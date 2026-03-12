- [x] **#26** Vendor Claim Generate (Backend) — Seleksi klaim APPROVED
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

ref: 
## Alur Vendor Claim

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


- [ ] **#28** Vendor Decision Input (Backend & Frontend) — Input ACCEPTED/REJECTED
  - Module target backend: endpoint keputusan vendor
  - Module target frontend: halaman/detail vendor claim
  - Checklist teknis lanjutan:
    - Definisikan payload keputusan per item claim
    - Simpan tanggal dan user input keputusan
    - Update status vendor claim aggregate
    - Tampilkan hasil accepted/rejected di UI