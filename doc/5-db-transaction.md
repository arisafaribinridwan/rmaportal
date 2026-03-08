# TRANSACTION TABLES

## 1 Claim

| Kolom          | Tipe    | Constraint                                       | Keterangan       |
| -------------- | ------- | ------------------------------------------------ | ---------------- |
| id             | integer | PK                                               | ID Klaim         |
| claimNumber    | text    | NOT NULL, UNIQUE                                 | Kode Klaim       |
| notificationId | integer | FK -> notificationMaster.id onDelete: 'restrict' | ID Notifikasi    |
| modelId        | integer | FK -> productModel.id onDelete: restrict         | ID/Kode model    |
| vendorId       | integer | FK -> vendor.id onDelete: 'restrict'             | Kode vendor      |
| inch           | integer | NOT NULL                                         | Ukuran inch      |
| branch         | text    | NOT NULL                                         | Nama cabang      |
| odfNumber      | text    |                                                  | Nomor Odf        |
| panelSerialNo  | text    | NOT NULL                                         | Nomor seri panel |
| ocSerialNo     | text    | NOT NULL                                         | Nomor seri oc    |
| defectCode     | text    | FK -> defectMaster.code onDelete: 'restrict'     | Kode kerusakan   |
| version        | text    |                                                  | Nomor versi      |
| week           | text    |                                                  | Kode Week        |
| claimStatus    | text    | NOT NULL                                         | Status Klaim     |
| submittedBy    | text    | FK → user.id (UUID)                              | Id CS            |
| updatedBy      | text    | FK → user.id (UUID)                              | Diupdate oleh    |
| createdAt      | integer | NOT NULL                                         | Waktu dibuat     |
| updatedAt      | integer | NOT NULL                                         | Waktu ada update |

INDEX:
- UNIQUE (claimNumber)
- INDEX (vendorId)
- INDEX (claimStatus)
- INDEX (submittedBy)
- INDEX (vendorId, claimStatus)

📌 CATATAN:
- Generate claimNumber: `CL-{YYYYMMDD}-{Sequence}`
- `branch` adalah snapshot dari `user.branch` || `notificationMaster.branch`
- `CLAIM_STATUSES = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'NEED_REVISION', 'APPROVED', 'ARCHIVED']`
- Claim menggunakan soft delete via `claimStatus = ARCHIVED`

---

## 2 ClaimPhoto

| Kolom         | Tipe    | Constraint                          | Keterangan       |
| ------------- | ------- | ----------------------------------- | ---------------- |
| id            | integer | PK                                  | ID Klaim foto    |
| claimId       | integer | FK -> claim.id onDelete: 'restrict' | Kode Klaim       |
| photoType     | text    | NOT NULL                            | Tipe/nama foto   |
| filePath      | text    | NOT NULL                            | File path foto   |
| thumbnailPath | text    |                                     | Thumbnail path   |
| status        | text    | NOT NULL                            | Status foto      |
| rejectReason  | text    |                                     | Catatan reject   |
| createdAt     | integer | NOT NULL                            | Waktu dibuat     |
| updatedAt     | integer | NOT NULL                            | Waktu ada update |

INDEX:
- UNIQUE (claimId, photoType)
- INDEX (claimId)

Photo Upload API:
- File Storage: `./public/uploads/claims/`
- Unique filename: `{claimId}_{photoType}_{timestamp}.jpg`
- Nuxt/H3: Use `readMultipartFormData`
- Validasi File:
  ```typescript
  const ALLOWED_TYPES = ['image/jpeg', 'image/png']
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  ```
- Security: sanitize filename, prevent directory traversal
- Thumbnail: 300×300px menggunakan library `sharp`
- `enum photoType = ["CLAIM", "CLAIM_ZOOM", "ODF", "PANEL_SN", "WO_PANEL", "WO_PANEL_SN"]`
- `enum status = ['PENDING', 'VERIFIED', 'REJECT']` (default: `'PENDING'`)

---

## 3 VendorClaim

| Kolom          | Tipe    | Constraint       | Keterangan                             |
| -------------- | ------- | ---------------- | -------------------------------------- |
| id             | integer | PK               | ID vendor klaim                        |
| vendorClaimNo  | text    | UNIQUE           | No klaim vendor                        |
| vendorId       | integer | FK -> vendor.id  | Kode vendor                            |
| submittedAt    | integer | NOT NULL         | Waktu kirim ke vendor (Unix timestamp) |
| reportSnapshot | text    | NOT NULL         | Snapshot JSON data klaim               |
| status         | text    | NOT NULL         | Status vendor claim                    |
| createdBy      | text    | FK → user.id (UUID)     | Dibuat oleh                            |
| updatedBy      | text    | FK → user.id (UUID)     | Diupdate oleh                          |
| createdAt      | integer | NOT NULL         | Waktu dibuat                           |
| updatedAt      | integer | NOT NULL         | Waktu ada update                       |

📌 CATATAN:
- `enum status = ['DRAFT', 'CREATED', 'PROCESSING', 'COMPLETED']`
- Generate `vendorClaimNo`: `VC-{YYYYMMDD}-{Sequence}`

---

## 4 VendorClaimItem

| Kolom            | Tipe    | Constraint                               | Keterangan                       |
| ---------------- | ------- | ---------------------------------------- | -------------------------------- |
| id               | integer | PK                                       | ID item klaim vendor             |
| vendorClaimId    | integer | FK -> vendorClaim.id onDelete: 'cascade' | ID klaim vendor                  |
| claimId          | integer | FK -> claim.id onDelete: 'restrict'      | ID klaim                         |
| vendorDecision   | text    | NOT NULL                                 | Keputusan vendor                 |
| compensation     | integer |                                          | Kompensasi (jika ACCEPTED)       |
| rejectReason     | text    |                                          | Alasan reject (jika REJECTED)    |
| vendorDecisionBy | text    | FK → user.id (UUID)                        | Dibuat oleh                      |
| vendorDecisionAt | integer |                                          | Waktu keputusan (Unix timestamp) |
| createdAt        | integer | NOT NULL                                 | Waktu dibuat                     |
| updatedAt        | integer |                                          | Waktu ada update                 |

📌 CATATAN:
- `enum vendorDecision = ['PENDING', 'ACCEPTED', 'REJECTED']`
- `rejectReason` wajib diisi jika `vendorDecision = REJECTED`

---

## 5 ClaimHistory

| Kolom      | Tipe    | Constraint                            | Keterangan       |
| ---------- | ------- | ------------------------------------- | ---------------- |
| id         | integer | PK                                    | ID klaim histori |
| claimId    | integer | FK -> claim.id onDelete: 'restrict'   | id claim         |
| action     | text    | NOT NULL                              | Jenis aksi       |
| fromStatus | text    | NOT NULL                              | status awal      |
| toStatus   | text    | NOT NULL                              | status akhir     |
| userId     | text    | FK → user.id (UUID)                   | ID User          |
| userRole   | text    | NOT NULL                              | snapshot role    |
| note       | text    |                                       | catatan          |
| createdAt  | integer | NOT NULL                              | Waktu dibuat     |

INDEX:
- INDEX (claimId)
- INDEX (userId)

📌 CATATAN:
- `enum action` merujuk pada `CLAIM_HISTORY_ACTIONS` di [Section 6](#6-constants--types)

---

## 6 PhotoReview

| Kolom        | Tipe    | Constraint                               | Keterangan                    |
| ------------ | ------- | ---------------------------------------- | ----------------------------- |
| id           | integer | PK                                       | ID foto review                |
| claimPhotoId | integer | FK -> claimPhoto.id onDelete: 'restrict' | Kode Klaim                    |
| reviewedBy   | text    | FK → user.id (UUID)                      | Di review oleh                |
| status       | text    | NOT NULL                                 | VERIFIED / REJECT             |
| rejectReason | text    |                                          | Catatan reject                |
| reviewedAt   | integer | NOT NULL                                 | Waktu review (Unix timestamp) |

INDEX:
- INDEX (claimPhotoId)
- INDEX (reviewedBy)

📌 CATATAN:
- `enum status` merujuk pada `CLAIM_PHOTO_STATUSES` di [Section 6](#6-constants--types)

---

## 7 SequenceGenerator

| Kolom        | Tipe    | Constraint | Keterangan                       |
| ------------ | ------- | ---------- | -------------------------------- |
| id           | integer | PK         | ID sequence                      |
| type         | text    | NOT NULL   | CLAIM / VENDOR_CLAIM             |
| currentDate  | text    | NOT NULL   | Format YYYYMMDD                  |
| lastSequence | integer | NOT NULL   | Nomor urut terakhir (default: 0) |

INDEX:
- UNIQUE (type, currentDate)

📌 CATATAN:
- `enum type` merujuk pada `SEQUENCE_TYPES` di [Section 6](#6-constants--types)
- Digunakan untuk generate `CL-{YYYYMMDD}-{Sequence}` dan `VC-{YYYYMMDD}-{Sequence}`
- Reset sequence otomatis per hari (berdasarkan currentDate)