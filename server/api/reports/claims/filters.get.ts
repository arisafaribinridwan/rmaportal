// server/api/reports/claims/filters.get.ts
// GET /api/reports/claims/filters
// Role guard: QRCC, MANAGEMENT, ADMIN (enforced by global middleware)
import { reportService } from '~~/server/services/report.service'

export default defineEventHandler(async (event) => {
  const user = event.context.auth?.user

  return reportService.getFilterOptions({
    role: user?.role,
    branch: user?.branch
  })
})
