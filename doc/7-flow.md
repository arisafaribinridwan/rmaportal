# FLOW SISTEM

## 1. Flow CS — Form Claim RMA

🟢 **Kondisi Awal**
- CS sudah login, Role = CS
- Di halaman index CS ada input field untuk memasukan **Notification Code**

#### Entry Point: Halaman Create Claim

1. CS ketik notification code di input field hero section
2. CS klik enter/tombol "Start Claim"
3. **Sistem redirect ke `/cs/claim/create?notification=<code>`**
4. Sistem melakukan lookup ke tabel `notification`

> **Catatan:** URL menyimpan `notificationCode` sebagai query param sehingga halaman bisa di-refresh tanpa kehilangan context awal.

---

#### 📝 Multi-Step Form Wizard (3 Steps)

##### Step 1: Notification & Defect Information

> Combined dari Step 1 & 2 untuk mempercepat input

**1.1 Notification Lookup Result**

**✅ Jika Notification DITEMUKAN:**
- Alert success: "Notification ditemukan"
- Data terisi otomatis (read-only): `notificationCode`, `productModelId`, `inch`, `vendorId`, `branch` (dari `notification.branch`)

**❌ Jika Notification TIDAK DITEMUKAN:**
- Alert info: "Notification tidak ditemukan, isi manual"
- CS mengisi `modelName` dengan **autocomplete** (dari tabel `ProductModel`)
- Jika model dipilih, auto-fill: `vendorId`, `inch`, `branch` (dari `profile.branch`)
- Sistem *auto-generate* NotificationMaster record saat Claim disubmit

**1.2 Serial Numbers & Defect Info**

CS mengisi: `panelSerialNo`, `ocSerialNo`, `defect` (dropdown dari DefectMaster)

**1.3 Conditional Fields (Vendor-specific)**

Berdasarkan `VendorFieldRule`, field berikut muncul/hilang:
- `odfNumber` → jika vendor membutuhkan
- `version` → jika vendor membutuhkan
- `week` → jika vendor membutuhkan

**1.4 Auto-save saat klik "Next" ke Step 2:**
- Jika `notificationCode` manual → auto-insert ke `NotificationMaster` dengan status `USED`
- Auto-save claim draft (status: `DRAFT`)
- Visual indicator: "Auto-saved ✓"

---

##### Step 2: Photo Evidence

**Sistem menampilkan upload zones berdasarkan VendorPhotoRule:**

| Vendor   | CLAIM | CLAIM_ZOOM | ODF | PANEL_SN | WO_PANEL | WO_PANEL_SN |
| -------- | ----- | ---------- | --- | -------- | -------- | ----------- |
| **MOKA** | ✅     | ✅          | ✅   | ✅        | ✅        | ✅           |
| **MTC**  | ✅     | ✅          | ✅   | ✅        | ❌        | ❌           |
| **SDP**  | ✅     | ✅          | ✅   | ✅        | ❌        | ❌           |

**Fitur Upload:**
- ✅ Drag & Drop Support
- ✅ Real-time Preview (thumbnail + lightbox zoom)
- ✅ Upload Progress (progress bar per foto)
- ✅ Smart Validation (max 5MB, JPG/PNG only)
- Status foto initial: `PENDING`; bisa re-upload selama belum `APPROVED`

**Auto-save saat klik "Next" ke Step 3**

---

##### Step 3: Review & Submit

**Sistem menampilkan summary semua data (read-only):** Notification Info, Defect Info, Photo Evidence

**Actions:**
- Button "Edit" → kembali ke step sebelumnya
- Button "Save as Draft" (manual save)
- Button "Submit to QRCC" (primary action)

**Submit Validation:**
1. ✅ Semua field wajib vendor terisi
2. ✅ Semua foto wajib vendor sudah di-upload
3. ✅ Tidak ada error format

**Jika valid:**
- `claimStatus → SUBMITTED`
- Record `ClaimHistory` dibuat: `action = SUBMIT`, `actorRole = CS`
- Redirect ke `/cs` + success toast

**Jika invalid:**
- Error message dengan detail field yang belum valid

---

#### Aksi CS berdasarkan Status Klaim

| Status Klaim  | Aksi CS                       | Auto-save         |
| ------------- | ----------------------------- | ----------------- |
| DRAFT         | Edit bebas, save kapan saja   | ✅ Per step change |
| SUBMITTED     | Read-only, view status        | ❌                 |
| NEED_REVISION | Edit terbatas (item rejected) | ✅ Per step change |
| APPROVED      | Read-only, export PDF         | ❌                 |
| ARCHIVED      | Read-only                     | ❌                 |

---

#### 🔧 Revision Flow

**Jika Klaim NEED_REVISION:**

1. `claimStatus → NEED_REVISION`, foto ditolak → `photoStatus → REJECTED`
2. Dashboard CS menampilkan badge "Need Revision"
3. CS klik claim → redirect ke `/cs/claim/:id/edit`

**Revision Interface:**
- 🔴 Red badge pada field/foto yang di-reject
- 💬 QRCC notes displayed prominently
- Side-by-side comparison: foto lama (rejected) vs upload zone baru
- Tombol "Submit Revision" disabled sampai semua item fixed

**Submit Revision:**
1. CS klik "Submit Revision"
2. `claimStatus → SUBMITTED`
3. `ClaimHistory`: `action = REVISION_SUBMIT`, `actorRole = CS`

---

## 2. Flow QRCC — Review Claim RMA

🟢 **Kondisi Awal**
- QRCC sudah login, Role = QRCC (atau ADMIN)
- Di `/dashboard/claims` tersedia daftar klaim dengan status `SUBMITTED`

#### Review Klaim

**1. Buka Detail Klaim**

Saat QRCC klik klaim:
- Redirect ke `/dashboard/claims/:id`
- `claimStatus → IN_REVIEW` (otomatis)
- `ClaimHistory`: `action = START_REVIEW`, `fromStatus = SUBMITTED`, `toStatus = IN_REVIEW`

**2. Layout Halaman Review (3 Tab)**

```
TAB 1: Claim Info (sebagian editable)
TAB 2: Photo Review
TAB 3: Claim History (audit trail read-only)
```

**3. TAB 1 — Claim Info**

Field READ-ONLY: `notificationCode`, `notificationDate`, `modelName`, `inch`, `vendorId`, `branch`

Field EDITABLE oleh QRCC:

| Field           | Tipe Input      | Keterangan              |
| --------------- | --------------- | ----------------------- |
| `panelSerialNo` | text            | Serial panel            |
| `ocSerialNo`    | text            | Serial OC               |
| `defect`        | autocomplete    | Dari DefectMaster       |
| `odfNumber`     | text (opsional) | Jika vendor membutuhkan |
| `version`       | text (opsional) | Jika vendor membutuhkan |
| `week`          | text (opsional) | Jika vendor membutuhkan |

> Perubahan data QRCC tidak mengubah status klaim. Status tetap `IN_REVIEW`.

**4. TAB 2 — Photo Review**

QRCC mereview setiap foto: pilih **VERIFIED** atau **REJECT** (jika REJECT: wajib isi catatan)

Record `PhotoReview` dibuat per foto: `claimPhotoId`, `reviewedBy`, `status`, `note`, `reviewedAt`

**5. Submit Review**

Tombol "Selesai Review" aktif saat semua foto sudah direview.

```
Jika ada foto REJECTED:
  → claimStatus = NEED_REVISION
  → Update ClaimPhoto.status = REJECTED
  → ClaimHistory: action = REJECT, toStatus = NEED_REVISION
  → Notifikasi muncul di dashboard CS pemilik klaim

Jika semua foto VERIFIED:
  → claimStatus = APPROVED
  → Update ClaimPhoto.status = VERIFIED (semua)
  → ClaimHistory: action = APPROVE, toStatus = APPROVED
```

**Aksi QRCC berdasarkan Status:**

| Status Klaim  | Aksi QRCC                                  |
| ------------- | ------------------------------------------ |
| SUBMITTED     | Buka detail → auto IN_REVIEW               |
| IN_REVIEW     | Edit field tertentu, review foto, submit   |
| NEED_REVISION | Read-only, tunggu revisi CS                |
| APPROVED      | Read-only, bisa dimasukkan ke Vendor Claim |
| ARCHIVED      | Read-only                                  |

---

## 3. Alur Vendor Claim

**1. Generate Vendor Claim (Wizard 3 Step)**

Entry point: `/dashboard/vendor-claims/create`

**Step 1 — Pilih Vendor & Filter Klaim**
- QRCC pilih **Vendor** dan **Filter periode** (opsional)
- Sistem tampilkan daftar klaim `APPROVED` yang belum masuk Vendor Claim, filtered by vendor

**Step 2 — Checklist Klaim**
- QRCC centang klaim yang akan dimasukkan ke batch
- "Select All" tersedia; minimal 1 klaim harus dipilih

**Step 3 — Preview & Generate**

Saat QRCC klik "Generate Vendor Claim":
1. Buat record `VendorClaim`: `vendorClaimNo = VC-{YYYYMMDD}-{Sequence}`, `status = CREATED`
2. Buat record `VendorClaimItem` per klaim: `vendorDecision = PENDING`
3. **File Excel auto-generate & download** (data klaim + link foto)
4. Redirect ke `/dashboard/vendor-claims/:id`

> Pengiriman file Excel ke vendor dilakukan **manual di luar sistem**.

**2. Input Keputusan Vendor (Per Item)**

Modal per item:
- `vendorDecision`: ACCEPTED / REJECTED
- `compensation`: nominal integer (wajib jika ACCEPTED)
- `rejectReason`: text (wajib jika REJECTED)
- `vendorDecisionAt`: timestamp otomatis

Auto-kalkulasi status VendorClaim:
```
Masih ada item PENDING  → status = PROCESSING
Semua item terisi       → status = COMPLETED
```

**Status VendorClaim:**

| Status     | Kondisi                                        |
| ---------- | ---------------------------------------------- |
| CREATED    | Baru di-generate, belum ada keputusan vendor   |
| PROCESSING | Ada sebagian keputusan vendor yang sudah diisi |
| COMPLETED  | Semua item sudah ada keputusan vendor          |

---

## 4. Master Data Management

| Master Data   | URL                               | Fitur Khusus                              |
| ------------- | --------------------------------- | ----------------------------------------- |
| Vendor        | `/dashboard/master/vendor`        | Toggle active/inactive, editor JSON rules |
| Product Model | `/dashboard/master/product-model` | Filter by vendor                          |
| Notification  | `/dashboard/master/notification`  | Input manual + **Import Excel**           |
| Defect Master | `/dashboard/master/defect`        | Toggle active/inactive                    |

**Import NotificationMaster (Excel):**
1. QRCC klik "Import Excel"
2. Upload file Excel (template tersedia)
3. Sistem preview + highlight baris error
4. QRCC konfirmasi → insert/update ke database
5. Summary: "X berhasil diimport, Y gagal"

Template Excel kolom: `notificationCode | notificationDate | modelName | branch | vendorId`