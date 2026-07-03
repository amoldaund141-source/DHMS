"""Celery application configuration for DHMS."""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("dhms")

# Read config from Django settings, namespaced with CELERY_
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all INSTALLED_APPS
app.autodiscover_tasks()

# ── Periodic tasks (beat schedule) ────────────────────────────────────────────
app.conf.beat_schedule = {
    # Refresh AI insights for each district every 6 hours
    "refresh-ai-insights": {
        "task": "core.tasks.refresh_all_ai_insights",
        "schedule": 6 * 60 * 60,  # seconds
    },
    # Check stock thresholds and send Telegram alerts every 30 min
    "check-stock-thresholds": {
        "task": "core.tasks.check_all_stock_thresholds",
        "schedule": 30 * 60,
    },
    # Auto-flag underperforming hospitals every 6 hours
    "auto-flag-hospitals": {
        "task": "core.tasks.auto_flag_hospitals",
        "schedule": 6 * 60 * 60,
    },
    # Compute redistribution suggestions every 6 hours
    "compute-redistribution": {
        "task": "core.tasks.compute_redistribution_suggestions",
        "schedule": 6 * 60 * 60,
    },
    # Record daily stock snapshot for sparklines / forecast
    "snapshot-stock-history": {
        "task": "core.tasks.snapshot_stock_history",
        "schedule": 24 * 60 * 60,  # once per day at midnight
    },
    # Fetch external hospital data every 2 hours
    "fetch-external-hospital-data": {
        "task": "core.tasks.fetch_external_hospital_data",
        "schedule": 2 * 60 * 60,  # every 2 hours
    },
}
