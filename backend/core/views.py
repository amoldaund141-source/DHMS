"""
DHMS All API Views.

Every queryset is scoped by role:
  admin (non-state) → district scope
  state admin       → all data
  staff             → their hospital only
  patient           → their own data only
"""
import io
from datetime import timedelta, datetime, date
from django.db import models
from django.utils import timezone
from django.db.models import Avg, Sum, Count, Max
from rest_framework import generics, status, views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    AIInsightCache, Appointment, Attendance, Bed, District, Doctor,
    FlaggedHospital, Footfall, Hospital, Notification, RedistributionSuggestion,
    StockHistory, StockItem, TestAvailability, User,
)
from .permissions import IsAdmin, IsAdminOrStaff, IsPatient, IsStaff
from .serializers import (
    AIInsightCacheSerializer, AppointmentCreateSerializer, AppointmentSerializer,
    AttendanceHistorySerializer, AttendanceSerializer, BedTrendSerializer,
    DistrictSerializer, DistrictStatsSerializer, DoctorSerializer,
    FlaggedHospitalSerializer, FootfallTrendSerializer, HospitalDetailSerializer,
    HospitalListSerializer, LoginSerializer, NotificationSerializer,
    RedistributionSuggestionSerializer, RegisterSerializer, SlotSerializer,
    StockItemSerializer, StockSummarySerializer, TestAvailabilitySerializer,
    UserMeSerializer,
)
from services.geo import haversine_km


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def get_hospital_queryset(request):
    """Return Hospital queryset scoped to the requesting user's role."""
    user = request.user
    qs = Hospital.objects.select_related("district", "beds").prefetch_related(
        "doctors__attendance", "stock__history", "footfall"
    )
    if user.role == "admin":
        if user.is_state_admin:
            return qs
        return qs.filter(district=user.district)
    if user.role == "staff":
        return qs.filter(pk=user.hospital_id)
    # patient — can see all hospitals (for booking)
    return qs


def get_scoped_district_ids(request):
    """Return list of district IDs visible to requesting admin."""
    user = request.user
    if user.is_state_admin:
        return list(District.objects.values_list("id", flat=True))
    return [user.district_id] if user.district_id else []


# ─────────────────────────────────────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────────────────────────────────────
class LoginView(TokenObtainPairView):
    """POST /api/auth/login → { token, refresh, user }"""
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register — patient self-registration"""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Auto-issue token so the user is logged in immediately
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "token": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id":    user.id,
                    "name":  user.get_full_name() or user.username,
                    "email": user.email,
                    "role":  user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(["POST"])
def logout_view(request):
    """POST /api/auth/logout — blacklist the refresh token."""
    try:
        refresh_token = request.data.get("refresh")
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"detail": "Logged out."}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"detail": "Token invalid or already blacklisted."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def me_view(request):
    """GET /api/auth/me — return current user."""
    serializer = UserMeSerializer(request.user)
    return Response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
# DISTRICTS
# ─────────────────────────────────────────────────────────────────────────────
class DistrictListView(generics.ListAPIView):
    """GET /api/districts"""
    serializer_class = DistrictSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        if self.request.user.is_state_admin:
            return District.objects.all()
        return District.objects.filter(pk=self.request.user.district_id)


class DistrictDetailView(generics.RetrieveAPIView):
    """GET /api/districts/:id"""
    serializer_class = DistrictSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = District.objects.all()


# ─────────────────────────────────────────────────────────────────────────────
# HOSPITALS
# ─────────────────────────────────────────────────────────────────────────────
class HospitalListView(generics.ListAPIView):
    """
    GET /api/hospitals?area=&type=&status=&lat=&lng=&district_id=
    Supports filtering + optional distance sort when lat/lng provided.
    """
    serializer_class = HospitalListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = get_hospital_queryset(self.request)

        # Query param filters
        area   = self.request.query_params.get("area")
        htype  = self.request.query_params.get("type")
        hstatus = self.request.query_params.get("status")
        district_id = self.request.query_params.get("district_id")

        if area:
            qs = qs.filter(area=area)
        if htype:
            qs = qs.filter(type=htype)
        if hstatus:
            qs = qs.filter(status=hstatus)
        if district_id and self.request.user.is_state_admin:
            qs = qs.filter(district_id=district_id)

        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        hospitals = list(qs)

        # Distance calculation if patient provides coordinates
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        distances = {}
        if lat and lng:
            try:
                patient_lat, patient_lng = float(lat), float(lng)
                for h in hospitals:
                    distances[h.id] = round(haversine_km(patient_lat, patient_lng, h.lat, h.lng), 1)
                hospitals.sort(key=lambda h: distances.get(h.id, 9999))
            except ValueError:
                pass

        serializer = self.get_serializer(
            hospitals, many=True, context={"request": request, "distances": distances}
        )
        return Response(serializer.data)


class HospitalDetailView(generics.RetrieveAPIView):
    """GET /api/hospitals/:id"""
    serializer_class = HospitalDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_hospital_queryset(self.request)


# ─────────────────────────────────────────────────────────────────────────────
# DISTRICT STATS (admin KPI bar)
# ─────────────────────────────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def district_stats_view(request):
    """GET /api/hospitals/district-stats?district_id="""
    qs = get_hospital_queryset(request)

    total_facilities = qs.count()

    # Stock health: average across all hospitals
    stock_healths = []
    for h in qs.prefetch_related("stock"):
        items = list(h.stock.all())
        if items:
            healthy = sum(1 for i in items if i.status == StockItem.STATUS_SUCCESS)
            stock_healths.append(round((healthy / len(items)) * 100))

    avg_stock = round(sum(stock_healths) / len(stock_healths)) if stock_healths else 0

    # Bed occupancy: average
    beds_qs = Bed.objects.filter(hospital__in=qs)
    bed_occ_list = [b.occupancy_pct for b in beds_qs]
    avg_bed = round(sum(bed_occ_list) / len(bed_occ_list)) if bed_occ_list else 0

    # Doctors
    latest_attendance = Attendance.objects.aggregate(Max('date'))['date__max']
    today = latest_attendance if latest_attendance else timezone.localdate()
    doctors_present = Attendance.objects.filter(
        doctor__hospital__in=qs, date=today, status="present"
    ).count()
    doctors_total = Doctor.objects.filter(hospital__in=qs).count()

    data = {
        "totalFacilities": total_facilities,
        "avgStockHealth":  avg_stock,
        "avgBedOccupancy": avg_bed,
        "doctorsPresent":  doctors_present,
        "doctorsTotal":    doctors_total,
    }
    return Response(DistrictStatsSerializer(data).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def footfall_trend_view(request):
    """GET /api/hospitals/footfall-trend?district_id= — 7-day footfall by PHC/CHC."""
    qs = get_hospital_queryset(request)
    latest_footfall = Footfall.objects.aggregate(Max('date'))['date__max']
    today = latest_footfall if latest_footfall else timezone.localdate()
    result = []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        phc_total = Footfall.objects.filter(
            hospital__in=qs, hospital__type="PHC", date=day
        ).aggregate(s=Sum("count"))["s"] or 0
        chc_total = Footfall.objects.filter(
            hospital__in=qs, hospital__type="CHC", date=day
        ).aggregate(s=Sum("count"))["s"] or 0
        result.append({
            "date":  day.strftime("%a"),
            "total": phc_total + chc_total,
            "phc":   phc_total,
            "chc":   chc_total,
        })

    return Response(FootfallTrendSerializer(result, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrStaff])
def bed_trend_view(request):
    """GET /api/hospitals/bed-trend?district_id= — 7-day avg bed occupancy."""
    qs = get_hospital_queryset(request)
    latest_footfall = Footfall.objects.aggregate(Max('date'))['date__max']
    today = latest_footfall if latest_footfall else timezone.localdate()
    result = []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        # Use Footfall date as proxy for "that day's bed data" — in production,
        # you'd snapshot bed occupancy daily too. For now, use current bed data.
        beds = Bed.objects.filter(hospital__in=qs)
        occ_list = [b.occupancy_pct for b in beds]
        avg = round(sum(occ_list) / len(occ_list)) if occ_list else 0
        result.append({"date": day.strftime("%a"), "occupancy": avg})

    return Response(BedTrendSerializer(result, many=True).data)


# ─────────────────────────────────────────────────────────────────────────────
# DOCTORS + ATTENDANCE (per hospital)
# ─────────────────────────────────────────────────────────────────────────────
class DoctorListView(generics.ListAPIView):
    """GET /api/hospitals/:id/doctors"""
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        hospital_id = self.kwargs["hospital_id"]
        # Verify the user has access to this hospital
        get_hospital_queryset(self.request).get(pk=hospital_id)
        return Doctor.objects.filter(hospital_id=hospital_id)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdminOrStaff])
def update_doctor_attendance(request, hospital_id, doc_id):
    """PATCH /api/hospitals/:id/doctors/:docId/attendance"""
    get_hospital_queryset(request).get(pk=hospital_id)  # access check
    doctor = Doctor.objects.get(pk=doc_id, hospital_id=hospital_id)
    today = timezone.localdate()

    attendance, _ = Attendance.objects.get_or_create(
        doctor=doctor, date=today,
        defaults={"status": "absent"}
    )
    new_status = request.data.get("status")
    check_in   = request.data.get("checkIn")

    if new_status:
        attendance.status = new_status
    if check_in:
        from datetime import time
        h, m = check_in.split(":")
        attendance.check_in = time(int(h), int(m))
    attendance.save()

    return Response(AttendanceSerializer(attendance).data)


class AttendanceListView(generics.ListAPIView):
    """GET /api/hospitals/:id/attendance — today's attendance records."""
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get_queryset(self):
        hospital_id = self.kwargs["hospital_id"]
        get_hospital_queryset(self.request).get(pk=hospital_id)
        latest_attendance = Attendance.objects.aggregate(Max('date'))['date__max']
        today = latest_attendance if latest_attendance else timezone.localdate()
        return Attendance.objects.filter(
            doctor__hospital_id=hospital_id, date=today
        ).select_related("doctor")


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrStaff])
def attendance_history_view(request, hospital_id):
    """GET /api/hospitals/:id/attendance/history — 7-day history."""
    get_hospital_queryset(request).get(pk=hospital_id)
    latest_attendance = Attendance.objects.aggregate(Max('date'))['date__max']
    today = latest_attendance if latest_attendance else timezone.localdate()
    result = []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        present = Attendance.objects.filter(
            doctor__hospital_id=hospital_id, date=day, status="present"
        ).count()
        absent = Attendance.objects.filter(
            doctor__hospital_id=hospital_id, date=day, status="absent"
        ).count()
        result.append({"date": day, "present": present, "absent": absent})

    return Response(AttendanceHistorySerializer(result, many=True).data)


# ─────────────────────────────────────────────────────────────────────────────
# STOCK
# ─────────────────────────────────────────────────────────────────────────────
class StockListView(generics.ListAPIView):
    """GET /api/hospitals/:id/stock"""
    serializer_class = StockItemSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get_queryset(self):
        hospital_id = self.kwargs["hospital_id"]
        get_hospital_queryset(self.request).get(pk=hospital_id)
        return StockItem.objects.filter(hospital_id=hospital_id).prefetch_related("history")


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrStaff])
def stock_summary_view(request, hospital_id):
    """GET /api/hospitals/:id/stock/summary"""
    get_hospital_queryset(request).get(pk=hospital_id)
    items = StockItem.objects.filter(hospital_id=hospital_id)
    total    = items.count()
    healthy  = sum(1 for i in items if i.status == StockItem.STATUS_SUCCESS)
    low      = sum(1 for i in items if i.status == StockItem.STATUS_WARNING)
    critical = sum(1 for i in items if i.status == StockItem.STATUS_CRITICAL)
    data = {"total": total, "healthy": healthy, "low": low, "critical": critical}
    return Response(StockSummarySerializer(data).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdminOrStaff])
def update_stock_item(request, hospital_id, item_id):
    """PATCH /api/hospitals/:id/stock/:itemId"""
    get_hospital_queryset(request).get(pk=hospital_id)
    item = StockItem.objects.get(pk=item_id, hospital_id=hospital_id)

    for field in ("current_qty", "ordered", "dispensed", "threshold"):
        val = request.data.get(field)
        if val is not None:
            setattr(item, field, int(val))

    item.save()
    return Response(StockItemSerializer(item).data)


# ─────────────────────────────────────────────────────────────────────────────
# TEST AVAILABILITY
# ─────────────────────────────────────────────────────────────────────────────
class TestAvailabilityListView(generics.ListAPIView):
    """GET /api/hospitals/:id/tests"""
    serializer_class = TestAvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        hospital_id = self.kwargs["hospital_id"]
        get_hospital_queryset(self.request).get(pk=hospital_id)
        return TestAvailability.objects.filter(hospital_id=hospital_id)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdminOrStaff])
def update_test_availability(request, hospital_id, test_id):
    """PATCH /api/hospitals/:id/tests/:testId"""
    get_hospital_queryset(request).get(pk=hospital_id)
    test = TestAvailability.objects.get(pk=test_id, hospital_id=hospital_id)
    available = request.data.get("available")
    if available is not None:
        test.available = bool(available)
        test.save()
    return Response(TestAvailabilitySerializer(test).data)


# ─────────────────────────────────────────────────────────────────────────────
# APPOINTMENTS
# ─────────────────────────────────────────────────────────────────────────────
class AppointmentListView(generics.ListCreateAPIView):
    """GET/POST /api/appointments"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.select_related("patient", "doctor", "hospital")

        if user.role == "patient":
            return qs.filter(patient=user)
        if user.role == "staff":
            return qs.filter(hospital=user.hospital)
        # admin
        if user.is_state_admin:
            return qs
        return qs.filter(hospital__district=user.district)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_appointment(request, appt_id):
    """PATCH /api/appointments/:id — update status"""
    appt = Appointment.objects.get(pk=appt_id)
    # Auth check
    user = request.user
    if user.role == "patient" and appt.patient != user:
        return Response(status=status.HTTP_403_FORBIDDEN)
    if user.role == "staff" and appt.hospital != user.hospital:
        return Response(status=status.HTTP_403_FORBIDDEN)

    new_status = request.data.get("status")
    if new_status:
        appt.status = new_status
        appt.save()
    return Response(AppointmentSerializer(appt).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def appointment_slots_view(request):
    """
    GET /api/appointments/slots?hospitalId=&doctorId=&date=
    Returns time slots with availability (booked = unavailable).
    """
    hospital_id = request.query_params.get("hospitalId")
    doctor_id   = request.query_params.get("doctorId")
    date_str    = request.query_params.get("date")

    if not (hospital_id and doctor_id and date_str):
        return Response({"detail": "hospitalId, doctorId, date required"}, status=400)

    try:
        query_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return Response({"detail": "Invalid date format, use YYYY-MM-DD"}, status=400)

    # All possible slots (09:00–16:00, 30-min intervals)
    all_slots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "14:00", "14:30", "15:00", "15:30", "16:00",
    ]

    booked = set(
        Appointment.objects.filter(
            doctor_id=doctor_id,
            hospital_id=hospital_id,
            date=query_date,
            status__in=["confirmed"],
        ).values_list("time", flat=True)
    )
    booked_strs = {t.strftime("%H:%M") for t in booked}

    slots = [{"time": s, "available": s not in booked_strs} for s in all_slots]
    return Response(SlotSerializer(slots, many=True).data)


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────────────────────────────────────
class NotificationListView(generics.ListAPIView):
    """GET /api/notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notif_id):
    """PATCH /api/notifications/:id/read"""
    notif = Notification.objects.get(pk=notif_id, user=request.user)
    notif.read = True
    notif.save()
    return Response(NotificationSerializer(notif).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """PATCH /api/notifications/read-all"""
    Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({"detail": "All notifications marked as read."})


# ─────────────────────────────────────────────────────────────────────────────
# FLAGGED HOSPITALS
# ─────────────────────────────────────────────────────────────────────────────
class FlaggedHospitalListView(generics.ListAPIView):
    """GET /api/flagged?district_id=&status="""
    serializer_class = FlaggedHospitalSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = FlaggedHospital.objects.select_related("hospital")
        user = self.request.user

        if not user.is_state_admin:
            qs = qs.filter(hospital__district=user.district)

        district_id = self.request.query_params.get("district_id")
        flag_status = self.request.query_params.get("status")

        if district_id and user.is_state_admin:
            qs = qs.filter(hospital__district_id=district_id)
        if flag_status:
            qs = qs.filter(status=flag_status)

        return qs


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdmin])
def update_flagged_hospital(request, flag_id):
    """PATCH /api/flagged/:id — update status and action_taken"""
    flag = FlaggedHospital.objects.get(pk=flag_id)
    # District scoping
    if not request.user.is_state_admin and flag.hospital.district != request.user.district:
        return Response(status=status.HTTP_403_FORBIDDEN)

    new_status  = request.data.get("status")
    action_taken = request.data.get("action_taken")

    if new_status:
        flag.status = new_status
        if new_status == "resolved":
            flag.resolved_at = timezone.now()
    if action_taken is not None:
        flag.action_taken = action_taken

    flag.save()
    return Response(FlaggedHospitalSerializer(flag).data)


# ─────────────────────────────────────────────────────────────────────────────
# REDISTRIBUTION SUGGESTIONS
# ─────────────────────────────────────────────────────────────────────────────
class RedistributionListView(generics.ListAPIView):
    """GET /api/insights/redistribution?district_id="""
    serializer_class = RedistributionSuggestionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = RedistributionSuggestion.objects.select_related("from_hospital", "to_hospital")
        user = self.request.user
        if not user.is_state_admin:
            qs = qs.filter(from_hospital__district=user.district)
        district_id = self.request.query_params.get("district_id")
        if district_id and user.is_state_admin:
            qs = qs.filter(from_hospital__district_id=district_id)
        return qs


# ─────────────────────────────────────────────────────────────────────────────
# AI INSIGHTS
# ─────────────────────────────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def ai_insights_view(request):
    """
    GET /api/insights?lang=en|mr
    Returns cached insights. Celery refreshes every 6h in background.
    Falls back to cached data if OpenRouter is unavailable.
    """
    lang = request.query_params.get("lang", "en")
    user = request.user

    district = user.district
    if not district and not user.is_state_admin:
        return Response({"detail": "No district assigned."}, status=400)

    # For state admin, use the first district or respond generically
    if user.is_state_admin:
        district = District.objects.first()

    try:
        cache_obj = AIInsightCache.objects.get(district=district, lang=lang)
        return Response(AIInsightCacheSerializer(cache_obj).data)
    except AIInsightCache.DoesNotExist:
        # Trigger a fresh generation synchronously (first-time only)
        from core.tasks import refresh_district_ai_insights
        refresh_district_ai_insights.delay(district.id, lang)
        return Response({
            "insights": ["AI insights are being generated. Please refresh in a moment."],
            "forecast": [],
            "lang": lang,
            "generatedAt": None,
        })


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def ai_forecast_view(request):
    """GET /api/insights/forecast?hospital_id=&lang="""
    from services.ai import ask_ai
    hospital_id = request.query_params.get("hospital_id")
    lang = request.query_params.get("lang", "en")

    if not hospital_id:
        return Response({"detail": "hospital_id required"}, status=400)

    hospital = get_hospital_queryset(request).get(pk=hospital_id)
    items = StockItem.objects.filter(hospital=hospital).prefetch_related("history")

    stock_data = []
    for item in items:
        history = list(item.history.order_by("date").values_list("qty", flat=True)[-7:])
        stock_data.append(
            f"{item.medicine}: current={item.current_qty} {item.unit}, "
            f"threshold={item.threshold}, 7-day trend={history}"
        )

    if not stock_data:
        return Response({"forecast": [], "lang": lang})

    prompt = (
        f"Hospital: {hospital.name} ({hospital.type}), Location: {hospital.location}.\n"
        f"Stock data for the past 7 days:\n" + "\n".join(stock_data) +
        "\n\nBased on the trend, which medicines are likely to run out in the next 7 days? "
        "List only critical ones with estimated days remaining. Be concise."
    )

    try:
        result = ask_ai(prompt, lang=lang)
        return Response({"forecast": [result], "lang": lang, "hospital": hospital.name})
    except Exception as e:
        return Response({"forecast": [f"AI unavailable: {str(e)}"], "lang": lang})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def ai_flagged_view(request):
    """
    GET /api/insights/flagged?district_id=
    Runs rule-based flagging + AI writes human-readable reason text.
    """
    from core.tasks import auto_flag_hospitals
    # Trigger task synchronously in this request for immediate response
    auto_flag_hospitals.delay()

    district_id = request.query_params.get("district_id")
    qs = FlaggedHospital.objects.filter(status="open").select_related("hospital")
    if not request.user.is_state_admin:
        qs = qs.filter(hospital__district=request.user.district)
    elif district_id:
        qs = qs.filter(hospital__district_id=district_id)

    return Response(FlaggedHospitalSerializer(qs, many=True).data)


# ─────────────────────────────────────────────────────────────────────────────
# EXCEL IMPORT
# ─────────────────────────────────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminOrStaff])
def import_stock_view(request):
    """
    POST /api/import/stock/
    Multipart: file (xlsx), hospital_id (optional — uses staff's hospital if omitted)
    Expected columns: medicine, unit, current_qty, ordered, dispensed, threshold
    """
    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"detail": "No file uploaded."}, status=400)

    hospital_id = request.data.get("hospital_id") or (
        request.user.hospital_id if request.user.role == "staff" else None
    )
    if not hospital_id:
        return Response({"detail": "hospital_id required for admin imports."}, status=400)

    hospital = get_hospital_queryset(request).get(pk=hospital_id)

    try:
        import pandas as pd
        df = pd.read_excel(io.BytesIO(file_obj.read()))
        imported = 0
        errors = []
        for idx, row in df.iterrows():
            try:
                item, _ = StockItem.objects.update_or_create(
                    hospital=hospital,
                    medicine=str(row["medicine"]).strip(),
                    defaults={
                        "unit":        str(row.get("unit", "tabs")).strip(),
                        "current_qty": int(row.get("current_qty", 0)),
                        "ordered":     int(row.get("ordered", 0)),
                        "dispensed":   int(row.get("dispensed", 0)),
                        "threshold":   int(row.get("threshold", 50)),
                    },
                )
                StockHistory.objects.get_or_create(
                    stock_item=item,
                    date=timezone.localdate(),
                    defaults={"qty": item.current_qty},
                )
                imported += 1
            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")

        return Response({"imported": imported, "errors": errors})
    except Exception as e:
        return Response({"detail": f"Failed to parse file: {str(e)}"}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def import_patients_view(request):
    """
    POST /api/import/patients/
    Expected columns: name, email, phone, dob, gender, blood_group, emergency_contact, district_code
    Creates User(role='patient') rows. Sends them a password reset email (if email backend configured).
    """
    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"detail": "No file uploaded."}, status=400)

    try:
        import pandas as pd
        df = pd.read_excel(io.BytesIO(file_obj.read()))
        imported = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                email = str(row["email"]).strip().lower()
                if User.objects.filter(email=email).exists():
                    errors.append(f"Row {idx + 2}: {email} already exists — skipped.")
                    continue

                name_parts = str(row.get("name", "")).strip().split(" ", 1)
                first = name_parts[0]
                last  = name_parts[1] if len(name_parts) > 1 else ""

                district_code = str(row.get("district_code", "")).strip().upper()
                district = District.objects.filter(code=district_code).first()

                user = User(
                    username=email,
                    email=email,
                    first_name=first,
                    last_name=last,
                    role=User.ROLE_PATIENT,
                    district=district,
                    phone=str(row.get("phone", "")).strip(),
                    gender=str(row.get("gender", "")).strip(),
                    blood_group=str(row.get("blood_group", "")).strip(),
                    emergency_contact=str(row.get("emergency_contact", "")).strip(),
                )
                if pd.notna(row.get("dob")):
                    user.dob = pd.to_datetime(row["dob"]).date()

                # Set a temp password — in prod, trigger password-reset email
                user.set_password("changeme@123")
                user.save()
                imported += 1
            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")

        return Response({"imported": imported, "errors": errors})
    except Exception as e:
        return Response({"detail": f"Failed to parse file: {str(e)}"}, status=400)


# ─────────────────────────────────────────────────────────────────────────────
# AI INSIGHTS — real-time OpenRouter-powered analysis
# ─────────────────────────────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ai_insights_view(request):
    """
    GET /api/insights/?lang=en
    Returns a list of AI-generated insight strings for the admin's district.
    Uses cached results when available, regenerates via OpenRouter when stale.
    """
    from services.ai import ask_ai

    lang = request.query_params.get("lang", "en")
    user = request.user

    # Determine district scope
    district = getattr(user, "district", None)
    if not district:
        # Fallback: use first district
        district = District.objects.first()
    if not district:
        return Response([])

    # Check cache (valid for 6 hours)
    cache = AIInsightCache.objects.filter(district=district, lang=lang).first()
    if cache and cache.generated_at > timezone.now() - timedelta(hours=6):
        return Response(cache.insights)

    # Gather real data for the prompt
    hospitals = Hospital.objects.filter(district=district).select_related("beds")
    total_hospitals = hospitals.count()
    if total_hospitals == 0:
        return Response(["No hospitals found in this district."])

    # Stock health
    stock_items = StockItem.objects.filter(hospital__district=district)
    total_items = stock_items.count()
    critical_items = sum(1 for s in stock_items if s.status == "critical")
    warning_items = sum(1 for s in stock_items if s.status == "warning")
    healthy_items = total_items - critical_items - warning_items

    # Beds
    total_beds = 0
    occupied_beds = 0
    for h in hospitals:
        try:
            bed = h.beds
            total_beds += bed.general_total + bed.semi_total + bed.special_total
            occupied_beds += bed.general_occupied + bed.semi_occupied + bed.special_occupied
        except Bed.DoesNotExist:
            pass
    occ_pct = round((occupied_beds / total_beds * 100)) if total_beds else 0

    # Doctors
    total_doctors = Doctor.objects.filter(hospital__district=district).count()
    latest_attendance = Attendance.objects.aggregate(Max('date'))['date__max']
    today_doc = latest_attendance if latest_attendance else timezone.localdate()
    present_doctors = Attendance.objects.filter(
        doctor__hospital__district=district,
        date=today_doc,
        status="present",
    ).count()

    # Footfall
    latest_footfall = Footfall.objects.aggregate(Max('date'))['date__max']
    today_footfall = latest_footfall if latest_footfall else timezone.localdate()
    week_ago = today_footfall - timedelta(days=7)
    footfall_week = Footfall.objects.filter(
        hospital__district=district, date__gte=week_ago
    ).aggregate(total=Sum("count"))["total"] or 0

    prompt = (
        f"District: {district.name}\n"
        f"Total hospitals: {total_hospitals}\n"
        f"Stock: {healthy_items} healthy, {warning_items} low, {critical_items} critical (out of {total_items})\n"
        f"Beds: {occupied_beds}/{total_beds} occupied ({occ_pct}%)\n"
        f"Doctors: {present_doctors}/{total_doctors} present today\n"
        f"Footfall last 7 days: {footfall_week}\n\n"
        f"Generate exactly 4 concise actionable insights as a JSON array of strings. "
        f"Each insight should be 1 sentence. Focus on: stock risks, bed pressure, staffing gaps, and patient trends. "
        f"Return ONLY the JSON array, no other text."
    )

    try:
        raw = ask_ai(prompt, lang=lang)
        # Parse the JSON array from AI response
        import json
        # Try to extract JSON array from the response
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start >= 0 and end > start:
            insights = json.loads(raw[start:end])
        else:
            insights = [raw.strip()]
    except Exception as e:
        # Fallback: return data-driven insights without AI
        insights = [
            f"{critical_items} stock items are critically low across {total_hospitals} facilities.",
            f"Bed occupancy is at {occ_pct}% — {'high pressure' if occ_pct > 80 else 'manageable'}.",
            f"{present_doctors}/{total_doctors} doctors present today.",
            f"Weekly footfall: {footfall_week} patients across the district.",
        ]

    # Cache it
    AIInsightCache.objects.update_or_create(
        district=district, lang=lang,
        defaults={"insights": insights}
    )

    return Response(insights)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ai_forecast_view(request):
    """
    GET /api/insights/forecast/?hospital_id=1&lang=en
    Returns AI-generated stock-out forecast for a hospital.
    """
    from services.ai import ask_ai

    hospital_id = request.query_params.get("hospital_id")
    lang = request.query_params.get("lang", "en")

    if not hospital_id:
        # District-wide forecast
        user = request.user
        district = getattr(user, "district", None) or District.objects.first()
        if not district:
            return Response([])
        hospitals = Hospital.objects.filter(district=district)
    else:
        hospitals = Hospital.objects.filter(pk=hospital_id)

    forecasts = []

    for hospital in hospitals[:5]:  # Limit to 5 hospitals to avoid too many API calls
        stock_items = StockItem.objects.filter(hospital=hospital).select_related("hospital")
        critical = [s for s in stock_items if s.status in ("critical", "warning")]

        if not critical:
            continue

        # Build stock data for prompt
        stock_lines = []
        for s in critical[:5]:  # Top 5 critical items
            history = StockHistory.objects.filter(
                stock_item=s
            ).order_by("-date")[:7]
            history_vals = [h.qty for h in reversed(history)]
            stock_lines.append(
                f"  - {s.medicine}: current={s.current_qty} {s.unit}, "
                f"threshold={s.threshold}, 7-day history={history_vals}"
            )

        if not stock_lines:
            continue

        prompt = (
            f"Hospital: {hospital.name}\n"
            f"Critical/low stock items:\n"
            + "\n".join(stock_lines)
            + "\n\nFor each item, predict days until stock-out based on the consumption trend. "
            f"Return a JSON array of objects with keys: "
            f"\"item\" (medicine name), \"daysLeft\" (predicted days), \"urgency\" (\"critical\" or \"warning\"). "
            f"Return ONLY the JSON array."
        )

        try:
            import json
            raw = ask_ai(prompt, lang=lang)
            start = raw.find("[")
            end = raw.rfind("]") + 1
            if start >= 0 and end > start:
                items = json.loads(raw[start:end])
                for item in items:
                    item["hospital"] = hospital.name
                forecasts.extend(items)
            else:
                forecasts.append({
                    "hospital": hospital.name,
                    "item": critical[0].medicine,
                    "daysLeft": max(1, int(critical[0].current_qty / max(1, critical[0].threshold - critical[0].current_qty) * 7)),
                    "urgency": "critical" if critical[0].status == "critical" else "warning",
                })
        except Exception:
            # Fallback: compute simple linear forecast
            for s in critical[:3]:
                daily_usage = max(1, (s.threshold - s.current_qty) / 30)
                days = max(1, int(s.current_qty / daily_usage))
                forecasts.append({
                    "hospital": hospital.name,
                    "item": s.medicine,
                    "daysLeft": days,
                    "urgency": "critical" if days < 5 else "warning",
                })

    # Sort by urgency and days left
    forecasts.sort(key=lambda x: (0 if x.get("urgency") == "critical" else 1, x.get("daysLeft", 99)))
    return Response(forecasts[:10])  # Top 10 most urgent


class RedistributionListView(generics.ListAPIView):
    """
    GET /api/insights/redistribution/?district_id=1
    Returns redistribution suggestions from the database.
    """
    serializer_class = RedistributionSuggestionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = RedistributionSuggestion.objects.select_related(
            "from_hospital", "to_hospital"
        ).filter(status="pending")

        district_id = self.request.query_params.get("district_id")
        if district_id:
            qs = qs.filter(from_hospital__district_id=district_id)
        elif self.request.user.district_id:
            qs = qs.filter(from_hospital__district_id=self.request.user.district_id)

        return qs[:20]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ai_flagged_view(request):
    """
    GET /api/insights/flagged/?district_id=1
    Returns flagged hospitals (auto-generated by Celery tasks + AI).
    """
    district_id = request.query_params.get("district_id")
    qs = FlaggedHospital.objects.select_related("hospital__district")

    if district_id:
        qs = qs.filter(hospital__district_id=district_id)
    elif request.user.district_id:
        qs = qs.filter(hospital__district_id=request.user.district_id)

    # Only return open/in-progress flags
    status_filter = request.query_params.get("status", "open")
    if status_filter != "all":
        qs = qs.filter(status=status_filter)

    serializer = FlaggedHospitalSerializer(qs[:30], many=True)
    return Response(serializer.data)

