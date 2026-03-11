// server/api/audit-trail/export.get.ts
// GET /api/audit-trail/export — Export audit trail as CSV
// Role guard: QRCC, ADMIN (enforced by global middleware via /api/audit-trail prefix)
import { auditTrailService } from '~~/server/services/audit-trail.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const { csv, filename } = await auditTrailService.exportCsv(query as Record<string, unknown>)

  // Set response headers for CSV download
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  return csv
})
