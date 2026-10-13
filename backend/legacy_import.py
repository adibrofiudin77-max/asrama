import re
import logging
from pathlib import Path
import bcrypt
import db

DUMP = Path(__file__).parent / "data" / "alhasani_db.sql"
ORDER = ["kamar", "ustadz", "pengurus", "santri", "users", "jadwal", "kehadiran", "pembayaran", "riwayat_kelas", "transaksi_keuangan"]
SEQ = {"kamar": "id_kamar", "ustadz": "id_ustadz", "pengurus": "id_pengurus", "users": "id", "jadwal": "id_jadwal",
       "kehadiran": "id_kehadiran", "pembayaran": "id_pembayaran", "riwayat_kelas": "id", "transaksi_keuangan": "id_transaksi"}
PATTERN = re.compile(r"INSERT INTO `(\w+)` \((.*?)\) VALUES\n(.*?);\n", re.S)


async def import_legacy():
    if await db.fetchval("select value from app_meta where key='legacy_imported'"):
        return
    sql = DUMP.read_text(encoding="utf-8")
    blocks = {}
    for t, cols, vals in PATTERN.findall(sql):
        vals = vals.replace("\\'", "''").replace('\\"', '"').replace("\\r\\n", "\n")
        blocks[t] = f'INSERT INTO {t} ({cols.replace("`", chr(34))}) VALUES {vals};'
    santri_pw = bcrypt.hashpw(b"111111", bcrypt.gensalt()).decode()
    async with db.pool().acquire() as c:
        async with c.transaction():
            for t in ORDER:
                if t in blocks:
                    await c.execute(blocks[t])
            for t, col in SEQ.items():
                await c.execute(f"select setval(pg_get_serial_sequence('{t}','{col}'), coalesce((select max({col}) from {t}), 1))")
            await c.execute("update users set password=$1 where role='santri'", santri_pw)
            await c.execute("insert into app_meta (key, value) values ('legacy_imported', now()::text)")
    logging.getLogger(__name__).info("Legacy data imported")
