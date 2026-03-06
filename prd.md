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