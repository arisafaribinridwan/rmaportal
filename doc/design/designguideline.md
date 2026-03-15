# Design Guideline

## Overview

Design system ini diarahkan untuk project RMA Portal sebagai refined enterprise interface yang tegas, presisi, dan energik. Tampilan harus menghindari kesan generic admin template, dengan hierarchy yang kuat, bentuk elemen tajam tanpa radius, dan warna primary yang cerah untuk mencerminkan semangat dan passion.

Guideline ini dibatasi pada tiga area utama:
- Font
- Colors
- Style

---

## Font

### Font Family

- Primary font: `Sora`
- Secondary/data font: `IBM Plex Sans`
- Fallback: `ui-sans-serif, system-ui, sans-serif`

### Penggunaan Font

Gunakan `Sora` untuk:
- Page title
- Heading
- Navigation
- Button
- Section label utama

Gunakan `IBM Plex Sans` untuk:
- Tabel
- Angka
- Metadata
- Claim number
- Notification code
- Status log
- Timestamp
- Konten form yang padat data

### Karakter Tipografi

- `Sora` memberi kesan modern, firm, dan premium
- `IBM Plex Sans` menjaga keterbacaan tinggi untuk area yang data-heavy
- Kombinasi ini cocok untuk platform enterprise yang serius tetapi tetap kontemporer

### Type Scale

- `34px / 42px / 700` untuk page title utama
- `26px / 34px / 700` untuk section heading besar
- `20px / 28px / 600` untuk sub-section heading
- `16px / 24px / 600` untuk group title atau emphasized body
- `14px / 22px / 400-500` untuk body text default
- `13px / 18px / 600` untuk label, table header, helper penting
- `12px / 16px / 500-600` untuk caption, badge, audit meta

### Typography Rules

- Hierarchy harus jelas dan kontras, tidak datar seperti dashboard template umum
- Heading menggunakan bobot tegas dan spacing rapat agar terasa solid
- Body text harus efisien dan mudah dipindai
- Data penting seperti `claimNumber`, `notificationCode`, nominal, status, dan waktu menggunakan `IBM Plex Sans`
- Uppercase hanya digunakan untuk badge pendek, overline, atau status singkat
- Hindari font yang terlalu playful, terlalu humanist, atau terlalu dekoratif

---

## Colors

Palet warna diarahkan untuk enterprise system yang kuat, optimistis, dan penuh energi. Warna utama harus tampil cerah dan percaya diri, tanpa kehilangan kesan profesional.

### Core Palette

- `Primary`: `#FF5A1F`
- `Primary Hover`: `#E14D16`
- `Primary Active`: `#C84312`
- `Primary Soft`: `#FFF1EB`

- `Secondary`: `#1F2A37`
- `Secondary Soft`: `#E9EEF3`

- `Accent`: `#FFB000`
- `Accent Soft`: `#FFF6DB`

- `Background Base`: `#F4F6F8`
- `Surface`: `#FFFFFF`
- `Surface Alt`: `#ECEFF3`
- `Border`: `#C9D2DC`

- `Text Primary`: `#111827`
- `Text Secondary`: `#4B5563`
- `Text Muted`: `#7B8794`
- `Text Inverse`: `#FFFFFF`

### Alasan Pemilihan Primary Color

- `#FF5A1F` terasa terang, aktif, dan penuh dorongan
- Tidak jatuh ke ungu startup, biru korporat generik, atau hijau fintech
- Cocok untuk sistem claim dan review yang membutuhkan energi visual tanpa kehilangan seriousness
- Memberi identitas visual yang lebih berani dan mudah diingat

### Semantic Colors

- `Success`: `#1F9D55`
- `Success Soft`: `#E9F8EF`

- `Warning`: `#D9822B`
- `Warning Soft`: `#FFF4E8`

- `Danger`: `#D64545`
- `Danger Soft`: `#FDECEC`

- `Info`: `#1D7AF2`
- `Info Soft`: `#EAF3FF`

- `Review`: `#B7791F`
- `Review Soft`: `#FFF1D6`

### Status Mapping

- `DRAFT`: background `#ECEFF3`, text `#4B5563`
- `SUBMITTED`: background `#EAF3FF`, text `#1D7AF2`
- `IN_REVIEW`: background `#FFF1D6`, text `#B7791F`
- `NEED_REVISION`: background `#FFF4E8`, text `#D9822B`
- `APPROVED`: background `#E9F8EF`, text `#1F9D55`
- `ARCHIVED`: background `#E5EAF0`, text `#667085`

Untuk review foto:
- `PENDING`: netral terang
- `VERIFIED`: hijau
- `REJECT`: merah tegas

Untuk vendor claim:
- `CREATED`: biru
- `PROCESSING`: amber
- `COMPLETED`: hijau tua

### Color Usage Rules

- Warna cerah digunakan secara strategis, bukan tersebar merata di seluruh layar
- `Primary` harus dominan pada CTA, active state, progress emphasis, dan elemen penting
- Area konten utama tetap netral agar data dan bukti foto tetap menjadi fokus
- Hindari penggunaan terlalu banyak warna dalam satu layar
- Jangan gunakan abu-abu berlebihan hingga tampilan terasa seperti admin template default

---

## Style

### Style Direction

- Gaya UI: `sharp enterprise interface`
- Karakter visual: `structured`, `crisp`, `confident`, `minimal but assertive`
- Interface harus terasa engineered dan intentional, bukan soft consumer app
- Layout harus memiliki blok yang jelas, alignment rapat, dan pembagian section yang kuat

### Shape

- Semua komponen utama menggunakan `0px radius`
- Jika pelunakan sangat dibutuhkan, maksimal `2px`, tetapi bukan default
- Button, input, card, modal, table container, dan badge harus memakai sudut tegas
- Bentuk tajam ini menjadi pembeda utama dari gaya SaaS template yang terlalu rounded

### Borders and Surfaces

- Gunakan border yang jelas dan konsisten untuk membangun struktur visual
- Card tidak perlu terasa floating; tampilkan sebagai panel kerja yang solid
- Shadow sangat minimal atau hampir tidak ada
- Separation lebih banyak dibangun lewat border, contrast surface, spacing, dan hierarchy tipografi
- Surface harus tetap clean, tetapi tidak terasa flat dan membosankan

### Visual Hierarchy

- Heading harus terasa dominan sejak pertama halaman dibuka
- CTA utama harus langsung terlihat dengan warna brand yang cerah
- Status dan decision state harus dapat dipindai dalam sekali lihat
- Tabel, form, dan review panel harus memiliki pembagian area yang kuat
- Halaman tidak boleh terasa seperti grid kartu generik; harus memiliki ritme dan prioritas yang jelas

### Component Style Direction

- Button primary: solid `Primary`, tajam, kontras tinggi
- Button secondary: putih atau abu terang dengan border tegas
- Destructive button: merah solid atau soft red dengan border jelas
- Badge status: flat, sharp, compact, high-legibility
- Input field: square, bordered, focus ring jelas dengan aksen primary
- Table: dense, rigid, highly scannable, dengan header kuat dan row divider jelas
- Upload dan photo review area: panel tegas dengan state border yang jelas, bukan dropzone rounded generik

### Interaction Feel

- Transisi cepat dan presisi, sekitar `120-180ms`
- Hover subtle tetapi firm
- Focus state wajib sangat jelas, terutama untuk workflow form-heavy
- State penting harus muncul melalui kombinasi shape, label, dan color, bukan warna saja

### Style Keywords

- `refined enterprise`
- `sharp`
- `high-authority`
- `energetic`
- `precise`
- `non-generic`
- `industrial modern`
