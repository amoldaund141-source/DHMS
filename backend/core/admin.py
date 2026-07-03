"""
DHMS Django Admin — register all models for manual data management.
Includes django-import-export for Excel import buttons in the admin panel.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from import_export.admin import ImportExportModelAdmin

from .models import (
    AIInsightCache, Appointment, Attendance, Bed, District, Doctor,
    FlaggedHospital, Footfall, Hospital, Notification, RedistributionSuggestion,
    StockHistory, StockItem, TestAvailability, User,
)


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display  = ("name", "code", "state")
    search_fields = ("name", "code")


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(Hospital)
class HospitalAdmin(ImportExportModelAdmin):
    list_display  = ("name", "type", "area", "district", "status", "phone")
    list_filter   = ("type", "area", "status", "district")
    search_fields = ("name", "location")


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ("email", "role", "district", "hospital", "is_state_admin", "is_active")
    list_filter   = ("role", "is_state_admin", "is_active")
    search_fields = ("email", "first_name", "last_name")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("DHMS Role & Scoping", {
            "fields": ("role", "district", "hospital", "is_state_admin",
                       "phone", "dob", "gender", "blood_group", "emergency_contact"),
        }),
    )


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = (
        "hospital", "general_total", "general_occupied",
        "semi_total", "semi_occupied", "special_total", "special_occupied",
    )


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(Doctor)
class DoctorAdmin(ImportExportModelAdmin):
    list_display  = ("name", "specialization", "hospital")
    list_filter   = ("hospital", "specialization")
    search_fields = ("name",)


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("doctor", "date", "status", "check_in")
    list_filter  = ("status", "date")
    date_hierarchy = "date"


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(StockItem)
class StockItemAdmin(ImportExportModelAdmin):
    list_display  = ("medicine", "hospital", "current_qty", "threshold", "unit", "status")
    list_filter   = ("hospital",)
    search_fields = ("medicine",)

    def status(self, obj):
        return obj.status
    status.short_description = "Status"


@admin.register(StockHistory)
class StockHistoryAdmin(admin.ModelAdmin):
    list_display = ("stock_item", "date", "qty")
    date_hierarchy = "date"


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(TestAvailability)
class TestAvailabilityAdmin(admin.ModelAdmin):
    list_display = ("test_name", "hospital", "available", "last_updated")
    list_filter  = ("available", "hospital")


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(Footfall)
class FootfallAdmin(admin.ModelAdmin):
    list_display  = ("hospital", "date", "count")
    date_hierarchy = "date"


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("patient", "doctor", "hospital", "date", "time", "status")
    list_filter  = ("status", "hospital", "date")
    date_hierarchy = "date"


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "severity", "read", "created_at")
    list_filter  = ("type", "severity", "read")
    date_hierarchy = "created_at"


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(FlaggedHospital)
class FlaggedHospitalAdmin(admin.ModelAdmin):
    list_display  = ("hospital", "severity", "status", "flagged_at", "resolved_at")
    list_filter   = ("severity", "status")
    date_hierarchy = "flagged_at"


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(RedistributionSuggestion)
class RedistributionSuggestionAdmin(admin.ModelAdmin):
    list_display = ("medicine", "from_hospital", "to_hospital", "suggested_qty", "status")
    list_filter  = ("status",)


# ─────────────────────────────────────────────────────────────────────────────
@admin.register(AIInsightCache)
class AIInsightCacheAdmin(admin.ModelAdmin):
    list_display = ("district", "lang", "generated_at")
    readonly_fields = ("generated_at",)
