# Task List — RMA Claim System

> Total: 32 Tasks | 8 Phases
> Progress: 4 selesai, 2 partial, 26 belum dikerjakan
---

## Phase 1 — Foundation: Database & Auth

- [x] **#1** Buat schema DB: `ProductModel`, `NotificationMaster`, `DefectMaster`
  - Path: `server/database/schema/product-model.ts`, `notification-master.ts`,`defect-master.ts`
  - Export di `server/database/schema/index.ts`
  - Termasuk Zod validation, FK constraints, indexes

- [x] **#2** Buat schema DB: `Claim`, `ClaimPhoto`, `ClaimHistory`
  - Path: `server/database/schema/claim.ts`, `claim-photo.ts`, `claim-history.ts`    
  - FK ke `notificationMaster`, `productModel`, `vendor`, `defectMaster`

- [x] **#3** Buat schema DB: `VendorClaim`, `VendorClaimItem`, `PhotoReview`, `SequenceGenerator`
  - Path: `server/database/schema/vendor-claim.ts`, `vendor-claim-item.ts`, `photo-review.ts`, `sequence-generator.ts`

- [x] **#4** Buat schema DB: tabel Better-Auth
  - Path: `server/database/schema/auth.ts`
  - Catatan: Profile field di-merge ke tabel `user` (bukan tabel terpisah)          
  - Termasuk `user`, `session`, `account`, `verification` + business fields (`branch`, `role`, `isActive`, `banned`, dll.)

- [ ] **#5** Setup Better-Auth server
  - Instal dependency `better-auth` (saat ini belum ada di package.json)
  - Buat `server/utils/auth.ts`, `app/utils/auth-client.ts`
  - Konfigurasi: session 7 hari, ratelimit, max 5 attempt, lock 15 menit

- [ ] **#6** Buat auth middleware & route protection
  - `server/api/auth/[...all].ts`, `server/utils/auth-helpers.ts`
  - Middleware: `app/middleware/auth.global.ts`, CS, Dashboard

- [ ] **#7** Buat halaman Login & Profile
  - `app/pages/login.vue` — form email + password
---

## Phase 2 — Master Data Management

- [ ] **#8** Setup shared infrastructure
  - Error handler, Sequence generator, Layouts, SidebarNav, `useAuth` composable
- [ ] **#9** Vendor CRUD (Backend) — Controller/Service di `server/api/vendors`
- [ ] **#10** Vendor CRUD (Frontend) — `app/pages/dashboard/master/vendor.vue`
- [ ] **#11** Product Model CRUD (Backend)
- [ ] **#12** Product Model CRUD (Frontend) — `app/pages/dashboard/master/product-model.vue`
- [ ] **#13** Defect Master CRUD (Backend)
- [ ] **#14** Defect Master CRUD (Frontend) — `app/pages/dashboard/master/defect.vue`
- [ ] **#15** Notification Master CRUD + Excel Import (Backend)
- [ ] **#16** Notification Master CRUD + Excel Import UI (Frontend) — `app/pages/dashboard/master/notification.vue`

---

## Phase 3 — Claim Flow: CS

- [ ] **#17** CS Claim List (Backend) — API `GET /claims`
- [ ] **#18** CS Claim List UI (Frontend) — `app/pages/cs/index.vue`, `app/pages/cs/claim/[id].vue`
- [ ] **#19** Claim Wizard Create (Backend) — Lookup, draft, submit, upload foto
- [ ] **#20** Claim Wizard Create UI (Frontend) — Multi-step form `app/pages/cs/claim/create.vue`
- [ ] **#21** Claim Revision Flow (Backend & Frontend) — `POST /claims/:id/revision`, `app/pages/cs/claim/[id]/edit.vue`

---

## Phase 4 — Claim Flow: QRCC

- [ ] **#22** QRCC Claims Dashboard (Backend) — API review klaim
- [ ] **#23** QRCC Claims Dashboard UI (Frontend) — 3-Tab Interface `app/pages/dashboard/claims/[id].vue`
- [ ] **#24** Photo Review (Backend) — Kalkulasi status akhir
- [ ] **#25** Audit Trail (Backend & Frontend) — List `ClaimHistory`, export Excel `app/pages/dashboard/audit-trail.vue`

---

## Phase 5 — Vendor Claim

- [ ] **#26** Vendor Claim Generate (Backend) — Seleksi klaim APPROVED
- [ ] **#27** Vendor Claim UI (Frontend) — Wizard 3 step `app/pages/dashboard/vendor-claims/create.vue`
- [ ] **#28** Vendor Decision Input (Backend & Frontend) — Input ACCEPTED/REJECTED

---

## Phase 6 — Management & Admin

- [ ] **#29** User Management (Backend & Frontend) — `app/pages/dashboard/users.vue`
- [ ] **#30** Dashboard Overview & Statistik — Chart unovis `app/pages/dashboard/index.vue`
- [ ] **#31** Reports (Backend & Frontend) — Laporan + export `app/pages/dashboard/reports.vue`

---

## Phase 7 — Testing & Polish

- [ ] **#32** Unit Tests, Integration Tests & UX Polish
  - Tambahkan skeleton loaders, toast notification konsisten
  - Cek responsive design
  - Pastikan linting dan typecheck lolos

---

> **Cara baca status:**
> - `[ ]` Belum dikerjakan
> - `[/]` Sedang dikerjakan
> - `[x]` Selesai
