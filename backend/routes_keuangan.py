import asyncio
from datetime import date
from typing import Optional
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import db
from auth import require_roles
from utils import BULAN, month_index, today_wib, dec

router = APIRouter(prefix="/api")
STAFF = require_roles("admin", "pengurus")
ADMIN = require_roles("admin")
FEE_BULANAN = 100000
FEE_DAFTAR = 150000


def _next(y, m):
    return (y + 1, 1) if m == 12 else (y, m + 1)


def compute_tagihan(s, pays, exs, today):
    end = today if s["status"] == "aktif" or not s.get("updated_at") else s["updated_at"].date()
    paid = {}
    for p in pays:
        mi = month_index(p["bulan_tagihan"])
        if p["jenis_pembayaran"] == "syariah" and mi and p["tahun_tagihan"]:
            paid.setdefault((int(p["tahun_tagihan"]), mi), p)
    exm = {(e["tahun"], e["bulan"]): e for e in exs}
    last = (end.year, end.month)
    if paid:
        last = max(last, max(paid))
    y, m = _next(s["tanggal_daftar"].year, s["tanggal_daftar"].month)
    months = []
    while (y, m) <= last:
        p, e = paid.get((y, m)), exm.get((y, m))
        status = "lunas" if p else ("dibebaskan" if e else "belum")
        months.append({"bulan": m, "tahun": y, "label": f"{BULAN[m-1]} {y}", "status": status, "nominal": FEE_BULANAN,
                       "id_pembayaran": p["id_pembayaran"] if p else None,
                       "keterangan": e["keterangan"] if (e and not p) else None})
        y, m = _next(y, m)
    dibayar = float(sum(p["nominal"] for p in pays if p["jenis_pembayaran"] == "pendaftaran"))
    sisa = max(0.0, FEE_DAFTAR - dibayar)
    belum = sum(1 for x in months if x["status"] == "belum")
    return {"pendaftaran": {"tagihan": FEE_DAFTAR, "dibayar": dibayar, "sisa": sisa, "lunas": sisa == 0},
            "bulanan": months, "bulan_belum": belum, "total_tunggakan": belum * FEE_BULANAN + sisa}


async def tagihan_overview():
    santri, all_pays, all_exs = await asyncio.gather(
        db.fetch("select s.*, k.nama_kamar from santri s left join kamar k on k.id_kamar=s.id_kamar where s.status='aktif' order by s.nama"),
        db.fetch("select nis, jenis_pembayaran, nominal, bulan_tagihan, tahun_tagihan, id_pembayaran from pembayaran"),
        db.fetch("select * from tagihan_status"))
    pays, exs = defaultdict(list), defaultdict(list)
    for p in all_pays:
        pays[p["nis"]].append(p)
    for e in all_exs:
        exs[e["nis"]].append(e)
    today, out = today_wib(), []
    for s in santri:
        t = compute_tagihan(s, pays[s["nis"]], exs[s["nis"]], today)
        out.append({"nis": s["nis"], "nama": s["nama"], "kelas": s["kelas"], "jenis_kelamin": s["jenis_kelamin"],
                    "nama_kamar": s["nama_kamar"], "bulan_belum": t["bulan_belum"],
                    "pendaftaran_sisa": t["pendaftaran"]["sisa"], "total_tunggakan": t["total_tunggakan"]})
    return out


@router.get("/tagihan")
async def list_tagihan(user=Depends(STAFF)):
    return await tagihan_overview()


@router.get("/tagihan/{nis}")
async def get_tagihan(nis: str, user=Depends(require_roles("admin", "pengurus", "santri"))):
    if user["role"] == "santri" and user["nis"] != nis:
        raise HTTPException(403, "Anda tidak memiliki akses")
    s, pays, exs = await asyncio.gather(
        db.fetchrow("select s.*, k.nama_kamar from santri s left join kamar k on k.id_kamar=s.id_kamar where s.nis=$1", nis),
        db.fetch("select p.*, pg.nama_pengurus from pembayaran p left join pengurus pg on pg.id_pengurus=p.id_pengurus where p.nis=$1 order by p.tanggal_bayar desc, p.id_pembayaran desc", nis),
        db.fetch("select * from tagihan_status where nis=$1", nis))
    if not s:
        raise HTTPException(404, "Santri tidak ditemukan")
    return {"santri": s, **compute_tagihan(s, pays, exs, today_wib()), "pembayaran": pays}


class StatusIn(BaseModel):
    bulan: int
    tahun: int
    status: str
    keterangan: Optional[str] = None


@router.post("/tagihan/{nis}/status")
async def set_status(nis: str, body: StatusIn, user=Depends(ADMIN)):
    if body.status == "dibebaskan":
        if await db.fetchval("select 1 from pembayaran where nis=$1 and jenis_pembayaran='syariah' and lower(bulan_tagihan)=lower($2) and tahun_tagihan=$3",
                             nis, BULAN[body.bulan - 1], str(body.tahun)):
            raise HTTPException(400, "Bulan ini sudah lunas")
        await db.execute(
            "insert into tagihan_status (nis,bulan,tahun,status,keterangan,created_by,created_at) values ($1,$2,$3,'dibebaskan',$4,$5,now()) "
            "on conflict (nis,bulan,tahun) do update set keterangan=excluded.keterangan, created_by=excluded.created_by",
            nis, body.bulan, body.tahun, body.keterangan or "Dibebaskan", user["id"])
    else:
        await db.execute("delete from tagihan_status where nis=$1 and bulan=$2 and tahun=$3", nis, body.bulan, body.tahun)
    return {"ok": True}


class BayarIn(BaseModel):
    nis: str
    jenis: str
    bulan: Optional[int] = None
    tahun: Optional[int] = None
    nominal: float
    tanggal_bayar: Optional[date] = None
    keterangan: Optional[str] = None


async def gen_no_transaksi(d: date) -> str:
    prefix = f"TRX-{d:%Y%m%d}"
    last = await db.fetchval("select max(no_transaksi) from pembayaran where no_transaksi like $1", prefix + "%")
    return f"{prefix}{(int(last[-3:]) + 1) if last else 1:03d}"


async def create_payment(user, body: BayarIn):
    s = await db.fetchrow("select * from santri where nis=$1", body.nis)
    if not s:
        raise HTTPException(404, "Santri tidak ditemukan")
    if body.jenis not in ("syariah", "pendaftaran") or body.nominal <= 0:
        raise HTTPException(400, "Data pembayaran tidak valid")
    if not user.get("id_pengurus"):
        raise HTTPException(400, "Akun ini tidak terhubung dengan data pengurus")
    tgl = body.tanggal_bayar or today_wib()
    bulan_nama, tahun = None, str(body.tahun or tgl.year)
    if body.jenis == "syariah":
        if not body.bulan or not body.tahun or not 1 <= body.bulan <= 12:
            raise HTTPException(400, "Bulan & tahun tagihan wajib diisi")
        bulan_nama = BULAN[body.bulan - 1]
        if await db.fetchval("select 1 from pembayaran where nis=$1 and jenis_pembayaran='syariah' and lower(bulan_tagihan)=lower($2) and tahun_tagihan=$3",
                             body.nis, bulan_nama, tahun):
            raise HTTPException(400, f"Syariah {bulan_nama} {tahun} sudah lunas")
        if await db.fetchval("select 1 from tagihan_status where nis=$1 and bulan=$2 and tahun=$3", body.nis, body.bulan, body.tahun):
            raise HTTPException(400, f"Bulan {bulan_nama} {tahun} dibebaskan dari tagihan")
    no = await gen_no_transaksi(tgl)
    pid = await db.fetchval(
        "insert into pembayaran (nis,jenis_pembayaran,nominal,tanggal_bayar,bulan_tagihan,tahun_tagihan,keterangan,id_pengurus,no_transaksi,created_at,updated_at) "
        "values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now()) returning id_pembayaran",
        body.nis, body.jenis, dec(body.nominal), tgl, bulan_nama, tahun, body.keterangan, user["id_pengurus"], no)
    ket = f"Syariah Bulanan - {bulan_nama} {tahun} a.n {s['nama']}" if body.jenis == "syariah" else f"Pendaftaran a.n {s['nama']}"
    await db.execute(
        "insert into transaksi_keuangan (jenis,kategori,nominal,tanggal,keterangan,referensi_id,referensi_tipe,created_at,updated_at) "
        "values ('pemasukan',$1,$2,$3,$4,$5,'pembayaran',now(),now())", body.jenis, dec(body.nominal), tgl, ket, str(pid))
    return {"id_pembayaran": pid, "no_transaksi": no}


@router.post("/pembayaran")
async def add_payment(body: BayarIn, user=Depends(STAFF)):
    return await create_payment(user, body)


@router.get("/pembayaran")
async def list_payment(nis: Optional[str] = None, limit: int = 50, user=Depends(STAFF)):
    q = ("select p.*, s.nama, s.kelas, pg.nama_pengurus from pembayaran p join santri s on s.nis=p.nis "
         "left join pengurus pg on pg.id_pengurus=p.id_pengurus")
    if nis:
        return await db.fetch(q + " where p.nis=$1 order by p.id_pembayaran desc limit $2", nis, limit)
    return await db.fetch(q + " order by p.id_pembayaran desc limit $1", limit)


@router.get("/pembayaran/{pid}")
async def get_payment(pid: int, user=Depends(require_roles("admin", "pengurus", "santri"))):
    p = await db.fetchrow(
        "select p.*, s.nama, s.kelas, s.alamat, s.jenis_kelamin, k.nama_kamar, pg.nama_pengurus from pembayaran p join santri s on s.nis=p.nis "
        "left join kamar k on k.id_kamar=s.id_kamar left join pengurus pg on pg.id_pengurus=p.id_pengurus where p.id_pembayaran=$1", pid)
    if not p or (user["role"] == "santri" and p["nis"] != user["nis"]):
        raise HTTPException(404, "Pembayaran tidak ditemukan")
    return p


@router.delete("/pembayaran/{pid}")
async def delete_payment(pid: int, user=Depends(ADMIN)):
    await db.execute("delete from transaksi_keuangan where referensi_tipe='pembayaran' and referensi_id=$1", str(pid))
    await db.execute("delete from pembayaran where id_pembayaran=$1", pid)
    return {"ok": True}


class TransaksiIn(BaseModel):
    jenis: str
    kategori: str
    nominal: float
    tanggal: date
    keterangan: Optional[str] = None


@router.get("/keuangan")
async def list_keuangan(dari: Optional[date] = None, sampai: Optional[date] = None, user=Depends(ADMIN)):
    dari = dari or date(2000, 1, 1)
    sampai = sampai or today_wib()
    items = await db.fetch("select * from transaksi_keuangan where tanggal between $1 and $2 order by tanggal desc, id_transaksi desc", dari, sampai)
    masuk = sum(float(i["nominal"]) for i in items if i["jenis"] == "pemasukan")
    keluar = sum(float(i["nominal"]) for i in items if i["jenis"] == "pengeluaran")
    saldo = await db.fetchval("select coalesce(sum(case when jenis='pemasukan' then nominal else -nominal end),0) from transaksi_keuangan")
    awal = await db.fetchval("select coalesce(sum(case when jenis='pemasukan' then nominal else -nominal end),0) from transaksi_keuangan where tanggal < $1", dari)
    return {"items": items, "total_masuk": masuk, "total_keluar": keluar, "saldo_periode": masuk - keluar,
            "saldo_awal": float(awal), "saldo_kas": float(saldo)}


@router.post("/keuangan")
async def add_keuangan(body: TransaksiIn, user=Depends(ADMIN)):
    if body.jenis not in ("pemasukan", "pengeluaran") or body.nominal <= 0 or not body.kategori.strip():
        raise HTTPException(400, "Data transaksi tidak valid")
    tid = await db.fetchval(
        "insert into transaksi_keuangan (jenis,kategori,nominal,tanggal,keterangan,referensi_tipe,created_at,updated_at) "
        "values ($1,$2,$3,$4,$5,'manual',now(),now()) returning id_transaksi",
        body.jenis, body.kategori.strip(), dec(body.nominal), body.tanggal, body.keterangan)
    return {"id_transaksi": tid}


@router.delete("/keuangan/{tid}")
async def delete_keuangan(tid: int, user=Depends(ADMIN)):
    await db.execute("delete from transaksi_keuangan where id_transaksi=$1", tid)
    return {"ok": True}
