from pathlib import Path
import logging

LOG_DIR = Path("logs")
LOG_FILE_PATH = LOG_DIR / "application_log.txt"
LOG_FORMAT = "%(message)s"


def configure_logging() -> logging.Logger:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("web_query_logger")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    formatter = logging.Formatter(LOG_FORMAT)

    for handler in logger.handlers:
        if isinstance(handler, logging.FileHandler) and Path(getattr(handler, "baseFilename", "")).resolve() == LOG_FILE_PATH.resolve():
            handler.setFormatter(formatter)
            return logger

    file_handler = logging.FileHandler(LOG_FILE_PATH, encoding="utf-8", mode="a")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger


logger = configure_logging()
