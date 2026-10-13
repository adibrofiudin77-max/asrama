import asyncio
from datetime import date, time
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import db
from auth import require_roles, get_current_user
from routes_keuangan import tagihan_overview
from utils import today_wib

router = APIRouter(prefix="/api")
STAFF = require_roles("admin", "pengurus")
ABSEN = require_roles("admin", "pengurus", "ustadz")
HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
STATUS = {"hadir", "sakit", "izin", "alpha"}


class JadwalIn(BaseModel):
    nama_kegiatan: str
    hari: str
    waktu: time
    id_ustadz: Optional[int] = None


@router.get("/jadwal")
async def list_jadwal(user=Depends(get_current_user)):
    return await db.fetch(
        "select j.*, u.nama_ustadz from jadwal j left join ustadz u on u.id_ustadz=j.id_ustadz "
        "order by array_position(array['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']::varchar[], j.hari), j.waktu, j.id_jadwal")


def _check(body: JadwalIn):
    if body.hari not in HARI or not body.nama_kegiatan.strip():
        raise HTTPException(400, "Data jadwal tidak valid")


@router.post("/jadwal")
async def add_jadwal(body: JadwalIn, user=Depends(STAFF)):
    _check(body)
    jid = await db.fetchval("insert into jadwal (nama_kegiatan,hari,waktu,id_ustadz,created_at,updated_at) values ($1,$2,$3,$4,now(),now()) returning id_jadwal",
                            body.nama_kegiatan.strip(), body.hari, body.waktu, body.id_ustadz)
    return {"id_jadwal": jid}


@router.put("/jadwal/{jid}")
async def edit_jadwal(jid: int, body: JadwalIn, user=Depends(STAFF)):
    _check(body)
    await db.execute("update jadwal set nama_kegiatan=$1,hari=$2,waktu=$3,id_ustadz=$4,updated_at=now() where id_jadwal=$5",
                     body.nama_kegiatan.strip(), body.hari, body.waktu, body.id_ustadz, jid)
    return {"ok": True}


@router.delete("/jadwal/{jid}")
async def del_jadwal(jid: int, user=Depends(STAFF)):
    await db.execute("delete from jadwal where id_jadwal=$1", jid)
    return {"ok": True}


@router.get("/absensi")
async def get_absensi(tanggal: date, id_jadwal: int, user=Depends(ABSEN)):
    return await db.fetch(
        "select s.nis, s.nama, s.kelas, s.program_keahlian, s.jenis_kelamin, k.status, k.keterangan from santri s "
        "left join kehadiran k on k.nis=s.nis and k.tanggal=$1 and k.id_jadwal=$2 where s.status='aktif' order by s.jenis_kelamin, s.nama",
        tanggal, id_jadwal)


class AbsenItem(BaseModel):
    nis: str
    status: str
    keterangan: Optional[str] = None


class AbsensiIn(BaseModel):
    tanggal: date
    id_jadwal: int
    items: List[AbsenItem]


@router.post("/absensi")
async def save_absensi(body: AbsensiIn, user=Depends(ABSEN)):
    j = await db.fetchrow("select * from jadwal where id_jadwal=$1", body.id_jadwal)
    if not j:
        raise HTTPException(404, "Jadwal tidak ditemukan")
    if any(i.status not in STATUS for i in body.items):
        raise HTTPException(400, "Status kehadiran tidak valid")
    id_ustadz = user.get("id_ustadz") or j["id_ustadz"]
    rows = [(i.nis, body.id_jadwal, id_ustadz, body.tanggal, i.status, i.keterangan or None) for i in body.items]
    async with db.pool().acquire() as c:
        await c.executemany(
            "insert into kehadiran (nis,id_jadwal,id_ustadz,tanggal,status,keterangan,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,now(),now()) "
            "on conflict (nis,tanggal,id_jadwal) do update set status=excluded.status, keterangan=excluded.keterangan, id_ustadz=excluded.id_ustadz, updated_at=now()",
            rows)
    return {"jumlah": len(rows)}


async def rekap_kehadiran(dari: Optional[date] = None, sampai: Optional[date] = None):
    args, cond = [], ""
    if dari:
        args.append(dari)
        cond += f" and k.tanggal >= ${len(args)}"
    if sampai:
        args.append(sampai)
        cond += f" and k.tanggal <= ${len(args)}"
    rows = await db.fetch(
        "select s.nis, s.nama, s.kelas, s.program_keahlian, s.jenis_kelamin, count(k.id_kehadiran) total, "
        "count(*) filter (where k.status='hadir') hadir, count(*) filter (where k.status='sakit') sakit, "
        "count(*) filter (where k.status='izin') izin, count(*) filter (where k.status='alpha') alpha "
        f"from santri s left join kehadiran k on k.nis=s.nis {cond} where s.status='aktif' group by s.nis order by s.nama", *args)
    for r in rows:
        r["persen"] = round(r["hadir"] * 100 / r["total"], 1) if r["total"] else 0
    return rows


@router.get("/absensi/rekap")
async def get_rekap(dari: Optional[date] = None, sampai: Optional[date] = None, user=Depends(ABSEN)):
    return await rekap_kehadiran(dari, sampai)


@router.get("/kehadiran/saya")
async def kehadiran_saya(user=Depends(require_roles("santri"))):
    items = await db.fetch(
        "select k.*, j.nama_kegiatan, j.hari, j.waktu from kehadiran k left join jadwal j on j.id_jadwal=k.id_jadwal "
        "where k.nis=$1 order by k.tanggal desc, j.waktu", user["nis"])
    summary = {s: sum(1 for i in items if i["status"] == s) for s in STATUS}
    total = len(items)
    return {"items": items, "summary": summary, "total": total, "persen": round(summary["hadir"] * 100 / total, 1) if total else 0}


@router.get("/dashboard")
async def dashboard(periode: str = "bulan", user=Depends(STAFF)):
    today = today_wib()
    first = today.replace(day=1)
    rek, ov, aktif, hadir, masuk, jml, saldo, recent = await asyncio.gather(
        rekap_kehadiran(first if periode == "bulan" else None, today if periode == "bulan" else None),
        tagihan_overview(),
        db.fetch("select jenis_kelamin, count(*) n from santri where status='aktif' group by jenis_kelamin"),
        db.fetchval("select count(distinct nis) from kehadiran where tanggal=$1 and status='hadir'", today),
        db.fetchval("select coalesce(sum(nominal),0) from pembayaran where tanggal_bayar between $1 and $2", first, today),
        db.fetchval("select count(*) from jadwal"),
        db.fetchval("select coalesce(sum(case when jenis='pemasukan' then nominal else -nominal end),0) from transaksi_keuangan"),
        db.fetch("select p.id_pembayaran, p.no_transaksi, p.nominal, p.jenis_pembayaran, p.bulan_tagihan, p.tahun_tagihan, p.tanggal_bayar, s.nama "
                 "from pembayaran p join santri s on s.nis=p.nis order by p.id_pembayaran desc limit 5"))
    rek = [r for r in rek if r["total"] > 0]
    rajin = sorted(rek, key=lambda r: (-r["persen"], -r["hadir"], r["nama"]))[:5]
    malas = sorted(rek, key=lambda r: (r["persen"], -r["alpha"], r["nama"]))[:5]
    jk = {r["jenis_kelamin"]: r["n"] for r in aktif}
    stats = {
        "total_santri": sum(jk.values()), "putra": jk.get("L", 0), "putri": jk.get("P", 0),
        "hadir_hari_ini": hadir, "pemasukan_bulan_ini": float(masuk),
        "santri_menunggak": sum(1 for o in ov if o["total_tunggakan"] > 0),
        "total_tunggakan": sum(o["total_tunggakan"] for o in ov),
        "jumlah_jadwal": jml,
    }
    if user["role"] == "admin":
        stats["saldo_kas"] = float(saldo)
    return {"stats": stats, "top_rajin": rajin, "top_malas": malas, "pembayaran_terbaru": recent, "periode": periode}
