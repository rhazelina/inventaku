# Demo Script: Role Matrix Inventaku (10-15 Menit)

Dokumen ini dipakai saat presentasi agar alur demo rapi, cepat, dan minim risiko.

## Persiapan (2 menit)
1. Jalankan web + API.
2. Siapkan 3 akun:
- `admin / admin123`
- `operator / operator123`
- `deva / deva12345`
3. Pastikan sudah ada minimal 1 data item inventaris.

## Alur Demo Utama

### 1) Login & Dashboard per Role (1 menit)
1. Login sebagai `admin`, tunjukkan masuk ke dashboard admin.
2. Logout.
3. Login sebagai `operator`, tunjukkan dashboard operator.
4. Logout.
5. Login sebagai `employee` (`deva`), tunjukkan dashboard pegawai.

Expected:
- Semua role bisa login/logout.
- Tampilan menu navbar berbeda sesuai role.

### 2) Admin: Fitur Khusus Admin (3 menit)
1. Login sebagai `admin`.
2. Buka `/users`, tunjukkan CRUD pengguna (minimal tampil list user).
3. Buka `/reports`, set filter tanggal + status lalu klik generate.
4. Klik export `CSV` dan `PDF`.
5. Buka `/settings`, tunjukkan pengaturan sistem.

Expected:
- Admin bisa akses `Users`, `Reports`, `Settings`.
- Export laporan berjalan.

Narasi singkat:
- "Role admin fokus ke kontrol pengguna, kebijakan sistem, dan analitik laporan."

### 3) Operator: Operasional Harian (3 menit)
1. Logout admin, login `operator`.
2. Buka halaman master data:
- `/classes`
- `/items`
- `/categories`
- `/locations`
- `/units`
3. Buka `/loans` untuk verifikasi peminjaman.
4. Coba akses `/users` atau `/reports`.

Expected:
- Operator bisa akses master data + verifikasi peminjaman.
- Operator ditolak (`unauthorized`) saat ke `Users` dan `Reports`.

Narasi singkat:
- "Operator fokus ke operasional inventaris dan verifikasi transaksi."

### 4) Employee: Pengajuan Peminjaman (3 menit)
1. Logout operator, login `deva`.
2. Buka `/request-loan`, ajukan 1 peminjaman.
3. Buka `/returns`, tunjukkan menu pengembalian tersedia.
4. Coba akses `/items` dan `/reports`.

Expected:
- Employee bisa ajukan peminjaman.
- Employee tidak bisa akses master data dan laporan.

Narasi singkat:
- "Pegawai hanya pakai fitur transaksi personal, tidak bisa mengubah data master."

### 5) End-to-End Singkat (2-3 menit)
1. Tetap sebagai employee: submit peminjaman baru (status awal `PENDING`).
2. Logout, login operator.
3. Buka `/loans`, approve pengajuan tadi.
4. Kembali login employee/operator, proses pengembalian.
5. Login admin, buka `/reports` untuk melihat data transaksi muncul di laporan.

Expected:
- Flow peminjaman -> verifikasi -> pengembalian -> laporan berjalan penuh.

## Skenario Backup Jika Demo Error
1. Jika export PDF gagal, lanjutkan bukti dari export CSV + tabel laporan.
2. Jika data kosong, buat 1 transaksi cepat via `employee` lalu refresh laporan.
3. Jika sesi login nyangkut, logout lalu login ulang per role.

## Checklist Cepat Saat Presentasi
- [ ] Role-based menu terlihat beda
- [ ] Admin-only page benar-benar admin-only
- [ ] Operator-only operasional berjalan
- [ ] Employee tidak bisa akses halaman terlarang
- [ ] End-to-end transaksi tampil di laporan

## Referensi
- Matrix & QA: `QA-ROLE-MATRIX-CHECKLIST.md`
