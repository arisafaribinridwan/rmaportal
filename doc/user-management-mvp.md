# User Management MVP Plan

## Goal

Membangun module User Management khusus Admin dengan route final `/dashboard/users` dan operasi minimum:

- list user
- create user
- ubah role
- ubah status aktif

## Scope yang Disepakati

- Halaman final ada di `app/pages/dashboard/users.vue`
- Menu dan route User Management hanya untuk `ADMIN`
- Saat user menjadi nonaktif, user tidak boleh login lagi
- User nonaktif juga harus kehilangan akses secepat mungkin pada request berikutnya
- Create user memakai default password system dari `shared/utils/constants.ts`
- UI harus menampilkan info password default setelah user berhasil dibuat
- Field create user:
  - wajib: `name`, `email`, `username`, `role`
  - `branch` wajib jika role = `CS`
- Edit user untuk MVP hanya mencakup:
  - ubah `role`
  - ubah `status aktif`
- Admin tidak boleh mengubah role atau status aktif dirinya sendiri
- Jika role diubah menjadi `CS` tetapi user target tidak punya `branch`, perubahan harus ditolak
- Tabel user menampilkan semua user dengan filter `All / Active / Inactive`

## Implementasi MVP

### 1. Route dan Akses Frontend

- Buat dedicated page di `app/pages/dashboard/users.vue`
- Ubah seluruh referensi route lama `/dashboard/settings/users` menjadi `/dashboard/users`
- Sinkronkan sidebar, settings navigation, dan route middleware agar hanya `ADMIN` yang bisa mengakses page ini

### 2. Kontrak Data User Management

- Siapkan response list user minimum:
  - `id`
  - `name`
  - `email`
  - `username`
  - `role`
  - `branch`
  - `isActive`
  - `createdAt`
- Gunakan type khusus user management agar tidak bentrok dengan type dummy frontend yang sudah ada

### 3. Backend API

- Sediakan endpoint minimum:
  - `GET /api/users`
  - `POST /api/users`
  - `PATCH /api/users/[id]`
- Semua endpoint tetap berada di prefix `/api/users` agar proteksi admin-only dari middleware global tetap berlaku
- Validasi backend harus mencakup:
  - role harus valid
  - `branch` wajib jika create user dengan role `CS`
  - update role ke `CS` ditolak jika target belum punya `branch`
  - admin tidak boleh update dirinya sendiri

### 4. Create User yang Aman

- Create user harus mengikuti jalur auth yang valid agar akun benar-benar bisa dipakai login
- Default password diambil dari `shared/utils/constants.ts`
- Setelah create berhasil, UI menampilkan informasi password awal ke admin

### 5. Enforcement Status Aktif

- Nonaktif bukan hanya label UI; status ini harus memblok login dan request lanjutan
- Minimal untuk MVP, request dari user nonaktif harus ditolak pada pengecekan auth/session berikutnya
- Jika mekanisme auth memungkinkan, sesi aktif user juga direvoke saat status diubah

### 6. UI User Management

- Tampilkan halaman tabel user dengan pola yang konsisten dengan dashboard existing
- Sediakan:
  - search/filter sederhana
  - filter status `All / Active / Inactive`
  - tombol `New user`
  - aksi row untuk edit role dan activate/deactivate
- Aksi terhadap akun admin yang sedang login harus diblok

### 7. Modal dan UX

- Modal create user berisi field minimum sesuai scope
- `branch` tampil dan wajib saat role `CS`
- Modal edit hanya untuk ubah role
- Modal status hanya untuk activate/deactivate
- Error dan toast harus menjelaskan rule bisnis dengan bahasa yang jelas

### 8. Validasi dan Pengujian

- Admin bisa akses `/dashboard/users`
- Non-admin tidak bisa akses page maupun API `/api/users`
- Create user non-CS tanpa branch berhasil
- Create user CS tanpa branch ditolak
- Edit role ke `CS` ditolak jika target tidak punya branch
- Admin tidak bisa ubah role/status dirinya sendiri
- Deactivate user membuat akses user tersebut terputus pada request berikutnya

## Prinsip Best Practice yang Dipakai

- Validasi penting tetap di backend, bukan hanya di frontend
- Module user management dipisahkan sebagai dedicated page, bukan submenu settings lama
- Integritas auth lebih diprioritaskan daripada shortcut insert data manual
- Guard UI, page middleware, dan API middleware harus konsisten

## Ringkasan Implementasi

### Files Created

| File | Deskripsi |
|------|-----------|
| `app/types/user-management.ts` | Type khusus frontend untuk user management agar tidak bentrok dengan type dummy di `app/types/index.d.ts` |
| `app/pages/dashboard/users.vue` | Halaman utama user management dengan tabel, filter status, search, dan pagination |

### Files Implemented dari Stub Kosong

| File | Deskripsi |
|------|-----------|
| `server/repositories/user-management.repo.ts` | Query layer untuk list, find by id/email/username, partial update, dan revoke session fallback |
| `server/services/user-management.service.ts` | Business logic untuk list, create, update role/status, validasi rule bisnis, dan revoke session saat deactivate |
| `server/api/users/index.get.ts` | Endpoint `GET /api/users` untuk list user admin-only |
| `server/api/users/index.post.ts` | Endpoint `POST /api/users` untuk create user admin-only |
| `server/api/users/[id].patch.ts` | Endpoint `PATCH /api/users/[id]` untuk update role dan/atau status aktif |
| `app/components/users/UserCreateModal.vue` | Modal create user dengan field minimum, validasi branch untuk role `CS`, dan info password default setelah sukses |
| `app/components/users/UserRoleModal.vue` | Modal ubah role user dengan warning jika target tanpa branch akan diubah ke `CS` |
| `app/components/users/UserStatusModal.vue` | Modal activate/deactivate user dengan penjelasan dampak akses login |

### Files Modified

| File | Perubahan |
|------|-----------|
| `server/utils/auth-helpers.ts` | Menambahkan enforcement `isActive` di `requireAuth()` agar user nonaktif diblok pada request berikutnya |
| `app/layouts/dashboard.vue` | Memindahkan menu User Management menjadi dedicated menu item `/dashboard/users` yang hanya tampil untuk `ADMIN` |
| `app/pages/dashboard/settings.vue` | Menghapus referensi tab Users lama agar tidak lagi mengarah ke route deprecated |

### Rule Bisnis yang Sudah Diimplementasikan

- Akses page dan API user management hanya untuk `ADMIN`
- Field `branch` wajib saat create user dengan role `CS`
- Perubahan role ke `CS` ditolak jika user target belum punya `branch`
- Admin tidak bisa mengubah role atau status aktif dirinya sendiri
- Create user menggunakan jalur auth yang valid melalui Better Auth admin API
- Password awal menggunakan `DEFAULT_INITIAL_PASSWORD` dari `shared/utils/constants.ts`
- UI menampilkan password default setelah user berhasil dibuat
- Deactivate user merevoke session aktif agar akses terputus secepat mungkin
- User nonaktif diblok pada request berikutnya melalui validasi auth server
- Route lama `/dashboard/settings/users` sudah tidak direferensikan lagi dan diganti menjadi `/dashboard/users`

### Verifikasi Teknis

- `pnpm nuxi typecheck` berhasil lolos setelah implementasi
- Build sempat menampilkan warning dependency `DEP0155`, tetapi itu berasal dari package pihak ketiga dan bukan error dari kode user management

