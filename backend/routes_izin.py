from datetime import date
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel
import db
from auth import require_roles
from wa import notify, normalize
from utils import BULAN

router = APIRouter(prefix="/api")
STAFF = require_roles("admin", "pengurus")
ADMIN = require_roles("admin")
SANTRI = require_roles("santri")
SELECT = ("select i.*, s.nama, s.kelas, s.program_keahlian, s.jenis_kelamin, k.nama_kamar from izin_pulang i "
          "join santri s on s.nis=i.nis left join kamar k on k.id_kamar=s.id_kamar")


def tgl_id(d):
    return f"{d.day} {BULAN[d.month - 1]} {d.year}"


class IzinIn(BaseModel):
    tanggal_pulang: date
    tanggal_kembali: date
    penjemput: str
    alasan: str


class ProsesIn(BaseModel):
    status: str
    catatan: Optional[str] = None


class PenerimaIn(BaseModel):
    nama: str
    no_hp: str
    aktif: bool = True


@router.post("/izin")
async def ajukan_izin(body: IzinIn, request: Request, bg: BackgroundTasks, user=Depends(SANTRI)):
    if not body.penjemput.strip() or not body.alasan.strip():
        raise HTTPException(400, "Penjemput dan alasan wajib diisi")
    if body.tanggal_kembali < body.tanggal_pulang:
        raise HTTPException(400, "Tanggal kembali tidak boleh sebelum tanggal pulang")
    iid = await db.fetchval(
        "insert into izin_pulang (nis,tanggal_pulang,tanggal_kembali,penjemput,alasan,status,created_at) values ($1,$2,$3,$4,$5,'menunggu',now()) returning id",
        user["nis"], body.tanggal_pulang, body.tanggal_kembali, body.penjemput.strip(), body.alasan.strip())
    s = await db.fetchrow("select s.nama, s.kelas, s.program_keahlian, k.nama_kamar from santri s left join kamar k on k.id_kamar=s.id_kamar where s.nis=$1", user["nis"])
    origin = request.headers.get("origin")
    msg = ("*PENGAJUAN IZIN PULANG*\nPP Alhasani Limpung\n\n"
           f"Nama: {s['nama']}\nNIS: {user['nis']}\nKelas: {s['kelas']} {s['program_keahlian'] or ''}\nKamar: {s['nama_kamar'] or '-'}\n"
           f"Tanggal pulang: {tgl_id(body.tanggal_pulang)}\nKembali: {tgl_id(body.tanggal_kembali)}\n"
           f"Penjemput: {body.penjemput.strip()}\nAlasan: {body.alasan.strip()}\n\n"
           "Mohon diproses (ACC / tolak) melalui aplikasi" + (f":\n{origin}/izin" if origin else "."))
    bg.add_task(notify, msg, iid)
    return {"id": iid}


@router.get("/izin/saya")
async def izin_saya(user=Depends(SANTRI)):
    return await db.fetch(SELECT + " where i.nis=$1 order by i.created_at desc", user["nis"])


@router.get("/izin")
async def list_izin(status: Optional[str] = None, user=Depends(STAFF)):
    if status:
        return await db.fetch(SELECT + " where i.status=$1 order by i.created_at desc limit 300", status)
    return await db.fetch(SELECT + " order by (i.status='menunggu') desc, i.created_at desc limit 300")


@router.get("/izin/rekap")
async def rekap_izin(dari: Optional[date] = None, sampai: Optional[date] = None, user=Depends(STAFF)):
    args, cond = [], ""
    if dari:
        args.append(dari)
        cond += f" and i.tanggal_pulang >= ${len(args)}"
    if sampai:
        args.append(sampai)
        cond += f" and i.tanggal_pulang <= ${len(args)}"
    return await db.fetch(
        "select s.nis, s.nama, s.kelas, s.program_keahlian, s.jenis_kelamin, "
        "count(i.id) filter (where i.status='disetujui') jumlah_pulang, count(i.id) filter (where i.status='menunggu') menunggu, "
        "count(i.id) filter (where i.status='ditolak') ditolak, max(i.tanggal_pulang) filter (where i.status='disetujui') terakhir_pulang, "
        "coalesce(sum(i.tanggal_kembali - i.tanggal_pulang + 1) filter (where i.status='disetujui'), 0) total_hari "
        f"from santri s left join izin_pulang i on i.nis=s.nis {cond} where s.status='aktif' group by s.nis order by jumlah_pulang desc, s.nama", *args)


@router.post("/izin/{iid}/proses")
async def proses_izin(iid: int, body: ProsesIn, user=Depends(STAFF)):
    if body.status not in ("disetujui", "ditolak"):
        raise HTTPException(400, "Status tidak valid")
    r = await db.execute("update izin_pulang set status=$1, catatan=$2, diproses_oleh=$3, diproses_at=now() where id=$4",
                         body.status, body.catatan, user["name"], iid)
    if r.endswith(" 0"):
        raise HTTPException(404, "Pengajuan tidak ditemukan")
    return {"ok": True}


@router.delete("/izin/{iid}")
async def hapus_izin(iid: int, user=Depends(require_roles("admin", "santri"))):
    if user["role"] == "santri":
        r = await db.execute("delete from izin_pulang where id=$1 and nis=$2 and status='menunggu'", iid, user["nis"])
        if r.endswith(" 0"):
            raise HTTPException(400, "Hanya pengajuan yang masih menunggu yang bisa dibatalkan")
    else:
        await db.execute("delete from izin_pulang where id=$1", iid)
    return {"ok": True}


def _penerima(body: PenerimaIn):
    no = normalize(body.no_hp)
    if not no or not body.nama.strip():
        raise HTTPException(400, "Nama dan nomor WA (format 08xxx) wajib valid")
    return body.nama.strip(), no, body.aktif


@router.get("/wa-penerima")
async def list_penerima(user=Depends(ADMIN)):
    return await db.fetch("select * from wa_penerima order by id")


@router.post("/wa-penerima")
async def add_penerima(body: PenerimaIn, user=Depends(ADMIN)):
    nama, no, aktif = _penerima(body)
    if await db.fetchval("select 1 from wa_penerima where no_hp=$1", no):
        raise HTTPException(400, "Nomor sudah terdaftar")
    return {"id": await db.fetchval("insert into wa_penerima (nama,no_hp,aktif,created_at) values ($1,$2,$3,now()) returning id", nama, no, aktif)}


@router.put("/wa-penerima/{pid}")
async def edit_penerima(pid: int, body: PenerimaIn, user=Depends(ADMIN)):
    nama, no, aktif = _penerima(body)
    if await db.fetchval("select 1 from wa_penerima where no_hp=$1 and id<>$2", no, pid):
        raise HTTPException(400, "Nomor sudah terdaftar")
    await db.execute("update wa_penerima set nama=$1, no_hp=$2, aktif=$3 where id=$4", nama, no, aktif, pid)
    return {"ok": True}


@router.delete("/wa-penerima/{pid}")
async def del_penerima(pid: int, user=Depends(ADMIN)):
    await db.execute("delete from wa_penerima where id=$1", pid)
    return {"ok": True}


@router.post("/wa-penerima/test")
async def test_penerima(user=Depends(ADMIN)):
    return {"hasil": await notify("*Tes Notifikasi*\nPP Alhasani Limpung\n\nNomor ini terdaftar sebagai penerima notifikasi izin pulang santri.")}
