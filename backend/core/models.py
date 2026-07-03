"""
DHMS — All data models.

Design rules:
  - Admin (non-state): Hospital.objects.filter(district=request.user.district)
  - State admin:       all hospitals
  - Staff:             request.user.hospital only
  - Patient:           their own appointments only
"""
from django.db import models
from django.contrib.auth.models import AbstractUser


# ─────────────────────────────────────────────────────────────────────────────
# DISTRICT
# ─────────────────────────────────────────────────────────────────────────────
class District(models.Model):
    name  = models.CharField(max_length=100, unique=True)
    state = models.CharField(max_length=100, default="Maharashtra")
    code  = models.CharField(max_length=20, unique=True)  # e.g. "RAIGAD"

    def __str__(self):
        return f"{self.name} ({self.code})"

    class Meta:
        ordering = ["name"]


# ─────────────────────────────────────────────────────────────────────────────
# HOSPITAL
# ─────────────────────────────────────────────────────────────────────────────
class Hospital(models.Model):
    TYPE_PHC = "PHC"
    TYPE_CHC = "CHC"
    TYPE_CHOICES = [(TYPE_PHC, "PHC"), (TYPE_CHC, "CHC")]

    AREA_URBAN = "urban"
    AREA_RURAL = "rural"
    AREA_CHOICES = [(AREA_URBAN, "Urban"), (AREA_RURAL, "Rural")]

    STATUS_OPERATIONAL = "operational"
    STATUS_CLOSED = "closed"
    STATUS_CHOICES = [
        (STATUS_OPERATIONAL, "Operational"),
        (STATUS_CLOSED, "Closed"),
    ]

    district = models.ForeignKey(
        District, on_delete=models.CASCADE, related_name="hospitals"
    )
    name     = models.CharField(max_length=200)
    type     = models.CharField(choices=TYPE_CHOICES, max_length=3)
    area     = models.CharField(choices=AREA_CHOICES, max_length=10)
    location = models.CharField(max_length=255)
    lat      = models.FloatField()
    lng      = models.FloatField()
    phone    = models.CharField(max_length=20)
    status   = models.CharField(choices=STATUS_CHOICES, default=STATUS_OPERATIONAL, max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.type})"

    class Meta:
        ordering = ["name"]


# ─────────────────────────────────────────────────────────────────────────────
# USER (custom auth)
# ─────────────────────────────────────────────────────────────────────────────
class User(AbstractUser):
    ROLE_ADMIN   = "admin"
    ROLE_STAFF   = "staff"
    ROLE_PATIENT = "patient"
    ROLE_CHOICES = [
        (ROLE_ADMIN,   "admin"),
        (ROLE_STAFF,   "staff"),
        (ROLE_PATIENT, "patient"),
    ]

    role             = models.CharField(choices=ROLE_CHOICES, max_length=10, default=ROLE_PATIENT)
    district         = models.ForeignKey(
        District, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="admins",
        help_text="Set for district-level admin users",
    )
    is_state_admin   = models.BooleanField(
        default=False,
        help_text="State admins see all districts",
    )
    hospital         = models.ForeignKey(
        Hospital, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="staff_users",
        help_text="Set for staff users — scopes them to one hospital",
    )
    phone            = models.CharField(max_length=15, blank=True)
    dob              = models.DateField(null=True, blank=True)
    gender           = models.CharField(max_length=10, blank=True)
    blood_group      = models.CharField(max_length=5, blank=True)
    emergency_contact = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


# ─────────────────────────────────────────────────────────────────────────────
# BEDS
# ─────────────────────────────────────────────────────────────────────────────
class Bed(models.Model):
    hospital         = models.OneToOneField(
        Hospital, on_delete=models.CASCADE, related_name="beds"
    )
    general_total    = models.IntegerField(default=0)
    general_occupied = models.IntegerField(default=0)
    semi_total       = models.IntegerField(default=0)
    semi_occupied    = models.IntegerField(default=0)
    special_total    = models.IntegerField(default=0)
    special_occupied = models.IntegerField(default=0)

    @property
    def total(self):
        return self.general_total + self.semi_total + self.special_total

    @property
    def occupied(self):
        return self.general_occupied + self.semi_occupied + self.special_occupied

    @property
    def occupancy_pct(self):
        if self.total == 0:
            return 0
        return round((self.occupied / self.total) * 100)

    def __str__(self):
        return f"Beds @ {self.hospital.name}"


# ─────────────────────────────────────────────────────────────────────────────
# DOCTOR
# ─────────────────────────────────────────────────────────────────────────────
class Doctor(models.Model):
    hospital       = models.ForeignKey(
        Hospital, on_delete=models.CASCADE, related_name="doctors"
    )
    name           = models.CharField(max_length=150)
    specialization = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} — {self.specialization} @ {self.hospital.name}"

    class Meta:
        ordering = ["name"]


# ─────────────────────────────────────────────────────────────────────────────
# ATTENDANCE
# ─────────────────────────────────────────────────────────────────────────────
class Attendance(models.Model):
    STATUS_PRESENT = "present"
    STATUS_ABSENT  = "absent"
    STATUS_CHOICES = [
        (STATUS_PRESENT, "present"),
        (STATUS_ABSENT,  "absent"),
    ]

    doctor   = models.ForeignKey(
        Doctor, on_delete=models.CASCADE, related_name="attendance"
    )
    date     = models.DateField()
    status   = models.CharField(choices=STATUS_CHOICES, max_length=10)
    check_in = models.TimeField(null=True, blank=True)

    class Meta:
        unique_together = ("doctor", "date")
        ordering = ["-date"]

    def __str__(self):
        return f"{self.doctor.name} — {self.date} — {self.status}"


# ─────────────────────────────────────────────────────────────────────────────
# STOCK
# ─────────────────────────────────────────────────────────────────────────────
class StockItem(models.Model):
    hospital    = models.ForeignKey(
        Hospital, on_delete=models.CASCADE, related_name="stock"
    )
    medicine    = models.CharField(max_length=150)
    unit        = models.CharField(max_length=20)   # tabs / caps / pcs
    current_qty = models.IntegerField(default=0)
    ordered     = models.IntegerField(default=0)
    dispensed   = models.IntegerField(default=0)
    threshold   = models.IntegerField(default=50)
    updated_at  = models.DateTimeField(auto_now=True)

    STATUS_SUCCESS  = "success"
    STATUS_WARNING  = "warning"
    STATUS_CRITICAL = "critical"

    @property
    def status(self):
        if self.current_qty <= 0:
            return self.STATUS_CRITICAL
        if self.current_qty <= self.threshold * 0.10:
            # 90%+ depleted from threshold → critical (also triggers Telegram)
            return self.STATUS_CRITICAL
        if self.current_qty < self.threshold:
            return self.STATUS_WARNING
        return self.STATUS_SUCCESS

    @property
    def depletion_pct(self):
        """How much of threshold has been depleted (0–100)."""
        if self.threshold == 0:
            return 0
        return max(0, round((1 - self.current_qty / self.threshold) * 100))

    def __str__(self):
        return f"{self.medicine} @ {self.hospital.name} ({self.current_qty} {self.unit})"

    class Meta:
        unique_together = ("hospital", "medicine")
        ordering = ["medicine"]


class StockHistory(models.Model):
    """Daily snapshot of stock qty — powers sparkline charts & AI forecast."""
    stock_item = models.ForeignKey(
        StockItem, on_delete=models.CASCADE, related_name="history"
    )
    date = models.DateField()
    qty  = models.IntegerField()

    class Meta:
        unique_together = ("stock_item", "date")
        ordering = ["date"]


# ─────────────────────────────────────────────────────────────────────────────
# TEST AVAILABILITY  [GAP FIX #1]
# ─────────────────────────────────────────────────────────────────────────────
class TestAvailability(models.Model):
    """Diagnostic test availability per hospital (X-ray, USG, Blood Test, etc.)"""
    hospital     = models.ForeignKey(
        Hospital, on_delete=models.CASCADE, related_name="tests"
    )
    test_name    = models.CharField(max_length=100)  # X-ray, Blood Test, USG, ECG ...
    available    = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("hospital", "test_name")
        ordering = ["test_name"]

    def __str__(self):
        status = "✓" if self.available else "✗"
        return f"{status} {self.test_name} @ {self.hospital.name}"


# ─────────────────────────────────────────────────────────────────────────────
# FOOTFALL
# ─────────────────────────────────────────────────────────────────────────────
class Footfall(models.Model):
    """Daily patient footfall per hospital — drives admin footfall-trend chart."""
    hospital = models.ForeignKey(
        Hospital, on_delete=models.CASCADE, related_name="footfall"
    )
    date  = models.DateField()
    count = models.IntegerField(default=0)

    class Meta:
        unique_together = ("hospital", "date")
        ordering = ["-date"]

    def __str__(self):
        return f"{self.hospital.name} — {self.date} — {self.count} patients"


# ─────────────────────────────────────────────────────────────────────────────
# APPOINTMENT
# ─────────────────────────────────────────────────────────────────────────────
class Appointment(models.Model):
    STATUS_CONFIRMED  = "confirmed"
    STATUS_COMPLETED  = "completed"
    STATUS_CANCELLED  = "cancelled"
    STATUS_CHOICES = [
        (STATUS_CONFIRMED,  "confirmed"),
        (STATUS_COMPLETED,  "completed"),
        (STATUS_CANCELLED,  "cancelled"),
    ]

    patient  = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="appointments"
    )
    doctor   = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE)
    date     = models.DateField()
    time     = models.TimeField()
    status   = models.CharField(choices=STATUS_CHOICES, max_length=15, default=STATUS_CONFIRMED)
    notes    = models.TextField(blank=True)

    class Meta:
        ordering = ["date", "time"]

    def __str__(self):
        return f"{self.patient} → {self.doctor} on {self.date} {self.time}"


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATION
# ─────────────────────────────────────────────────────────────────────────────
class Notification(models.Model):
    TYPE_LOW_STOCK            = "lowStock"
    TYPE_BED_FULL             = "bedFull"
    TYPE_DOCTOR_ABSENT        = "doctorAbsent"
    TYPE_APPOINTMENT_REMINDER = "appointmentReminder"
    TYPE_FLAGGED              = "flagged"

    SEVERITY_CRITICAL = "critical"
    SEVERITY_WARNING  = "warning"
    SEVERITY_INFO     = "info"
    SEVERITY_CHOICES  = [
        (SEVERITY_CRITICAL, "critical"),
        (SEVERITY_WARNING,  "warning"),
        (SEVERITY_INFO,     "info"),
    ]

    user       = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    type       = models.CharField(max_length=30)
    title      = models.CharField(max_length=200)
    message    = models.TextField()
    message_mr = models.TextField(blank=True)   # Marathi translation [MULTILINGUAL FIX]
    hospital   = models.ForeignKey(
        Hospital, null=True, blank=True, on_delete=models.SET_NULL
    )
    severity   = models.CharField(choices=SEVERITY_CHOICES, max_length=10)
    read       = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.severity}] {self.title} → {self.user}"


# ─────────────────────────────────────────────────────────────────────────────
# FLAGGED HOSPITAL  [GAP FIX #2]
# ─────────────────────────────────────────────────────────────────────────────
class FlaggedHospital(models.Model):
    """Auto-generated flags for underperforming centres + intervention log."""
    SEVERITY_CRITICAL = "critical"
    SEVERITY_WARNING  = "warning"
    STATUS_OPEN        = "open"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_RESOLVED    = "resolved"

    hospital      = models.ForeignKey(
        Hospital, on_delete=models.CASCADE, related_name="flags"
    )
    reason        = models.CharField(max_length=255)  # e.g. "Stock health < 20% for 3 days"
    reason_mr     = models.TextField(blank=True)       # Marathi version
    severity      = models.CharField(
        choices=[(SEVERITY_CRITICAL, "critical"), (SEVERITY_WARNING, "warning")],
        max_length=10,
    )
    status        = models.CharField(
        choices=[
            (STATUS_OPEN, "open"),
            (STATUS_IN_PROGRESS, "in_progress"),
            (STATUS_RESOLVED, "resolved"),
        ],
        default=STATUS_OPEN,
        max_length=15,
    )
    action_taken  = models.TextField(blank=True)  # intervention log
    flagged_at    = models.DateTimeField(auto_now_add=True)
    resolved_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-flagged_at"]

    def __str__(self):
        return f"[{self.severity}] {self.hospital.name} — {self.reason[:60]}"


# ─────────────────────────────────────────────────────────────────────────────
# REDISTRIBUTION SUGGESTION  [GAP FIX #3]
# ─────────────────────────────────────────────────────────────────────────────
class RedistributionSuggestion(models.Model):
    """AI-computed suggestion: transfer surplus stock from one hospital to another."""
    STATUS_PENDING   = "pending"
    STATUS_ACTIONED  = "actioned"
    STATUS_DISMISSED = "dismissed"

    medicine      = models.CharField(max_length=150)
    from_hospital = models.ForeignKey(
        Hospital, related_name="surplus_of", on_delete=models.CASCADE
    )
    to_hospital   = models.ForeignKey(
        Hospital, related_name="shortage_of", on_delete=models.CASCADE
    )
    suggested_qty = models.IntegerField()
    generated_at  = models.DateTimeField(auto_now_add=True)
    status        = models.CharField(
        choices=[
            (STATUS_PENDING,   "pending"),
            (STATUS_ACTIONED,  "actioned"),
            (STATUS_DISMISSED, "dismissed"),
        ],
        default=STATUS_PENDING,
        max_length=15,
    )

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return (
            f"{self.medicine}: {self.from_hospital.name} → "
            f"{self.to_hospital.name} ({self.suggested_qty})"
        )


# ─────────────────────────────────────────────────────────────────────────────
# AI INSIGHT CACHE
# ─────────────────────────────────────────────────────────────────────────────
class AIInsightCache(models.Model):
    """
    Stores last-generated AI insight per district (+ lang).
    Returned immediately on /api/insights so the page never waits for OpenRouter.
    Celery refreshes this in the background every 6 hours.
    """
    district    = models.ForeignKey(District, on_delete=models.CASCADE)
    lang        = models.CharField(max_length=5, default="en")  # "en" or "mr"
    insights    = models.JSONField(default=list)  # list of insight strings
    forecast    = models.JSONField(default=list)  # stock-out forecast list
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("district", "lang")

    def __str__(self):
        return f"AI cache — {self.district} [{self.lang}] @ {self.generated_at}"
