# PRD - Manajemen Pondok Pesantren Al Hasani Limpung

## Original problem statement
buatkan web app, manajemen Pondok Pesantren alhasani, dengan database yang sudah dibuat di web app sebelumnya, dengan 3 hak akses, administator akses semua, pengurus akses absensi input pembayaran dan pendaftaran input jadwal ngaji, santri melihat tagihan masing" santri jadwal mengaji daftar kehadiran mereka, untuk login santri menggunakan nis dengan default password 111111. seperti database diatas. untuk pembayaran perbulan 100 ribu, dan biaya pendaftaran 150 ribu. buatkan fitur kenaikan kelas dll dan pada pembayaran santri administrator dapat mengubah status pembayaran jika contoh dibulan juni ada pkl karena santri tidak dipomdok jadi tida dibebani biaya bulnanan. biaya bulanan terhitung sejak satu bulan setelah pendaftaran. dan cetak kwitansi dengan size kertas envelope c55 landscape. dan pada dashboard pengurus dan administrator tampilkan top santri ter rajin sesuai kehadiraan mengaji dan top termalas.

Follow-ups: React + FastAPI, database Supabase; ustadz hanya akses absensi; modul keuangan + laporan kas; kop kwitansi "PONDOK PESANTREN ALHASANI LIMPUNG, Jl. KH. Wahid Hasyim No. 01 Limpung", tanda tangan = pengurus yang input; kelas = tingkat X/XI/XII + program keahlian (PM, AK, TO, PPLG, PG, RPL, BD, BR, LP); tanpa motif polkadot/gambar masjid; login simpel hijau elegan tanpa logo; kwitansi tanpa logo (cetak hitam putih).

## Architecture
- Frontend: React (CRA + craco), Tailwind, shadcn, sonner. Pages: Login, Dashboard, Santri, Pembayaran, Kwitansi (C5 229x162mm), Absensi, Jadwal, KenaikanKelas, Keuangan, Master (Kamar/Ustadz), Pengguna, Portal santri.
- Backend: FastAPI + asyncpg -> Supabase Postgres (session pooler aws-0-ap-southeast-2, DATABASE_URL in backend/.env). Files: server.py, db.py, auth.py, routes_master.py, routes_akademik.py, routes_keuangan.py, legacy_import.py, schema.sql.
- Legacy MySQL dump (backend/data/alhasani_db.sql) imported once on startup (app_meta.legacy_imported). Santri passwords reset to 111111; staff Laravel $2y$ hashes kept.
- Auth: JWT Bearer (12h), brute-force lockout (login_attempts table). Roles in DB: pengurus_admin->admin, pengurus_harian->pengurus, ustadz, santri.
- New tables: tagihan_status (bulan dibebaskan/PKL), login_attempts, app_meta; kehadiran now has id_jadwal (unique nis+tanggal+id_jadwal); santri.program_keahlian.

## User personas
Administrator (semua akses), Pengurus (dashboard, santri/pendaftaran, pembayaran, absensi, jadwal), Ustadz (absensi saja), Santri (tagihan, jadwal, kehadiran).

## What's been implemented (2026-10-12)
- All modules above; billing starts 1 month after tanggal_daftar; admin can mark months "dibebaskan"; payments create transaksi_keuangan; top 5 terajin/termalas on dashboard; kenaikan kelas massal (keeps program keahlian, LULUS sets status).
- UI refresh: white sidebar with pondok logo, simple solid green login, kwitansi without logo.
- Verified manually: admin & santri login, dashboard, tagihan, kwitansi render.
- 2026-10-12: Full E2E test (iteration_1) on isolated Supabase schema `alhasani_test` (copy of real data): backend 27/27, frontend 100%. Test schema dropped afterwards; backend back on `public` (DB_SCHEMA env, default public). Fixed login_attempts counter.

- 2026-10-13: Re-imported from GitHub (adibrofiudin77-max/asrama, main) into new workspace. Installed asyncpg (other deps already present). backend/.env: DATABASE_URL via Supabase session pooler aws-0-ap-southeast-2 (user postgres.wtdmqvdparooghepprhf; direct db.* host is IPv6-only), JWT_SECRET, ADMIN_EMAIL/PASSWORD, DB_SCHEMA=public.
- 2026-10-13: Branding: title "PP Alhasani Limpung", favicon/apple-touch-icon from logo.png. Emerald + gold luxury theme: tailwind emerald/amber scales overridden (jewel emerald, metallic gold), Cormorant Garamond display font, dark emerald sidebar w/ gold active state, gold hairline header, gold login button, dark hero on portal.

## Backlog
- P0: (done) End-to-end testing on isolated test schema — rerun by setting DB_SCHEMA=alhasani_test in backend/.env and restarting
- P1: Import/backfill program keahlian for existing santri (currently empty)
- P2: Export laporan kas to Excel/PDF; WhatsApp reminder tunggakan
