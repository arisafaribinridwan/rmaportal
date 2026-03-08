# USER-AUTH INTEGRATION

## 1. Ringkasan

Sistem manajemen user menggunakan **Better-Auth** sebagai sistem utama yang menangani autentikasi sekaligus menyimpan data bisnis. Tabel `profile` telah dihapus dan digabungkan ke dalam tabel `user` bawaan Better-Auth.

## 2. Arsitektur Integration

**Struktur Tabel User:**
```
user (Better-Auth)
┌──────────────────────────┐
│ id (TEXT/UUID)           │ ◀─ Primary Key
│ name                     │
│ email                    │
│ password (via account)   │
│ ...                      │
│ role (Business Data)     │
│ branch (Business Data)   │
│ isActive (Business Data) │
└──────────────────────────┘
```

- Semua relasi di tabel lain (seperti `Claim`, `ClaimHistory`) langsung menggunakan `userId` yang bertipe `TEXT` (UUID) berelasi langsung dengan `user.id`.
- Penggabungan data bisnis (seperti `role`, `branch`, dan `isActive`) dilakukan sebagai ekstensi tabel/plugin dari Better-Auth.

## 3. Cara Kerja Integration

**1. User Registration Flow (via Admin)**
```
1. Admin membuat user baru melalui fitur Admin panel/API terpisah
2. API Better-Auth dipanggil untuk membuat akun (email, password default)
3. Data bisnis (role, branch, isActive) langsung disimpan pada tabel user di saat bersamaan
```

**2. User Login Flow**
```
1. User login dengan email & password
2. Better-Auth memvalidasi kredensial
3. Mengembalikan objek User yang di dalamnya sudah mencakup profil lengkap (role, branch, isActive) karena tergabung dalam satu tabel.
```

**3. User Management**
```
1. Update Business Data → langsung mengubah kolom `branch`, `role`, di tabel `user`.
2. Delete User → Menggunakan metode Soft Delete (merubah `isActive = false`) agar integritas data constraint pada `ClaimHistory` dsb tetap terjaga.
```

## 4. Validation & Security

**Database Level:**
- Semua *Foreign Key* ke entitas user menggunakan tipe data UUID/`TEXT` yang langsung menuju `user.id`.

**Application Level:**
- ✅ Active Check: Setiap operasi sistem mensyaratkan `isActive = true` baik untuk login maupun backend operation.
- ✅ Role Validation: Menggunakan enum bawaan bisnis (`ADMIN`, `CS`, `QRCC`, `MANAGEMENT`).

## 5. Usage Examples

```typescript
// Mendapatkan session user lengkap (Auth + Business fields)
const session = await authClient.getSession();
const user = session?.user;
// Output struct: { id, email, name, role, branch, isActive, ... }

// Melakukan manipulasi data di internal service (contoh menggunakan Drizzle)
await db.update(userTable)
  .set({ role: 'QRCC', branch: 'Surabaya' })
  .where(eq(userTable.id, 'id-better-auth'));
```

---

## 6. AUTH MIDDLEWARE & ROUTE PROTECTION

### 6.1 API Route Handler

Endpoint auth (seperti login, logout, get-session) di-handle oleh Better Auth.
- **Route**: `server/api/auth/[...all].ts`
- **Fungsi**: Mem-pass request H3 ke Better-Auth handler menggunakan `toWebRequest()`.

### 6.2 Client Route Protection (Nuxt Middleware)

Route protection ditangani murni pada sisi klien/Nuxt menggunakan `defineNuxtRouteMiddleware`. Untuk menghindari inkonsistensi hydration di SSR Nuxt, pengecekan `session` di-skip pada instance server (`import.meta.server`) dan pengecekan dilakukan langsung dengan `authClient.getSession()`.

**Daftar Middleware:**

1. **`auth.global.ts` (Global)**
   - Berjalan di setiap pergantian rute.
   - Jika user **belum login** dan mengakses rute selain `/login`, maka di-redirect ke `/login`.
   - Jika user **sudah login** dan mengakses `/login`, maka di-redirect berdasarkan role:
     - Role **CS** → `/cs`
     - Role **QRCC/MANAGEMENT/ADMIN** → `/dashboard`

2. **`cs.ts` (Named Middleware)**
   - Diterapkan pada halaman di bawah `/cs/*`.
   - **Aturan**: Hanya user dengan role `CS` yang diizinkan. Jika role lain mencoba mengakses, akan di-redirect ke `/dashboard`.

3. **`dashboard.ts` (Named Middleware)**
   - Diterapkan pada halaman di bawah `/dashboard/*`.
   - **Aturan**: Hanya user dengan role `QRCC`, `MANAGEMENT`, atau `ADMIN` yang diizinkan. Jika role `CS` mencoba mengakses, akan di-redirect ke `/cs`.

### 8.3 Server-Side Auth Helpers

Pada file internal server (`server/utils/auth-helpers.ts`), data pengguna dan role dibaca langsung dari `session.user` (Better-Auth):
- `getCurrentUser(event)`: Mengembalikan object session dari request header.
- `requireAuth(event)`: Melemparkan error 401 Unauthorized jika belum login.
- `requireRole(event, roles)`: Mengecek role yang dijinkan vs role user. Membaca properti `role` dan `isActive` langsung dari struktur user Better-Auth, melempar error 403 Forbidden jika tidak cocok/aktif.