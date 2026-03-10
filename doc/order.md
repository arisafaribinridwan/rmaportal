- [/] **#6** Buat auth middleware & route protection
  - Module backend: `server/api/auth/[...all].ts`, `server/utils/auth-helpers.ts`
  - Module frontend: `app/middleware/auth.global.ts`, `app/middleware/dashboard.ts`, `app/middleware/cs.ts`
  - Status saat ini: auth route dan helper sudah ada, namun proteksi global belum aktif penuh
  - Temuan repo:
    - `server/api/auth/[...all].ts` sudah mount Better Auth handler
    - `server/utils/auth-helpers.ts` sudah punya `getCurrentUser`, `requireAuth`, `requireRole`
    - `app/middleware/auth.global.ts` masih di-disable sementara
  - Checklist teknis lanjutan:
    - Aktifkan kembali logic di `app/middleware/auth.global.ts`
    - Samakan aturan redirect public/private route untuk `/`, `/login`, `/cs`, dan `/dashboard`
    - Pastikan `app/middleware/dashboard.ts` dan `app/middleware/cs.ts` benar-benar membatasi role
    - Validasi `event.context.auth` selalu terisi di endpoint yang butuh auth
    - Tambahkan catatan fallback untuk route yang belum siap agar tidak me-redirect ke halaman placeholder yang rusak

- [/] **#7** Buat halaman Login & Profile
  - Module login: `app/pages/login.vue`
  - Module profile/settings: `app/pages/dashboard/settings/index.vue`, `app/pages/dashboard/settings/security.vue`
  - Status saat ini: UI login dan profile/settings sudah ada, tapi belum terhubung ke auth flow riil
  - Temuan repo:
    - `app/pages/login.vue` masih `console.log` saat submit
    - halaman settings/profile masih template umum, belum profil user RMA
  - Checklist teknis lanjutan:
    - Hubungkan submit login ke `authClient`
    - Tampilkan error login yang konsisten di halaman login
    - Redirect user ke home berdasarkan role setelah login sukses
    - Ganti dummy profile data dengan session user aktual
    - Tentukan scope halaman security: ubah password saja atau plus deactivate/delete account

---

## Phase 2 — Master Data Management

- [/] **#8** Setup shared infrastructure
  - Module layout: `app/layouts/dashboard.vue`, `app/layouts/cs.vue`
  - Module composable: `app/composables/useAuth.ts`
  - Module shared contract: `shared/utils/constants.ts`, `shared/types/database.ts`
  - Module pendukung: `app/error.vue`
  - Status saat ini: fondasi shared sudah mulai terbentuk, tapi masih campur dengan komponen/template generik
  - Temuan repo:
    - `useAuth` sudah ada untuk session, user, role, dan home path
    - layout dashboard/cs sudah ada tapi masih menyisakan navigasi/template non-RMA
    - sequence generator service belum ditemukan di `server/services`
  - Checklist teknis lanjutan:
    - Rapikan navigasi di `app/layouts/dashboard.vue` agar hanya memuat route yang benar-benar ada
    - Rapikan navigasi di `app/layouts/cs.vue` agar path konsisten dengan halaman claim yang tersedia
    - Tambahkan service untuk sequence generator bila akan dipakai pada claim/vendor-claim numbering
    - Tetapkan sumber kebenaran tipe frontend: apakah pakai `app/types/master.ts` atau shared DB types untuk tiap flow
    - Buat daftar module yang masih placeholder agar mudah ditindak satu per satu