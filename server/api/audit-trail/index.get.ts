// server/api/audit-trail/index.get.ts
// GET /api/audit-trail — List claim history (audit trail)
// Role guard: QRCC, ADMIN (enforced by global middleware via /api/audit-trail prefix)
import { auditTrailService } from '~~/server/services/audit-trail.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return auditTrailService.list(query as Record<string, unknown>)
})
