import sqlite3
from contextlib import contextmanager
import datetime as dt

APP_DB = "db.sqlite3"

@contextmanager
def get_conn():
    conn = sqlite3.connect(APP_DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def now_iso():
    """Retorna a data e hora atual no formato ISO YYYY-MM-DD HH:MM:SS"""
    return dt.datetime.now().isoformat(timespec="seconds")
