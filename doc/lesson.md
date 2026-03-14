# Lessons Learned

---

## 1. Stale Session State saat Sign-Out dengan Client-Side Navigation

**Tanggal:** 2026-03-14
**File terkait:**
- [app/composables/useAuth.ts](../app/composables/useAuth.ts)
- [app/middleware/auth.global.ts](../app/middleware/auth.global.ts)
- [app/components/UserMenu.vue](../app/components/UserMenu.vue)

### Masalah

`authClient.signOut()` dari better-auth/vue berhasil menghapus cookie dan session di server, tetapi internal reactive state dari `authClient.useSession()` **tidak langsung ter-reset secara sinkron**.

Ketika `navigateTo('/login')` dijalankan secara client-side tepat setelah `signOut()`, middleware `auth.global.ts` masih membaca `isLoggedIn = true` dari sesi lama (stale). Akibatnya middleware memblokir akses ke `/login` dan me-redirect user kembali ke dashboard — login loop.

```
authClient.signOut()
  → cookie/server session cleared
  → TAPI useSession() internal state belum sync

navigateTo('/login')
  → auth.global.ts middleware berjalan
  → isLoggedIn.value masih true (stale!)
  → middleware redirect balik ke /dashboard  💥
```

Solusi sementara yang sering dipakai — `window.location.href = '/login'` — memang bekerja karena memaksa full-page reload sehingga state direset total. Tapi ini mengorbankan pengalaman SPA (ada flicker, reload penuh).

### Solusi

Tambahkan **module-level reactive flag** `isSigningOut` di `useAuth.ts`. Karena berada di module scope (bukan di dalam fungsi), ref ini adalah **singleton** — satu instance yang dibagi oleh semua consumer: komponen, middleware, dan composable mana pun yang memanggil `useAuth()`.

**Perubahan di [useAuth.ts](../app/composables/useAuth.ts):**

```ts
// Module-level — shared di seluruh app
const isSigningOut = ref(false)

export function useAuth() {
  const session = authClient.useSession()

  const user = computed(() => {
    if (isSigningOut.value) return null          // ← guard reaktif
    return session.value?.data?.user ?? null
  })

  const isLoggedIn = computed(() => !!user.value)

  async function signOut() {
    isSigningOut.value = true                    // 1. invalidasi computed secara sinkron
    try {
      await authClient.signOut()                 // 2. clear cookie & server session
      await navigateTo('/login', { replace: true }) // 3. navigasi aman
    } finally {
      isSigningOut.value = false                 // 4. reset setelah navigasi selesai
    }
  }

  return { ..., signOut }
}
```

**Alur yang benar setelah perbaikan:**

```
isSigningOut = true
  → user computed → null  (sinkron, dalam tick yang sama)
  → isLoggedIn → false    (sinkron)

authClient.signOut()  → clear cookie

navigateTo('/login')
  → auth.global.ts middleware berjalan
  → isLoggedIn.value = false  ✓
  → middleware mengizinkan akses ke /login  ✓
```

### Key Takeaway

> Ketika library pihak ketiga (seperti better-auth) tidak menjamin reactive state ter-update secara sinkron setelah operasi async, gunakan **module-level ref sebagai "optimistic flag"** untuk memastikan semua computed yang bergantung padanya langsung ter-invalidasi sebelum navigasi client-side dijalankan.

Ini pola yang umum untuk menghindari race condition antara async state update library eksternal dan Nuxt route middleware.

---

## 2. Scope Filter Reports Harus Dipaksa di Backend (Bukan Hanya UI)

**Tanggal:** 2026-03-14
**File terkait:**
- [server/services/report.service.ts](../server/services/report.service.ts)
- [server/api/reports/claims/summary.get.ts](../server/api/reports/claims/summary.get.ts)
- [server/api/reports/claims/detail.get.ts](../server/api/reports/claims/detail.get.ts)
- [server/api/reports/claims/export.get.ts](../server/api/reports/claims/export.get.ts)
- [server/api/reports/claims/filters.get.ts](../server/api/reports/claims/filters.get.ts)

### Masalah

Pada fitur Reports, role `MANAGEMENT` hanya boleh melihat data sesuai `branch` miliknya. Jika pembatasan ini hanya diterapkan di frontend (misalnya branch dropdown dikunci), user masih bisa mengubah query manual (`?branch=...`) langsung ke endpoint API.

Artinya, pembatasan berbasis UI saja tidak cukup untuk menjamin data isolation antar-branch.

### Solusi

Tambahkan layer **scoping filter di service backend** agar semua endpoint report (`summary`, `detail`, `export`, dan `filters`) memakai aturan akses yang sama.

Implementasi di `report.service.ts`:

```ts
function resolveScopedFilters(raw, scope) {
  const filters = parseFilters(raw)

  if (scope?.role === 'MANAGEMENT') {
    if (!scope.branch?.trim()) {
      throw createError({ statusCode: 403 })
    }

    filters.branch = scope.branch.trim() // force override
  }

  return filters
}
```

Semua handler API report mengirim `role` + `branch` dari `event.context.auth.user` ke service, sehingga rule ini selalu aktif terlepas dari source request (UI, curl, Postman, dll).

### Key Takeaway

> Rule akses data yang bersifat security/authorization harus dipaksa di backend service layer. Frontend boleh membantu UX (menyembunyikan/mengunci filter), tetapi tidak boleh menjadi satu-satunya pengaman.

Dengan pola ini, kita mendapat enforcement yang konsisten untuk semua endpoint report sekaligus mengurangi risiko data leakage karena query tampering.
