"""
DHMS Serializers.

CRITICAL: All API responses use camelCase field names to match the React frontend
exactly (which expects bedOccupancy, stockHealth etc., not bed_occupancy).
Use SerializerMethodField or to_representation for camelCase conversion.
"""
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    AIInsightCache, Appointment, Attendance, Bed, District, Doctor,
    FlaggedHospital, Footfall, Hospital, Notification, RedistributionSuggestion,
    StockHistory, StockItem, TestAvailability, User,
)


# ─────────────────────────────────────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────────────────────────────────────
class LoginSerializer(TokenObtainPairSerializer):
    """
    Returns { token, user } — frontend stores token as 'dhms_token'.
    We rename SimpleJWT's 'access' key to 'token'.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        token = data["access"]  # SimpleJWT key
        return {
            "token": token,                  # <-- frontend expects "token"
            "refresh": data["refresh"],
            "user": {
                "id":          user.id,
                "name":        user.get_full_name() or user.username,
                "email":       user.email,
                "role":        user.role,
                "districtId":  user.district_id,
                "hospitalId":  user.hospital_id,
                "isStateAdmin": user.is_state_admin,
            },
        }


class RegisterSerializer(serializers.ModelSerializer):
    """Patient self-registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            "id", "first_name", "last_name", "email", "password",
            "phone", "dob", "gender", "blood_group", "emergency_contact",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        email = validated_data["email"]
        user = User(
            username=email,
            role=User.ROLE_PATIENT,
            **validated_data,
        )
        user.set_password(password)
        user.save()
        return user


class UserMeSerializer(serializers.ModelSerializer):
    """GET /api/auth/me — full current-user info."""
    name = serializers.SerializerMethodField()
    districtId = serializers.IntegerField(source="district_id", read_only=True)
    hospitalId = serializers.IntegerField(source="hospital_id", read_only=True)
    isStateAdmin = serializers.BooleanField(source="is_state_admin", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "name", "email", "role",
            "districtId", "hospitalId", "isStateAdmin",
            "phone", "dob", "gender", "blood_group", "emergency_contact",
        ]

    def get_name(self, obj):
        return obj.get_full_name() or obj.username


# ─────────────────────────────────────────────────────────────────────────────
# DISTRICT
# ─────────────────────────────────────────────────────────────────────────────
class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ["id", "name", "state", "code"]


# ─────────────────────────────────────────────────────────────────────────────
# BED
# ─────────────────────────────────────────────────────────────────────────────
class BedSerializer(serializers.ModelSerializer):
    general  = serializers.SerializerMethodField()
    semi     = serializers.SerializerMethodField()
    special  = serializers.SerializerMethodField()
    bedOccupancy = serializers.IntegerField(source="occupancy_pct", read_only=True)

    class Meta:
        model = Bed
        fields = [
            "general", "semi", "special", "bedOccupancy",
            "general_total", "general_occupied",
            "semi_total", "semi_occupied",
            "special_total", "special_occupied",
        ]

    def get_general(self, obj):
        return {"total": obj.general_total, "occupied": obj.general_occupied}

    def get_semi(self, obj):
        return {"total": obj.semi_total, "occupied": obj.semi_occupied}

    def get_special(self, obj):
        return {"total": obj.special_total, "occupied": obj.special_occupied}


# ─────────────────────────────────────────────────────────────────────────────
# DOCTOR
# ─────────────────────────────────────────────────────────────────────────────
class DoctorSerializer(serializers.ModelSerializer):
    # Today's attendance status resolved from related Attendance records
    status   = serializers.SerializerMethodField()
    checkIn  = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = ["id", "name", "specialization", "status", "checkIn"]

    def _today_record(self, obj):
        from django.db.models import Max
        latest = Attendance.objects.aggregate(Max('date'))['date__max']
        today = latest if latest else timezone.localdate()
        return obj.attendance.filter(date=today).first()

    def get_status(self, obj):
        record = self._today_record(obj)
        return record.status if record else "absent"

    def get_checkIn(self, obj):
        record = self._today_record(obj)
        if record and record.check_in:
            return record.check_in.strftime("%H:%M")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# HOSPITAL  (list + detail)
# ─────────────────────────────────────────────────────────────────────────────
class HospitalListSerializer(serializers.ModelSerializer):
    """Compact serializer for list view — matches frontend NearbyHospitals card."""
    beds         = BedSerializer(read_only=True)
    doctors      = DoctorSerializer(many=True, read_only=True)
    stockHealth  = serializers.SerializerMethodField()
    stockStatus  = serializers.SerializerMethodField()
    bedOccupancy = serializers.SerializerMethodField()
    doctorsPresent = serializers.SerializerMethodField()
    doctorsTotal   = serializers.SerializerMethodField()
    footfall       = serializers.SerializerMethodField()
    distance       = serializers.SerializerMethodField()  # populated by view when lat/lng given

    class Meta:
        model = Hospital
        fields = [
            "id", "name", "type", "area", "location", "lat", "lng",
            "phone", "status", "distance",
            "beds", "doctors", "stockHealth", "stockStatus",
            "bedOccupancy", "doctorsPresent", "doctorsTotal", "footfall",
        ]

    def _stock_health(self, obj):
        items = obj.stock.all()
        if not items:
            return 100
        healthy = sum(1 for i in items if i.status == StockItem.STATUS_SUCCESS)
        return round((healthy / len(items)) * 100)

    def _stock_status(self, obj):
        items = obj.stock.all()
        statuses = [i.status for i in items]
        if StockItem.STATUS_CRITICAL in statuses:
            return "critical"
        if StockItem.STATUS_WARNING in statuses:
            return "warning"
        return "success"

    def get_stockHealth(self, obj):
        return self._stock_health(obj)

    def get_stockStatus(self, obj):
        return self._stock_status(obj)

    def get_bedOccupancy(self, obj):
        try:
            return obj.beds.occupancy_pct
        except Bed.DoesNotExist:
            return 0

    def get_doctorsPresent(self, obj):
        from django.db.models import Max
        latest = Attendance.objects.aggregate(Max('date'))['date__max']
        today = latest if latest else timezone.localdate()
        return obj.doctors.filter(attendance__date=today, attendance__status="present").count()

    def get_doctorsTotal(self, obj):
        return obj.doctors.count()

    def get_footfall(self, obj):
        from django.db.models import Max
        latest = Footfall.objects.aggregate(Max('date'))['date__max']
        today = latest if latest else timezone.localdate()
        record = obj.footfall.filter(date=today).first()
        return record.count if record else 0

    def get_distance(self, obj):
        """Set by view via context['distances'] dict."""
        distances = self.context.get("distances", {})
        return distances.get(obj.id)


class HospitalDetailSerializer(HospitalListSerializer):
    """Full detail — adds doctor list."""
    doctors = DoctorSerializer(many=True, read_only=True)

    class Meta(HospitalListSerializer.Meta):
        fields = HospitalListSerializer.Meta.fields + ["doctors"]


# ─────────────────────────────────────────────────────────────────────────────
# DISTRICT STATS (admin KPI cards)
# ─────────────────────────────────────────────────────────────────────────────
class DistrictStatsSerializer(serializers.Serializer):
    totalFacilities  = serializers.IntegerField()
    avgStockHealth   = serializers.FloatField()
    avgBedOccupancy  = serializers.FloatField()
    doctorsPresent   = serializers.IntegerField()
    doctorsTotal     = serializers.IntegerField()


# ─────────────────────────────────────────────────────────────────────────────
# ATTENDANCE
# ─────────────────────────────────────────────────────────────────────────────
class AttendanceSerializer(serializers.ModelSerializer):
    doctorId       = serializers.IntegerField(source="doctor_id", read_only=True)
    name           = serializers.CharField(source="doctor.name", read_only=True)
    specialization = serializers.CharField(source="doctor.specialization", read_only=True)
    checkIn        = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = ["id", "doctorId", "name", "specialization", "date", "status", "checkIn"]

    def get_checkIn(self, obj):
        return obj.check_in.strftime("%H:%M") if obj.check_in else None


class AttendanceHistorySerializer(serializers.Serializer):
    date    = serializers.DateField()
    present = serializers.IntegerField()
    absent  = serializers.IntegerField()


# ─────────────────────────────────────────────────────────────────────────────
# STOCK
# ─────────────────────────────────────────────────────────────────────────────
class StockHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StockHistory
        fields = ["date", "qty"]


class StockItemSerializer(serializers.ModelSerializer):
    status      = serializers.CharField(read_only=True)
    depletionPct = serializers.IntegerField(source="depletion_pct", read_only=True)
    trend       = serializers.SerializerMethodField()
    currentQty  = serializers.IntegerField(source="current_qty")
    updatedAt   = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = StockItem
        fields = [
            "id", "medicine", "unit",
            "currentQty", "ordered", "dispensed", "threshold",
            "status", "depletionPct", "trend", "updatedAt",
        ]

    def get_trend(self, obj):
        # Last 7 days of history for sparkline (safely fetch last 7 via reverse order then flip)
        qs = obj.history.order_by("-date").values_list("qty", flat=True)[:7]
        return list(reversed(qs))


class StockSummarySerializer(serializers.Serializer):
    total    = serializers.IntegerField()
    healthy  = serializers.IntegerField()
    low      = serializers.IntegerField()
    critical = serializers.IntegerField()


# ─────────────────────────────────────────────────────────────────────────────
# TEST AVAILABILITY
# ─────────────────────────────────────────────────────────────────────────────
class TestAvailabilitySerializer(serializers.ModelSerializer):
    lastUpdated = serializers.DateTimeField(source="last_updated", read_only=True)
    testName    = serializers.CharField(source="test_name")

    class Meta:
        model = TestAvailability
        fields = ["id", "testName", "available", "lastUpdated"]


# ─────────────────────────────────────────────────────────────────────────────
# APPOINTMENT
# ─────────────────────────────────────────────────────────────────────────────
class AppointmentSerializer(serializers.ModelSerializer):
    patient        = serializers.SerializerMethodField()
    doctor         = serializers.SerializerMethodField()
    hospital       = serializers.SerializerMethodField()
    hospitalId     = serializers.IntegerField(source="hospital_id")
    doctorId       = serializers.IntegerField(source="doctor_id")
    specialization = serializers.CharField(source="doctor.specialization", read_only=True)
    patientPhone   = serializers.SerializerMethodField()
    time           = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id", "patient", "doctor", "hospital",
            "hospitalId", "doctorId",
            "date", "time", "status", "notes",
            "specialization", "patientPhone",
        ]

    def get_patient(self, obj):
        return obj.patient.get_full_name() or obj.patient.username

    def get_doctor(self, obj):
        return obj.doctor.name

    def get_hospital(self, obj):
        return obj.hospital.name

    def get_patientPhone(self, obj):
        return obj.patient.phone

    def get_time(self, obj):
        return obj.time.strftime("%H:%M")


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Used for POST /api/appointments."""
    class Meta:
        model = Appointment
        fields = ["doctor", "hospital", "date", "time", "notes"]

    def create(self, validated_data):
        validated_data["patient"] = self.context["request"].user
        return super().create(validated_data)


class SlotSerializer(serializers.Serializer):
    time      = serializers.CharField()
    available = serializers.BooleanField()


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATION
# ─────────────────────────────────────────────────────────────────────────────
class NotificationSerializer(serializers.ModelSerializer):
    hospital   = serializers.SerializerMethodField()
    messageMr  = serializers.CharField(source="message_mr", read_only=True)
    createdAt  = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id", "type", "title", "message", "messageMr",
            "hospital", "severity", "read", "createdAt",
        ]

    def get_hospital(self, obj):
        return obj.hospital.name if obj.hospital else None


# ─────────────────────────────────────────────────────────────────────────────
# FLAGGED HOSPITAL
# ─────────────────────────────────────────────────────────────────────────────
class FlaggedHospitalSerializer(serializers.ModelSerializer):
    hospital   = serializers.SerializerMethodField()
    flaggedAt  = serializers.DateTimeField(source="flagged_at", read_only=True)
    resolvedAt = serializers.DateTimeField(source="resolved_at", read_only=True)
    reasonMr   = serializers.CharField(source="reason_mr", read_only=True)

    class Meta:
        model = FlaggedHospital
        fields = [
            "id", "hospital", "reason", "reasonMr",
            "severity", "status", "action_taken",
            "flaggedAt", "resolvedAt",
        ]

    def get_hospital(self, obj):
        return {"id": obj.hospital_id, "name": obj.hospital.name, "type": obj.hospital.type}


# ─────────────────────────────────────────────────────────────────────────────
# REDISTRIBUTION SUGGESTION
# ─────────────────────────────────────────────────────────────────────────────
class RedistributionSuggestionSerializer(serializers.ModelSerializer):
    fromHospital  = serializers.SerializerMethodField()
    toHospital    = serializers.SerializerMethodField()
    suggestedQty  = serializers.IntegerField(source="suggested_qty")
    generatedAt   = serializers.DateTimeField(source="generated_at", read_only=True)

    class Meta:
        model = RedistributionSuggestion
        fields = [
            "id", "medicine", "fromHospital", "toHospital",
            "suggestedQty", "status", "generatedAt",
        ]

    def get_fromHospital(self, obj):
        return {"id": obj.from_hospital_id, "name": obj.from_hospital.name}

    def get_toHospital(self, obj):
        return {"id": obj.to_hospital_id, "name": obj.to_hospital.name}


# ─────────────────────────────────────────────────────────────────────────────
# FOOTFALL TREND (admin chart)
# ─────────────────────────────────────────────────────────────────────────────
class FootfallTrendSerializer(serializers.Serializer):
    date  = serializers.DateField()
    total = serializers.IntegerField()
    phc   = serializers.IntegerField()
    chc   = serializers.IntegerField()


class BedTrendSerializer(serializers.Serializer):
    date      = serializers.DateField()
    occupancy = serializers.FloatField()


# ─────────────────────────────────────────────────────────────────────────────
# AI INSIGHT CACHE
# ─────────────────────────────────────────────────────────────────────────────
class AIInsightCacheSerializer(serializers.ModelSerializer):
    generatedAt = serializers.DateTimeField(source="generated_at", read_only=True)

    class Meta:
        model = AIInsightCache
        fields = ["insights", "forecast", "lang", "generatedAt"]
