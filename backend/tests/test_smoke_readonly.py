"""Read-only smoke tests for Alhasani imported app. NO mutations - LIVE Supabase DB."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://asrama-main.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "adib.rofiudin77@guru.smk.belajar.id"
ADMIN_PASSWORD = "Alhasani@2026"
SANTRI_NIS = "260101016"
SANTRI_PASS = "111111"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "mode": "staff", "identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD
    }, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data or "access_token" in data, f"No token: {data}"
    return data.get("token") or data.get("access_token")


@pytest.fixture(scope="session")
def santri_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "mode": "santri", "identifier": SANTRI_NIS, "password": SANTRI_PASS
    }, timeout=30)
    assert r.status_code == 200, f"Santri login failed: {r.status_code} {r.text}"
    return r.json().get("token") or r.json().get("access_token")


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_root():
    r = requests.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200
    assert r.json().get("message") == "Alhasani API"


def test_admin_me(admin_token):
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=_auth(admin_token), timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data  # has user info


def test_santri_login_ok(santri_token):
    assert santri_token


# Read-only GET endpoints as admin
ADMIN_GETS = [
    "/api/santri",
    "/api/pembayaran",
    "/api/absensi",
    "/api/jadwal",
    "/api/keuangan",
    "/api/kelas",
    "/api/kamar",
    "/api/ustadz",
    "/api/users",
    "/api/dashboard",
    "/api/tagihan",
    "/api/absensi/rekap",
    "/api/riwayat-kelas",
]


@pytest.mark.parametrize("path", ADMIN_GETS)
def test_admin_get(admin_token, path):
    r = requests.get(f"{BASE_URL}{path}", headers=_auth(admin_token), timeout=30)
    assert r.status_code in (200, 404), f"{path} -> {r.status_code} {r.text[:200]}"
    if r.status_code == 200:
        # Should parse as JSON
        r.json()


SANTRI_GETS = [
    "/api/tagihan",
    "/api/jadwal",
    "/api/kehadiran/saya",
]


@pytest.mark.parametrize("path", SANTRI_GETS)
def test_santri_get(santri_token, path):
    r = requests.get(f"{BASE_URL}{path}", headers=_auth(santri_token), timeout=30)
    assert r.status_code in (200, 404), f"{path} -> {r.status_code} {r.text[:200]}"
