# UI Plan

Ringkasan teknis untuk eksekusi desain UI RMA Portal berdasarkan `prd-short.md`, dengan fokus awal pada halaman `/cs` dan `/dashboard`.

## Arah visual

- Gunakan gaya `webapp-01-industrialtechnical_light` sebagai acuan visual utama untuk hierarchy, struktur panel, tipografi tegas, border tajam, dan aksen status yang kuat.
- Nuansa produk: enterprise operations platform yang serius, cepat dipindai, desktop-first, responsif, dan tidak terasa seperti template admin generik.
- Workflow foto, status claim, dan decision state harus selalu jadi elemen yang mudah dikenali.

## Fondasi layout bersama

- Shell utama dibagi menjadi 2 pola: `CS workspace` yang lebih fokus ke task entry, dan `Dashboard workspace` dengan sidebar + topbar untuk area operasional yang lebih luas.
- Gunakan ritme layout tajam: panel border tegas, section header jelas, status badge compact, dan area aksi sticky/selalu terlihat untuk task penting.
- Komponen inti yang harus konsisten lintas halaman: KPI card, filter bar, table padat, stepper, timeline, upload zone, review panel, empty/loading/error state.

## Eksekusi per halaman

### 1. `/cs`

- Tujuan: membantu CS membuat claim baru secepat mungkin dan memonitor claim aktif tanpa distraksi berlebih.
- Struktur layar:
  - hero/task launcher untuk input `notification code`
  - panel ringkasan status claim aktif
  - daftar claim terbaru/perlu revisi
  - panel checklist langkah create claim
- Komponen utama:
  - search/input launcher besar
  - status cards `DRAFT`, `SUBMITTED`, `NEED_REVISION`
  - recent claims table/list
  - progress rail 3 langkah create claim
- State yang perlu disiapkan saat implementasi kode:
  - default kosong sebelum input notification
  - validation error untuk kode invalid
  - success path menuju wizard create
  - empty state saat tidak ada claim aktif

### 2. `/dashboard`

- Tujuan: memberi overview operasional dan jalur cepat ke review claim, vendor claim, report, dan audit.
- Struktur layar:
  - sidebar navigasi role-based
  - topbar berisi date range, search, alert, quick action
  - overview KPI
  - chart/trend operasional
  - work queue prioritas tinggi
  - tabel latest claims / vendor processing
- Komponen utama:
  - KPI cards untuk claim pipeline
  - workload panel untuk review foto dan revisi
  - chart trend claim harian/mingguan
  - activity / audit feed
  - quick links ke claims, vendor claims, reports, master data, user management
- State yang perlu disiapkan saat implementasi kode:
  - loading skeleton untuk KPI dan chart
  - empty state jika tidak ada queue
  - alert state untuk overdue review atau claim stuck

## Rencana halaman berikutnya

- `Login`: akses aman, orientasi produk, status environment.
- `CS Claims List`: filter, sorting, status badge, row action.
- `CS Claim Create Wizard`: 3-step wizard, upload vendor-based, sticky summary.
- `CS Claim Detail`: detail entity, photo evidence, history, action bar.
- `CS Revision Page`: daftar item revisi + reason per foto.
- `Dashboard Claims Review List`: queue-centric data table.
- `Dashboard Claim Review Detail`: tabs `Claim Info`, `Photo Review`, `Claim History`.
- `Vendor Claims`: list, create wizard, detail batch processing.
- `Master Data`: vendor, product model, notification, defect.
- `Reports`, `Audit Trail`, `User Management`, `Settings`, `Security`: fokus data density, filtering, export, dan traceability.

## Catatan implementasi

- Saat translate ke Nuxt UI, prioritaskan reusable page shell, status badge mapping, dan data table pattern agar halaman berikutnya tinggal mengikuti pattern yang sama.
- Pakai token warna/status terpusat agar status claim, photo review, dan vendor claim konsisten di semua area.
- Untuk mobile/tablet, pertahankan hierarchy utama dengan stacking section, sedangkan sidebar dashboard berubah menjadi drawer/collapse.
