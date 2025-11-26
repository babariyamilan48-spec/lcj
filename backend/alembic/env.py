from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- Python path setup so `core` and `app` can be imported ---
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

SERVICE_ROOT = os.path.abspath(os.path.join(BACKEND_ROOT, 'auth_service'))
SERVICE_ROOT = os.path.abspath(os.path.join(BACKEND_ROOT, 'question_service'))
SERVICE_ROOT = os.path.abspath(os.path.join(BACKEND_ROOT, 'contact_service'))
SERVICE_ROOT = os.path.abspath(os.path.join(BACKEND_ROOT, 'results_service'))
if SERVICE_ROOT not in sys.path:
    sys.path.insert(0, SERVICE_ROOT)

from core.config.settings import settings
from core.database_fixed import Base
from auth_service.app.models import  user
from question_service.app.models.test import Test
from question_service.app.models.test_section import TestSection
from question_service.app.models.question import Question
from question_service.app.models.option import Option
from question_service.app.models.test_dimension import TestDimension
from question_service.app.models.test_result import TestResult , TestResultConfiguration , TestResultDetail
from contact_service.app.models.contact import Contact
from question_service.app.models.ai_insights import AIInsights
target_metadata = Base.metadata

def run_migrations_offline():
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = settings.DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
