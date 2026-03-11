# Task List — RMA Claim System

> Total: 32 Tasks | 7 Phases
> Progress: 5 selesai, 11 partial, 16 belum dikerjakan
> Fokus dokumen ini: memetakan status aktual repo dan memecah next step per file/module tanpa mengubah struktur aplikasi yang ada

---

## Phase 1 — Foundation: Database & Auth

- [x] **#1** Buat schema DB: `ProductModel`, `NotificationMaster`, `DefectMaster`
  - Module: `server/database/schema/product-model.ts`, `server/database/schema/notification-master.ts`, `server/database/schema/defect-master.ts`
  - Status saat ini: schema utama sudah tersedia dan sudah diexport lewat `server/database/schema/index.ts`
  - Cakupan yang sudah ada: struktur tabel, relasi dasar, dan validasi Zod

- [x] **#2** Buat schema DB: `Claim`, `ClaimPhoto`, `ClaimHistory`
  - Module: `server/database/schema/claim.ts`, `server/database/schema/claim-photo.ts`, `server/database/schema/claim-history.ts`
  - Status saat ini: schema inti claim flow sudah tersedia
  - Cakupan yang sudah ada: model claim, foto claim, dan history claim

- [x] **#3** Buat schema DB: `VendorClaim`, `VendorClaimItem`, `PhotoReview`, `SequenceGenerator`
  - Module: `server/database/schema/vendor-claim.ts`, `server/database/schema/vendor-claim-item.ts`, `server/database/schema/photo-review.ts`, `server/database/schema/sequence-generator.ts`
  - Status saat ini: schema untuk vendor claim flow sudah tersedia

- [x] **#4** Buat schema DB: tabel Better-Auth
  - Module: `server/database/schema/auth.ts`
  - Status saat ini: tabel `user`, `session`, `account`, `verification` sudah tersedia
  - Cakupan yang sudah ada: business fields tambahan sudah merge ke tabel `user`

- [x] **#5** Setup Better-Auth server
  - Module: `server/utils/auth.ts`, `app/utils/auth-client.ts`
  - Status saat ini: auth server/client sudah terpasang
  - Cakupan yang sudah ada: session 7 hari, rate limit login, RBAC role `ADMIN`/`MANAGEMENT`/`QRCC`/`CS`

- [x] **#6** Buat auth middleware & route protection
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

- [x] **#7** Buat halaman Login & Profile
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

- [x] **#8** Setup shared infrastructure
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

- [x] **#9** Vendor CRUD (Backend)
  - Module route dummy: `server/api/master/vendors.ts`
  - Module route final: `server/api/master/vendor/index.get.ts`, `server/api/master/vendor/index.post.ts`, `server/api/master/vendor/[id].get.ts`, `server/api/master/vendor/[id].put.ts`, `server/api/master/vendor/[id].patch.ts`
  - Module service: `server/services/vendor.service.ts`
  - Status saat ini: service dan route granular sudah ada, namun endpoint dummy masih dipakai UI tertentu
  - Checklist teknis lanjutan:
    - Putuskan endpoint final yang akan dipakai frontend
    - Hilangkan ketergantungan UI terhadap `server/api/master/vendors.ts`
    - Samakan format response list/detail/create/update/status
    - Pastikan semua route memakai auth helper/role guard yang konsisten
    - Definisikan kontrak filter list: `search`, `isActive`, pagination bila diperlukan

- [x] **#10** Vendor CRUD (Frontend)
  - Module page: `app/pages/dashboard/master/vendor.vue`
  - Module modal: `app/components/master/vendor/VendorAddModal.vue`, `app/components/master/vendor/VendorEditModal.vue`, `app/components/master/vendor/VendorDeleteModal.vue`
  - Status saat ini: table, filter, dan modal sudah ada, tapi submit masih placeholder
  - Checklist teknis lanjutan:
    - Ganti `useFetch('/api/master/vendors')` ke endpoint final yang disepakati
    - Hubungkan modal add/edit/delete ke POST/PUT/PATCH backend
    - Tambahkan refresh data setelah create/update/status change
    - Tampilkan error API di toast/form state
    - Pastikan field `requiredPhotos` dan `requiredFields` mengikuti konstanta shared

- [x] **#11** Product Model CRUD (Backend)
  - Module route dummy: `server/api/master/product-models.ts`
  - Module route final: `server/api/master/product-model/index.get.ts`, `server/api/master/product-model/index.post.ts`, `server/api/master/product-model/[id].get.ts`, `server/api/master/product-model/[id].put.ts`, `server/api/master/product-model/[id].patch.ts`
  - Module service: `server/services/product-model.service.ts`
  - Status saat ini: service dan route granular sudah ada, tetapi list dummy masih ada untuk UI
  - Checklist teknis lanjutan:
    - Finalkan endpoint list/detail product model yang menjadi sumber data utama
    - Samakan validasi uniqueness model per vendor di semua route
    - Pastikan response include informasi vendor yang dibutuhkan UI
    - Tambahkan auth/role guard konsisten di semua route product model
    - Dokumentasikan format payload create/update di doc API internal

- [x] **#12** Product Model CRUD (Frontend)
  - Module page: `app/pages/dashboard/master/product-model.vue`
  - Module modal: `app/components/master/product-model/ProductModelAddModal.vue`, `app/components/master/product-model/ProductModelEditModal.vue`, `app/components/master/product-model/ProductModelDeleteModal.vue`
  - Status saat ini: UI list dan modal sudah ada, namun data masih dari endpoint dummy
  - Checklist teknis lanjutan:
    - Ganti source data ke endpoint final backend
    - Hubungkan add/edit/delete modal ke backend actual
    - Pastikan pilihan vendor sinkron dengan master vendor aktif
    - Tambahkan refresh table setelah aksi sukses
    - Samakan pesan sukses/error antar modal

- [x] **#13** Defect Master CRUD (Backend)
  - Module route dummy: `server/api/master/defects.ts`
  - Module route final: `server/api/master/defect/index.get.ts`, `server/api/master/defect/index.post.ts`, `server/api/master/defect/[id].get.ts`, `server/api/master/defect/[id].put.ts`, `server/api/master/defect/[id].patch.ts`
  - Module service: `server/services/defect-master.service.ts`
  - Status saat ini: backend final sudah mulai ada, tetapi list dummy masih eksis
  - Checklist teknis lanjutan:
    - Konsolidasikan route dummy vs route final
    - Pastikan validasi unik untuk `code` dan `name` dipakai konsisten
    - Samakan bentuk response list/detail/mutation
    - Tambahkan role guard untuk QRCC/Admin
    - Putuskan apakah soft delete cukup via `isActive`

- [x] **#14** Defect Master CRUD (Frontend)
  - Module page: `app/pages/dashboard/master/defect.vue`
  - Module modal: `app/components/master/defect/DefectAddModal.vue`, `app/components/master/defect/DefectEditModal.vue`, `app/components/master/defect/DefectDeleteModal.vue`
  - Status saat ini: UI sudah ada, submit dan refresh flow belum final
  - Checklist teknis lanjutan:
    - Sambungkan table ke endpoint final
    - Sambungkan add/edit/delete modal ke backend
    - Pastikan filter dan sorting tetap jalan setelah integrasi API
    - Tampilkan validasi konflik `code`/`name` dari backend
    - Samakan naming toast dan empty state

- [x] **#15** Notification Master CRUD + Excel Import (Backend)
  - Module route dummy: `server/api/master/notifications.ts`
  - Module route final: `server/api/master/notification/index.get.ts`, `server/api/master/notification/index.post.ts`, `server/api/master/notification/[id].get.ts`, `server/api/master/notification/[id].put.ts`, `server/api/master/notification/[id].patch.ts`
  - Module service: `server/services/notification-master.service.ts`
  - Status saat ini: CRUD backend dasar sudah ada, import Excel belum ditemukan
  - Checklist teknis lanjutan:
    - Konsolidasikan endpoint dummy vs endpoint final
    - Pastikan response list menyertakan `modelName` dan `vendorName` bila dibutuhkan UI
    - Definisikan rule perubahan status `NEW` -> `USED` -> `EXPIRED`
    - Tambahkan desain endpoint import Excel bila memang masuk scope phase ini
    - Tentukan format template file import dan error report row-level

- [x] **#16** Notification Master CRUD + Excel Import UI (Frontend)
  - Module page: `app/pages/dashboard/master/notification.vue`
  - Module modal: `app/components/master/notification/NotificationAddModal.vue`, `app/components/master/notification/NotificationEditModal.vue`, `app/components/master/notification/NotificationDeleteModal.vue`
  - Status saat ini: table dan modal CRUD sudah ada, tetapi belum full integrate dan belum ada import UI
  - Checklist teknis lanjutan:
    - Ganti source list dari endpoint dummy ke endpoint final
    - Hubungkan modal create/edit/expire ke backend
    - Tambahkan validasi sinkron model-vendor bila diperlukan business rule
    - Rancang UI import Excel tanpa mengubah struktur page yang sekarang
    - Tambahkan feedback hasil import: sukses, partial success, gagal

---

## Phase 3 — Claim Flow: CS

- [x] **#17** CS Claim List (Backend) — API `GET /api/claims`
  - Modul aktual: `server/api/claims/index.get.ts` + `server/repositories/claim.repo.ts`
  - Status saat ini: endpoint list sudah tersedia dan terpakai
  - Cakupan yang sudah ada:
    - Filter: `status`, `branch`, `vendorId`, `keyword`, `dateFrom`, `dateTo`
    - Pagination: `page`, `limit` (response menyertakan `pagination`)
    - Summary field list UI sudah tersedia (claim number, notification/model/vendor, defect, status, timestamps)
    - Role guard mengikuti middleware auth global (CS/QRCC/ADMIN)

- [x] **#18** CS Claim List UI (Frontend)
  - Modul aktual: `app/pages/cs/index.vue`, `app/pages/cs/claim/index.vue`, `app/pages/cs/claim/[id].vue`, `app/layouts/cs.vue`
  - Status saat ini: list/detail page sudah terhubung dengan kontrak backend yang aktif
  - Cakupan yang sudah ada:
    - `app/pages/cs/index.vue` dipakai sebagai hero + pintu masuk ke create claim
    - `app/pages/cs/claim/index.vue` sudah menampilkan tabel, filter UI, aksi ke detail
    - `app/pages/cs/claim/[id].vue` sudah menampilkan overview/detail klaim
    - Navigasi layout CS sudah mengarah ke `/cs/claim` dan konsisten (tidak ada `/cs/Claims`)
    - Kontrak response list sudah sinkron dengan backend (`{ data, pagination }`)
    - Mapping field backend vs frontend sudah seragam untuk status (`claimStatus`) pada list/detail

- [x] **#19** Claim Wizard Create (Backend) — Lookup, draft, submit, upload foto
  - Modul aktual: `server/api/claims/**` + `server/services/claim.service.ts`
  - Status saat ini: flow backend wizard sudah tersedia
  - Cakupan yang sudah ada:
    - Lookup endpoint: notifications/models/vendors/defects di `server/api/claims/lookup/*`
    - Draft endpoint: `POST /api/claims` (create) dan `PUT /api/claims/:id` (update draft)
    - Submit endpoint: `PUT /api/claims/:id/submit`
    - Upload foto endpoint: `POST /api/claims/:id/photos` (+ delete photo)
    - Validasi vendor required fields/photos sudah diterapkan di service


- [x] **#20** Claim Wizard Create UI (Frontend)
  - Modul aktual: `app/pages/cs/claim/create.vue`
  - Status saat ini: wizard multi-step sudah terhubung penuh ke API backend (lookup, save draft, submit, upload foto).
  - Cakupan yang sudah ada:
    - Step wizard sudah dipisah: notification/detail defect, upload foto, review
    - State management draft sudah sinkron dengan backend
    - Validasi per step dan required photos sesuai konfigurasi vendor dari API
    - Upload foto menggunakan endpoint `/api/claims/:id/photos`

- [x] **#21** Claim Revision Flow (Backend & Frontend)
  - Modul backend aktual: `server/api/claims/[id]/revise.put.ts`, `server/api/claims/[id]/history.get.ts`, `server/services/claim.service.ts`
  - Modul frontend aktual: `app/pages/cs/claim/[id]/edit.vue`
  - Status saat ini: Backend dan Frontend sudah terintegrasi penuh untuk flow revisi.
  - Cakupan yang sudah ada:
    - Status yang diizinkan revision sudah ditetapkan (`NEED_REVISION`)
    - Endpoint submit revision sudah terintegrasi di frontend (`PUT /api/claims/:id/revise`)
    - Halaman edit claim mengambil data riil dari backend
    - UI penandaan field/foto rejected dinamis berdasarkan feedback QRCC
    - Riwayat alasan revision ditarik dari history backend


---

## Phase 4 — Claim Flow: QRCC

- [ ] **#22** QRCC Claims Dashboard (Backend) — API review klaim
  - Module target: route review claims untuk dashboard QRCC
  - Checklist teknis lanjutan:
    - Definisikan endpoint list claim untuk reviewer
    - Tambahkan filter per status review
    - Sertakan data foto dan ringkasan defect untuk review cepat
    - Pastikan hanya role QRCC/Admin yang bisa akses

- [ ] **#23** QRCC Claims Dashboard UI (Frontend) — 3-Tab Interface `app/pages/dashboard/claims/[id].vue`
  - Module target: `app/pages/dashboard/claims/index.vue`, `app/pages/dashboard/claims/[id].vue`
  - Checklist teknis lanjutan:
    - Siapkan halaman list claim QRCC
    - Siapkan detail dengan tab ringkasan, foto review, dan history
    - Sinkronkan route dengan menu dashboard
    - Tambahkan status badge dan action panel review

- [ ] **#24** Photo Review (Backend) — Kalkulasi status akhir
  - Module target: service review foto dan finalisasi status claim
  - Checklist teknis lanjutan:
    - Definisikan aturan lulus/gagal tiap foto
    - Simpan hasil review per foto
    - Hitung status akhir claim dari hasil review
    - Tulis audit history untuk setiap keputusan review

- [ ] **#25** Audit Trail (Backend & Frontend) — List `ClaimHistory`, export Excel `app/pages/dashboard/audit-trail.vue`
  - Module target backend: endpoint claim history + export
  - Module target frontend: `app/pages/dashboard/audit-trail.vue`
  - Checklist teknis lanjutan:
    - Buat endpoint list history
    - Buat filter berdasarkan action, user, tanggal, claim number
    - Tambahkan export sesuai kebutuhan management
    - Siapkan page audit trail di dashboard

---

## Phase 5 — Vendor Claim

- [ ] **#26** Vendor Claim Generate (Backend) — Seleksi klaim APPROVED
  - Module target: service generate vendor claim
  - Checklist teknis lanjutan:
    - Tentukan rule grouping claim per vendor
    - Generate nomor vendor claim dari sequence
    - Simpan item claim yang tergabung
    - Catat history generate vendor claim

- [ ] **#27** Vendor Claim UI (Frontend) — Wizard 3 step `app/pages/dashboard/vendor-claims/create.vue`
  - Module target: halaman create vendor claim
  - Checklist teknis lanjutan:
    - Buat step seleksi vendor
    - Buat step seleksi approved claims
    - Buat step review dan submit vendor claim
    - Sinkronkan route dengan menu dashboard

- [ ] **#28** Vendor Decision Input (Backend & Frontend) — Input ACCEPTED/REJECTED
  - Module target backend: endpoint keputusan vendor
  - Module target frontend: halaman/detail vendor claim
  - Checklist teknis lanjutan:
    - Definisikan payload keputusan per item claim
    - Simpan tanggal dan user input keputusan
    - Update status vendor claim aggregate
    - Tampilkan hasil accepted/rejected di UI

---

## Phase 6 — Management & Admin

- [/] **#29** User Management (Backend & Frontend) — `app/pages/dashboard/users.vue`
  - Module auth/role existing: `server/utils/auth.ts`
  - Module frontend existing terkait settings: `app/pages/dashboard/settings/members.vue`
  - Status saat ini: role admin di auth sudah ada, tetapi user management RMA belum jadi module khusus
  - Checklist teknis lanjutan:
    - Tentukan apakah user management tetap di settings atau halaman terpisah `app/pages/dashboard/users.vue`
    - Definisikan operasi minimum: list user, create user, ubah role, ubah status aktif
    - Pastikan hanya Admin yang bisa mutate user
    - Ganti page template members menjadi flow user management RMA

- [/] **#30** Dashboard Overview & Statistik — Chart unovis `app/pages/dashboard/index.vue`
  - Module page: `app/pages/dashboard/index.vue`
  - Module komponen: `app/components/home/HomeStats.vue`, `app/components/home/HomeChart.server.vue`, `app/components/home/HomeChart.client.vue`, `app/components/home/HomeSales.vue`
  - Status saat ini: shell dashboard dan komponen statistik sudah ada, tapi masih template generik
  - Checklist teknis lanjutan:
    - Tentukan KPI utama RMA: submitted, need revision, approved, archived, vendor claim pending
    - Ganti source data dummy/template ke data RMA aktual
    - Sesuaikan label, chart, dan cards agar domain-specific
    - Hapus shortcut/action dashboard yang tidak relevan dengan RMA

- [ ] **#31** Reports (Backend & Frontend) — Laporan + export `app/pages/dashboard/reports.vue`
  - Module target backend: endpoint report summary/detail/export
  - Module target frontend: `app/pages/dashboard/reports.vue`
  - Status saat ini: file page reports belum ditemukan
  - Checklist teknis lanjutan:
    - Tentukan jenis laporan prioritas
    - Definisikan filter laporan
    - Definisikan format export yang dibutuhkan
    - Siapkan page reports dan integrasi ke dashboard menu

---

## Phase 7 — Testing & Polish

- [ ] **#32** Unit Tests, Integration Tests & UX Polish
  - Scope backend: auth helpers, services master data, claim flow
  - Scope frontend: login, master data CRUD, CS claim flow, dashboard access
  - Status saat ini: test suite untuk flow utama RMA belum terlihat dan beberapa area UI masih placeholder
  - Checklist teknis lanjutan:
    - Tentukan strategi test minimal untuk backend service dan endpoint penting
    - Tambahkan test untuk auth redirect dan role-based access
    - Tambahkan test untuk CRUD master data prioritas
    - Audit seluruh halaman placeholder/template sebelum masuk polish final
    - Rapikan toast, empty state, loading state, dan responsive behavior

---

## Prioritas Eksekusi Disarankan

- **P1 — Selesaikan fondasi auth dan shared flow**
  - Task `#6`, `#7`, `#8`
  - Alasan: tanpa auth aktif dan layout/navigation yang rapi, modul lain akan sulit divalidasi end-to-end

- **P2 — Finalkan satu pola CRUD master data lalu replikasi**
  - Task `#9` s.d. `#16`
  - Alasan: backend dan frontend sudah setengah jadi; pola vendor/product model/defect/notification bisa diseragamkan

- **P3 — Bangun CS claim flow minimum viable**
  - Task `#17` s.d. `#21`
  - Alasan: ini alur bisnis inti yang akan membuka kebutuhan QRCC, vendor claim, audit, dan reports

- **P4 — Lanjutkan reviewer, vendor claim, dan reporting**
  - Task `#22` s.d. `#31`
  - Alasan: modul ini bergantung pada claim flow yang sudah stabil

- **P5 — Tutup dengan testing dan polish**
  - Task `#32`
  - Alasan: dilakukan setelah alur utama dan kontrak endpoint tidak banyak berubah lagi

---

> **Cara baca status:**
> - `[ ]` Belum dikerjakan
> - `[/]` Sudah mulai / sebagian selesai / masih perlu integrasi
> - `[x]` Selesai
