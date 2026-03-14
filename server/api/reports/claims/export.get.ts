// server/api/reports/claims/export.get.ts
// GET /api/reports/claims/export
// Role guard: QRCC, MANAGEMENT, ADMIN (enforced by global middleware)
import { reportService } from '~~/server/services/report.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const user = event.context.auth?.user

  const { csv, filename } = await reportService.exportCsv(query as Record<string, unknown>, {
    role: user?.role,
    branch: user?.branch
  })

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  return csv
})
