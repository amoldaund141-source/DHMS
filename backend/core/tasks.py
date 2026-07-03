"""
DHMS Celery Tasks.

Scheduled via celery beat (configured in config/celery.py):
  - refresh_all_ai_insights       every 6h
  - check_all_stock_thresholds    every 30 min
  - auto_flag_hospitals           every 6h
  - compute_redistribution_suggestions  every 6h
  - snapshot_stock_history        daily
  - send_stock_telegram_alert     on-demand (triggered by signal)
  - refresh_district_ai_insights  on-demand (triggered by missing cache)
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta


# ─────────────────────────────────────────────────────────────────────────────
# TELEGRAM ALERT — triggered by signal on stock save
# ─────────────────────────────────────────────────────────────────────────────
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_stock_telegram_alert(self, stock_item_id):
    """Send Telegram alert when a stock item hits 90%+ depletion."""
    try:
        from core.models import StockItem
        from services.telegram import send_telegram_alert

        item = StockItem.objects.select_related("hospital").get(pk=stock_item_id)
        pct  = item.depletion_pct
        msg  = (
            f"⚠️ *Low Stock Alert* — {item.hospital.name}\n"
            f"Medicine: {item.medicine}\n"
            f"Current: {item.current_qty} {item.unit} "
            f"(Threshold: {item.threshold}) — *{pct}% depleted*\n"
            f"District: {item.hospital.district.name}"
        )
        send_telegram_alert(msg)
    except Exception as exc:
        raise self.retry(exc=exc)


# ─────────────────────────────────────────────────────────────────────────────
# STOCK HISTORY SNAPSHOT — daily
# ─────────────────────────────────────────────────────────────────────────────
@shared_task
def snapshot_stock_history():
    """
    Record today's stock qty for every StockItem.
    Drives sparkline charts and AI forecast.
    """
    from core.models import StockItem, StockHistory

    today = timezone.localdate()
    items = StockItem.objects.all()
    created = 0
    for item in items:
        _, was_created = StockHistory.objects.get_or_create(
            stock_item=item, date=today, defaults={"qty": item.current_qty}
        )
        if was_created:
            created += 1
    return f"Snapshotted {created} stock history records for {today}"


# ─────────────────────────────────────────────────────────────────────────────
# STOCK THRESHOLD CHECK — every 30 min
# ─────────────────────────────────────────────────────────────────────────────
@shared_task
def check_all_stock_thresholds():
    """Scan all stock items and send Telegram alerts for critical ones."""
    from core.models import StockItem
    from services.telegram import send_telegram_alert

    critical_items = [
        item for item in StockItem.objects.select_related("hospital__district").all()
        if item.current_qty <= item.threshold * 0.10
    ]

    alerts_sent = 0
    for item in critical_items:
        pct = item.depletion_pct
        send_telegram_alert(
            f"⚠️ *Critical Stock* — {item.hospital.name} ({item.hospital.district.name})\n"
            f"{item.medicine}: {item.current_qty}/{item.threshold} ({pct}% depleted)"
        )
        alerts_sent += 1

    return f"Sent {alerts_sent} stock threshold alerts"


# ─────────────────────────────────────────────────────────────────────────────
# AUTO-FLAG UNDERPERFORMING HOSPITALS — every 6h
# ─────────────────────────────────────────────────────────────────────────────
@shared_task
def auto_flag_hospitals():
    """
    Rule-based flagging:
      1. Stock health < 20% for any hospital
      2. Bed occupancy >= 95%
      3. Doctor absence rate > 50% this week
    Then uses AI to write a human-readable reason in English + Marathi.
    """
    from core.models import Hospital, StockItem, Bed, Attendance, Doctor, FlaggedHospital
    from services.ai import ask_ai

    today = timezone.localdate()
    week_ago = today - timedelta(days=7)
    flagged_count = 0

    for hospital in Hospital.objects.select_related("district").prefetch_related(
        "stock", "beds", "doctors__attendance"
    ):
        reasons = []

        # Rule 1: Stock health < 20%
        items = list(hospital.stock.all())
        if items:
            healthy = sum(1 for i in items if i.status == StockItem.STATUS_SUCCESS)
            health_pct = round((healthy / len(items)) * 100)
            if health_pct < 20:
                reasons.append(f"Stock health is {health_pct}% (below 20% threshold)")

        # Rule 2: Bed occupancy >= 95%
        try:
            if hospital.beds.occupancy_pct >= 95:
                reasons.append(
                    f"Bed occupancy is {hospital.beds.occupancy_pct}% (≥95%)"
                )
        except Bed.DoesNotExist:
            pass

        # Rule 3: Doctor absence rate > 50% this week
        total_doctors = hospital.doctors.count()
        if total_doctors > 0:
            absent_days = Attendance.objects.filter(
                doctor__hospital=hospital,
                date__gte=week_ago,
                status="absent",
            ).count()
            total_possible = total_doctors * 7
            absence_rate = round((absent_days / total_possible) * 100) if total_possible else 0
            if absence_rate > 50:
                reasons.append(f"Doctor absence rate is {absence_rate}% this week (>50%)")

        if not reasons:
            continue

        combined_reason = " | ".join(reasons)
        severity = "critical" if any("Stock" in r and "<" in r or "95%" in r for r in reasons) else "warning"

        # Check if an open flag with the same reason already exists (avoid duplicates)
        existing = FlaggedHospital.objects.filter(
            hospital=hospital, reason=combined_reason, status="open"
        ).exists()
        if existing:
            continue

        # Use AI to write a better human-readable reason
        try:
            prompt = (
                f"Hospital: {hospital.name} ({hospital.type}) in {hospital.district.name}.\n"
                f"Issues detected: {combined_reason}.\n"
                f"Write a 1-sentence professional alert for district health administrators."
            )
            reason_en = ask_ai(prompt, lang="en")
            reason_mr = ask_ai(prompt, lang="mr")
        except Exception:
            reason_en = combined_reason
            reason_mr = ""

        FlaggedHospital.objects.create(
            hospital=hospital,
            reason=reason_en,
            reason_mr=reason_mr,
            severity=severity,
        )
        flagged_count += 1

    return f"Auto-flagged {flagged_count} hospitals"


# ─────────────────────────────────────────────────────────────────────────────
# COMPUTE REDISTRIBUTION SUGGESTIONS — every 6h
# ─────────────────────────────────────────────────────────────────────────────
@shared_task
def compute_redistribution_suggestions():
    """
    For each district, compare stock levels of the same medicine across hospitals.
    If Hospital A has surplus (> 2x threshold) and Hospital B is critical,
    suggest redistribution.
    """
    from core.models import District, StockItem, RedistributionSuggestion

    suggestions_created = 0

    for district in District.objects.all():
        hospitals = district.hospitals.all()
        medicine_map = {}

        # Build medicine → hospital stock map
        for hospital in hospitals:
            for item in hospital.stock.all():
                if item.medicine not in medicine_map:
                    medicine_map[item.medicine] = []
                medicine_map[item.medicine].append(item)

        for medicine, items in medicine_map.items():
            surplus_hospitals = [i for i in items if i.current_qty > i.threshold * 2]
            critical_hospitals = [i for i in items if i.status == StockItem.STATUS_CRITICAL]

            for surplus in surplus_hospitals:
                for critical in critical_hospitals:
                    if surplus.hospital == critical.hospital:
                        continue

                    suggested_qty = min(
                        surplus.current_qty - surplus.threshold,
                        critical.threshold - critical.current_qty,
                    )
                    if suggested_qty <= 0:
                        continue

                    # Avoid duplicate suggestions
                    exists = RedistributionSuggestion.objects.filter(
                        medicine=medicine,
                        from_hospital=surplus.hospital,
                        to_hospital=critical.hospital,
                        status="pending",
                    ).exists()
                    if not exists:
                        RedistributionSuggestion.objects.create(
                            medicine=medicine,
                            from_hospital=surplus.hospital,
                            to_hospital=critical.hospital,
                            suggested_qty=suggested_qty,
                        )
                        suggestions_created += 1

    return f"Created {suggestions_created} redistribution suggestions"


# ─────────────────────────────────────────────────────────────────────────────
# AI INSIGHTS REFRESH — every 6h (also triggered on-demand for first-time load)
# ─────────────────────────────────────────────────────────────────────────────
@shared_task
def refresh_all_ai_insights():
    """Refresh AI insights for all districts in both languages."""
    from core.models import District

    for district in District.objects.all():
        for lang in ("en", "mr"):
            refresh_district_ai_insights.delay(district.id, lang)

    return "Queued AI insight refresh for all districts"


@shared_task(bind=True, max_retries=2, default_retry_delay=120)
def refresh_district_ai_insights(self, district_id, lang="en"):
    """
    Generate AI insights for one district + lang and cache the result.
    If OpenRouter fails, do NOT fail — keep the existing cached value.
    """
    try:
        from core.models import (
            District, Hospital, StockItem, Bed, Attendance, Doctor, AIInsightCache
        )
        from services.ai import ask_ai

        district = District.objects.get(pk=district_id)
        hospitals = Hospital.objects.filter(district=district).prefetch_related("stock", "doctors__attendance")
        today = timezone.localdate()

        # Aggregate numbers
        total = hospitals.count()
        critical_stock = sum(
            1 for h in hospitals
            for i in h.stock.all()
            if i.status == StockItem.STATUS_CRITICAL
        )
        doctors_present = Attendance.objects.filter(
            doctor__hospital__district=district, date=today, status="present"
        ).count()
        doctors_total = Doctor.objects.filter(hospital__district=district).count()
        absence_rate = round(((doctors_total - doctors_present) / doctors_total) * 100) if doctors_total else 0

        beds_qs = Bed.objects.filter(hospital__district=district)
        avg_bed_occ = round(
            sum(b.occupancy_pct for b in beds_qs) / beds_qs.count()
        ) if beds_qs.count() else 0

        prompt = (
            f"District: {district.name}, State: {district.state}.\n"
            f"Total facilities: {total}.\n"
            f"Critical stock items across all hospitals: {critical_stock}.\n"
            f"Doctors present today: {doctors_present}/{doctors_total} ({absence_rate}% absent).\n"
            f"Average bed occupancy: {avg_bed_occ}%.\n\n"
            f"Generate exactly 4 short (1-2 sentence) data-driven insights for the district health administrator. "
            f"Each insight must reference specific numbers. Be direct and actionable."
        )

        insights_text = ask_ai(prompt, lang=lang)
        # Parse — try to split by newlines; fallback to single insight
        insights = [line.strip("- •123456789. ").strip()
                    for line in insights_text.splitlines()
                    if line.strip()][:4]
        if not insights:
            insights = [insights_text]

        # Stock forecast prompt
        forecast_prompt = (
            f"District: {district.name}. {critical_stock} stock items are critically low across "
            f"{total} facilities. Average bed occupancy is {avg_bed_occ}%. "
            f"What are the top 3 predicted health system risks in the next 7 days? Be concise."
        )
        forecast_text = ask_ai(forecast_prompt, lang=lang)
        forecast = [line.strip("- •123456789. ").strip()
                    for line in forecast_text.splitlines()
                    if line.strip()][:3]

        AIInsightCache.objects.update_or_create(
            district=district, lang=lang,
            defaults={"insights": insights, "forecast": forecast},
        )

        return f"Refreshed insights for {district.name} [{lang}]"

    except Exception as exc:
        # Don't let AI failures surface as 500 errors
        # Retry once with a delay, then give up silently
        try:
            raise self.retry(exc=exc)
        except Exception:
            return f"AI insight refresh failed for district {district_id} — keeping cached value"


# ─────────────────────────────────────────────────────────────────────────────
# EXTERNAL API INTEGRATION — scheduled (e.g. every 2 hours)
# ─────────────────────────────────────────────────────────────────────────────
@shared_task
def fetch_external_hospital_data():
    """
    Connect to an external hospital database/API, pull the latest data,
    and conservatively update this system's database.
    """
    import os
    import logging
    from core.models import StockItem
    
    logger = logging.getLogger(__name__)
    external_api_url = os.environ.get("EXTERNAL_HOSPITAL_API_URL")
    
    # 1. Fetch data
    if external_api_url:
        try:
            import requests
            response = requests.get(external_api_url, timeout=10)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            logger.error(f"Failed to fetch external data: {e}")
            return f"Error: Failed to connect to external API - {e}"
    else:
        # MOCK DATA for demonstration/development
        # Simulating data arriving from an external system
        data = {
            "medicines": [
                {"name": "Amoxicillin 250mg", "quantity": 180},
                {"name": "Atenolol 50mg", "quantity": 45},
                {"name": "Unknown Medicine", "quantity": 500} # Should be ignored
            ]
        }
    
    # 2. Safely Update our Database
    updated_count = 0
    ignored_count = 0
    
    try:
        external_medicines = data.get("medicines", [])
        
        for ext_item in external_medicines:
            med_name = ext_item.get("name")
            new_qty = ext_item.get("quantity")
            
            if med_name and new_qty is not None:
                # Find existing items in our DB matching this name
                # We do NOT create new ones if they don't exist
                matching_items = StockItem.objects.filter(medicine__iexact=med_name)
                
                if matching_items.exists():
                    for db_item in matching_items:
                        db_item.current_qty = int(new_qty)
                        db_item.save(update_fields=['current_qty'])
                        updated_count += 1
                else:
                    ignored_count += 1
                    
        return f"External sync complete. Updated {updated_count} existing items. Ignored {ignored_count} unrecognized items."
        
    except Exception as e:
        logger.error(f"Error during external data sync: {e}")
        return f"Error: {e}"
