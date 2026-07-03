"""
DHMS URL routing — all endpoints under /api/ (as included from config/urls.py).

Full endpoint map:
  Auth
    POST  /api/auth/login
    POST  /api/auth/register
    POST  /api/auth/logout
    GET   /api/auth/me

  Districts
    GET   /api/districts/
    GET   /api/districts/<id>/

  Hospitals
    GET   /api/hospitals/                             (filters: area, type, status, lat, lng, district_id)
    GET   /api/hospitals/district-stats/
    GET   /api/hospitals/footfall-trend/
    GET   /api/hospitals/bed-trend/
    GET   /api/hospitals/<id>/
    GET   /api/hospitals/<id>/doctors/
    PATCH /api/hospitals/<hospital_id>/doctors/<doc_id>/attendance/
    GET   /api/hospitals/<id>/attendance/
    GET   /api/hospitals/<id>/attendance/history/
    GET   /api/hospitals/<id>/stock/
    GET   /api/hospitals/<id>/stock/summary/
    PATCH /api/hospitals/<hospital_id>/stock/<item_id>/
    GET   /api/hospitals/<id>/tests/
    PATCH /api/hospitals/<hospital_id>/tests/<test_id>/

  Appointments
    GET   /api/appointments/
    POST  /api/appointments/
    GET   /api/appointments/slots/                    (?hospitalId=&doctorId=&date=)
    PATCH /api/appointments/<id>/

  Notifications
    GET   /api/notifications/
    PATCH /api/notifications/read-all/
    PATCH /api/notifications/<id>/read/

  Flagged
    GET   /api/flagged/                               (?district_id=&status=)
    PATCH /api/flagged/<id>/

  AI Insights
    GET   /api/insights/                              (?lang=en|mr)
    GET   /api/insights/forecast/                    (?hospital_id=&lang=)
    GET   /api/insights/redistribution/              (?district_id=)
    GET   /api/insights/flagged/                     (?district_id=)

  Excel Import
    POST  /api/import/stock/
    POST  /api/import/patients/
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    # ── Auth ─────────────────────────────────────────────────────────────────
    path("auth/login/",    views.LoginView.as_view(),    name="auth-login"),
    path("auth/register/", views.RegisterView.as_view(), name="auth-register"),
    path("auth/logout/",   views.logout_view,            name="auth-logout"),
    path("auth/me/",       views.me_view,                name="auth-me"),
    path("auth/refresh/",  TokenRefreshView.as_view(),   name="auth-refresh"),

    # ── Districts ─────────────────────────────────────────────────────────────
    path("districts/",          views.DistrictListView.as_view(),   name="district-list"),
    path("districts/<int:pk>/", views.DistrictDetailView.as_view(), name="district-detail"),

    # ── Hospitals — aggregate ─────────────────────────────────────────────────
    path("hospitals/",                  views.HospitalListView.as_view(),  name="hospital-list"),
    path("hospitals/district-stats/",   views.district_stats_view,         name="district-stats"),
    path("hospitals/footfall-trend/",   views.footfall_trend_view,         name="footfall-trend"),
    path("hospitals/bed-trend/",        views.bed_trend_view,              name="bed-trend"),

    # ── Hospital — detail ─────────────────────────────────────────────────────
    path("hospitals/<int:pk>/", views.HospitalDetailView.as_view(), name="hospital-detail"),

    # ── Doctors & Attendance (under hospital) ─────────────────────────────────
    path("hospitals/<int:hospital_id>/doctors/",
         views.DoctorListView.as_view(), name="doctor-list"),
    path("hospitals/<int:hospital_id>/doctors/<int:doc_id>/attendance/",
         views.update_doctor_attendance, name="doctor-attendance"),

    path("hospitals/<int:hospital_id>/attendance/",
         views.AttendanceListView.as_view(), name="attendance-list"),
    path("hospitals/<int:hospital_id>/attendance/history/",
         views.attendance_history_view, name="attendance-history"),

    # ── Stock ─────────────────────────────────────────────────────────────────
    path("hospitals/<int:hospital_id>/stock/",
         views.StockListView.as_view(), name="stock-list"),
    path("hospitals/<int:hospital_id>/stock/summary/",
         views.stock_summary_view, name="stock-summary"),
    path("hospitals/<int:hospital_id>/stock/<int:item_id>/",
         views.update_stock_item, name="stock-update"),

    # ── Test Availability ─────────────────────────────────────────────────────
    path("hospitals/<int:hospital_id>/tests/",
         views.TestAvailabilityListView.as_view(), name="test-list"),
    path("hospitals/<int:hospital_id>/tests/<int:test_id>/",
         views.update_test_availability, name="test-update"),

    # ── Appointments ──────────────────────────────────────────────────────────
    path("appointments/",         views.AppointmentListView.as_view(), name="appointment-list"),
    path("appointments/slots/",   views.appointment_slots_view,        name="appointment-slots"),
    path("appointments/<int:appt_id>/", views.update_appointment,      name="appointment-update"),

    # ── Notifications ─────────────────────────────────────────────────────────
    path("notifications/",           views.NotificationListView.as_view(), name="notification-list"),
    path("notifications/read-all/",  views.mark_all_notifications_read,   name="notification-read-all"),
    path("notifications/<int:notif_id>/read/", views.mark_notification_read, name="notification-read"),

    # ── Flagged Hospitals ─────────────────────────────────────────────────────
    path("flagged/",            views.FlaggedHospitalListView.as_view(), name="flagged-list"),
    path("flagged/<int:flag_id>/", views.update_flagged_hospital,        name="flagged-update"),

    # ── AI Insights ───────────────────────────────────────────────────────────
    path("insights/",                views.ai_insights_view,      name="ai-insights"),
    path("insights/forecast/",       views.ai_forecast_view,      name="ai-forecast"),
    path("insights/redistribution/", views.RedistributionListView.as_view(), name="redistribution"),
    path("insights/flagged/",        views.ai_flagged_view,       name="ai-flagged"),

    # ── Excel Import ──────────────────────────────────────────────────────────
    path("import/stock/",    views.import_stock_view,    name="import-stock"),
    path("import/patients/", views.import_patients_view, name="import-patients"),
]
