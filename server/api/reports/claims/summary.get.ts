// server/api/reports/claims/summary.get.ts
// GET /api/reports/claims/summary
// Role guard: QRCC, MANAGEMENT, ADMIN (enforced by global middleware)
import { reportService } from '~~/server/services/report.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const user = event.context.auth?.user

  return reportService.getSummary(query as Record<string, unknown>, {
    role: user?.role,
    branch: user?.branch
  })
})
