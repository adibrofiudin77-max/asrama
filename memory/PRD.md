# PRD - Manajemen Pondok Pesantren Alhasani

## Original problem statement
buatkan web app, manajemen Pondok Pesantren alhasani, dengan database yang sudah dibuat di web app sebelumnya, dengan 3 hak akses, administator akses semua, pengurus akses absensi input pembayaran dan pendaftaran input jadwal ngaji, santri melihat tagihan masing" santri jadwal mengaji daftar kehadiran mereka, untuk login santri menggunakan nis dengan default password 111111. seperti database diatas. untuk pembayaran perbulan 100 ribu, dan biaya pendaftaran 150 ribu. buatkan fitur kenaikan kelas dll dan pada pembayaran santri administrator dapat mengubah status pembayaran jika contoh dibulan juni ada pkl karena santri tidak dipomdok jadi tida dibebani biaya bulnanan. biaya bulanan terhitung sejak satu bulan setelah pendaftaran. dan cetak kwitansi dengan size kertas envelope c55 landscape. dan pada dashboard pengurus dan administrator tampilkan top santri ter rajin sesuai kehadiraan mengaji dan top termalas.

## User choices
- Admin/pengurus: tetap pakai password lama (hash Laravel), login dengan email
- Absensi per jadwal/kegiatan per tanggal
- Ustadz: hanya akses absensi
- Modul keuangan + laporan kas sederhana: ya
- Kop kwitansi: PONDOK PESANTREN ALHASANI LIMPUNG, Jl. KH. Wahid Hasyim No. [nomor], Limpung; tanda tangan = pengurus yang login
- Stack wajib: Laravel + Next.js + Supabase

## Status (2026-10-12)
- Belum dibangun. User membatalkan karena wajib Laravel + Next.js, sedangkan platform hanya mendukung React + FastAPI.

## Backlog
- P0: Bangun aplikasi lengkap di React + FastAPI (Supabase atau MongoDB) jika user setuju
