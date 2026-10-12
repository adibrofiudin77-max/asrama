from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
_IDX = {b.lower(): i + 1 for i, b in enumerate(BULAN)}


def today_wib():
    return datetime.now(ZoneInfo("Asia/Jakarta")).date()


def month_index(name):
    return _IDX.get((name or "").strip().lower())


def dec(x):
    return Decimal(str(x))
