# RMA CLAIM SYSTEM — PRODUCT REQUIREMENTS DOCUMENT (PRD)

> **Status**: FINALIZED ✅
> **Tech Stack**: Nuxt 4 (v4.3.1), Better-Auth (v1.5.4), Drizzle ORM, SQLite.

---

## 1. CORE TECH STACK & ARCHITECTURE
- **Frontend/Backend**: Nuxt 4 (Composition API)
- **Auth**: Better-Auth (Username & Admin plugins)
- **Database**: SQLite + Drizzle ORM (Unix MS Timestamps)
- **Validation**: Zod (Runtime + Type-Safe)
- **Layers**: API Route (Auth/Val) -> Service (Logic) -> Repository (DB)

---

## 2. DATABASE SCHEMA (DRIZZLE)
*Semua ID Bisnis: Integer (PK). User ID: Text/UUID (FK ke user.id Better-Auth).*

### 2.1 Master Tables
- **vendors**: `code` (UQ), `requiredPhotos` (JSON), `requiredFields` (JSON), `isActive`.
- **productModels**: `name` (UQ), `vendorId` (FK), `inch`, `isActive`.
- **notificationMasters**: `notificationCode` (UQ), `status` (NEW/USED/EXPIRED).
- **defectMasters**: `code` (UQ), `name`, `isActive`.

### 2.2 Transaction Tables
- **claims**: `claimNumber` (UQ), `status` (DRAFT, SUBMITTED, IN_REVIEW, NEED_REVISION, APPROVED, ARCHIVED).
- **claimPhotos**: `claimId`, `photoType` (UQ per claim), `status` (PENDING, VERIFIED, REJECT).
- **vendorClaims**: `vendorClaimNo` (UQ), `status` (DRAFT, CREATED, PROCESSING, COMPLETED).
- **vendorClaimItems**: `vendorDecision` (ACCEPTED/REJECTED), `compensation`.

### 2.3 Audit & Logs
- **claimHistory**: Log aksi (CREATE, SUBMIT, APPROVE, dll) + metadata user.
- **photoReviews**: Detail review QRCC per foto.

---

## 3. USER ROLES & ACCESS CONTROL
| Role | Landing Page | Key Permissions |
| :--- | :--- | :--- |
| **CS** | `/cs` | Create/Edit Claim, View personal claims. |
| **QRCC** | `/dashboard` | Review Claim, Approve/Reject, Vendor Claim, Master Data. |
| **MANAGEMENT** | `/dashboard` | Analytics, Reports & Dashboards. |
| **ADMIN** | `/dashboard` | Full Access + User & Role Management. |

---

## 4. KEY SYSTEM FLOWS
### 4.1 Claim Creation (CS)
1. **Entry**: Input `notificationCode` -> Redirect ke `/cs/claim/create`.
2. **Step 1**: Data Notification (Auto/Manual) + SN + Defect.
3. **Step 2**: Upload Foto berdasarkan `requiredPhotos` Vendor.
4. **Step 3**: Review & Submit -> Status: `SUBMITTED`.

### 4.2 Review & Approval (QRCC)
1. **Queue**: Ambil klaim `SUBMITTED` -> Status auto `IN_REVIEW`.
2. **Review**: Verifikasi/Reject foto per item + Edit field tertentu.
3. **Decision**: Jika ada reject -> `NEED_REVISION`. Jika OK -> `APPROVED`.

### 4.3 Vendor Claim Process
- Batch klaim `APPROVED` per Vendor -> Generate `VendorClaim` & Export Excel.
- Update keputusan vendor (Accepted/Rejected) per item di sistem.

---

## 5. DEVELOPMENT STANDARDS
- **Formatting**: 2-space indent, LF endings, PascalCase components.
- **Soft Delete**: `isActive` flag (User/Vendor) atau `ARCHIVED` status (Claim).
- **Security**: Sanitasi filename, 5MB max upload, Role-based Route Middleware.
- **Storage**: `./public/uploads/claims/` dengan 300x300px thumbnails via Sharp.

## 6. GIT WORKFLOW

```
Main branch:    main
Feature branch: feature/feature-name
Bugfix branch:  bugfix/bug-name

Commit message format:
- feat:     Add feature X
- fix:      Fix bug Y
- docs:     Update documentation
- refactor: Refactor module Z
- test:     Add test for X
```

---

## 7. PRODUCT CONTEXT FOR UI DESIGN

### 7.1 Product Summary
- Sistem ini adalah **internal web app** untuk proses **RMA / claim elektronik** dari input claim oleh CS, review oleh QRCC, sampai rekap vendor claim dan reporting.
- Pengguna utama bekerja di lingkungan operasional kantor/cabang, sehingga UI harus terasa **cepat, rapi, profesional, dan fokus pada task completion**, bukan marketing style.
- Aplikasi memiliki 2 area besar:
  - **CS Workspace**: alur input claim, revisi, dan tracking klaim milik sendiri.
  - **Dashboard Workspace**: area QRCC, Management, dan Admin untuk review, master data, vendor claim, reports, dan user management.

### 7.2 Design Goals
- Membuat alur claim yang kompleks terasa **jelas, bertahap, dan rendah error**.
- Memastikan status proses mudah dipahami lewat **badge, timeline, progress, dan review states**.
- Menjaga dashboard tetap **data-dense tetapi tidak melelahkan**, cocok untuk pengguna operasional harian.
- Menampilkan relasi antar entitas (`Claim`, `Photo Review`, `Vendor Claim`, `Report`) secara konsisten.
- Siap dipakai sebagai referensi implementasi di **Nuxt 4 admin app** dengan responsive desktop-first layout.

### 7.3 Target Users
- **CS**: staf operasional yang membuat claim baru, upload bukti foto, dan melakukan revisi jika diminta.
- **QRCC**: reviewer yang memverifikasi data dan foto, lalu memutuskan approve/reject.
- **Management**: melihat performa, trend, dan laporan.
- **Admin**: mengelola semua modul termasuk user management.

### 7.4 UX Principles
- **Clarity first**: field penting, status, dan next action harus langsung terlihat.
- **Workflow-driven**: gunakan wizard, stepper, tab review, sticky summary, dan action bar.
- **Operational efficiency**: tabel, filter, bulk action, dan empty/loading/error state wajib jelas.
- **Evidence-centric**: foto adalah bagian inti proses, jadi preview, zoom, compare, dan review note harus menonjol.
- **Role-aware navigation**: menu dan landing page berbeda per role, tetapi design language tetap konsisten.

---

## 8. INFORMATION ARCHITECTURE FOR DESIGN

### 8.1 Global Structure
- **Public**
  - `/login`
- **CS Area**
  - `/cs`
  - `/cs/claim`
  - `/cs/claim/create`
  - `/cs/claim/:id`
  - `/cs/claim/:id/edit`
  - `/cs/profile`
- **Dashboard Area**
  - `/dashboard`
  - `/dashboard/claims`
  - `/dashboard/claims/:id`
  - `/dashboard/vendor-claims`
  - `/dashboard/vendor-claims/create`
  - `/dashboard/vendor-claims/:id`
  - `/dashboard/master/vendor`
  - `/dashboard/master/product-model`
  - `/dashboard/master/notification`
  - `/dashboard/master/defect`
  - `/dashboard/reports`
  - `/dashboard/audit-trail`
  - `/dashboard/users`
  - `/dashboard/settings`
  - `/dashboard/settings/security`

### 8.2 Navigation Model
- **CS navigation**:
  - Home
  - My Claims
  - Profile
- **QRCC navigation**:
  - Dashboard
  - Claims
  - Vendor Claims
  - Master Data
  - Reports
  - Audit Trail
  - Settings
- **Management navigation**:
  - Dashboard
  - Reports
  - Settings
- **Admin navigation**:
  - Dashboard
  - Claims
  - Vendor Claims
  - Master Data
  - Reports
  - Audit Trail
  - Users
  - Settings

---

## 9. REQUIRED SCREENS FOR UI DESIGN

### 9.1 Authentication
- **Login Page**
  - Clean focused login card.
  - Field: username/email, password.
  - Feedback state: invalid credential, loading, locked/inactive account.
  - After login redirect by role.

### 9.2 CS Workspace
- **CS Home `/cs`**
  - Hero section dengan input `Notification Code` sebagai entry point tercepat.
  - Ringkasan claim terbaru milik user.
  - Quick filters by status.
  - CTA utama: `Start Claim`.

- **My Claims List `/cs/claim`**
  - Tabel/list klaim milik CS.
  - Filter: status, tanggal, keyword.
  - Kolom minimum: claim number, notification code, model, vendor, defect, last update, status.
  - Empty state yang mendorong user membuat claim baru.

- **Create Claim Wizard `/cs/claim/create`**
  - Wizard 3 langkah dengan stepper jelas.
  - Step 1: notification lookup/result, manual fallback, serial number, defect, conditional vendor fields.
  - Step 2: upload photo evidence berdasarkan vendor requirements.
  - Step 3: review summary + submit.
  - Harus ada auto-save indicator, validation summary, dan sticky action footer.

- **Claim Detail `/cs/claim/:id`**
  - Header klaim dengan badge status.
  - Overview info, defect info, photo gallery, review notes, history/timeline.
  - Jika status `NEED_REVISION`, tampilkan banner dan CTA ke edit revisi.

- **Claim Revision `/cs/claim/:id/edit`**
  - Mirip wizard create, tapi menonjolkan item rejected.
  - Perlu marker visual untuk field/foto yang direvisi.
  - Side-by-side compare untuk foto lama vs upload baru sangat disarankan.

- **Profile `/cs/profile`**
  - Ringkas dan sederhana: profile info, branch, role, dan update basic account/security entry point.

### 9.3 Dashboard Workspace
- **Dashboard Overview `/dashboard`**
  - Untuk QRCC/Admin: cards KPI, review queue, approval trend, vendor claim summary, recent activities.
  - Untuk Management: fokus ke analytics, trend, branch/vendor performance.
  - Untuk Admin: kombinasi KPI operasional + user overview.

- **Claims Review List `/dashboard/claims`**
  - High-utility data table.
  - Filter: status, vendor, tanggal, branch, keyword.
  - Quick scan untuk claim yang butuh review.
  - Row click menuju detail review.

- **Claim Review Detail `/dashboard/claims/:id`**
  - Layout 3 tab:
    - Claim Info
    - Photo Review
    - Claim History
  - Harus ada sticky review summary dan decision bar.
  - Photo review perlu mendukung verified / reject + note.

- **Vendor Claims List `/dashboard/vendor-claims`**
  - Tabel batch vendor claim dengan status dan summary item.
  - Filter: vendor, status, periode.
  - CTA: `Generate Vendor Claim`.

- **Vendor Claim Create Wizard `/dashboard/vendor-claims/create`**
  - Step 1: pilih vendor + filter klaim approved.
  - Step 2: checklist item claim.
  - Step 3: preview batch + generate.
  - Perlu menonjolkan selected count dan estimasi output batch.

- **Vendor Claim Detail `/dashboard/vendor-claims/:id`**
  - Header batch info + status.
  - Tabel item claim.
  - Modal/side panel input keputusan vendor.
  - Summary accepted/rejected/pending + compensation total.

- **Master Data Pages**
  - `/dashboard/master/vendor`
  - `/dashboard/master/product-model`
  - `/dashboard/master/notification`
  - `/dashboard/master/defect`
  - Gunakan pattern layout yang konsisten: header, stats ringan, filter bar, table, modal form, drawer/detail bila perlu.
  - Vendor page perlu area untuk `requiredPhotos` dan `requiredFields` rule editor.
  - Notification page perlu pattern untuk import Excel + preview result.

- **Reports `/dashboard/reports`**
  - Data visualization untuk claim per periode, per vendor, per branch, approval rate, revision rate.
  - Kombinasi KPI cards, charts, summary blocks, dan export actions.

- **Audit Trail `/dashboard/audit-trail`**
  - Tabel log aktivitas dengan filter by claim, user, action, date.
  - Desain harus menekankan traceability dan chronology.

- **Users `/dashboard/users`**
  - Admin-only user management.
  - Table user + status filter + search.
  - Modal create user, edit role, activate/deactivate.

- **Settings `/dashboard/settings` dan `/dashboard/settings/security`**
  - Basic account information.
  - Security form untuk password update.

---

## 10. KEY UI PATTERNS & COMPONENTS

### 10.1 Layout Patterns
- Left sidebar untuk area dashboard.
- Compact sidebar atau simplified shell untuk area CS.
- Top header dengan page title, breadcrumb, search/context actions, user menu.
- Sticky action bar pada flow kritikal: claim wizard, review claim, vendor claim generation.

### 10.2 Core Components
- Status badge dengan semantic color untuk semua state proses.
- Reusable data table dengan filter bar, search, pagination, bulk selection.
- Multi-step stepper.
- Timeline / audit activity list.
- Photo upload card dengan drag-drop, preview, progress, retry, replace.
- Photo lightbox / zoom viewer.
- Review decision chips atau segmented control untuk `VERIFIED` / `REJECT`.
- Summary cards untuk KPI dan batch metrics.
- Empty state, loading skeleton, toast, inline validation.

### 10.3 Status System
- **Claim Status**:
  - `DRAFT`
  - `SUBMITTED`
  - `IN_REVIEW`
  - `NEED_REVISION`
  - `APPROVED`
  - `ARCHIVED`
- **Photo Status**:
  - `PENDING`
  - `VERIFIED`
  - `REJECT`
- **Vendor Claim Status**:
  - `DRAFT`
  - `CREATED`
  - `PROCESSING`
  - `COMPLETED`

### 10.4 Suggested Visual Semantics
- Neutral/gray for draft or inactive information.
- Blue for submitted / in-progress review.
- Amber/orange for need attention / revision / processing.
- Green for approved / verified / completed.
- Red for rejected / destructive actions.

---

## 11. VISUAL DIRECTION FOR PENCIL.DEV

### 11.1 Design Tone
- Professional internal enterprise app.
- Modern, clean, credible, operational.
- Dense enough for serious work, but still breathable and visually structured.
- Prioritaskan desktop experience, namun tetap responsive di tablet/mobile.

### 11.2 Style Direction
- Hindari tampilan template admin generik yang terlalu datar.
- Gunakan visual language yang terasa **industrial-tech / quality-control / operations**.
- Boleh memakai aksen warna yang tegas dan dewasa, misalnya kombinasi **slate / steel / blue / teal / amber**.
- Gunakan card, panel, divider, highlight surface, dan badge untuk membentuk hirarki.
- Foto evidence area harus terlihat seperti workspace penting, bukan sekadar lampiran kecil.

### 11.3 Typography & Density
- Typeface sans modern yang rapi dan kuat untuk dashboard operasional.
- Heading tegas, data label ringkas, table readable.
- Gunakan spacing yang efisien; jangan terlalu lega seperti landing page.

### 11.4 Interaction Cues
- Hover, selected row, active tab, active step, upload progress, review state, dan disabled state harus sangat jelas.
- Tampilkan feedback visual untuk autosave, validation, success, dan pending action.

---

## 12. CONTENT & DATA HINTS FOR MOCKUP

### 12.1 Example Vendors
- MOKA
- MTC
- SDP

### 12.2 Example Photo Types
- CLAIM
- CLAIM_ZOOM
- ODF
- PANEL_SN
- WO_PANEL
- WO_PANEL_SN

### 12.3 Example Defects
- No Display
- Vertical Line
- Horizontal Line
- Broken Panel
- Flicker

### 12.4 Example Branches
- Jakarta
- Bekasi
- Bandung
- Surabaya

### 12.5 Example KPI Labels
- Total Claims
- Submitted Today
- In Review Queue
- Need Revision
- Approved Rate
- Vendor Claims This Month

---

## 13. DELIVERABLE EXPECTATION FOR PENCIL.DEV

- Buat **multi-screen UI design system-consistent** untuk seluruh flow utama.
- Prioritaskan screen berikut sebagai fokus utama jika perlu bertahap:
  1. Login
  2. CS Home
  3. CS Claim Create Wizard
  4. CS Claim Detail / Revision
  5. Dashboard Overview
  6. Claims Review List
  7. Claim Review Detail
  8. Vendor Claim List + Create Wizard
  9. Master Data pattern page
  10. Reports page
- Sertakan komponen states yang penting: default, loading, empty, error, success.
- Gunakan reusable patterns agar implementasi frontend nantinya konsisten.

---

## 14. READY-TO-USE PROMPT FOR PENCIL.DEV

```text
Design a complete internal web application UI for an RMA Claim System.

Context:
- This is a role-based operational system for handling electronic product RMA claims.
- The product is used by Customer Service (CS), QRCC reviewers, Management, and Admin.
- The app has two main workspaces: a CS area for claim creation/revision/tracking, and a dashboard area for QRCC, Management, and Admin.
- The design should feel like a serious enterprise operations platform: modern, clean, efficient, and trustworthy.
- Prioritize desktop usability, but keep layouts responsive.

Core goals:
- Make complex claim workflows feel clear and step-by-step.
- Make statuses, review decisions, and next actions obvious.
- Support heavy operational usage with structured tables, filters, summaries, and auditability.
- Treat photo evidence as a first-class part of the product.

Main entities:
- Claim
- Claim Photo
- Claim History
- Photo Review
- Vendor Claim
- Vendor Claim Item
- Vendor
- Product Model
- Notification Master
- Defect Master
- User

Roles:
- CS: create claim, upload photos, revise rejected claims, track own claims.
- QRCC: review claims, verify/reject photos, approve claims, generate vendor claims, manage master data.
- Management: monitor analytics and reports.
- Admin: full access plus user management.

Required screens:
1. Login page.
2. CS home with hero notification code input and recent claims.
3. CS claims list.
4. CS create claim wizard with 3 steps:
   - Step 1: notification lookup, product info, serial numbers, defect, conditional vendor fields.
   - Step 2: photo evidence upload based on vendor requirements.
   - Step 3: review summary and submit.
5. CS claim detail page with status, photo gallery, notes, and history.
6. CS revision page highlighting rejected fields/photos and allowing re-upload.
7. Dashboard overview page with KPI cards, trends, and role-based widgets.
8. Claims review list page for QRCC/Admin.
9. Claim review detail page with 3 tabs:
   - Claim Info
   - Photo Review
   - Claim History
10. Vendor claims list page.
11. Vendor claim creation wizard.
12. Vendor claim detail page with item decisions and compensation summary.
13. Master data pages for Vendor, Product Model, Notification, and Defect.
14. Reports dashboard.
15. Audit trail page.
16. User management page for Admin.
17. Settings and security pages.

Important workflow details:
- Claim statuses: DRAFT, SUBMITTED, IN_REVIEW, NEED_REVISION, APPROVED, ARCHIVED.
- Photo statuses: PENDING, VERIFIED, REJECT.
- Vendor claim statuses: DRAFT, CREATED, PROCESSING, COMPLETED.
- CS starts a claim by entering a notification code.
- If notification is found, product data is auto-filled.
- If not found, CS can manually select product model and the system still allows claim creation.
- Vendors have different required photos and fields.
- Claim creation is a wizard with auto-save indicators.
- QRCC reviews each photo individually and can reject with notes.
- If any photo is rejected, the claim becomes NEED_REVISION.
- If all are verified, the claim becomes APPROVED.
- Approved claims can be batched into vendor claims.
- Vendor claim generation is also a 3-step flow.
- Audit/history visibility is important.

Navigation structure:
- Public: /login
- CS: /cs, /cs/claim, /cs/claim/create, /cs/claim/:id, /cs/claim/:id/edit, /cs/profile
- Dashboard: /dashboard, /dashboard/claims, /dashboard/claims/:id, /dashboard/vendor-claims, /dashboard/vendor-claims/create, /dashboard/vendor-claims/:id, /dashboard/master/vendor, /dashboard/master/product-model, /dashboard/master/notification, /dashboard/master/defect, /dashboard/reports, /dashboard/audit-trail, /dashboard/users, /dashboard/settings, /dashboard/settings/security

Design requirements:
- Avoid generic admin template look.
- Use a refined enterprise visual system with strong hierarchy.
- Use sidebar + topbar dashboard shell for dashboard roles.
- Use a simpler but still polished shell for CS area.
- Include reusable patterns: data tables, filter bars, stepper, status badges, KPI cards, timeline, modal forms, drawers, upload zones, lightbox, sticky action bar.
- Make photo review and photo upload UI visually strong and easy to understand.
- Include loading, empty, error, success, disabled, and validation states where relevant.
- Use clear semantic status colors:
  - neutral for draft/inactive
  - blue for submitted/in review
  - amber for revision/attention needed
  - green for approved/verified/completed
  - red for rejected/destructive

Visual direction:
- Internal enterprise operations platform.
- Modern, structured, efficient, and credible.
- Slight industrial-tech / quality-control feel.
- Avoid flat bland layouts.
- Prefer a mature palette such as slate, steel, blue, teal, and amber accents.
- Typography should be clean, readable, and strong for dashboards and forms.
- The design should feel implementation-ready for a Nuxt web app.

Example data hints:
- Vendors: MOKA, MTC, SDP.
- Photo types: CLAIM, CLAIM_ZOOM, ODF, PANEL_SN, WO_PANEL, WO_PANEL_SN.
- Defects: No Display, Vertical Line, Horizontal Line, Broken Panel, Flicker.
- Branches: Jakarta, Bekasi, Bandung, Surabaya.

Output expectation:
- Produce a coherent multi-screen product UI with consistent components and role-aware navigation.
- Focus especially on the claim creation wizard, the claim review detail screen, the vendor claim flow, the reports page, and the master data pattern.
```

---

## 15. SHORT VERSION PROMPT FOR PENCIL.DEV

```text
Design a modern internal web app UI for an RMA Claim System.

This product is used by 4 roles:
- CS: create claim, upload required photos, revise rejected claims, track personal claims.
- QRCC: review claims, verify/reject photos, approve claims, generate vendor claims, manage master data.
- Management: monitor analytics and reports.
- Admin: full access plus user management.

The app has 2 main areas:
- CS workspace: simpler operational shell for claim entry and revision.
- Dashboard workspace: sidebar + topbar admin shell for QRCC, Management, and Admin.

Main workflows:
1. CS enters a notification code to start a claim.
2. Claim wizard has 3 steps:
   - notification/product/defect info
   - photo evidence upload based on vendor requirements
   - review and submit
3. QRCC reviews each photo individually.
4. If any photo is rejected, claim status becomes NEED_REVISION.
5. If all photos are verified, claim becomes APPROVED.
6. Approved claims can be grouped into vendor claim batches.

Important statuses:
- Claim: DRAFT, SUBMITTED, IN_REVIEW, NEED_REVISION, APPROVED, ARCHIVED
- Photo: PENDING, VERIFIED, REJECT
- Vendor Claim: DRAFT, CREATED, PROCESSING, COMPLETED

Required screens:
- Login
- CS home with notification code hero input and recent claims
- CS claims list
- CS claim create wizard
- CS claim detail
- CS claim revision page
- Dashboard overview
- Claims review list
- Claim review detail with 3 tabs: Claim Info, Photo Review, Claim History
- Vendor claims list
- Vendor claim create wizard
- Vendor claim detail
- Master data pages: Vendor, Product Model, Notification, Defect
- Reports dashboard
- Audit trail
- User management
- Settings and security

Design requirements:
- Internal enterprise operations platform, not a generic template.
- Modern, clean, efficient, trustworthy, and implementation-ready.
- Desktop-first but responsive.
- Use strong hierarchy, reusable tables, filter bars, stepper, status badges, KPI cards, timeline, modal/drawer forms, upload zones, and sticky action bars.
- Make photo upload and photo review feel like a first-class workflow.
- Include loading, empty, error, validation, and success states.

Visual direction:
- Slight industrial-tech / quality-control feel.
- Mature palette such as slate, steel, blue, teal, and amber accents.
- Dense enough for operational use, but still clear and breathable.

Example data:
- Vendors: MOKA, MTC, SDP
- Photo types: CLAIM, CLAIM_ZOOM, ODF, PANEL_SN, WO_PANEL, WO_PANEL_SN
- Defects: No Display, Vertical Line, Horizontal Line, Broken Panel, Flicker
- Branches: Jakarta, Bekasi, Bandung, Surabaya

Please create a coherent multi-screen UI system with consistent components and role-aware navigation, with special attention to the claim wizard, claim review detail, vendor claim flow, reports, and master data pages.
```
