"""
Telegram Bot service for DHMS.

Sends stock-out and critical alert messages to a configured Telegram group/channel.
Fails silently if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured
(so local dev without a bot still works).
"""
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def send_telegram_alert(message: str) -> bool:
    """
    Send a plain-text message to the configured Telegram chat.

    Args:
        message: The alert text (supports basic Markdown).

    Returns:
        True if sent successfully, False otherwise.
    """
    token   = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    if not token or not chat_id:
        logger.warning(
            "Telegram not configured. Set TELEGRAM_BOT_TOKEN and "
            "TELEGRAM_CHAT_ID in .env to enable alerts."
        )
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"

    try:
        response = requests.post(
            url,
            json={
                "chat_id":    chat_id,
                "text":       message,
                "parse_mode": "Markdown",
            },
            timeout=10,
        )
        response.raise_for_status()
        logger.info("Telegram alert sent successfully.")
        return True

    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send Telegram alert: {e}")
        return False
