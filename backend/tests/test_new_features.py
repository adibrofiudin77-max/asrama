"""Tests for new features: payment auto-allocation, tarif per kelas, lunas_manual,
kwitansi rincian, izin pulang, wa penerima, santri kehadiran per_kegiatan.

Isolated schema DB_SCHEMA=alhasani_test on Supabase. Safe to create/delete.
WhatsApp safety: no numbers should be aktif during these tests.
"""
import os
import time
from datetime import date, timedelta
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "adib.rofiudin77@guru.smk.belajar.id"
ADMIN_PASSWORD = "Alhasani@2026"
SANTRI_X = "260101016"      # Hisyam, kelas X
SANTRI_X_PW = "111111"
SANTRI_XI = "2022023"       # Elviana, kelas XI
PENGURUS_EMAIL = f"test_pengurus_izin_{int(time.time())}@alhasani.test"
PENGURUS_PW = "pengurus123"


# ---------------- fixtures ----------------
@pytest.fixture(scope="module")
def admin_h():
    r = requests.post(f"{API}/auth/login", json={"mode": "staff", "identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def santri_x_h():
    r = requests.post(f"{API}/auth/login", json={"mode": "santri", "identifier": SANTRI_X, "password": SANTRI_X_PW}, timeout=30)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def pengurus_h(admin_h):
    requests.post(f"{API}/users", json={"name": "TEST_ Pengurus Izin", "email": PENGURUS_EMAIL, "role": "pengurus", "password": PENGURUS_PW}, headers=admin_h, timeout=30)
    r = requests.post(f"{API}/auth/login", json={"mode": "staff", "identifier": PENGURUS_EMAIL, "password": PENGURUS_PW}, timeout=30)
    if r.status_code != 200:
        pytest.skip("cannot login pengurus")
    yield {"Authorization": f"Bearer {r.json()['token']}"}
    # cleanup: delete user
    users = requests.get(f"{API}/users", headers=admin_h, timeout=30).json()
    for u in users:
        if u.get("email") == PENGURUS_EMAIL:
            requests.delete(f"{API}/users/{u['id']}", headers=admin_h, timeout=30)


# ---------------- TARIF PER KELAS ----------------
class TestTarifKelas:
    def test_kelas_X_tarif_100000(self, admin_h):
        r = requests.get(f"{API}/tagihan/{SANTRI_X}", headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["tarif_bulanan"] == 100000
        if data["bulanan"]:
            assert data["bulanan"][0]["nominal"] == 100000

    def test_kelas_XI_tarif_60000(self, admin_h):
        r = requests.get(f"{API}/tagihan/{SANTRI_XI}", headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["tarif_bulanan"] == 60000
        if data["bulanan"]:
            assert all(m["nominal"] == 60000 for m in data["bulanan"])
        # total_tunggakan == sum(month sisa) + pendaftaran sisa
        expected = sum(m["sisa"] for m in data["bulanan"]) + data["pendaftaran"]["sisa"]
        assert abs(data["total_tunggakan"] - expected) < 0.01


# ---------------- PAYMENT PREVIEW ----------------
class TestPreview:
    def test_preview_allocation_zero_nominal(self, admin_h):
        r = requests.post(f"{API}/pembayaran/preview", json={"nis": SANTRI_X, "nominal": 0}, headers=admin_h, timeout=30)
        assert r.status_code == 200
        assert r.json()["alokasi"] == []

    def test_preview_250000_kelas_X(self, admin_h):
        """kelas X tarif=100k. Preview 250000 should produce 3 months, last partial."""
        r = requests.post(f"{API}/pembayaran/preview", json={"nis": SANTRI_X, "nominal": 250000}, headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text
        alo = r.json()["alokasi"]
        assert len(alo) >= 2
        # total nominal <= 250000 (and == 250000 if there are enough months)
        total = sum(float(a["nominal"]) for a in alo)
        assert abs(total - 250000) < 0.01
        # each alokasi should have tarif 100000
        for a in alo:
            assert a["tarif"] == 100000 or float(a["tarif"]) == 100000

    def test_preview_60000_kelas_XI(self, admin_h):
        r = requests.post(f"{API}/pembayaran/preview", json={"nis": SANTRI_XI, "nominal": 60000}, headers=admin_h, timeout=30)
        assert r.status_code == 200
        alo = r.json()["alokasi"]
        assert len(alo) == 1
        assert float(alo[0]["nominal"]) == 60000
        assert float(alo[0]["tarif"]) == 60000
        assert float(alo[0]["sisa"]) == 0


# ---------------- PAYMENT + ALOCATION ----------------
class TestPaymentAllocation:
    """Create a dedicated TEST santri so we can safely create/delete payments."""

    @pytest.fixture(scope="class")
    def test_nis(self, admin_h):
        nis = f"TA{int(time.time()) % 10000000:07d}"
        body = {"nis": nis, "nama": "TEST_ Alokasi", "jenis_kelamin": "L", "kelas": "X",
                "tanggal_daftar": (date.today() - timedelta(days=90)).isoformat(),
                "status": "aktif", "bayar_pendaftaran": False}
        r = requests.post(f"{API}/santri", json=body, headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text
        yield nis
        # cleanup payments then santri
        tag = requests.get(f"{API}/tagihan/{nis}", headers=admin_h, timeout=30).json()
        for p in tag.get("pembayaran", []):
            requests.delete(f"{API}/pembayaran/{p['id_pembayaran']}", headers=admin_h, timeout=30)
        requests.delete(f"{API}/santri/{nis}", headers=admin_h, timeout=30)

    def test_pay_250000_creates_one_payment_and_alokasi(self, admin_h, test_nis):
        r = requests.post(f"{API}/pembayaran",
                          json={"nis": test_nis, "jenis": "syariah", "nominal": 250000, "tanggal_bayar": date.today().isoformat()},
                          headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        pid = data["id_pembayaran"]
        assert "no_transaksi" in data
        assert len(data["alokasi"]) >= 2
        # verify GET payment
        pr = requests.get(f"{API}/pembayaran/{pid}", headers=admin_h, timeout=30)
        assert pr.status_code == 200
        pdata = pr.json()
        assert len(pdata["alokasi"]) == len(data["alokasi"])
        assert "rincian" in pdata and pdata["rincian"]
        # tagihan reflects the allocation
        tag = requests.get(f"{API}/tagihan/{test_nis}", headers=admin_h, timeout=30).json()
        lunas = [m for m in tag["bulanan"] if m["status"] == "lunas"]
        sebagian = [m for m in tag["bulanan"] if m["status"] == "sebagian"]
        assert len(lunas) >= 2
        # 250k on 100k tarif => last month sebagian with sisa 50k
        if sebagian:
            assert sebagian[0]["dibayar"] == 50000
            assert sebagian[0]["sisa"] == 50000

    def test_followup_payment_completes_partial(self, admin_h, test_nis):
        """Pay 50000 to finish the previous partial month."""
        r = requests.post(f"{API}/pembayaran",
                          json={"nis": test_nis, "jenis": "syariah", "nominal": 50000, "tanggal_bayar": date.today().isoformat()},
                          headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text
        tag = requests.get(f"{API}/tagihan/{test_nis}", headers=admin_h, timeout=30).json()
        sebagian = [m for m in tag["bulanan"] if m["status"] == "sebagian"]
        lunas = [m for m in tag["bulanan"] if m["status"] == "lunas"]
        assert len(sebagian) == 0
        assert len(lunas) >= 3

    def test_delete_payment_reverts_months(self, admin_h, test_nis):
        tag = requests.get(f"{API}/tagihan/{test_nis}", headers=admin_h, timeout=30).json()
        pays = tag["pembayaran"]
        # delete all payments
        for p in pays:
            requests.delete(f"{API}/pembayaran/{p['id_pembayaran']}", headers=admin_h, timeout=30)
        tag2 = requests.get(f"{API}/tagihan/{test_nis}", headers=admin_h, timeout=30).json()
        assert all(m["status"] == "belum" for m in tag2["bulanan"] if m["status"] != "dibebaskan")


# ---------------- LUNAS MANUAL ----------------
class TestLunasManual:
    @pytest.fixture(scope="class")
    def test_nis(self, admin_h):
        nis = f"TM{int(time.time()) % 10000000:07d}"
        body = {"nis": nis, "nama": "TEST_ Manual", "jenis_kelamin": "L", "kelas": "X",
                "tanggal_daftar": (date.today() - timedelta(days=120)).isoformat(),
                "status": "aktif", "bayar_pendaftaran": False}
        r = requests.post(f"{API}/santri", json=body, headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text
        yield nis
        requests.delete(f"{API}/santri/{nis}", headers=admin_h, timeout=30)

    def test_lunas_manual_does_not_touch_kas(self, admin_h, test_nis):
        k0 = requests.get(f"{API}/keuangan", headers=admin_h, timeout=30).json()["saldo_kas"]
        tag = requests.get(f"{API}/tagihan/{test_nis}", headers=admin_h, timeout=30).json()
        m = next((x for x in tag["bulanan"] if x["sisa"] > 0), None)
        assert m
        r = requests.post(f"{API}/tagihan/{test_nis}/status",
                          json={"bulan": m["bulan"], "tahun": m["tahun"], "status": "lunas_manual", "keterangan": "TEST"},
                          headers=admin_h, timeout=30)
        assert r.status_code == 200
        k1 = requests.get(f"{API}/keuangan", headers=admin_h, timeout=30).json()["saldo_kas"]
        assert k0 == k1
        tag2 = requests.get(f"{API}/tagihan/{test_nis}", headers=admin_h, timeout=30).json()
        found = [x for x in tag2["bulanan"] if (x["bulan"], x["tahun"]) == (m["bulan"], m["tahun"])]
        assert found and found[0]["status"] == "lunas_manual"
        # revert
        requests.post(f"{API}/tagihan/{test_nis}/status",
                      json={"bulan": m["bulan"], "tahun": m["tahun"], "status": "normal"},
                      headers=admin_h, timeout=30)
        tag3 = requests.get(f"{API}/tagihan/{test_nis}", headers=admin_h, timeout=30).json()
        found3 = [x for x in tag3["bulanan"] if (x["bulan"], x["tahun"]) == (m["bulan"], m["tahun"])]
        assert found3 and found3[0]["status"] in ("belum", "sebagian")

    def test_lunas_manual_pendaftaran(self, admin_h, test_nis):
        r = requests.post(f"{API}/tagihan/{test_nis}/status",
                          json={"bulan": 0, "tahun": 0, "status": "lunas_manual"},
                          headers=admin_h, timeout=30)
        assert r.status_code == 200
        tag = requests.get(f"{API}/tagihan/{test_nis}", headers=admin_h, timeout=30).json()
        assert tag["pendaftaran"]["lunas"] is True
        assert tag["pendaftaran"]["manual"] is True
        assert tag["pendaftaran"]["sisa"] == 0

    def test_bulk_lunas_manual(self, admin_h, test_nis):
        tag = requests.get(f"{API}/tagihan/{test_nis}", headers=admin_h, timeout=30).json()
        belum = [m for m in tag["bulanan"] if m["sisa"] > 0]
        if not belum:
            pytest.skip("no unpaid months")
        last = belum[-1]
        r = requests.post(f"{API}/tagihan/{test_nis}/lunas-manual",
                          json={"sampai_bulan": last["bulan"], "sampai_tahun": last["tahun"], "pendaftaran": False, "keterangan": "TEST"},
                          headers=admin_h, timeout=30)
        assert r.status_code == 200
        assert r.json()["jumlah"] >= 1
        tag2 = requests.get(f"{API}/tagihan/{test_nis}", headers=admin_h, timeout=30).json()
        assert all(m["status"] != "belum" for m in tag2["bulanan"])

    def test_pengurus_cannot_lunas_manual(self, pengurus_h, test_nis):
        r = requests.post(f"{API}/tagihan/{test_nis}/status",
                          json={"bulan": 1, "tahun": 2027, "status": "lunas_manual"},
                          headers=pengurus_h, timeout=30)
        assert r.status_code == 403
        r2 = requests.post(f"{API}/tagihan/{test_nis}/lunas-manual",
                           json={"sampai_bulan": 1, "sampai_tahun": 2027},
                           headers=pengurus_h, timeout=30)
        assert r2.status_code == 403


# ---------------- IZIN PULANG ----------------
class TestIzin:
    @pytest.fixture(scope="class")
    def iid(self, santri_x_h):
        """Create izin from santri Hisyam."""
        body = {"tanggal_pulang": (date.today() + timedelta(days=1)).isoformat(),
                "tanggal_kembali": (date.today() + timedelta(days=3)).isoformat(),
                "penjemput": "TEST Ayah", "alasan": "TEST acara keluarga"}
        r = requests.post(f"{API}/izin", json=body, headers=santri_x_h, timeout=30)
        assert r.status_code == 200, r.text
        iid = r.json()["id"]
        yield iid
        # cleanup (admin)
        try:
            tok = requests.post(f"{API}/auth/login", json={"mode": "staff", "identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30).json()["token"]
            requests.delete(f"{API}/izin/{iid}", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
        except Exception:
            pass

    def test_create_izin_200(self, iid):
        assert isinstance(iid, int)

    def test_validation_dates(self, santri_x_h):
        r = requests.post(f"{API}/izin", json={
            "tanggal_pulang": date.today().isoformat(),
            "tanggal_kembali": (date.today() - timedelta(days=1)).isoformat(),
            "penjemput": "x", "alasan": "y"}, headers=santri_x_h, timeout=30)
        assert r.status_code == 400

    def test_validation_empty_fields(self, santri_x_h):
        r = requests.post(f"{API}/izin", json={
            "tanggal_pulang": date.today().isoformat(),
            "tanggal_kembali": date.today().isoformat(),
            "penjemput": "   ", "alasan": "  "}, headers=santri_x_h, timeout=30)
        assert r.status_code == 400

    def test_santri_lists_own(self, santri_x_h, iid):
        r = requests.get(f"{API}/izin/saya", headers=santri_x_h, timeout=30)
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert iid in ids

    def test_staff_can_list(self, admin_h, iid):
        r = requests.get(f"{API}/izin?status=menunggu", headers=admin_h, timeout=30)
        assert r.status_code == 200
        assert any(x["id"] == iid for x in r.json())

    def test_notif_wa_no_active(self, admin_h, iid):
        # Give background a moment
        time.sleep(3)
        r = requests.get(f"{API}/izin?status=menunggu", headers=admin_h, timeout=30)
        row = next((x for x in r.json() if x["id"] == iid), None)
        assert row is not None
        # notif_wa should be set — since no aktif number, expect "Tidak ada nomor penerima aktif"
        assert row.get("notif_wa") in (None, "Tidak ada nomor penerima aktif") or "Tidak ada" in str(row.get("notif_wa"))

    def test_pengurus_can_proses(self, pengurus_h, iid):
        r = requests.post(f"{API}/izin/{iid}/proses", json={"status": "disetujui", "catatan": "TEST ok"},
                          headers=pengurus_h, timeout=30)
        assert r.status_code == 200

    def test_santri_cannot_cancel_processed(self, santri_x_h, iid):
        r = requests.delete(f"{API}/izin/{iid}", headers=santri_x_h, timeout=30)
        assert r.status_code == 400

    def test_rekap(self, admin_h):
        r = requests.get(f"{API}/izin/rekap", headers=admin_h, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # should include Hisyam with jumlah_pulang >= 1
        row = next((x for x in data if x["nis"] == SANTRI_X), None)
        if row:
            assert row["jumlah_pulang"] >= 1


# ---------------- WA PENERIMA ----------------
class TestWAPenerima:
    def test_admin_crud_inactive(self, admin_h):
        """Create a WA receiver with aktif=False (safety)."""
        nama = f"TEST_{int(time.time())}"
        r = requests.post(f"{API}/wa-penerima",
                          json={"nama": nama, "no_hp": "081999888777", "aktif": False},
                          headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text
        wid = r.json()["id"]
        # list
        lst = requests.get(f"{API}/wa-penerima", headers=admin_h, timeout=30)
        assert lst.status_code == 200
        assert any(x["id"] == wid for x in lst.json())
        # duplicate rejected
        r2 = requests.post(f"{API}/wa-penerima",
                           json={"nama": "dup", "no_hp": "081999888777", "aktif": False},
                           headers=admin_h, timeout=30)
        assert r2.status_code == 400
        # 62xxx normalized
        r3 = requests.post(f"{API}/wa-penerima",
                           json={"nama": f"TEST_{int(time.time())}_norm", "no_hp": "6281234567890", "aktif": False},
                           headers=admin_h, timeout=30)
        assert r3.status_code == 200
        wid2 = r3.json()["id"]
        lst2 = requests.get(f"{API}/wa-penerima", headers=admin_h, timeout=30).json()
        row = next(x for x in lst2 if x["id"] == wid2)
        assert row["no_hp"].startswith("08")
        # edit
        re = requests.put(f"{API}/wa-penerima/{wid}",
                          json={"nama": nama + "_edit", "no_hp": "081999888777", "aktif": False},
                          headers=admin_h, timeout=30)
        assert re.status_code == 200
        # bad format rejected
        rb = requests.post(f"{API}/wa-penerima",
                           json={"nama": "bad", "no_hp": "abcd", "aktif": False},
                           headers=admin_h, timeout=30)
        assert rb.status_code == 400
        # cleanup
        requests.delete(f"{API}/wa-penerima/{wid}", headers=admin_h, timeout=30)
        requests.delete(f"{API}/wa-penerima/{wid2}", headers=admin_h, timeout=30)

    def test_pengurus_forbidden(self, pengurus_h):
        r = requests.get(f"{API}/wa-penerima", headers=pengurus_h, timeout=30)
        assert r.status_code == 403


# ---------------- SANTRI KEHADIRAN per_kegiatan ----------------
class TestKehadiranSaya:
    def test_endpoint(self, santri_x_h):
        r = requests.get(f"{API}/kehadiran/saya", headers=santri_x_h, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "per_kegiatan" in data
        if data["per_kegiatan"]:
            k = data["per_kegiatan"][0]
            for f in ("id_jadwal", "nama_kegiatan", "hadir", "sakit", "izin", "alpha", "total"):
                assert f in k, f"missing field {f}"
