# QA Checklist: Role Matrix & Demo Flow

Dokumen ini untuk validasi cepat bahwa hak akses dan fitur sesuai matrix final.

## Matrix Final (disepakati)
- Login: `admin`, `operator`, `employee`
- Logout: `admin`, `operator`, `employee`
- CRUD Pengguna: `admin` saja
- Inventaris (manage classes/items/categories/locations/units): `operator` + `admin`
- Peminjaman:
- `employee`: ajukan peminjaman
- `operator` + `admin`: verifikasi/approve/reject
- Pengembalian: semua role
- Laporan + Export CSV/PDF: `admin` saja

## Akun Uji
- Admin: `admin / admin123`
- Operator: `operator / operator123`
- Employee: `deva / deva12345`

## Checklist UI Route (Frontend)
1. Login sebagai `admin`
- [ ] Bisa akses `/users`
- [ ] Bisa akses `/reports`
- [ ] Bisa akses `/settings`
- [ ] Bisa akses `/items`, `/categories`, `/locations`, `/units`, `/classes`
- [ ] Bisa akses `/loans`

2. Login sebagai `operator`
- [ ] Tidak bisa akses `/users` (redirect unauthorized)
- [ ] Tidak bisa akses `/reports` (redirect unauthorized)
- [ ] Tidak bisa akses `/settings` (redirect unauthorized)
- [ ] Bisa akses `/items`, `/categories`, `/locations`, `/units`, `/classes`
- [ ] Bisa akses `/loans` (verifikasi)

3. Login sebagai `employee`
- [ ] Tidak bisa akses `/users`, `/reports`, `/settings`
- [ ] Tidak bisa akses `/items`, `/categories`, `/locations`, `/units`, `/classes`
- [ ] Tidak bisa akses `/loans` (verifikasi operator/admin)
- [ ] Bisa akses `/request-loan`
- [ ] Bisa akses `/returns`

## Checklist API Authorization (Backend)
1. Endpoint users
- [ ] `GET /users` -> admin `200`, operator `403`, employee `403`

2. Endpoint laporan
- [ ] `GET /reports/summary` -> admin `200`, operator `403`, employee `403`
- [ ] `GET /reports/export/pdf` -> admin `200`, operator `403`, employee `403`

3. Endpoint master data
- [ ] `GET /categories` -> admin/operator `200`, employee `403`
- [ ] `GET /locations` -> admin/operator `200`, employee `403`
- [ ] `GET /units` -> admin/operator `200`, employee `403`

4. Endpoint peminjaman
- [ ] `POST /loans` (employee) berhasil membuat `PENDING`
- [ ] `POST /loans/:id/approve` (operator/admin) berhasil
- [ ] `POST /loans/:id/reject` (operator/admin) berhasil
- [ ] `POST /loans/:id/return` semua role sesuai data kepemilikan/flow

## Checklist Laporan
- [ ] Filter tanggal berjalan
- [ ] Filter role berjalan
- [ ] Filter status berjalan
- [ ] Filter item (keyword) berjalan
- [ ] Sorting berjalan (`sortBy` + `sortDir`)
- [ ] Pagination berjalan (`page`, `limit`)
- [ ] Export CSV berhasil terdownload
- [ ] Export PDF server-side berhasil terdownload

## Catatan Verifikasi
- Tanggal tes:
- Tester:
- Commit/hash yang diuji:
- Temuan bug:

## Hasil Smoke Test API (2026-02-18)
- `GET /users` -> `admin:200`, `operator:403`, `employee:403`
- `GET /reports/summary` -> `admin:200`, `operator:403`, `employee:403`
- `GET /categories` -> `admin:200`, `operator:200`, `employee:403`
- `GET /locations` -> `admin:200`, `operator:200`, `employee:403`
- `GET /units` -> `admin:200`, `operator:200`, `employee:403`
- `GET /items` -> `admin:200`, `operator:200`, `employee:200`
