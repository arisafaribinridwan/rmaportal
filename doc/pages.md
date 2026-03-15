# Daftar Halaman RMA Portal

## Public / Auth

| Pages | URL | Fitur |
| ----- | --- | ----- |
| Login | `/login` | Form login dengan field email & password, validasi Zod, error alert, branding section kiri (judul, deskripsi, feature highlights), dark mode toggle, redirect otomatis sesuai role setelah login |
| Index (Redirect) | `/` | Halaman redirect otomatis ke halaman sesuai role user |

## CS (Customer Service) — Layout: `cs`

| Pages | URL | Fitur |
| ----- | --- | ----- |
| CS Home | `/cs` | Hero section dengan input field notification number dan button "Search" untuk membuat claim RMA baru, badge "System Online", deskripsi sistem |
| CS Claim List | `/cs/claim` | Tabel daftar claim milik CS (kolom: Claim ID, Notification Code, Model Name, Status, Created At, Actions), search by notification code, filter status (Draft/Submitted/In Review/Need Revision/Approved/Archived), pagination, button "New Claim", empty state |
| CS Claim Create | `/cs/claim/create` | Wizard 3 langkah: **Step 1** - lookup notification (search + select), form defect info (model, inch, branch, vendor, panel SN, OC SN, defect type, vendor required fields: ODF number/version/week), **Step 2** - upload foto evidence (dynamic berdasarkan vendor config, drag/drop zone, file preview, remove file), **Step 3** - review summary (report summary, defect summary, evidences list), button Save as Draft & Submit to QRCC |
| CS Claim Detail | `/cs/claim/[id]` | Detail claim read-only dengan tabs (Claim Overview), info notification (code, model, branch, created at), defect details (panel SN, OC SN), status badge, button "Revise Claim" jika status NEED_REVISION, back button ke claim list |
| CS Claim Edit (Revise) | `/cs/claim/[id]/edit` | Form revisi claim untuk status NEED_REVISION: alert revision note dari QRCC, revision history timeline, context read-only (notification, model, vendor, branch), form edit defect info (panel SN, OC SN, defect type, vendor required fields), photo evidence section (verified foto read-only, rejected foto wajib re-upload, pending foto read-only), textarea revision note, button Submit Revision |

## Dashboard — Layout: `dashboard` (sidebar collapsible + resizable)

### Home & Overview

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Dashboard Home | `/dashboard` | All | Navbar dengan notification bell, toolbar dengan date range picker & period selector (daily/weekly/monthly), stats cards (HomeStats), chart trend (HomeChart client/server), latest activity/sales (HomeSales) |

### Claims Management

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Claims List | `/dashboard/claims` | QRCC, ADMIN | Tabel semua claim (kolom: Claim Number, Vendor, Model, Branch, Date Created, Status, Actions), search keyword (claim no, panel SN, OC SN), filter status (Submitted/In Review/Need Revision/Approved), server-side pagination, button refresh |
| Claim Detail | `/dashboard/claims/[id]` | QRCC, ADMIN | Detail claim lengkap dengan 3 tabs: **Ringkasan** (notification info + defect details), **Foto Review** (grid foto dengan badge status PENDING/VERIFIED/REJECT, button Verify & Reject per foto, reject memerlukan alasan), **History** (tabel audit trail: date, action, role, notes, status), header actions: button "Need Revision" & "Approve Claim" (disabled jika masih ada foto pending) |

### Vendor Claims

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Vendor Claims List | `/dashboard/vendor-claims` | QRCC, ADMIN | Tabel vendor claims (kolom: VC Number, Vendor, Submitted, Status, Created, Actions), filter status (Created/Processing/Completed), pagination server-side, button "Create Vendor Claim", button refresh |
| Vendor Claim Detail | `/dashboard/vendor-claims/[id]` | QRCC, ADMIN | Summary cards (vendor, status, submitted date, total items), tabel claim items (kolom: Claim No, Serial Numbers, Defect, Decision, Details, Actions), modal input vendor decision (select ACCEPTED/REJECTED, input compensation jika accepted, textarea reject reason jika rejected), validasi Zod |
| Vendor Claim Create | `/dashboard/vendor-claims/create` | QRCC, ADMIN | Wizard 3 langkah: **Step 1** - pilih vendor (dropdown vendor aktif), **Step 2** - checklist klaim APPROVED milik vendor (select all, scrollable list dengan info panel SN/OC SN/branch/defect/inch/ODF/version/week), **Step 3** - review & generate (info vendor, ringkasan total klaim/branch/jenis defect, tabel klaim terpilih, info box tentang auto-generate Excel), button Generate Vendor Claim |

### Master Data

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Master Vendor | `/dashboard/master/vendor` | QRCC, ADMIN | CRUD tabel vendor (kolom: select, ID, Code, Name, Required Photos, Required Fields, Status, Actions), search by name, filter status (Active/Inactive), column visibility toggle, row actions dropdown (copy code, edit, activate/deactivate), modal add/edit/delete, pagination |
| Master Product Model | `/dashboard/master/product-model` | QRCC, ADMIN | CRUD tabel product model (kolom: select, ID, Name sortable, Inch, Vendor Name, Status, Actions), search by name, filter status, column visibility toggle, row actions dropdown (copy name, edit, activate/deactivate), modal add/edit/delete, pagination |
| Master Notification | `/dashboard/master/notification` | QRCC, ADMIN | CRUD tabel notification (kolom: select, ID, Notification Code sortable, Date, Product Model, Branch, Vendor Name, Status, Actions), search by code, filter status (New/Used/Expired), column visibility toggle, row actions dropdown (copy code, edit, expire), button Import Excel (coming soon), modal add/edit/delete, pagination |
| Master Defect | `/dashboard/master/defect` | QRCC, ADMIN | CRUD tabel defect (kolom: select, ID, Code, Defect Name sortable, Status, Actions), search by name, filter status (Active/Inactive), column visibility toggle, row actions dropdown (copy code, edit, activate/deactivate), modal add/edit/delete, pagination |

### Reports & Audit

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Reports | `/dashboard/reports` | All | Claim Status Report: filter date range (from/to), filter status, filter vendor, filter branch (auto-locked untuk role MANAGEMENT), summary cards (Total Claims, Draft, Submitted, In Review, Need Revision, Approved, Archived), tabel detail report (kolom: Claim Number, Vendor, Model, Notification, Branch, Status, Submitted By, Created At), server-side pagination, button Export CSV, button refresh |
| Audit Trail | `/dashboard/audit-trail` | QRCC, ADMIN | Tabel audit trail (kolom: Date & Time, Action, Claim No, User Role, Notes, New Status), search by claim no / user ID, filter action (CREATE/UPDATE/SUBMIT/UPLOAD_PHOTO/VERIFY_PHOTO/APPROVE), server-side pagination, button Export CSV, button refresh |

### User Management

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Users | `/dashboard/users` | ADMIN | Tabel user management (kolom: Name sortable, Email, Username, Role badge, Branch, Status Active/Inactive, Created, Actions dropdown), search by name, filter status (Active/Inactive), modal create user, modal change role, modal activate/deactivate user (disabled untuk diri sendiri), pagination, button refresh |

### Settings

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Settings (Layout) | `/dashboard/settings` | All | Navigation tabs: General, Security. Sub-page router |
| Settings General | `/dashboard/settings` | All | Profile read-only: Name, Email, Username, Role badge, Branch. Semua field disabled (managed by admin) |
| Settings Security | `/dashboard/settings/security` | All | Form change password: current password, new password, confirm new password, validasi (min 8 char, new ≠ current, confirm = new), error alert, success toast |
| Settings Members | `/dashboard/settings/members` | All | Daftar members dengan search, button "Invite people", list members component |
| Settings Notifications | `/dashboard/settings/notifications` | All | Toggle notification preferences: channels (Email, Desktop), account updates (Weekly digest, Product updates, Important updates) dengan USwitch |
