"""config/__init__.py — make Celery app available on django startup"""
from .celery import app as celery_app

__all__ = ("celery_app",)
