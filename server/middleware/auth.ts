// server/middleware/auth.ts
// ============================================================
// Global Auth Middleware — Role-based API route protection
// ============================================================
// Ref: doc/2-user-role.md (Lines 5-21)
// Runs on EVERY server request (Nitro auto-scan).
// Public/non-API routes are skipped. API routes are matched
// against a role-access map and enforced via requireRole().
// ============================================================

import type { H3Event } from 'h3'
import type { UserRole } from '~~/shared/utils/constants'

// ────────────────────────────────────────────────────────────
// Route-to-Role mapping
// ────────────────────────────────────────────────────────────
// Each entry: [urlPrefix, allowedRoles[]]
// Order matters — first match wins. More specific prefixes
// MUST come before broader ones.
// ────────────────────────────────────────────────────────────

interface RouteRule {
  /** URL prefix to match (startsWith) */
  prefix: string
  /** Roles allowed to access this route group */
  roles: UserRole[]
}

const ROUTE_RULES: RouteRule[] = [
  // ── User Management (Admin only) ──────────────────────────
  { prefix: '/api/users', roles: ['ADMIN'] },

  // ── Master Data (QRCC, Admin) ─────────────────────────────
  { prefix: '/api/master', roles: ['QRCC', 'ADMIN'] },

  // ── Vendor Claims (QRCC, Admin) ───────────────────────────
  { prefix: '/api/vendor-claims', roles: ['QRCC', 'ADMIN'] },

  // ── Audit Trail (QRCC, Admin) ─────────────────────────────
  { prefix: '/api/audit-trail', roles: ['QRCC', 'ADMIN'] },

  // ── Reports (QRCC, Management, Admin) ─────────────────────
  { prefix: '/api/reports', roles: ['QRCC', 'MANAGEMENT', 'ADMIN'] },

  // ── Claims (all authenticated roles) ──────────────────────
  // CS  → create/revisi (enforced at handler level)
  // QRCC/Admin → review, approve/reject (enforced at handler level)
  { prefix: '/api/claims', roles: ['CS', 'QRCC', 'ADMIN'] }
]

// ────────────────────────────────────────────────────────────
// Paths that bypass auth entirely
// ────────────────────────────────────────────────────────────

const PUBLIC_PREFIXES = [
  '/api/auth' // Better-Auth endpoints (login, session, etc.)
]

function isPublicRoute(path: string): boolean {
  return PUBLIC_PREFIXES.some(prefix => path.startsWith(prefix))
}

function isApiRoute(path: string): boolean {
  return path.startsWith('/api/')
}

// ────────────────────────────────────────────────────────────
// Find matching route rule for a given path
// ────────────────────────────────────────────────────────────

function findRouteRule(path: string): RouteRule | undefined {
  return ROUTE_RULES.find(rule => path.startsWith(rule.prefix))
}

// ────────────────────────────────────────────────────────────
// Middleware Handler
// ────────────────────────────────────────────────────────────

export default defineEventHandler(async (event: H3Event) => {
  const path = getRequestURL(event).pathname

  // 1) Skip non-API requests (pages, assets, _nuxt, etc.)
  if (!isApiRoute(path)) {
    return
  }

  // 2) Skip public routes (Better-Auth endpoints)
  if (isPublicRoute(path)) {
    return
  }

  // 3) Find the matching route rule
  const rule = findRouteRule(path)

  if (rule) {
    // Protected route — enforce role-based access
    await requireRole(event, rule!.roles)
  } else {
    // API route with no explicit rule — require authentication at minimum
    await requireAuth(event)
  }
})
