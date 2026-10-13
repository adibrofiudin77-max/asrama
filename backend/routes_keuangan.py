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
FEE_DAFTAR = 150000
TARIF_DEFAULT = 100000
TARIF_KELAS = {"XI": 60000, "XII": 60000}
MANUAL = "lunas_manual"


def tarif_bulanan(kelas):
    return TARIF_KELAS.get((kelas or "").strip().upper(), TARIF_DEFAULT)


def label(y, m):
    return f"{BULAN[m - 1]} {y}"


def _next(y, m):
    return (y + 1, 1) if m == 12 else (y, m + 1)


def _first(s):
    return _next(s["tanggal_daftar"].year, s["tanggal_daftar"].month)


def compute_tagihan(s, pays, alok, sts, today):
    tarif = tarif_bulanan(s["kelas"])
    end = today if s["status"] == "aktif" or not s.get("updated_at") else s["updated_at"].date()
    paid, last_pid = defaultdict(float), {}
    for a in alok:
        k = (a["tahun"], a["bulan"])
        paid[k] += float(a["nominal"])
        last_pid[k] = max(last_pid.get(k, 0), a["id_pembayaran"])
    stm = {(e["tahun"], e["bulan"]): e for e in sts if e["bulan"]}
    last = (end.year, end.month)
    if paid:
        last = max(last, max(paid))
    (y, m), months = _first(s), []
    while (y, m) <= last:
        p, e = paid.get((y, m), 0.0), stm.get((y, m))
        status = "lunas" if p >= tarif else e["status"] if e else "sebagian" if p > 0 else "belum"
        months.append({"bulan": m, "tahun": y, "label": label(y, m), "status": status, "nominal": tarif, "dibayar": p,
                       "sisa": tarif - p if status in ("belum", "sebagian") else 0,
                       "id_pembayaran": last_pid.get((y, m)),
                       "keterangan": e["keterangan"] if (e and status != "lunas") else None})
        y, m = _next(y, m)
    dibayar = float(sum(p["nominal"] for p in pays if p["jenis_pembayaran"] == "pendaftaran"))
    manual = any(e["bulan"] == 0 for e in sts)
    sisa = 0.0 if manual else max(0.0, FEE_DAFTAR - dibayar)
    return {"tarif_bulanan": tarif,
            "pendaftaran": {"tagihan": FEE_DAFTAR, "dibayar": dibayar, "sisa": sisa, "lunas": sisa == 0, "manual": manual},
            "bulanan": months, "bulan_belum": sum(1 for x in months if x["sisa"] > 0),
            "total_tunggakan": sum(x["sisa"] for x in months) + sisa}


def allocate(s, t, sts, nominal):
    tarif, rest, out = t["tarif_bulanan"], float(nominal), []
    skip = {(e["tahun"], e["bulan"]) for e in sts if e["bulan"]}

    def put(y, m, sisa):
        nonlocal rest
        n = min(rest, sisa)
        rest -= n
        out.append({"bulan": m, "tahun": y, "label": label(y, m), "nominal": n, "tarif": tarif, "sisa": sisa - n})

    for x in t["bulanan"]:
        if rest > 0 and x["sisa"] > 0:
            put(x["tahun"], x["bulan"], x["sisa"])
    b = t["bulanan"]
    y, m = _next(b[-1]["tahun"], b[-1]["bulan"]) if b else _first(s)
    for _ in range(240):
        if rest <= 0:
            break
        if (y, m) not in skip:
            put(y, m, tarif)
        y, m = _next(y, m)
    return out


def rincian(p, alok):
    if p["jenis_pembayaran"] != "syariah":
        return "Pendaftaran"
    if not alok:
        return f"Syariah {p.get('bulan_tagihan') or ''} {p.get('tahun_tagihan') or ''}".strip()
    a, z = alok[0], alok[-1]
    if len(alok) == 1:
        return f"Syariah {label(a['tahun'], a['bulan'])}" + (" (sebagian)" if float(a["sisa"]) > 0 else "")
    return f"Syariah {label(a['tahun'], a['bulan'])} s/d {label(z['tahun'], z['bulan'])} ({len(alok)} bulan)"


def attach_rincian(pays, alok):
    by = defaultdict(list)
    for a in sorted(alok, key=lambda a: (a["tahun"], a["bulan"], a["id"])):
        by[a["id_pembayaran"]].append(a)
    for p in pays:
        p["alokasi"] = by[p["id_pembayaran"]]
        p["rincian"] = rincian(p, p["alokasi"])
    return pays


async def with_rincian(pays):
    ids = [p["id_pembayaran"] for p in pays]
    alok = await db.fetch("select * from pembayaran_alokasi where id_pembayaran = any($1::bigint[])", ids) if ids else []
    return attach_rincian(pays, alok)


async def load_bill(nis):
    s, pays, alok, sts = await asyncio.gather(
        db.fetchrow("select s.*, k.nama_kamar from santri s left join kamar k on k.id_kamar=s.id_kamar where s.nis=$1", nis),
        db.fetch("select p.*, pg.nama_pengurus from pembayaran p left join pengurus pg on pg.id_pengurus=p.id_pengurus where p.nis=$1 order by p.tanggal_bayar desc, p.id_pembayaran desc", nis),
        db.fetch("select * from pembayaran_alokasi where nis=$1", nis),
        db.fetch("select * from tagihan_status where nis=$1", nis))
    if not s:
        raise HTTPException(404, "Santri tidak ditemukan")
    return s, pays, alok, sts


async def migrate_alokasi():
    rows = await db.fetch("select id_pembayaran, nis, nominal, bulan_tagihan, tahun_tagihan from pembayaran p where jenis_pembayaran='syariah' "
                          "and not exists (select 1 from pembayaran_alokasi a where a.id_pembayaran=p.id_pembayaran)")
    for r in rows:
        mi = month_index(r["bulan_tagihan"])
        if mi and (r["tahun_tagihan"] or "").isdigit():
            await db.execute("insert into pembayaran_alokasi (id_pembayaran,nis,bulan,tahun,nominal,tarif,sisa,created_at) values ($1,$2,$3,$4,$5,$5,0,now())",
                             r["id_pembayaran"], r["nis"], mi, int(r["tahun_tagihan"]), r["nominal"])


async def tagihan_overview():
    santri, all_pays, all_alok, all_sts = await asyncio.gather(
        db.fetch("select s.*, k.nama_kamar from santri s left join kamar k on k.id_kamar=s.id_kamar where s.status='aktif' order by s.nama"),
        db.fetch("select nis, jenis_pembayaran, nominal from pembayaran where jenis_pembayaran='pendaftaran'"),
        db.fetch("select nis, bulan, tahun, nominal, id_pembayaran from pembayaran_alokasi"),
        db.fetch("select * from tagihan_status"))
    pays, alok, sts = defaultdict(list), defaultdict(list), defaultdict(list)
    for src, dst in ((all_pays, pays), (all_alok, alok), (all_sts, sts)):
        for r in src:
            dst[r["nis"]].append(r)
    today, out = today_wib(), []
    for s in santri:
        t = compute_tagihan(s, pays[s["nis"]], alok[s["nis"]], sts[s["nis"]], today)
        out.append({"nis": s["nis"], "nama": s["nama"], "kelas": s["kelas"], "program_keahlian": s["program_keahlian"], "jenis_kelamin": s["jenis_kelamin"],
                    "nama_kamar": s["nama_kamar"], "bulan_belum": t["bulan_belum"], "tarif_bulanan": t["tarif_bulanan"],
                    "pendaftaran_sisa": t["pendaftaran"]["sisa"], "total_tunggakan": t["total_tunggakan"]})
    return out


@router.get("/tagihan")
async def list_tagihan(user=Depends(STAFF)):
    return await tagihan_overview()


@router.get("/tagihan/{nis}")
async def get_tagihan(nis: str, user=Depends(require_roles("admin", "pengurus", "santri"))):
    if user["role"] == "santri" and user["nis"] != nis:
        raise HTTPException(403, "Anda tidak memiliki akses")
    s, pays, alok, sts = await load_bill(nis)
    return {"santri": s, **compute_tagihan(s, pays, alok, sts, today_wib()), "pembayaran": attach_rincian(pays, alok)}


class StatusIn(BaseModel):
    bulan: int
    tahun: int
    status: str
    keterangan: Optional[str] = None


async def upsert_status(nis, rows, status, ket, uid):
    async with db.pool().acquire() as c:
        await c.executemany(
            "insert into tagihan_status (nis,bulan,tahun,status,keterangan,created_by,created_at) values ($1,$2,$3,$4,$5,$6,now()) "
            "on conflict (nis,bulan,tahun) do update set status=excluded.status, keterangan=excluded.keterangan, created_by=excluded.created_by",
            [(nis, b, t, status, ket, uid) for b, t in rows])


@router.post("/tagihan/{nis}/status")
async def set_status(nis: str, body: StatusIn, user=Depends(ADMIN)):
    if not 0 <= body.bulan <= 12 or (body.bulan == 0 and body.status == "dibebaskan"):
        raise HTTPException(400, "Bulan tidak valid")
    if body.status == "dibebaskan":
        if await db.fetchval("select 1 from pembayaran_alokasi where nis=$1 and bulan=$2 and tahun=$3", nis, body.bulan, body.tahun):
            raise HTTPException(400, "Bulan ini sudah ada pembayaran")
        await upsert_status(nis, [(body.bulan, body.tahun)], "dibebaskan", body.keterangan or "Dibebaskan", user["id"])
    elif body.status == MANUAL:
        await upsert_status(nis, [(body.bulan, body.tahun)], MANUAL, body.keterangan or "Lunas (bayar manual)", user["id"])
    else:
        await db.execute("delete from tagihan_status where nis=$1 and bulan=$2 and tahun=$3", nis, body.bulan, body.tahun)
    return {"ok": True}


class LunasManualIn(BaseModel):
    sampai_bulan: int
    sampai_tahun: int
    pendaftaran: bool = False
    keterangan: Optional[str] = None


@router.post("/tagihan/{nis}/lunas-manual")
async def lunas_manual(nis: str, body: LunasManualIn, user=Depends(ADMIN)):
    s, pays, alok, sts = await load_bill(nis)
    t = compute_tagihan(s, pays, alok, sts, today_wib())
    rows = [(x["bulan"], x["tahun"]) for x in t["bulanan"] if x["sisa"] > 0 and (x["tahun"], x["bulan"]) <= (body.sampai_tahun, body.sampai_bulan)]
    if body.pendaftaran and not t["pendaftaran"]["lunas"]:
        rows.append((0, 0))
    if rows:
        await upsert_status(nis, rows, MANUAL, body.keterangan or "Lunas (bayar manual)", user["id"])
    return {"jumlah": len(rows)}


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
    if body.jenis not in ("syariah", "pendaftaran") or body.nominal <= 0:
        raise HTTPException(400, "Data pembayaran tidak valid")
    if not user.get("id_pengurus"):
        raise HTTPException(400, "Akun ini tidak terhubung dengan data pengurus")
    s, pays, alok, sts = await load_bill(body.nis)
    tgl = body.tanggal_bayar or today_wib()
    rows, bulan_nama, tahun = [], None, str(tgl.year)
    if body.jenis == "syariah":
        rows = allocate(s, compute_tagihan(s, pays, alok, sts, today_wib()), sts, body.nominal)
        bulan_nama, tahun = BULAN[rows[0]["bulan"] - 1], str(rows[0]["tahun"])
    no = await gen_no_transaksi(tgl)
    ket = f"{rincian({'jenis_pembayaran': body.jenis}, rows)} a.n {s['nama']}"
    async with db.pool().acquire() as c:
        async with c.transaction():
            pid = await c.fetchval(
                "insert into pembayaran (nis,jenis_pembayaran,nominal,tanggal_bayar,bulan_tagihan,tahun_tagihan,keterangan,id_pengurus,no_transaksi,created_at,updated_at) "
                "values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now()) returning id_pembayaran",
                body.nis, body.jenis, dec(body.nominal), tgl, bulan_nama, tahun, body.keterangan, user["id_pengurus"], no)
            if rows:
                await c.executemany(
                    "insert into pembayaran_alokasi (id_pembayaran,nis,bulan,tahun,nominal,tarif,sisa,created_at) values ($1,$2,$3,$4,$5,$6,$7,now())",
                    [(pid, body.nis, r["bulan"], r["tahun"], dec(r["nominal"]), dec(r["tarif"]), dec(r["sisa"])) for r in rows])
            await c.execute(
                "insert into transaksi_keuangan (jenis,kategori,nominal,tanggal,keterangan,referensi_id,referensi_tipe,created_at,updated_at) "
                "values ('pemasukan',$1,$2,$3,$4,$5,'pembayaran',now(),now())", body.jenis, dec(body.nominal), tgl, ket, str(pid))
    return {"id_pembayaran": pid, "no_transaksi": no, "alokasi": rows}


@router.post("/pembayaran")
async def add_payment(body: BayarIn, user=Depends(STAFF)):
    return await create_payment(user, body)


class PreviewIn(BaseModel):
    nis: str
    nominal: float


@router.post("/pembayaran/preview")
async def preview_payment(body: PreviewIn, user=Depends(STAFF)):
    s, pays, alok, sts = await load_bill(body.nis)
    if body.nominal <= 0:
        return {"alokasi": []}
    return {"alokasi": allocate(s, compute_tagihan(s, pays, alok, sts, today_wib()), sts, body.nominal)}


@router.get("/pembayaran")
async def list_payment(nis: Optional[str] = None, limit: int = 50, user=Depends(STAFF)):
    q = ("select p.*, s.nama, s.kelas, s.program_keahlian, pg.nama_pengurus from pembayaran p join santri s on s.nis=p.nis "
         "left join pengurus pg on pg.id_pengurus=p.id_pengurus")
    if nis:
        return await with_rincian(await db.fetch(q + " where p.nis=$1 order by p.id_pembayaran desc limit $2", nis, limit))
    return await with_rincian(await db.fetch(q + " order by p.id_pembayaran desc limit $1", limit))


@router.get("/pembayaran/{pid}")
async def get_payment(pid: int, user=Depends(require_roles("admin", "pengurus", "santri"))):
    p = await db.fetchrow(
        "select p.*, s.nama, s.kelas, s.program_keahlian, s.alamat, s.jenis_kelamin, k.nama_kamar, pg.nama_pengurus from pembayaran p join santri s on s.nis=p.nis "
        "left join kamar k on k.id_kamar=s.id_kamar left join pengurus pg on pg.id_pengurus=p.id_pengurus where p.id_pembayaran=$1", pid)
    if not p or (user["role"] == "santri" and p["nis"] != user["nis"]):
        raise HTTPException(404, "Pembayaran tidak ditemukan")
    p["alokasi"] = await db.fetch("select * from pembayaran_alokasi where id_pembayaran=$1 order by tahun, bulan, id", pid)
    p["rincian"] = rincian(p, p["alokasi"])
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
