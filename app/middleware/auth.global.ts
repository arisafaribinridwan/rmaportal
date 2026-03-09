// app/middleware/auth.global.ts
// Global middleware — berjalan di setiap navigasi route.
// Menangani: redirect unauthenticated → /login, redirect authenticated dari /login & / ke home.

import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
  // disable middleware sementara untuk fix ui dulu
  return

  // Skip di server-side untuk menghindari hydration mismatch
  if (import.meta.server) return

  const { isLoggedIn, getHomePath } = useAuth()

  // Daftar route yang bisa diakses tanpa login
  const publicRoutes = ['/login']
  const isPublic = publicRoutes.some(r => to.path === r || to.path.startsWith(r + '/'))

  // Belum login & bukan public route → redirect ke /login
  if (!isLoggedIn.value && !isPublic) {
    return navigateTo('/login', { replace: true })
  }

  // Sudah login & akses /login atau / → redirect ke home sesuai role
  if (isLoggedIn.value && (to.path === '/login' || to.path === '/')) {
    return navigateTo(getHomePath(), { replace: true })
  }
})
