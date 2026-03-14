// app/composables/useAuth.ts
import { authClient } from '~/utils/auth-client'
import type { UserRole } from '~~/shared/utils/constants'

/**
 * Flag reaktif yang langsung di-set `true` saat sign-out dimulai.
 * Karena shared state (module-level ref), semua consumer — termasuk
 * middleware — langsung membaca nilai terbaru tanpa menunggu
 * better-auth internal state ter-update.
 */
const isSigningOut = ref(false)

export function useAuth() {
  const session = authClient.useSession()

  const user = computed(() => {
    if (isSigningOut.value) return null
    return session.value?.data?.user ?? null
  })
  const isLoggedIn = computed(() => !!user.value)
  const role = computed(() => (user.value?.role as UserRole) ?? null)

  /**
   * Menentukan home path berdasarkan role user.
   * CS → /cs, lainnya (QRCC/MANAGEMENT/ADMIN) → /dashboard
   */
  function getHomePath(): string {
    if (role.value === 'CS') return '/cs'
    return '/dashboard'
  }

  /**
   * Sign-out yang aman untuk client-side navigation.
   * 1. Set isSigningOut → true  (langsung meng-invalidasi semua computed)
   * 2. Panggil authClient.signOut() (clear cookie/server session)
   * 3. navigateTo('/login') — middleware sudah melihat isLoggedIn = false
   * 4. Reset flag setelah navigasi selesai
   */
  async function signOut() {
    isSigningOut.value = true
    try {
      await authClient.signOut()
      await navigateTo('/login', { replace: true })
    }
    finally {
      // Reset flag setelah navigasi — state session better-auth
      // sudah benar di halaman /login
      isSigningOut.value = false
    }
  }

  return { session, user, isLoggedIn, role, getHomePath, signOut }
}
