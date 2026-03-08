// app/middleware/dashboard.ts
// Named middleware — diterapkan pada halaman /dashboard/*.
// Granular role-based access per route sesuai doc/2-user-role.md.
// CS redirect ke /cs, role dashboard yang tidak punya akses redirect ke /dashboard.

import { useAuth } from '~/composables/useAuth'
import type { UserRole } from '~~/shared/utils/constants'

/**
 * Route access map — defines which roles can access each dashboard route.
 * Routes are matched top-down; first match wins (most specific first).
 * If no match found, falls back to default dashboard roles.
 */
const ROUTE_ACCESS: { pattern: string, roles: UserRole[] }[] = [
  // User Management — Admin only
  { pattern: '/dashboard/setting/users', roles: ['ADMIN'] },

  // Claims Management — QRCC + Admin
  { pattern: '/dashboard/claims', roles: ['QRCC', 'ADMIN'] },

  // Vendor Claims — QRCC + Admin
  { pattern: '/dashboard/vendor-claims', roles: ['QRCC', 'ADMIN'] },

  // Master Data — QRCC + Admin
  { pattern: '/dashboard/master', roles: ['QRCC', 'ADMIN'] },

  // Audit Trail — QRCC + Admin
  { pattern: '/dashboard/audit-trail', roles: ['QRCC', 'ADMIN'] },

  // Reports — all dashboard roles
  { pattern: '/dashboard/reports', roles: ['QRCC', 'MANAGEMENT', 'ADMIN'] },

  // Settings (profile, security) — all dashboard roles
  { pattern: '/dashboard/setting', roles: ['QRCC', 'MANAGEMENT', 'ADMIN'] },

  // Dashboard home — all dashboard roles
  { pattern: '/dashboard', roles: ['QRCC', 'MANAGEMENT', 'ADMIN'] }
]

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { role, getHomePath } = useAuth()

  // Find first matching route access rule (most specific first)
  const match = ROUTE_ACCESS.find(rule =>
    to.path === rule.pattern || to.path.startsWith(rule.pattern + '/')
  )

  const allowedRoles = match?.roles ?? ['QRCC', 'MANAGEMENT', 'ADMIN']

  if (!role.value || !allowedRoles.includes(role.value)) {
    // Redirect ke home sesuai role:
    // - CS → /cs
    // - Management (tanpa akses ke claims dll) → /dashboard
    return navigateTo(getHomePath(), { replace: true })
  }
})
