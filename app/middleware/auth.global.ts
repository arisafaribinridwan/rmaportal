// app/middleware/auth.global.ts
// Global middleware — berjalan di setiap navigasi route.
// Menangani: redirect unauthenticated → /login, redirect authenticated dari /login & / ke home.

import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip di server-side untuk menghindari hydration mismatch
  if (import.meta.server) return

  const { isLoggedIn, getHomePath } = useAuth()

  // Route yang bisa diakses tanpa login
  const publicRoutes = ['/login']
  const isPublic = publicRoutes.some(r => to.path === r || to.path.startsWith(r + '/'))

  // Auth API routes — jangan intercept
  if (to.path.startsWith('/api/auth')) return

  // Belum login & bukan public route → redirect ke /login
  if (!isLoggedIn.value && !isPublic) {
    return navigateTo('/login', { replace: true })
  }

  // Sudah login & akses /login atau / → redirect ke home sesuai role
  if (isLoggedIn.value && (to.path === '/login' || to.path === '/')) {
    return navigateTo(getHomePath(), { replace: true })
  }
})
