// app/middleware/cs.ts
// Named middleware — diterapkan pada halaman /cs/*.
// Hanya role CS yang diizinkan, role lain redirect ke /dashboard.

import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const { role } = useAuth()

  if (role.value !== 'CS') {
    return navigateTo('/dashboard', { replace: true })
  }
})
