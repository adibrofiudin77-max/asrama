"""Backend tests for Pondok Pesantren Alhasani app.

IMPORTANT: Uses the real customer Supabase DB. All created resources are prefixed
with 'TEST' and deleted in teardown. Payments and jadwal are only touched on
TEST santri; no attendance is saved for real santri.
"""
import os
import time
from datetime import date, timedelta
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://alhasani-pesantren.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "adib.rofiudin77@guru.smk.belajar.id"
ADMIN_PASSWORD = "Alhasani@2026"
SANTRI_NIS_REAL = "260101016"
SANTRI_PW_REAL = "111111"

TEST_NIS = f"TEST{int(time.time()) % 1000000:06d}"
TEST_NAME = "TEST_ Santri"
TEST_PENGURUS_EMAIL = f"test_pengurus_{int(time.time())}@alhasani.test"
TEST_USTADZ_EMAIL = f"test_ustadz_{int(time.time())}@alhasani.test"
TEST_PENGURUS_PW = "pengurus123"
TEST_USTADZ_PW = "ustadz123"


# ------------------- Fixtures -------------------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"mode": "staff", "identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def test_santri(admin_headers):
    """Create a test santri once per session, cleanup at end."""
    body = {
        "nis": TEST_NIS, "nama": TEST_NAME, "jenis_kelamin": "L", "kelas": "X",
        "tanggal_daftar": (date.today() - timedelta(days=120)).isoformat(),
        "status": "aktif", "bayar_pendaftaran": False,
    }
    r = requests.post(f"{API}/santri", json=body, headers=admin_headers, timeout=30)
    assert r.status_code == 200, f"create santri: {r.status_code} {r.text}"
    yield TEST_NIS
    # cleanup
    requests.delete(f"{API}/santri/{TEST_NIS}", headers=admin_headers, timeout=30)


@pytest.fixture(scope="session")
def created_users(admin_headers):
    """Container for created user ids/related ids to cleanup at end."""
    created = {"user_ids": [], "jadwal_ids": [], "kamar_ids": [], "ustadz_ids": [], "keuangan_ids": [], "pembayaran_ids": []}
    yield created
    for pid in created["pembayaran_ids"]:
        requests.delete(f"{API}/pembayaran/{pid}", headers=admin_headers, timeout=30)
    for uid in created["user_ids"]:
        requests.delete(f"{API}/users/{uid}", headers=admin_headers, timeout=30)
    for jid in created["jadwal_ids"]:
        requests.delete(f"{API}/jadwal/{jid}", headers=admin_headers, timeout=30)
    for kid in created["kamar_ids"]:
        requests.delete(f"{API}/kamar/{kid}", headers=admin_headers, timeout=30)
    for uid in created["ustadz_ids"]:
        requests.delete(f"{API}/ustadz/{uid}", headers=admin_headers, timeout=30)
    for tid in created["keuangan_ids"]:
        requests.delete(f"{API}/keuangan/{tid}", headers=admin_headers, timeout=30)


# ------------------- Auth tests -------------------
class TestAuth:
    def test_login_admin_staff(self):
        r = requests.post(f"{API}/auth/login", json={"mode": "staff", "identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "token" in data and data["user"]["role"] == "admin"

    def test_login_santri(self):
        r = requests.post(f"{API}/auth/login", json={"mode": "santri", "identifier": SANTRI_NIS_REAL, "password": SANTRI_PW_REAL}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["role"] == "santri"
        assert data["user"]["nis"] == SANTRI_NIS_REAL

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"mode": "staff", "identifier": ADMIN_EMAIL, "password": "wrongpass"}, timeout=30)
        assert r.status_code == 401

    def test_me_requires_token(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_me_with_token(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


# ------------------- Santri tests -------------------
class TestSantri:
    def test_list_santri(self, admin_headers):
        r = requests.get(f"{API}/santri", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_and_get_test_santri(self, admin_headers, test_santri):
        r = requests.get(f"{API}/santri/{test_santri}", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["nis"] == test_santri
        assert r.json()["nama"] == TEST_NAME

    def test_duplicate_nis_rejected(self, admin_headers, test_santri):
        r = requests.post(f"{API}/santri", json={"nis": test_santri, "nama": "dup", "tanggal_daftar": date.today().isoformat()}, headers=admin_headers, timeout=30)
        assert r.status_code == 400

    def test_santri_login_default_password(self, test_santri):
        r = requests.post(f"{API}/auth/login", json={"mode": "santri", "identifier": test_santri, "password": "111111"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "santri"


# ------------------- Pembayaran tests -------------------
class TestPembayaran:
    def test_tagihan_overview(self, admin_headers):
        r = requests.get(f"{API}/tagihan", headers=admin_headers, timeout=60)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_tagihan_detail_test_santri(self, admin_headers, test_santri):
        r = requests.get(f"{API}/tagihan/{test_santri}", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "bulanan" in data and "pendaftaran" in data
        # Billing should start the month AFTER tanggal_daftar
        if data["bulanan"]:
            first = data["bulanan"][0]
            assert first["status"] in ("belum", "lunas", "dibebaskan")

    def test_pay_syariah_and_duplicate(self, admin_headers, test_santri, created_users):
        tag = requests.get(f"{API}/tagihan/{test_santri}", headers=admin_headers, timeout=30).json()
        belum = [m for m in tag["bulanan"] if m["status"] == "belum"]
        assert belum, "no unpaid month to test"
        m = belum[0]
        body = {"nis": test_santri, "jenis": "syariah", "bulan": m["bulan"], "tahun": m["tahun"], "nominal": 100000, "tanggal_bayar": date.today().isoformat()}
        r = requests.post(f"{API}/pembayaran", json=body, headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        pid = r.json()["id_pembayaran"]
        created_users["pembayaran_ids"].append(pid)
        # duplicate rejected
        r2 = requests.post(f"{API}/pembayaran", json=body, headers=admin_headers, timeout=30)
        assert r2.status_code == 400

    def test_exempt_month(self, admin_headers, test_santri):
        tag = requests.get(f"{API}/tagihan/{test_santri}", headers=admin_headers, timeout=30).json()
        belum = [m for m in tag["bulanan"] if m["status"] == "belum"]
        if not belum:
            pytest.skip("no belum month to exempt")
        m = belum[-1]
        r = requests.post(f"{API}/tagihan/{test_santri}/status",
                          json={"bulan": m["bulan"], "tahun": m["tahun"], "status": "dibebaskan", "keterangan": "TEST PKL"},
                          headers=admin_headers, timeout=30)
        assert r.status_code == 200
        tag2 = requests.get(f"{API}/tagihan/{test_santri}", headers=admin_headers, timeout=30).json()
        found = [x for x in tag2["bulanan"] if x["bulan"] == m["bulan"] and x["tahun"] == m["tahun"]]
        assert found and found[0]["status"] == "dibebaskan"
        # undo
        r2 = requests.post(f"{API}/tagihan/{test_santri}/status",
                           json={"bulan": m["bulan"], "tahun": m["tahun"], "status": "belum"},
                           headers=admin_headers, timeout=30)
        assert r2.status_code == 200

    def test_get_payment_and_santri_isolation(self, admin_headers, test_santri, created_users):
        if not created_users["pembayaran_ids"]:
            pytest.skip("no payment created")
        pid = created_users["pembayaran_ids"][0]
        r = requests.get(f"{API}/pembayaran/{pid}", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p["nis"] == test_santri
        assert "nama_pengurus" in p
        # santri should not be able to read others' payment
        s_tok = requests.post(f"{API}/auth/login", json={"mode": "santri", "identifier": SANTRI_NIS_REAL, "password": SANTRI_PW_REAL}, timeout=30).json()["token"]
        r2 = requests.get(f"{API}/pembayaran/{pid}", headers={"Authorization": f"Bearer {s_tok}"}, timeout=30)
        assert r2.status_code == 404  # intentionally hidden as 404

    def test_santri_isolation_tagihan(self):
        s_tok = requests.post(f"{API}/auth/login", json={"mode": "santri", "identifier": SANTRI_NIS_REAL, "password": SANTRI_PW_REAL}, timeout=30).json()["token"]
        r = requests.get(f"{API}/tagihan/999999", headers={"Authorization": f"Bearer {s_tok}"}, timeout=30)
        assert r.status_code == 403


# ------------------- Jadwal / Absensi -------------------
class TestJadwal:
    def test_jadwal_crud(self, admin_headers, created_users):
        body = {"nama_kegiatan": "TEST_ Ngaji", "hari": "Senin", "waktu": "08:00:00"}
        r = requests.post(f"{API}/jadwal", json=body, headers=admin_headers, timeout=30)
        assert r.status_code == 200
        jid = r.json()["id_jadwal"]
        created_users["jadwal_ids"].append(jid)

        r2 = requests.get(f"{API}/jadwal", headers=admin_headers, timeout=30)
        assert r2.status_code == 200 and any(j["id_jadwal"] == jid for j in r2.json())

        body2 = {"nama_kegiatan": "TEST_ Ngaji 2", "hari": "Selasa", "waktu": "09:00:00"}
        r3 = requests.put(f"{API}/jadwal/{jid}", json=body2, headers=admin_headers, timeout=30)
        assert r3.status_code == 200

    def test_absensi_save_only_test_santri(self, admin_headers, test_santri, created_users):
        if not created_users["jadwal_ids"]:
            pytest.skip("no jadwal")
        jid = created_users["jadwal_ids"][0]
        tgl = date.today().isoformat()
        body = {"tanggal": tgl, "id_jadwal": jid, "items": [{"nis": test_santri, "status": "hadir"}]}
        r = requests.post(f"{API}/absensi", json=body, headers=admin_headers, timeout=30)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/absensi", params={"tanggal": tgl, "id_jadwal": jid}, headers=admin_headers, timeout=30)
        assert r2.status_code == 200
        found = [x for x in r2.json() if x["nis"] == test_santri]
        assert found and found[0]["status"] == "hadir"


# ------------------- Dashboard -------------------
class TestDashboard:
    def test_dashboard(self, admin_headers):
        r = requests.get(f"{API}/dashboard?periode=bulan", headers=admin_headers, timeout=60)
        assert r.status_code == 200
        data = r.json()
        assert "stats" in data and "top_rajin" in data and "top_malas" in data
        assert "saldo_kas" in data["stats"]

    def test_dashboard_semua(self, admin_headers):
        r = requests.get(f"{API}/dashboard?periode=semua", headers=admin_headers, timeout=60)
        assert r.status_code == 200


# ------------------- Master: kamar, ustadz, users -------------------
class TestMaster:
    def test_kamar_crud(self, admin_headers, created_users):
        name = f"TEST_K_{int(time.time())}"
        r = requests.post(f"{API}/kamar", json={"nama_kamar": name}, headers=admin_headers, timeout=30)
        assert r.status_code == 200
        kid = r.json()["id_kamar"]
        created_users["kamar_ids"].append(kid)

    def test_ustadz_crud(self, admin_headers, created_users):
        r = requests.post(f"{API}/ustadz", json={"nama_ustadz": f"TEST_U_{int(time.time())}"}, headers=admin_headers, timeout=30)
        assert r.status_code == 200
        created_users["ustadz_ids"].append(r.json()["id_ustadz"])

    def test_create_pengurus_user(self, admin_headers, created_users):
        r = requests.post(f"{API}/users", json={"name": "TEST_ Pengurus", "email": TEST_PENGURUS_EMAIL, "role": "pengurus", "password": TEST_PENGURUS_PW}, headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        created_users["user_ids"].append(r.json()["id"])

    def test_create_ustadz_user(self, admin_headers, created_users):
        r = requests.post(f"{API}/users", json={"name": "TEST_ Ustadz", "email": TEST_USTADZ_EMAIL, "role": "ustadz", "password": TEST_USTADZ_PW}, headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        created_users["user_ids"].append(r.json()["id"])

    def test_login_as_pengurus_role_check(self, admin_headers, created_users):
        # need pengurus already created
        r = requests.post(f"{API}/auth/login", json={"mode": "staff", "identifier": TEST_PENGURUS_EMAIL, "password": TEST_PENGURUS_PW}, timeout=30)
        if r.status_code != 200:
            pytest.skip("pengurus not yet created in session order")
        tok = r.json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        # Pengurus should NOT access keuangan (admin only)
        r2 = requests.get(f"{API}/keuangan", headers=h, timeout=30)
        assert r2.status_code == 403
        # Pengurus should NOT access users list
        r3 = requests.get(f"{API}/users", headers=h, timeout=30)
        assert r3.status_code == 403
        # Pengurus SHOULD access santri list
        r4 = requests.get(f"{API}/santri", headers=h, timeout=30)
        assert r4.status_code == 200

    def test_login_as_ustadz_role_check(self, admin_headers, created_users):
        r = requests.post(f"{API}/auth/login", json={"mode": "staff", "identifier": TEST_USTADZ_EMAIL, "password": TEST_USTADZ_PW}, timeout=30)
        if r.status_code != 200:
            pytest.skip("ustadz not yet created")
        tok = r.json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        # ustadz denied on santri list (STAFF only)
        r2 = requests.get(f"{API}/santri", headers=h, timeout=30)
        assert r2.status_code == 403
        # ustadz allowed on jadwal and absensi listing
        r3 = requests.get(f"{API}/jadwal", headers=h, timeout=30)
        assert r3.status_code == 200


# ------------------- Keuangan (admin) -------------------
class TestKeuangan:
    def test_keuangan_crud(self, admin_headers, created_users):
        r = requests.post(f"{API}/keuangan", json={"jenis": "pemasukan", "kategori": "TEST_kategori", "nominal": 1000, "tanggal": date.today().isoformat(), "keterangan": "TEST"}, headers=admin_headers, timeout=30)
        assert r.status_code == 200
        created_users["keuangan_ids"].append(r.json()["id_transaksi"])
        r2 = requests.get(f"{API}/keuangan", headers=admin_headers, timeout=30)
        assert r2.status_code == 200
        d = r2.json()
        assert "total_masuk" in d and "saldo_kas" in d


# ------------------- Change password (test account only) -------------------
class TestChangePassword:
    def test_change_password_on_test_user(self, created_users):
        if not created_users["user_ids"]:
            pytest.skip("no test pengurus to test")
        r = requests.post(f"{API}/auth/login", json={"mode": "staff", "identifier": TEST_PENGURUS_EMAIL, "password": TEST_PENGURUS_PW}, timeout=30)
        if r.status_code != 200:
            pytest.skip("cannot login pengurus")
        tok = r.json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        new_pw = TEST_PENGURUS_PW + "x"
        r2 = requests.post(f"{API}/auth/change-password", json={"old_password": TEST_PENGURUS_PW, "new_password": new_pw}, headers=h, timeout=30)
        assert r2.status_code == 200
        # login with new
        r3 = requests.post(f"{API}/auth/login", json={"mode": "staff", "identifier": TEST_PENGURUS_EMAIL, "password": new_pw}, timeout=30)
        assert r3.status_code == 200
        # revert
        tok3 = r3.json()["token"]
        requests.post(f"{API}/auth/change-password", json={"old_password": new_pw, "new_password": TEST_PENGURUS_PW}, headers={"Authorization": f"Bearer {tok3}"}, timeout=30)
