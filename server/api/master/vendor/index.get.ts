// server/api/master/vendor/index.get.ts
// GET /api/master/vendor — List vendors (QRCC, Admin)
import { vendorService } from '~~/server/services/vendor.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const filters: { isActive?: boolean, search?: string } = {}

  if (query.isActive !== undefined) {
    filters.isActive = query.isActive === 'true'
  }

  if (typeof query.search === 'string' && query.search.trim()) {
    filters.search = query.search.trim()
  }

  return vendorService.list(filters)
})
