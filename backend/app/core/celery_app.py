from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery = Celery(
    "wealth_sync",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
)

# Periodic task schedule
celery.conf.beat_schedule = {
    'check-bills-daily': {
        'task': 'app.tasks.bill_automation.check_and_create_pending_bills',
        'schedule': crontab(hour=6, minute=0),  # Run daily at 6 AM UTC
    },
}

celery.conf.task_routes = {
    'app.tasks.bill_automation.*': {'queue': 'bills'},
}
