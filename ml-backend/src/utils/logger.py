"""
Centralized logging configuration for LumoTrade

Provides structured logging with:
- Different log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- File and console output
- Automatic log rotation
- Colored console output
- Structured JSON logs for production
"""

import logging
import sys
from pathlib import Path
from datetime import datetime
from logging.handlers import RotatingFileHandler
import json


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for console output"""
    
    # Color codes
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'        # Reset
    }
    
    def format(self, record):
        # Add color to levelname
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = f"{self.COLORS[levelname]}{levelname}{self.COLORS['RESET']}"
        
        return super().format(record)


class JSONFormatter(logging.Formatter):
    """Format logs as JSON for production"""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)


def setup_logger(
    name: str = 'lumotrade',
    level: str = 'INFO',
    log_dir: str = 'logs',
    json_format: bool = False
) -> logging.Logger:
    """
    Setup and configure logger
    
    Args:
        name: Logger name
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files
        json_format: Use JSON format for logs (production)
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create log directory
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)
    
    # Console handler (always colored, human-readable)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    if json_format:
        console_formatter = JSONFormatter()
    else:
        console_formatter = ColoredFormatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handler for all logs
    all_log_file = log_path / f'{name}.log'
    file_handler = RotatingFileHandler(
        all_log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    
    if json_format:
        file_formatter = JSONFormatter()
    else:
        file_formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(module)s:%(lineno)d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    # Separate error log file
    error_log_file = log_path / f'{name}_errors.log'
    error_handler = RotatingFileHandler(
        error_log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    logger.addHandler(error_handler)
    
    return logger


# Global logger instance
logger = setup_logger()


# Convenience functions
def debug(msg, *args, **kwargs):
    logger.debug(msg, *args, **kwargs)


def info(msg, *args, **kwargs):
    logger.info(msg, *args, **kwargs)


def warning(msg, *args, **kwargs):
    logger.warning(msg, *args, **kwargs)


def error(msg, *args, **kwargs):
    logger.error(msg, *args, **kwargs)


def critical(msg, *args, **kwargs):
    logger.critical(msg, *args, **kwargs)


def exception(msg, *args, **kwargs):
    logger.exception(msg, *args, **kwargs)

