"""Django signals for DHMS — post-save triggers."""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import StockItem

logger = logging.getLogger(__name__)


@receiver(post_save, sender=StockItem)
def check_stock_on_save(sender, instance, **kwargs):
    """
    After any StockItem save, if stock is at or below 10% of threshold
    (i.e. 90%+ depleted), fire a Telegram alert via Celery task.
    This keeps the HTTP response fast — the alert is sent in the background.

    Falls back gracefully if Celery/Redis is unavailable (e.g. local dev
    without a Redis broker running).
    """
    if instance.current_qty <= instance.threshold * 0.10:
        try:
            # Import here to avoid circular imports at module load time
            from core.tasks import send_stock_telegram_alert
            send_stock_telegram_alert.delay(instance.pk)
        except Exception as exc:  # noqa: BLE001
            # Redis/Celery unavailable — log and continue rather than crashing
            logger.warning(
                "Could not queue stock alert for StockItem %s (Celery/Redis unavailable): %s",
                instance.pk,
                exc,
            )
