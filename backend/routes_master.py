from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
import db
from auth import require_roles, hash_password, ROLE_MAP, DB_ROLE
from routes_keuangan import create_payment, BayarIn
from utils import today_wib

router = APIRouter(prefix="/api")
STAFF = require_roles("admin", "pengurus")
ADMIN = require_roles("admin")
FIELDS = ["nama", "tempat_lahir", "tanggal_lahir", "jenis_kelamin", "alamat", "nama_bapak", "nama_ibu",
          "no_hp_santri", "no_hp_ortu", "kelas", "program_keahlian", "id_kamar", "tanggal_daftar", "status"]


def kelas_label(kelas, pk):
    return f"{kelas} {pk or ''}".strip()


class SantriIn(BaseModel):
    nama: str
    tempat_lahir: Optional[str] = None
    tanggal_lahir: Optional[date] = None
    jenis_kelamin: str = "L"
    alamat: Optional[str] = None
    nama_bapak: Optional[str] = None
    nama_ibu: Optional[str] = None
    no_hp_santri: Optional[str] = None
    no_hp_ortu: Optional[str] = None
    kelas: str = "X"
    program_keahlian: Optional[str] = None
    id_kamar: Optional[int] = None
    tanggal_daftar: date = Field(default_factory=today_wib)
    status: str = "aktif"


class SantriCreate(SantriIn):
    nis: str
    bayar_pendaftaran: bool = False
    nominal_pendaftaran: float = 150000


@router.get("/santri")
async def list_santri(q: Optional[str] = None, status: Optional[str] = None, kelas: Optional[str] = None,
                      jurusan: Optional[str] = None, user=Depends(STAFF)):
    where, args = [], []
    if q:
        args.append(f"%{q.lower()}%")
        where.append(f"(lower(s.nama) like ${len(args)} or s.nis like ${len(args)})")
    if status:
        args.append(status)
        where.append(f"s.status=${len(args)}")
    if kelas:
        args.append(kelas)
        where.append(f"s.kelas=${len(args)}")
    if jurusan == "_none":
        where.append("s.program_keahlian is null")
    elif jurusan:
        args.append(jurusan)
        where.append(f"s.program_keahlian=${len(args)}")
    sql = "select s.*, k.nama_kamar from santri s left join kamar k on k.id_kamar=s.id_kamar"
    sql += (" where " + " and ".join(where)) if where else ""
    return await db.fetch(sql + " order by s.nama", *args)


@router.get("/santri/{nis}")
async def get_santri(nis: str, user=Depends(STAFF)):
    s = await db.fetchrow("select s.*, k.nama_kamar from santri s left join kamar k on k.id_kamar=s.id_kamar where s.nis=$1", nis)
    if not s:
        raise HTTPException(404, "Santri tidak ditemukan")
    return s


@router.post("/santri")
async def create_santri(body: SantriCreate, user=Depends(STAFF)):
    nis = body.nis.strip()
    if not nis or not body.nama.strip():
        raise HTTPException(400, "NIS dan nama wajib diisi")
    if await db.fetchval("select 1 from santri where nis=$1", nis):
        raise HTTPException(400, "NIS sudah terdaftar")
    ph = ",".join(f"${i + 2}" for i in range(len(FIELDS)))
    await db.execute(f"insert into santri (nis,{','.join(FIELDS)},created_at,updated_at) values ($1,{ph},now(),now())",
                     nis, *[getattr(body, f) for f in FIELDS])
    await db.execute(
        "insert into users (name,email,password,role,nis,created_at,updated_at) values ($1,$2,$3,'santri',$4,now(),now()) on conflict (email) do nothing",
        body.nama, f"{nis}@alhasani.santri", hash_password("111111"), nis)
    pay = None
    if body.bayar_pendaftaran:
        pay = await create_payment(user, BayarIn(nis=nis, jenis="pendaftaran", nominal=body.nominal_pendaftaran,
                                                 tanggal_bayar=body.tanggal_daftar, keterangan="Pendaftaran Santri Baru"))
    return {"nis": nis, "pembayaran": pay}


@router.put("/santri/{nis}")
async def update_santri(nis: str, body: SantriIn, user=Depends(ADMIN)):
    sets = ",".join(f"{f}=${i + 2}" for i, f in enumerate(FIELDS))
    r = await db.execute(f"update santri set {sets}, updated_at=now() where nis=$1", nis, *[getattr(body, f) for f in FIELDS])
    if r.endswith(" 0"):
        raise HTTPException(404, "Santri tidak ditemukan")
    await db.execute("update users set name=$1 where nis=$2 and role='santri'", body.nama, nis)
    return {"ok": True}


@router.delete("/santri/{nis}")
async def delete_santri(nis: str, user=Depends(ADMIN)):
    await db.execute("delete from transaksi_keuangan where referensi_tipe='pembayaran' and referensi_id in (select id_pembayaran::text from pembayaran where nis=$1)", nis)
    await db.execute("delete from users where nis=$1 and role='santri'", nis)
    await db.execute("delete from santri where nis=$1", nis)
    return {"ok": True}


@router.post("/santri/{nis}/reset-password")
async def reset_santri_pw(nis: str, user=Depends(ADMIN)):
    await db.execute("update users set password=$1 where nis=$2 and role='santri'", hash_password("111111"), nis)
    return {"ok": True}


@router.get("/kelas")
async def list_kelas(user=Depends(STAFF)):
    return await db.fetch("select kelas, program_keahlian, count(*) filter (where status='aktif') jumlah from santri "
                          "group by kelas, program_keahlian order by kelas, program_keahlian nulls first")


class KamarIn(BaseModel):
    nama_kamar: str


@router.get("/kamar")
async def list_kamar(user=Depends(STAFF)):
    return await db.fetch("select k.*, (select count(*) from santri s where s.id_kamar=k.id_kamar and s.status='aktif') jumlah from kamar k order by k.nama_kamar")


@router.post("/kamar")
async def add_kamar(body: KamarIn, user=Depends(ADMIN)):
    if await db.fetchval("select 1 from kamar where lower(nama_kamar)=lower($1)", body.nama_kamar.strip()):
        raise HTTPException(400, "Nama kamar sudah ada")
    return {"id_kamar": await db.fetchval("insert into kamar (nama_kamar,created_at,updated_at) values ($1,now(),now()) returning id_kamar", body.nama_kamar.strip())}


@router.put("/kamar/{kid}")
async def edit_kamar(kid: int, body: KamarIn, user=Depends(ADMIN)):
    await db.execute("update kamar set nama_kamar=$1, updated_at=now() where id_kamar=$2", body.nama_kamar.strip(), kid)
    return {"ok": True}


@router.delete("/kamar/{kid}")
async def del_kamar(kid: int, user=Depends(ADMIN)):
    await db.execute("delete from kamar where id_kamar=$1", kid)
    return {"ok": True}


class UstadzIn(BaseModel):
    nama_ustadz: str
    no_hp: Optional[str] = None
    alamat: Optional[str] = None


@router.get("/ustadz")
async def list_ustadz(user=Depends(require_roles("admin", "pengurus", "ustadz"))):
    return await db.fetch("select * from ustadz order by nama_ustadz")


@router.post("/ustadz")
async def add_ustadz(body: UstadzIn, user=Depends(ADMIN)):
    uid = await db.fetchval("insert into ustadz (nama_ustadz,no_hp,alamat,created_at,updated_at) values ($1,$2,$3,now(),now()) returning id_ustadz",
                            body.nama_ustadz, body.no_hp, body.alamat)
    return {"id_ustadz": uid}


@router.put("/ustadz/{uid}")
async def edit_ustadz(uid: int, body: UstadzIn, user=Depends(ADMIN)):
    await db.execute("update ustadz set nama_ustadz=$1,no_hp=$2,alamat=$3,updated_at=now() where id_ustadz=$4", body.nama_ustadz, body.no_hp, body.alamat, uid)
    return {"ok": True}


@router.delete("/ustadz/{uid}")
async def del_ustadz(uid: int, user=Depends(ADMIN)):
    await db.execute("delete from ustadz where id_ustadz=$1", uid)
    return {"ok": True}


class UserIn(BaseModel):
    name: str
    email: str
    role: str
    password: Optional[str] = None
    no_hp: Optional[str] = None
    alamat: Optional[str] = None


class PwIn(BaseModel):
    password: str


@router.get("/users")
async def list_users(user=Depends(ADMIN)):
    rows = await db.fetch(
        "select u.id,u.name,u.email,u.role,u.id_pengurus,u.id_ustadz,u.created_at, coalesce(p.no_hp,us.no_hp) no_hp from users u "
        "left join pengurus p on p.id_pengurus=u.id_pengurus left join ustadz us on us.id_ustadz=u.id_ustadz where u.role<>'santri' order by u.role, u.name")
    for r in rows:
        r["role"] = ROLE_MAP.get(r["role"], r["role"])
    return rows


@router.post("/users")
async def add_user(body: UserIn, user=Depends(ADMIN)):
    email = body.email.strip().lower()
    if body.role not in ("admin", "pengurus", "ustadz"):
        raise HTTPException(400, "Peran tidak valid")
    if not body.password or len(body.password) < 6:
        raise HTTPException(400, "Password minimal 6 karakter")
    if await db.fetchval("select 1 from users where lower(email)=$1", email):
        raise HTTPException(400, "Email sudah digunakan")
    id_p = id_u = None
    if body.role == "ustadz":
        id_u = await db.fetchval("insert into ustadz (nama_ustadz,no_hp,alamat,created_at,updated_at) values ($1,$2,$3,now(),now()) returning id_ustadz",
                                 body.name, body.no_hp, body.alamat)
    else:
        id_p = await db.fetchval("insert into pengurus (nama_pengurus,jenis_pengurus,no_hp,alamat,created_at,updated_at) values ($1,$2,$3,$4,now(),now()) returning id_pengurus",
                                 body.name, "admin" if body.role == "admin" else "pengurus_harian", body.no_hp, body.alamat)
    uid = await db.fetchval("insert into users (name,email,password,role,id_pengurus,id_ustadz,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,now(),now()) returning id",
                            body.name, email, hash_password(body.password), DB_ROLE[body.role], id_p, id_u)
    return {"id": uid}


@router.put("/users/{uid}")
async def edit_user(uid: int, body: UserIn, user=Depends(ADMIN)):
    u = await db.fetchrow("select * from users where id=$1 and role<>'santri'", uid)
    if not u:
        raise HTTPException(404, "Pengguna tidak ditemukan")
    email = body.email.strip().lower()
    if await db.fetchval("select 1 from users where lower(email)=$1 and id<>$2", email, uid):
        raise HTTPException(400, "Email sudah digunakan")
    await db.execute("update users set name=$1, email=$2, updated_at=now() where id=$3", body.name, email, uid)
    if u["id_pengurus"]:
        await db.execute("update pengurus set nama_pengurus=$1, no_hp=coalesce($2,no_hp) where id_pengurus=$3", body.name, body.no_hp, u["id_pengurus"])
    if u["id_ustadz"]:
        await db.execute("update ustadz set nama_ustadz=$1, no_hp=coalesce($2,no_hp) where id_ustadz=$3", body.name, body.no_hp, u["id_ustadz"])
    return {"ok": True}


@router.post("/users/{uid}/password")
async def set_user_pw(uid: int, body: PwIn, user=Depends(ADMIN)):
    if len(body.password) < 6:
        raise HTTPException(400, "Password minimal 6 karakter")
    await db.execute("update users set password=$1 where id=$2", hash_password(body.password), uid)
    return {"ok": True}


@router.delete("/users/{uid}")
async def del_user(uid: int, user=Depends(ADMIN)):
    if uid == user["id"]:
        raise HTTPException(400, "Tidak bisa menghapus akun sendiri")
    await db.execute("delete from users where id=$1 and role<>'santri'", uid)
    return {"ok": True}


class KenaikanIn(BaseModel):
    nis_list: List[str]
    kelas_baru: str
    tahun_ajaran: Optional[str] = None
    keterangan: Optional[str] = None


@router.post("/kenaikan-kelas")
async def kenaikan(body: KenaikanIn, user=Depends(ADMIN)):
    baru = body.kelas_baru.strip()
    if not body.nis_list or not baru:
        raise HTTPException(400, "Pilih santri dan kelas tujuan")
    lulus = baru.upper() == "LULUS"
    n = 0
    for nis in body.nis_list:
        s = await db.fetchrow("select kelas, program_keahlian from santri where nis=$1", nis)
        if not s:
            continue
        await db.execute("insert into riwayat_kelas (nis,kelas_lama,kelas_baru,tanggal_naik,tahun_ajaran,keterangan,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,now(),now())",
                         nis, kelas_label(s["kelas"], s["program_keahlian"]), "LULUS" if lulus else kelas_label(baru, s["program_keahlian"]),
                         today_wib(), body.tahun_ajaran, body.keterangan)
        if lulus:
            await db.execute("update santri set status='lulus', updated_at=now() where nis=$1", nis)
        else:
            await db.execute("update santri set kelas=$1, updated_at=now() where nis=$2", baru, nis)
        n += 1
    return {"jumlah": n}


@router.get("/riwayat-kelas")
async def riwayat_kelas(user=Depends(ADMIN)):
    return await db.fetch("select r.*, s.nama from riwayat_kelas r join santri s on s.nis=r.nis order by r.id desc limit 300")
