// app/composables/useAuth.ts
import { authClient } from '~/utils/auth-client'
import type { UserRole } from '~~/shared/utils/constants'

export function useAuth() {
  const session = authClient.useSession()

  const user = computed(() => session.value?.data?.user ?? null)
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

  return { session, user, isLoggedIn, role, getHomePath }
}
