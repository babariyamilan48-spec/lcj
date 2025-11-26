"""
Logging configuration for database connection monitoring
Enables detailed logging of database connections, sessions, and operations
"""

import logging
import logging.config
import os

# Get log level from environment (default: INFO)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": LOG_LEVEL,
            "formatter": "default",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": LOG_LEVEL,
            "formatter": "detailed",
            "filename": "logs/database.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "encoding": "utf-8",
        },
    },
    "loggers": {
        # Database connection logging - DETAILED
        "core.database_fixed": {
            "level": "INFO",  # Always show database logs
            "handlers": ["console", "file"],
            "propagate": False,
        },
        
        # SQLAlchemy engine logging
        "sqlalchemy.engine": {
            "level": LOG_LEVEL,
            "handlers": ["console", "file"],
            "propagate": False,
        },
        
        # SQLAlchemy pool logging
        "sqlalchemy.pool": {
            "level": LOG_LEVEL,
            "handlers": ["console", "file"],
            "propagate": False,
        },
        
        # Application logging
        "": {
            "level": LOG_LEVEL,
            "handlers": ["console", "file"],
        },
    },
}

def setup_logging():
    """Setup logging configuration"""
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)
    
    # Apply logging configuration
    logging.config.dictConfig(LOGGING_CONFIG)
    
    # Get root logger
    logger = logging.getLogger()
    logger.info(f"✅ Logging configured with level: {LOG_LEVEL}")
    logger.info("📊 Database connection logging enabled")
    
    return logger

# Setup logging when module is imported
setup_logging()
