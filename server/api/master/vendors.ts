// server/api/master/vendors.ts
// GET /api/master/vendors — List all vendors (used by frontend data tables)
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
