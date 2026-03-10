# Execution Map — RMA Claim System

> Versi singkat dari `doc/task_list.md`
> Tujuan: dipakai sebagai working board harian, fokus ke urutan eksekusi dan blocker utama

---

## Snapshot

- Total task: `32`
- Selesai: `5`
- Partial: `11`
- Belum mulai: `16`
- Fokus eksekusi terdekat: fondasi auth, cleanup shared flow, lalu finalisasi pola CRUD master data

---

## Current Focus

- **Track 1 — Auth Foundation**
  - `#6` Auth middleware & route protection
  - `#7` Login & Profile
  - Tujuan: login benar-benar jalan, redirect role stabil, route private/public jelas

- **Track 2 — Shared Cleanup**
  - `#8` Shared infrastructure
  - Tujuan: layout, navigation, typing, dan placeholder map lebih rapi

- **Track 3 — Master Data Pattern**
  - `#9` s.d. `#16`
  - Tujuan: finalkan 1 pola CRUD backend+frontend, lalu replikasi ke modul lain

---

## Priority Board

## P1 — Kerjakan Sekarang

- [x] `#6` Auth middleware & route protection
  - File kunci: `server/api/auth/[...all].ts`, `server/utils/auth-helpers.ts`, `app/middleware/auth.global.ts`
  - Hasil yang diharapkan:
    - proteksi route aktif
    - role guard jalan
    - redirect `/login` dan home path konsisten
  - Blocker saat ini:
    - `app/middleware/auth.global.ts` masih disable

- [x] `#7` Login & Profile
  - File kunci: `app/pages/login.vue`, `app/pages/dashboard/settings/index.vue`, `app/pages/dashboard/settings/security.vue`
  - Hasil yang diharapkan:
    - login submit pakai auth client
    - error login tampil rapi
    - profile ambil session user nyata
  - Blocker saat ini:
    - login masih `console.log`
    - profile masih template umum

- [x] `#8` Shared infrastructure
  - File kunci: `app/layouts/dashboard.vue`, `app/layouts/cs.vue`, `app/composables/useAuth.ts`, `shared/utils/constants.ts`, `shared/types/database.ts`
  - Hasil yang diharapkan:
    - navigasi hanya memuat route yang valid
    - path CS/dashboard konsisten
    - arah penggunaan type lebih jelas
  - Blocker saat ini:
    - layout masih campur template non-RMA
    - sequence generator service belum ada

---

## P2 — Finalkan Pola CRUD Master Data

- [/] `#9` Vendor CRUD Backend
  - File kunci: `server/api/master/vendor/*.ts`, `server/api/master/vendors.ts`, `server/services/vendor.service.ts`
  - Outcome:
    - endpoint final jelas
    - endpoint dummy tidak lagi jadi sumber utama

- [/] `#10` Vendor CRUD Frontend
  - File kunci: `app/pages/dashboard/master/vendor.vue`, `app/components/master/vendor/*.vue`
  - Outcome:
    - table pakai endpoint final
    - add/edit/delete benar-benar mutate backend

- [/] `#11` Product Model CRUD Backend
  - File kunci: `server/api/master/product-model/*.ts`, `server/api/master/product-models.ts`, `server/services/product-model.service.ts`
  - Outcome:
    - route list/detail final konsisten

- [/] `#12` Product Model CRUD Frontend
  - File kunci: `app/pages/dashboard/master/product-model.vue`, `app/components/master/product-model/*.vue`
  - Outcome:
    - UI tidak lagi bergantung ke data dummy

- [/] `#13` Defect Master CRUD Backend
  - File kunci: `server/api/master/defect/*.ts`, `server/api/master/defects.ts`, `server/services/defect-master.service.ts`
  - Outcome:
    - validasi unik dan status update final

- [/] `#14` Defect Master CRUD Frontend
  - File kunci: `app/pages/dashboard/master/defect.vue`, `app/components/master/defect/*.vue`
  - Outcome:
    - CRUD UI tersambung backend final

- [/] `#15` Notification Master CRUD + Excel Import Backend
  - File kunci: `server/api/master/notification/*.ts`, `server/api/master/notifications.ts`, `server/services/notification-master.service.ts`
  - Outcome:
    - CRUD final jelas
    - scope import Excel diputuskan

- [/] `#16` Notification Master CRUD + Excel Import Frontend
  - File kunci: `app/pages/dashboard/master/notification.vue`, `app/components/master/notification/*.vue`
  - Outcome:
    - list pakai backend final
    - import UI punya arah implementasi

---

## P3 — Bangun Core Claim Flow

- [ ] `#17` CS Claim List Backend
- [/] `#18` CS Claim List UI
- [ ] `#19` Claim Wizard Create Backend
- [/] `#20` Claim Wizard Create UI
- [ ] `#21` Claim Revision Flow

Catatan fokus:
- selesaikan list claim minimum dulu
- lanjut create draft + submit
- baru tambah revision flow

---

## P4 — Reviewer, Vendor Claim, Reporting

- [ ] `#22` QRCC Claims Dashboard Backend
- [ ] `#23` QRCC Claims Dashboard UI
- [ ] `#24` Photo Review Backend
- [ ] `#25` Audit Trail
- [ ] `#26` Vendor Claim Generate
- [ ] `#27` Vendor Claim UI
- [ ] `#28` Vendor Decision Input
- [/] `#29` User Management
- [/] `#30` Dashboard Overview & Statistik
- [ ] `#31` Reports

Catatan fokus:
- fase ini aman dikerjakan setelah claim flow CS sudah stabil

---

## P5 — Final Hardening

- [ ] `#32` Unit Tests, Integration Tests & UX Polish
  - Fokus akhir:
    - test auth dan role access
    - test CRUD master data prioritas
    - audit placeholder/template tersisa
    - rapikan loading, toast, empty state, responsive

---

## Dependency Map

- `#6` -> `#7` -> `#8`
- `#8` -> `#9` s.d. `#16`
- `#9` s.d. `#16` -> `#17` s.d. `#21`
- `#17` s.d. `#21` -> `#22` s.d. `#28`
- `#22` s.d. `#31` -> `#32`

---

## Quick Wins

- Aktifkan middleware auth dan rapikan redirect role
- Hubungkan submit login ke auth client
- Samakan endpoint final vs endpoint dummy untuk satu modul master data dulu
- Rapikan route/path yang tidak konsisten di layout CS dan dashboard

---

## Open Questions

- Apakah `app/pages/cs/index.vue` akan tetap jadi hero page atau diubah jadi landing list claim?
- Apakah user management tetap berada di area settings atau pindah ke page khusus?
- Apakah Excel import untuk notification tetap masuk Phase 2 atau dipisah setelah CRUD stabil?
- Sumber type frontend utama akan dipusatkan ke mana: `app/types/master.ts` atau shared DB types?

---

## Referensi

- Task detail lengkap: `doc/task_list.md`
