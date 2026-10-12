-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: Oct 12, 2026 at 06:48 AM
-- Server version: 8.0.43
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `alhasani_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `jadwal`
--

CREATE TABLE `jadwal` (
  `id_jadwal` bigint UNSIGNED NOT NULL,
  `nama_kegiatan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hari` enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') COLLATE utf8mb4_unicode_ci NOT NULL,
  `waktu` time NOT NULL,
  `id_ustadz` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jadwal`
--

INSERT INTO `jadwal` (`id_jadwal`, `nama_kegiatan`, `hari`, `waktu`, `id_ustadz`, `created_at`, `updated_at`) VALUES
(1, 'Jama\'ah Maghrib - Isya', 'Senin', '18:00:00', 1, '2026-06-26 15:05:31', '2026-06-26 15:05:31'),
(2, 'Ngaji Qur\'an dan Kitab', 'Senin', '18:00:00', 1, '2026-06-26 15:06:12', '2026-06-26 15:06:12'),
(3, 'Jama\'ah Maghrib - Isya', 'Jumat', '18:00:00', 1, '2026-06-26 15:06:40', '2026-06-26 15:06:40'),
(4, 'Yasin dan Tahlil', 'Jumat', '18:00:00', 1, '2026-06-26 15:07:05', '2026-06-26 15:07:05');

-- --------------------------------------------------------

--
-- Table structure for table `kamar`
--

CREATE TABLE `kamar` (
  `id_kamar` bigint UNSIGNED NOT NULL,
  `nama_kamar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kamar`
--

INSERT INTO `kamar` (`id_kamar`, `nama_kamar`, `created_at`, `updated_at`) VALUES
(1, 'A1', NULL, NULL),
(2, 'A2', NULL, NULL),
(3, 'B1', NULL, NULL),
(4, 'B2', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `kehadiran`
--

CREATE TABLE `kehadiran` (
  `id_kehadiran` bigint UNSIGNED NOT NULL,
  `nis` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_ustadz` bigint UNSIGNED NOT NULL,
  `tanggal` date NOT NULL,
  `status` enum('hadir','sakit','izin','alpha') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hadir',
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kehadiran`
--

INSERT INTO `kehadiran` (`id_kehadiran`, `nis`, `id_ustadz`, `tanggal`, `status`, `keterangan`, `created_at`, `updated_at`) VALUES
(1, '2022023', 1, '2026-06-26', 'hadir', NULL, '2026-06-26 12:29:52', '2026-06-26 12:29:52');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2024_01_01_000000_create_users_table', 1),
(2, '2024_01_01_000001_create_kamar_table', 1),
(3, '2024_01_01_000002_create_santri_table', 1),
(4, '2024_01_01_000003_create_pengurus_table', 1),
(5, '2024_01_01_000004_create_ustadz_table', 1),
(6, '2024_01_01_000005_create_jadwal_table', 1),
(7, '2024_01_01_000006_create_kehadiran_table', 1),
(8, '2024_01_01_000007_create_pembayaran_table', 1),
(9, '2024_01_01_000008_create_password_reset_tokens_table', 1),
(10, '2024_06_26_000009_add_jenis_kelamin_to_santri', 2),
(11, '2026_07_11_000000_change_kelas_to_string', 3),
(12, '2026_07_11_000001_create_riwayat_kelas_table', 3),
(13, '2026_07_11_000002_create_transaksi_keuangan_table', 3),
(14, '2026_08_11_000001_backfill_pembayaran_to_transaksi_keuangan', 3);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id_pembayaran` bigint UNSIGNED NOT NULL,
  `nis` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_pembayaran` enum('syariah','pendaftaran') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'syariah',
  `nominal` decimal(12,2) NOT NULL,
  `tanggal_bayar` date NOT NULL,
  `bulan_tagihan` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tahun_tagihan` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `id_pengurus` bigint UNSIGNED NOT NULL,
  `no_transaksi` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pembayaran`
--

INSERT INTO `pembayaran` (`id_pembayaran`, `nis`, `jenis_pembayaran`, `nominal`, `tanggal_bayar`, `bulan_tagihan`, `tahun_tagihan`, `keterangan`, `id_pengurus`, `no_transaksi`, `created_at`, `updated_at`) VALUES
(1, '2022023', 'pendaftaran', 115000.00, '2026-06-26', NULL, '2026', NULL, 2, '20260626001', '2026-06-26 11:22:04', '2026-06-26 11:22:04'),
(2, '260201025', 'pendaftaran', 150000.00, '2026-07-11', NULL, '2026', 'Biaya Pendaftaran Asrama', 2, '20260711001', '2026-07-11 15:18:57', '2026-07-11 15:18:57'),
(3, '260204031', 'pendaftaran', 150000.00, '2026-07-12', NULL, '2026', 'Pendaftaran Santri Baru', 2, '20260712001', '2026-07-12 10:42:00', '2026-07-12 10:42:00'),
(4, '260204011', 'pendaftaran', 150000.00, '2026-07-12', NULL, '2026', 'Pendaftaran', 2, '20260712002', '2026-07-12 10:49:42', '2026-07-12 10:49:42'),
(5, '260101019', 'pendaftaran', 150000.00, '2026-07-12', NULL, '2026', NULL, 2, '20260712003', '2026-07-12 11:04:13', '2026-07-12 11:04:13'),
(6, '260403002', 'pendaftaran', 150000.00, '2026-07-12', NULL, '2026', NULL, 2, '20260712004', '2026-07-12 13:34:17', '2026-07-12 13:34:17'),
(7, '260401023', 'pendaftaran', 150000.00, '2026-07-12', NULL, '2026', NULL, 2, '20260712005', '2026-07-12 13:56:49', '2026-07-12 13:56:49'),
(8, '260101016', 'pendaftaran', 150000.00, '2026-07-12', NULL, '2026', NULL, 2, '20260712006', '2026-07-12 14:34:05', '2026-07-12 14:34:05'),
(9, '260204031', 'syariah', 100000.00, '2026-08-10', 'Agustus', '2026', NULL, 2, '20260810001', '2026-08-10 10:04:20', '2026-08-10 10:04:20'),
(11, '260101016', 'syariah', 100000.00, '2026-08-11', 'Agustus', '2026', NULL, 2, '20260811002', '2026-08-11 08:08:28', '2026-08-11 08:08:28'),
(17, '260204011', 'syariah', 100000.00, '2026-08-11', 'Agustus', '2026', NULL, 2, '20260811003', '2026-08-11 11:23:48', '2026-08-11 11:23:48'),
(19, '260103012', 'pendaftaran', 150000.00, '2026-08-17', 'Agustus', '2026', NULL, 2, '20260817001', '2026-08-17 14:14:41', '2026-08-17 14:14:41'),
(20, '260101016', 'syariah', 100000.00, '2026-08-21', 'Agustus', '2026', 'Bulan agustus', 2, '20260821001', '2026-08-21 08:53:03', '2026-08-21 08:53:03'),
(21, '260101019', 'syariah', 100000.00, '2026-08-21', 'Agustus', '2026', NULL, 2, '20260821002', '2026-08-21 09:01:59', '2026-08-21 09:01:59'),
(22, '260101016', 'syariah', 100000.00, '2026-09-11', 'September', '2026', NULL, 2, 'TRX-20260911001', '2026-09-11 11:06:38', '2026-09-11 11:06:38'),
(23, '260103012', 'syariah', 100000.00, '2026-09-11', 'September', '2026', NULL, 2, 'TRX-20260911002', '2026-09-11 11:08:27', '2026-09-11 11:08:27'),
(24, '260204031', 'syariah', 100000.00, '2026-09-11', 'September', '2026', NULL, 2, 'TRX-20260911003', '2026-09-11 11:10:52', '2026-09-11 11:10:52'),
(25, '260101019', 'syariah', 100000.00, '2026-09-25', 'September', '2026', NULL, 2, 'TRX-20260925001', '2026-09-25 09:08:46', '2026-09-25 09:08:46'),
(26, '260204011', 'syariah', 100000.00, '2026-09-25', 'September', '2026', NULL, 2, 'TRX-20260925002', '2026-09-25 09:09:44', '2026-09-25 09:09:44'),
(27, '260204031', 'syariah', 100000.00, '2026-10-12', 'Oktober', '2026', NULL, 2, 'TRX-20261012001', '2026-10-12 13:35:28', '2026-10-12 13:35:28'),
(28, '260401023', 'syariah', 100000.00, '2026-10-12', 'Agustus', '2026', NULL, 2, 'TRX-20261012002', '2026-10-12 13:36:22', '2026-10-12 13:36:22'),
(29, '260401023', 'syariah', 100000.00, '2026-10-12', 'September', '2026', NULL, 2, 'TRX-20261012003', '2026-10-12 13:36:45', '2026-10-12 13:36:45');

-- --------------------------------------------------------

--
-- Table structure for table `pengurus`
--

CREATE TABLE `pengurus` (
  `id_pengurus` bigint UNSIGNED NOT NULL,
  `nama_pengurus` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_pengurus` enum('admin','pengurus_harian') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pengurus_harian',
  `no_hp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pengurus`
--

INSERT INTO `pengurus` (`id_pengurus`, `nama_pengurus`, `jenis_pengurus`, `no_hp`, `alamat`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'admin', '081234567890', 'Asrama Alhasani', '2026-06-26 10:08:35', '2026-06-26 10:08:35'),
(2, 'yano', 'pengurus_harian', '081326424375', 'wonotunggal', '2026-06-26 10:58:19', '2026-06-26 10:58:19');

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_kelas`
--

CREATE TABLE `riwayat_kelas` (
  `id` bigint UNSIGNED NOT NULL,
  `nis` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kelas_lama` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kelas_baru` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_naik` date NOT NULL,
  `tahun_ajaran` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `santri`
--

CREATE TABLE `santri` (
  `nis` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tempat_lahir` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `jenis_kelamin` enum('L','P') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'L',
  `alamat` text COLLATE utf8mb4_unicode_ci,
  `nama_bapak` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_ibu` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_hp_santri` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_hp_ortu` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kelas` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'X',
  `id_kamar` bigint UNSIGNED DEFAULT NULL,
  `tanggal_daftar` date NOT NULL DEFAULT '2026-06-26',
  `status` enum('aktif','nonaktif','lulus') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `santri`
--

INSERT INTO `santri` (`nis`, `nama`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `alamat`, `nama_bapak`, `nama_ibu`, `no_hp_santri`, `no_hp_ortu`, `kelas`, `id_kamar`, `tanggal_daftar`, `status`, `created_at`, `updated_at`) VALUES
('2022023', 'Elviana Labibah', 'Batang', '2004-02-10', 'P', 'tersono', 'labib', 'bibah', '085135527698', '085554545454', 'XI', 1, '2026-06-26', 'aktif', '2026-06-26 11:01:05', '2026-06-27 09:48:33'),
('260101016', 'Hisyam Ali Assiddiqi', 'Batang', '2011-02-21', 'L', 'Dusun Sawangan RT. 002 RW. 002 Desa Sawangan Kec. Gringsing Kab. Batang', 'Ahmad Rosyidin', 'Umi Afiyah', '082221042108', '085200796260', 'X', 4, '2026-07-12', 'aktif', '2026-07-12 14:33:04', '2026-07-12 14:33:04'),
('260101019', 'IRSYAD MUZAKI', 'Batang', '2010-07-15', 'L', 'Dukuh Kebonagung RT.001 RW.002 Desa Kambangan Kecamatan Blado Kabupaten Batang', 'Sanusi', 'Darwati', '085602496598', '082258769796', 'X', 4, '2026-07-12', 'aktif', '2026-07-12 11:03:22', '2026-07-12 11:03:22'),
('260103012', 'ELIN NUR AIDA', 'Kendal', '2011-06-21', 'L', 'Dusun nguwok RT. 07 RW. 01 des. Harjodowo kec. Sukorejo kab. Kendal', 'Mahzin', 'Suyami', '085385118753', '081359745456', 'X', 2, '2026-08-17', 'aktif', '2026-08-17 14:13:39', '2026-08-17 14:13:39'),
('260201025', 'SINDA AULIA', 'Batang', '2009-01-25', 'P', 'desa sodong RT. 04 RW. 01 kec. wonotunggal kab. batang', 'SANURI', 'RASONAH', '+6285138099093', '+6281228097713', 'X', 2, '2026-07-11', 'aktif', '2026-07-11 15:01:17', '2026-07-11 15:01:17'),
('260204011', 'dwi nurul fadhilah', 'batang', '2011-05-25', 'P', 'dk tunggoro desa getas RT.15 RW.05 bawang batang', 'agus setiono', 'kuwatriyah', '0812 2686 7082', '085226736363', 'X', 2, '2026-07-12', 'aktif', '2026-07-12 10:48:05', '2026-07-12 12:13:40'),
('260204031', 'Najwa ayattul husna', 'Batang', '2011-02-22', 'P', '\"Dusun bonjor 01 rt12/rw04\r\nDes. Sidalang Kec. Tersono Kab. Batang\"', 'Hadi Mulyo', 'Julaehah', '085879179715', '085229043267', 'X', 2, '2026-07-12', 'aktif', '2026-07-12 10:40:28', '2026-07-12 10:40:28'),
('260401023', 'NAOMI AGUSTINA RAMADHANI', 'Batang', '2010-08-14', 'P', 'Dusun binangun krajan RT.008 RW.001 Des.Binangun Kec.Bandar Kab.Batang', 'Yahya Mubarok', 'Muhanik', '082138361810', '082322094897', 'X', 2, '2026-07-12', 'aktif', '2026-07-12 13:55:41', '2026-07-12 13:55:41'),
('260403002', 'AFIF FAEYZA', 'Batang', NULL, 'L', 'DUSUN Sipelem RT 23.rw 006 Des.Ketanggan kec.gringsing kab .batang', 'MUHAMMAD MUSLIH', 'PUJIYATUN KARIYANI', '085201000134', '089985575939', 'X', 3, '2026-07-12', 'aktif', '2026-07-12 13:33:25', '2026-07-12 13:33:25');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaksi_keuangan`
--

CREATE TABLE `transaksi_keuangan` (
  `id_transaksi` bigint UNSIGNED NOT NULL,
  `jenis` enum('pemasukan','pengeluaran') COLLATE utf8mb4_unicode_ci NOT NULL,
  `kategori` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nominal` decimal(15,2) NOT NULL,
  `tanggal` date NOT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `referensi_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referensi_tipe` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transaksi_keuangan`
--

INSERT INTO `transaksi_keuangan` (`id_transaksi`, `jenis`, `kategori`, `nominal`, `tanggal`, `keterangan`, `referensi_id`, `referensi_tipe`, `created_at`, `updated_at`) VALUES
(1, 'pemasukan', 'pendaftaran', 115000.00, '2026-06-26', 'Pendaftaran a.n Elviana Labibah', '1', 'pembayaran', '2026-08-11 14:01:06', '2026-08-11 14:01:06'),
(2, 'pemasukan', 'pendaftaran', 150000.00, '2026-07-11', 'Pendaftaran a.n SINDA AULIA', '2', 'pembayaran', '2026-08-11 14:01:06', '2026-08-11 14:01:06'),
(3, 'pemasukan', 'pendaftaran', 150000.00, '2026-07-12', 'Pendaftaran a.n Najwa ayattul husna', '3', 'pembayaran', '2026-08-11 14:01:06', '2026-08-11 14:01:06'),
(4, 'pemasukan', 'pendaftaran', 150000.00, '2026-07-12', 'Pendaftaran a.n dwi nurul fadhilah', '4', 'pembayaran', '2026-08-11 14:01:06', '2026-08-11 14:01:06'),
(5, 'pemasukan', 'pendaftaran', 150000.00, '2026-07-12', 'Pendaftaran a.n IRSYAD MUZAKI', '5', 'pembayaran', '2026-08-11 14:01:06', '2026-08-11 14:01:06'),
(6, 'pemasukan', 'pendaftaran', 150000.00, '2026-07-12', 'Pendaftaran a.n AFIF FAEYZA', '6', 'pembayaran', '2026-08-11 14:01:06', '2026-08-11 14:01:06'),
(7, 'pemasukan', 'pendaftaran', 150000.00, '2026-07-12', 'Pendaftaran a.n NAOMI AGUSTINA RAMADHANI', '7', 'pembayaran', '2026-08-11 14:01:06', '2026-08-11 14:01:06'),
(8, 'pemasukan', 'pendaftaran', 150000.00, '2026-07-12', 'Pendaftaran a.n Hisyam Ali Assiddiqi', '8', 'pembayaran', '2026-08-11 14:01:06', '2026-08-11 14:01:06'),
(9, 'pemasukan', 'syariah', 100000.00, '2026-08-10', 'Syariah Bulanan - Agustus 2026 a.n Najwa ayattul husna', '9', 'pembayaran', '2026-08-11 14:01:06', '2026-08-11 14:01:06'),
(10, 'pemasukan', 'syariah', 100000.00, '2026-08-11', 'Syariah Bulanan - Agustus 2026 a.n Hisyam Ali Assiddiqi', '11', 'pembayaran', '2026-08-11 14:01:06', '2026-08-11 14:01:06'),
(11, 'pemasukan', 'syariah', 100000.00, '2026-08-11', 'Syariah Bulanan - Agustus 2026 a.n dwi nurul fadhilah', '17', 'pembayaran', '2026-08-11 14:01:06', '2026-08-11 14:01:06'),
(12, 'pengeluaran', 'Listrik', 102500.00, '2026-07-07', NULL, NULL, 'manual', '2026-08-11 14:09:35', '2026-08-11 14:09:35'),
(13, 'pengeluaran', 'Listrik', 102500.00, '2026-07-23', NULL, NULL, 'manual', '2026-08-11 14:10:23', '2026-08-11 14:10:23'),
(14, 'pengeluaran', 'Listrik', 102500.00, '2026-08-10', NULL, NULL, 'manual', '2026-08-11 14:10:53', '2026-08-11 14:10:53'),
(15, 'pengeluaran', 'ATK & Operasional', 35000.00, '2026-07-20', 'Obat Nyamuk', NULL, 'manual', '2026-08-11 14:11:50', '2026-08-11 14:11:50'),
(16, 'pengeluaran', 'ATK & Operasional', 64000.00, '2026-08-11', 'Obat nyamuk dan Kispray', NULL, 'manual', '2026-08-11 14:12:54', '2026-08-11 14:12:54'),
(17, 'pengeluaran', 'ATK & Operasional', 100000.00, '2026-07-27', 'Bensin antar siswa sakit', NULL, 'manual', '2026-08-11 14:24:02', '2026-08-11 14:24:02'),
(18, 'pemasukan', 'pendaftaran', 150000.00, '2026-08-17', 'Pendaftaran - Agustus 2026 a.n ELIN NUR AIDA', '19', 'pembayaran', '2026-08-17 14:14:41', '2026-08-17 14:14:41'),
(19, 'pemasukan', 'syariah', 100000.00, '2026-08-21', 'Syariah Bulanan - Agustus 2026 a.n Hisyam Ali Assiddiqi', '20', 'pembayaran', '2026-08-21 08:53:03', '2026-08-21 08:53:03'),
(20, 'pemasukan', 'syariah', 100000.00, '2026-08-21', 'Syariah Bulanan - Agustus 2026 a.n IRSYAD MUZAKI', '21', 'pembayaran', '2026-08-21 09:01:59', '2026-08-21 09:01:59'),
(21, 'pemasukan', 'syariah', 100000.00, '2026-09-11', 'Syariah Bulanan - September 2026 a.n Hisyam Ali Assiddiqi', '22', 'pembayaran', '2026-09-11 11:06:38', '2026-09-11 11:06:38'),
(22, 'pemasukan', 'Syariah Bulanan', 100000.00, '2026-09-11', 'Pembayaran Syariah Bulanan - Hisyam Ali Assiddiqi (260101016) - September 2026', '22', 'pembayaran', '2026-09-11 11:06:38', '2026-09-11 11:06:38'),
(23, 'pemasukan', 'syariah', 100000.00, '2026-09-11', 'Syariah Bulanan - September 2026 a.n ELIN NUR AIDA', '23', 'pembayaran', '2026-09-11 11:08:27', '2026-09-11 11:08:27'),
(24, 'pemasukan', 'Syariah Bulanan', 100000.00, '2026-09-11', 'Pembayaran Syariah Bulanan - ELIN NUR AIDA (260103012) - September 2026', '23', 'pembayaran', '2026-09-11 11:08:27', '2026-09-11 11:08:27'),
(25, 'pemasukan', 'syariah', 100000.00, '2026-09-11', 'Syariah Bulanan - September 2026 a.n Najwa ayattul husna', '24', 'pembayaran', '2026-09-11 11:10:52', '2026-09-11 11:10:52'),
(26, 'pemasukan', 'Syariah Bulanan', 100000.00, '2026-09-11', 'Pembayaran Syariah Bulanan - Najwa ayattul husna (260204031) - September 2026', '24', 'pembayaran', '2026-09-11 11:10:52', '2026-09-11 11:10:52'),
(27, 'pemasukan', 'syariah', 100000.00, '2026-09-25', 'Syariah Bulanan - September 2026 a.n IRSYAD MUZAKI', '25', 'pembayaran', '2026-09-25 09:08:47', '2026-09-25 09:08:47'),
(28, 'pemasukan', 'Syariah Bulanan', 100000.00, '2026-09-25', 'Pembayaran Syariah Bulanan - IRSYAD MUZAKI (260101019) - September 2026', '25', 'pembayaran', '2026-09-25 09:08:47', '2026-09-25 09:08:47'),
(29, 'pemasukan', 'syariah', 100000.00, '2026-09-25', 'Syariah Bulanan - September 2026 a.n dwi nurul fadhilah', '26', 'pembayaran', '2026-09-25 09:09:44', '2026-09-25 09:09:44'),
(30, 'pemasukan', 'Syariah Bulanan', 100000.00, '2026-09-25', 'Pembayaran Syariah Bulanan - dwi nurul fadhilah (260204011) - September 2026', '26', 'pembayaran', '2026-09-25 09:09:44', '2026-09-25 09:09:44'),
(31, 'pemasukan', 'syariah', 100000.00, '2026-10-12', 'Syariah Bulanan - Oktober 2026 a.n Najwa ayattul husna', '27', 'pembayaran', '2026-10-12 13:35:28', '2026-10-12 13:35:28'),
(32, 'pemasukan', 'Syariah Bulanan', 100000.00, '2026-10-12', 'Pembayaran Syariah Bulanan - Najwa ayattul husna (260204031) - Oktober 2026', '27', 'pembayaran', '2026-10-12 13:35:28', '2026-10-12 13:35:28'),
(33, 'pemasukan', 'syariah', 100000.00, '2026-10-12', 'Syariah Bulanan - Agustus 2026 a.n NAOMI AGUSTINA RAMADHANI', '28', 'pembayaran', '2026-10-12 13:36:22', '2026-10-12 13:36:22'),
(34, 'pemasukan', 'Syariah Bulanan', 100000.00, '2026-10-12', 'Pembayaran Syariah Bulanan - NAOMI AGUSTINA RAMADHANI (260401023) - Agustus 2026', '28', 'pembayaran', '2026-10-12 13:36:22', '2026-10-12 13:36:22'),
(35, 'pemasukan', 'syariah', 100000.00, '2026-10-12', 'Syariah Bulanan - September 2026 a.n NAOMI AGUSTINA RAMADHANI', '29', 'pembayaran', '2026-10-12 13:36:45', '2026-10-12 13:36:45'),
(36, 'pemasukan', 'Syariah Bulanan', 100000.00, '2026-10-12', 'Pembayaran Syariah Bulanan - NAOMI AGUSTINA RAMADHANI (260401023) - September 2026', '29', 'pembayaran', '2026-10-12 13:36:45', '2026-10-12 13:36:45');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('santri','pengurus_admin','pengurus_harian','ustadz') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'santri',
  `nis` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_ustadz` bigint UNSIGNED DEFAULT NULL,
  `id_pengurus` bigint UNSIGNED DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `nis`, `id_ustadz`, `id_pengurus`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'pengurus.admin@alhasani.pengurus', NULL, '$2y$12$PtiHFvDOg61v.QJv7FPjIe0wuNgHUkmABnuuSdp79jbT7dsSCNMqi', 'pengurus_admin', NULL, NULL, 1, NULL, '2026-06-26 10:08:35', '2026-06-26 10:08:35'),
(2, 'Admin', 'admin@alhasani.test', NULL, '$2y$12$ISg7DGWymB/tOt7V1p4Q/eZvM7GEuKECVOVbPRoET3WYOBS9Ztd9W', 'pengurus_admin', NULL, NULL, 1, NULL, '2026-06-26 10:08:36', '2026-06-26 10:08:36'),
(3, 'yano', 'pengurus.yano@alhasani.pengurus', NULL, '$2y$12$p/rucEX9t0VKs9RDeLeUOeI75I/srPZgpLskd23IwS/OQEQCuFoOe', 'pengurus_harian', NULL, NULL, 2, NULL, '2026-06-26 10:58:19', '2026-06-26 10:58:19'),
(4, 'Elviana Labibah', '2022023@alhasani.santri', NULL, '$2y$12$qM8ATfxPyCViTpSoGFuZze6wWap6ZxXpvgAreYwCv4bO2JxpobFiq', 'santri', '2022023', NULL, NULL, NULL, '2026-06-26 11:01:05', '2026-06-26 11:01:05'),
(5, 'Aka', 'ustadz.aka@alhasani.ustadz', NULL, '$2y$12$8cKu.ltOmSF9ahzOXUx.suXmlWheQSVjs1.xNsWiaDh0fh8revsMW', 'ustadz', NULL, 1, NULL, NULL, '2026-06-26 11:03:50', '2026-06-26 11:03:50'),
(6, 'SINDA AULIA', '260201025@alhasani.santri', NULL, '$2y$12$Taf42RVirC3Jdf.vQXQcdO1ZBn4Z1c7kchOi2cI0oKzRWRytB3Hba', 'santri', '260201025', NULL, NULL, NULL, '2026-07-11 15:01:17', '2026-07-11 15:01:17'),
(7, 'Najwa ayattul husna', '260204031@alhasani.santri', NULL, '$2y$12$j46VAl6WuIEsUg0./31jnObD7y5ZExIit4ViPIkRcDfgJ0Z.05.r2', 'santri', '260204031', NULL, NULL, NULL, '2026-07-12 10:40:29', '2026-07-12 10:40:29'),
(8, 'dwi nurul fadhilah', '260204011@alhasani.santri', NULL, '$2y$12$UoM/pIUEZsVLhmIGcmCkcu3Gp5/aP6CvbTG2M3lRf/w0bFbaYuPCe', 'santri', '260204011', NULL, NULL, NULL, '2026-07-12 10:48:05', '2026-07-12 10:48:05'),
(9, 'IRSYAD MUZAKI', '260101019@alhasani.santri', NULL, '$2y$12$waziUxUX7hB5OdDlRTj7LuMVBFttPFfE62D97gn.QzcSsWRkDZXTi', 'santri', '260101019', NULL, NULL, NULL, '2026-07-12 11:03:22', '2026-07-12 11:03:22'),
(10, 'AFIF FAEYZA', '260403002@alhasani.santri', NULL, '$2y$12$oP4q6YagBitfZ20Owi.C2OuSTrOevPv./q3QbwdmN1Q6C/a1LCFj2', 'santri', '260403002', NULL, NULL, NULL, '2026-07-12 13:33:25', '2026-07-12 13:33:25'),
(11, 'NAOMI AGUSTINA RAMADHANI', '260401023@alhasani.santri', NULL, '$2y$12$kh/UFWUMlnDCwl.iyu4IVuUhK2wMNI3Ern5q7N2hdn0PWwmy8eV7i', 'santri', '260401023', NULL, NULL, NULL, '2026-07-12 13:55:42', '2026-07-12 13:55:42'),
(12, 'Hisyam Ali Assiddiqi', '260101016@alhasani.santri', NULL, '$2y$12$MzvVUoX1GU13nwuSYug/Q.7c.CABIi8Csvhx2OxhZlAt2ncjuPqby', 'santri', '260101016', NULL, NULL, NULL, '2026-07-12 14:33:05', '2026-07-12 14:33:05'),
(13, 'ELIN NUR AIDA', '260103012@alhasani.santri', NULL, '$2y$12$7VQrwab.FatXtUV7Q33MkeBFs9yb7AfhwnEGLWQiaRcmqZOJypWge', 'santri', '260103012', NULL, NULL, NULL, '2026-08-17 14:13:39', '2026-08-17 14:13:39');

-- --------------------------------------------------------

--
-- Table structure for table `ustadz`
--

CREATE TABLE `ustadz` (
  `id_ustadz` bigint UNSIGNED NOT NULL,
  `nama_ustadz` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_hp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ustadz`
--

INSERT INTO `ustadz` (`id_ustadz`, `nama_ustadz`, `no_hp`, `alamat`, `created_at`, `updated_at`) VALUES
(1, 'Aka', '081326424375', 'Sikebo', '2026-06-26 11:03:50', '2026-06-26 11:03:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `jadwal`
--
ALTER TABLE `jadwal`
  ADD PRIMARY KEY (`id_jadwal`),
  ADD KEY `jadwal_id_ustadz_foreign` (`id_ustadz`);

--
-- Indexes for table `kamar`
--
ALTER TABLE `kamar`
  ADD PRIMARY KEY (`id_kamar`),
  ADD UNIQUE KEY `kamar_nama_kamar_unique` (`nama_kamar`);

--
-- Indexes for table `kehadiran`
--
ALTER TABLE `kehadiran`
  ADD PRIMARY KEY (`id_kehadiran`),
  ADD UNIQUE KEY `kehadiran_nis_tanggal_unique` (`nis`,`tanggal`),
  ADD KEY `kehadiran_id_ustadz_foreign` (`id_ustadz`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id_pembayaran`),
  ADD UNIQUE KEY `pembayaran_no_transaksi_unique` (`no_transaksi`),
  ADD KEY `pembayaran_nis_foreign` (`nis`),
  ADD KEY `pembayaran_id_pengurus_foreign` (`id_pengurus`);

--
-- Indexes for table `pengurus`
--
ALTER TABLE `pengurus`
  ADD PRIMARY KEY (`id_pengurus`);

--
-- Indexes for table `riwayat_kelas`
--
ALTER TABLE `riwayat_kelas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `riwayat_kelas_nis_foreign` (`nis`);

--
-- Indexes for table `santri`
--
ALTER TABLE `santri`
  ADD PRIMARY KEY (`nis`),
  ADD KEY `santri_id_kamar_foreign` (`id_kamar`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `transaksi_keuangan`
--
ALTER TABLE `transaksi_keuangan`
  ADD PRIMARY KEY (`id_transaksi`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_nis_index` (`nis`);

--
-- Indexes for table `ustadz`
--
ALTER TABLE `ustadz`
  ADD PRIMARY KEY (`id_ustadz`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `jadwal`
--
ALTER TABLE `jadwal`
  MODIFY `id_jadwal` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `kamar`
--
ALTER TABLE `kamar`
  MODIFY `id_kamar` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `kehadiran`
--
ALTER TABLE `kehadiran`
  MODIFY `id_kehadiran` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id_pembayaran` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `pengurus`
--
ALTER TABLE `pengurus`
  MODIFY `id_pengurus` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `riwayat_kelas`
--
ALTER TABLE `riwayat_kelas`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transaksi_keuangan`
--
ALTER TABLE `transaksi_keuangan`
  MODIFY `id_transaksi` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `ustadz`
--
ALTER TABLE `ustadz`
  MODIFY `id_ustadz` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `jadwal`
--
ALTER TABLE `jadwal`
  ADD CONSTRAINT `jadwal_id_ustadz_foreign` FOREIGN KEY (`id_ustadz`) REFERENCES `ustadz` (`id_ustadz`) ON DELETE SET NULL;

--
-- Constraints for table `kehadiran`
--
ALTER TABLE `kehadiran`
  ADD CONSTRAINT `kehadiran_id_ustadz_foreign` FOREIGN KEY (`id_ustadz`) REFERENCES `ustadz` (`id_ustadz`) ON DELETE CASCADE,
  ADD CONSTRAINT `kehadiran_nis_foreign` FOREIGN KEY (`nis`) REFERENCES `santri` (`nis`) ON DELETE CASCADE;

--
-- Constraints for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD CONSTRAINT `pembayaran_id_pengurus_foreign` FOREIGN KEY (`id_pengurus`) REFERENCES `pengurus` (`id_pengurus`) ON DELETE CASCADE,
  ADD CONSTRAINT `pembayaran_nis_foreign` FOREIGN KEY (`nis`) REFERENCES `santri` (`nis`) ON DELETE CASCADE;

--
-- Constraints for table `riwayat_kelas`
--
ALTER TABLE `riwayat_kelas`
  ADD CONSTRAINT `riwayat_kelas_nis_foreign` FOREIGN KEY (`nis`) REFERENCES `santri` (`nis`) ON DELETE CASCADE;

--
-- Constraints for table `santri`
--
ALTER TABLE `santri`
  ADD CONSTRAINT `santri_id_kamar_foreign` FOREIGN KEY (`id_kamar`) REFERENCES `kamar` (`id_kamar`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
