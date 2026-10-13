import os
import re
import logging
import httpx
import db

log = logging.getLogger(__name__)
DEFAULT_PENERIMA = ("Pengurus", "081326424375")


def normalize(no):
    v = re.sub(r"\D", "", no or "")
    if v.startswith("62"):
        v = "0" + v[2:]
    return v if re.fullmatch(r"0\d{8,14}", v) else None


async def send_wa(targets, message):
    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=5.0)) as c:
        r = await c.post("https://api.fonnte.com/send", headers={"Authorization": os.environ["FONNTE_TOKEN"]},
                         data={"target": ",".join(targets), "message": message, "countryCode": "62"})
    data = r.json()
    if r.status_code >= 400 or (isinstance(data, dict) and data.get("status") is False):
        raise RuntimeError(data.get("reason") or data.get("detail") or str(data))
    return data


async def notify(message, izin_id=None):
    try:
        nums = list(dict.fromkeys(r["no_hp"] for r in await db.fetch("select no_hp from wa_penerima where aktif order by id")))
        if nums:
            await send_wa(nums, message)
            hasil = f"Terkirim ke {len(nums)} nomor"
        else:
            hasil = "Tidak ada nomor penerima aktif"
    except Exception as e:
        log.exception("WA notification failed")
        hasil = f"Gagal: {str(e)[:200]}"
    if izin_id:
        await db.execute("update izin_pulang set notif_wa=$1 where id=$2", hasil, izin_id)
    return hasil


async def seed_wa():
    if await db.fetchval("select value from app_meta where key='wa_seeded'"):
        return
    await db.execute("insert into wa_penerima (nama,no_hp,aktif,created_at) values ($1,$2,true,now()) on conflict (no_hp) do nothing", *DEFAULT_PENERIMA)
    await db.execute("insert into app_meta (key,value) values ('wa_seeded', now()::text) on conflict (key) do nothing")
