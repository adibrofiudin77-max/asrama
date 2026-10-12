import os
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
import db

router = APIRouter(prefix="/api/auth")
ROLE_MAP = {"pengurus_admin": "admin", "pengurus_harian": "pengurus", "ustadz": "ustadz", "santri": "santri"}
DB_ROLE = {v: k for k, v in ROLE_MAP.items()}


def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str) -> bool:
    if not h:
        return False
    try:
        return bcrypt.checkpw(p.encode(), h.replace("$2y$", "$2b$", 1).encode())
    except ValueError:
        return False


def create_token(uid: int) -> str:
    payload = {"sub": str(uid), "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm="HS256")


def public_user(u: dict) -> dict:
    return {"id": u["id"], "name": u["name"], "email": u["email"], "role": ROLE_MAP.get(u["role"], u["role"]),
            "nis": u["nis"], "id_pengurus": u["id_pengurus"], "id_ustadz": u["id_ustadz"]}


async def get_current_user(request: Request) -> dict:
    h = request.headers.get("Authorization", "")
    if not h.startswith("Bearer "):
        raise HTTPException(401, "Belum login")
    try:
        payload = jwt.decode(h[7:], os.environ["JWT_SECRET"], algorithms=["HS256"])
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Sesi berakhir, silakan login ulang")
    u = await db.fetchrow("select * from users where id=$1", int(payload["sub"]))
    if not u:
        raise HTTPException(401, "Pengguna tidak ditemukan")
    return public_user(u)


def require_roles(*roles):
    async def dep(user=Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, "Anda tidak memiliki akses")
        return user
    return dep


class LoginIn(BaseModel):
    mode: str
    identifier: str
    password: str


class ChangePwIn(BaseModel):
    old_password: str
    new_password: str


@router.post("/login")
async def login(body: LoginIn, request: Request):
    ident = body.identifier.strip().lower()
    ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "")).split(",")[0].strip()
    key = f"{ip}:{ident}"
    now = datetime.now(timezone.utc)
    att = await db.fetchrow("select * from login_attempts where identifier=$1", key)
    if att and att["locked_until"] and att["locked_until"] > now:
        raise HTTPException(429, "Terlalu banyak percobaan. Coba lagi 15 menit lagi.")
    if body.mode == "santri":
        u = await db.fetchrow("select * from users where nis=$1 and role='santri'", body.identifier.strip())
    else:
        u = await db.fetchrow("select * from users where lower(email)=$1 and role<>'santri'", ident)
    if not u or not verify_password(body.password, u["password"]):
        n = (att["attempts"] if att else 0) + 1
        locked = now + timedelta(minutes=15) if n >= 5 else None
        await db.execute(
            "insert into login_attempts (identifier, attempts, locked_until) values ($1,$2,$3) "
            "on conflict (identifier) do update set attempts=$2, locked_until=$3", key, 0 if locked else n, locked)
        raise HTTPException(401, "NIS/Email atau password salah")
    await db.execute("delete from login_attempts where identifier=$1", key)
    return {"token": create_token(u["id"]), "user": public_user(u)}


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return user


@router.post("/change-password")
async def change_password(body: ChangePwIn, user=Depends(get_current_user)):
    if len(body.new_password) < 6:
        raise HTTPException(400, "Password baru minimal 6 karakter")
    u = await db.fetchrow("select password from users where id=$1", user["id"])
    if not verify_password(body.old_password, u["password"]):
        raise HTTPException(400, "Password lama salah")
    await db.execute("update users set password=$1, updated_at=now() where id=$2", hash_password(body.new_password), user["id"])
    return {"ok": True}


async def seed_admin():
    email, pw = os.environ["ADMIN_EMAIL"].lower(), os.environ["ADMIN_PASSWORD"]
    u = await db.fetchrow("select * from users where lower(email)=$1", email)
    if not u:
        pid = await db.fetchval(
            "insert into pengurus (nama_pengurus, jenis_pengurus, created_at, updated_at) values ('Administrator','admin',now(),now()) returning id_pengurus")
        await db.execute(
            "insert into users (name,email,password,role,id_pengurus,created_at,updated_at) values ('Administrator',$1,$2,'pengurus_admin',$3,now(),now())",
            email, hash_password(pw), pid)
    elif not verify_password(pw, u["password"]):
        await db.execute("update users set password=$1 where id=$2", hash_password(pw), u["id"])
