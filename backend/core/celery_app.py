"""
Celery application configuration for Life Changing Journey backend.
Handles asynchronous task processing with Redis as broker and result backend.
"""

import os
import sys
from pathlib import Path
from celery import Celery
from kombu import Queue

# Load environment variables from .env file
try:
    from dotenv import load_dotenv

    # Get the backend directory (parent of core)
    backend_dir = Path(__file__).parent.parent
    env_file = backend_dir / '.env'

    if env_file.exists():
        load_dotenv(env_file, encoding='utf-8')
        print(f"[OK] Loaded environment variables from {env_file}")

        # Verify critical variables are loaded
        gemini_key = os.getenv('GEMINI_API_KEY')
        if gemini_key:
            print(f"[OK] GEMINI_API_KEY loaded: {gemini_key[:10]}...")
        else:
            print("[ERROR] GEMINI_API_KEY not found in environment")
    else:
        print(f"[WARNING] .env file not found at {env_file}")

except ImportError:
    print("[WARNING] python-dotenv not installed, environment variables may not be loaded")
except Exception as e:
    print(f"[WARNING] Error loading .env file: {e}")

# Get Redis configuration from environment variables
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', REDIS_URL)

# Configure SSL settings for Redis connections if using rediss://
broker_use_ssl = {}
result_backend_use_ssl = {}

if CELERY_BROKER_URL.startswith('rediss://'):
    import ssl
    broker_use_ssl = {
        'ssl_cert_reqs': ssl.CERT_NONE,
        'ssl_ca_certs': None,
        'ssl_certfile': None,
        'ssl_keyfile': None,
    }

if CELERY_RESULT_BACKEND.startswith('rediss://'):
    import ssl
    result_backend_use_ssl = {
        'ssl_cert_reqs': ssl.CERT_NONE,
        'ssl_ca_certs': None,
        'ssl_certfile': None,
        'ssl_keyfile': None,
    }

# Create Celery app instance
celery_app = Celery(
    'lcj_backend',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=[
        'core.tasks.ai_report_tasks',
        'core.tasks.pdf_generation_tasks'
    ]
)

# Celery configuration
celery_app.conf.update(
    # SSL configuration for Redis connections
    broker_use_ssl=broker_use_ssl,
    redis_backend_use_ssl=result_backend_use_ssl,

    # Task routing
    task_routes={
        'core.tasks.ai_report_tasks.*': {'queue': 'ai_reports'},
        'core.tasks.pdf_generation_tasks.*': {'queue': 'pdf_generation'},
    },

    # Queue configuration
    task_default_queue='default',
    task_queues=(
        Queue('default', routing_key='default'),
        Queue('ai_reports', routing_key='ai_reports'),
        Queue('pdf_generation', routing_key='pdf_generation'),
    ),

    # Task execution settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Task result settings
    result_expires=3600,  # Results expire after 1 hour
    task_track_started=True,
    task_send_sent_event=True,
    result_extended=True,  # Store more task metadata

    # Worker settings
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,

    # Retry settings
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,

    # Exception handling
    task_reject_on_worker_lost=True,
    task_ignore_result=False,
    task_store_errors_even_if_ignored=True,

    # Rate limiting
    task_annotations={
        'core.tasks.ai_report_tasks.generate_ai_insights_task': {
            'rate_limit': '10/m'  # 10 tasks per minute for AI generation
        },
        'core.tasks.ai_report_tasks.generate_comprehensive_ai_insights_task': {
            'rate_limit': '5/m'   # 5 tasks per minute for comprehensive reports
        },
        'core.tasks.pdf_generation_tasks.generate_pdf_report_task': {
            'rate_limit': '20/m'  # 20 PDF generations per minute
        }
    },

    # Monitoring
    worker_send_task_events=True,
)

# Health check task
@celery_app.task(bind=True)
def health_check(self):
    """Simple health check task to verify Celery is working"""
    return {
        'status': 'healthy',
        'task_id': self.request.id,
        'worker': self.request.hostname,
        'timestamp': self.request.eta
    }

# Import tasks to ensure they are registered
from core.tasks import ai_report_tasks
from core.tasks import pdf_generation_tasks

if __name__ == '__main__':
    celery_app.start()
