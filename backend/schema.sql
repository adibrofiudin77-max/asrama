CREATE TABLE IF NOT EXISTS app_meta (key varchar(100) PRIMARY KEY, value text);
CREATE TABLE IF NOT EXISTS kamar (id_kamar bigserial PRIMARY KEY, nama_kamar varchar(255) NOT NULL UNIQUE, created_at timestamptz, updated_at timestamptz);
CREATE TABLE IF NOT EXISTS ustadz (id_ustadz bigserial PRIMARY KEY, nama_ustadz varchar(100) NOT NULL, no_hp varchar(20), alamat text, created_at timestamptz, updated_at timestamptz);
CREATE TABLE IF NOT EXISTS pengurus (id_pengurus bigserial PRIMARY KEY, nama_pengurus varchar(100) NOT NULL, jenis_pengurus varchar(30) NOT NULL DEFAULT 'pengurus_harian', no_hp varchar(20), alamat text, created_at timestamptz, updated_at timestamptz);
CREATE TABLE IF NOT EXISTS santri (
  nis varchar(20) PRIMARY KEY, nama varchar(100) NOT NULL, tempat_lahir varchar(50), tanggal_lahir date,
  jenis_kelamin varchar(1) NOT NULL DEFAULT 'L', alamat text, nama_bapak varchar(100), nama_ibu varchar(100),
  no_hp_santri varchar(20), no_hp_ortu varchar(20), kelas varchar(50) NOT NULL DEFAULT 'X',
  id_kamar bigint REFERENCES kamar(id_kamar) ON DELETE SET NULL, tanggal_daftar date NOT NULL DEFAULT CURRENT_DATE,
  status varchar(20) NOT NULL DEFAULT 'aktif', created_at timestamptz, updated_at timestamptz);
ALTER TABLE santri ADD COLUMN IF NOT EXISTS program_keahlian varchar(20);
CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY, name varchar(255) NOT NULL, email varchar(255) NOT NULL UNIQUE, email_verified_at timestamptz,
  password varchar(255) NOT NULL, role varchar(30) NOT NULL DEFAULT 'santri', nis varchar(255), id_ustadz bigint, id_pengurus bigint,
  remember_token varchar(100), created_at timestamptz, updated_at timestamptz);
CREATE INDEX IF NOT EXISTS users_nis_index ON users(nis);
CREATE TABLE IF NOT EXISTS jadwal (id_jadwal bigserial PRIMARY KEY, nama_kegiatan varchar(100) NOT NULL, hari varchar(10) NOT NULL, waktu time NOT NULL, id_ustadz bigint REFERENCES ustadz(id_ustadz) ON DELETE SET NULL, created_at timestamptz, updated_at timestamptz);
CREATE TABLE IF NOT EXISTS kehadiran (
  id_kehadiran bigserial PRIMARY KEY, nis varchar(20) NOT NULL REFERENCES santri(nis) ON DELETE CASCADE,
  id_jadwal bigint REFERENCES jadwal(id_jadwal) ON DELETE CASCADE, id_ustadz bigint REFERENCES ustadz(id_ustadz) ON DELETE SET NULL,
  tanggal date NOT NULL, status varchar(10) NOT NULL DEFAULT 'hadir', keterangan text, created_at timestamptz, updated_at timestamptz,
  CONSTRAINT kehadiran_nis_tanggal_jadwal_unique UNIQUE (nis, tanggal, id_jadwal));
CREATE TABLE IF NOT EXISTS pembayaran (
  id_pembayaran bigserial PRIMARY KEY, nis varchar(20) NOT NULL REFERENCES santri(nis) ON DELETE CASCADE,
  jenis_pembayaran varchar(20) NOT NULL DEFAULT 'syariah', nominal numeric(12,2) NOT NULL, tanggal_bayar date NOT NULL,
  bulan_tagihan varchar(10), tahun_tagihan varchar(4), keterangan text, id_pengurus bigint REFERENCES pengurus(id_pengurus),
  no_transaksi varchar(50) NOT NULL UNIQUE, created_at timestamptz, updated_at timestamptz);
CREATE TABLE IF NOT EXISTS riwayat_kelas (
  id bigserial PRIMARY KEY, nis varchar(20) NOT NULL REFERENCES santri(nis) ON DELETE CASCADE, kelas_lama varchar(50) NOT NULL,
  kelas_baru varchar(50) NOT NULL, tanggal_naik date NOT NULL, tahun_ajaran varchar(20), keterangan text, created_at timestamptz, updated_at timestamptz);
CREATE TABLE IF NOT EXISTS transaksi_keuangan (
  id_transaksi bigserial PRIMARY KEY, jenis varchar(20) NOT NULL, kategori varchar(100) NOT NULL, nominal numeric(15,2) NOT NULL,
  tanggal date NOT NULL, keterangan text, referensi_id varchar(50), referensi_tipe varchar(50), created_at timestamptz, updated_at timestamptz);
CREATE TABLE IF NOT EXISTS tagihan_status (
  id bigserial PRIMARY KEY, nis varchar(20) NOT NULL REFERENCES santri(nis) ON DELETE CASCADE, bulan int NOT NULL, tahun int NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'dibebaskan', keterangan text, created_by bigint, created_at timestamptz,
  CONSTRAINT tagihan_status_unique UNIQUE (nis, bulan, tahun));
CREATE TABLE IF NOT EXISTS login_attempts (identifier varchar(255) PRIMARY KEY, attempts int NOT NULL DEFAULT 0, locked_until timestamptz);
ALTER TABLE app_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE kamar ENABLE ROW LEVEL SECURITY;
ALTER TABLE ustadz ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE kehadiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE riwayat_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi_keuangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagihan_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
