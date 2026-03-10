// server/api/master/product-models.ts
// GET /api/master/product-models — List all product models (used by frontend data tables)
import { productModelService } from '~~/server/services/product-model.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const filters: { isActive?: boolean, search?: string, vendorId?: number } = {}

  if (query.isActive !== undefined) {
    filters.isActive = query.isActive === 'true'
  }

  if (typeof query.search === 'string' && query.search.trim()) {
    filters.search = query.search.trim()
  }

  if (query.vendorId !== undefined) {
    const vendorId = Number(query.vendorId)
    if (!isNaN(vendorId) && vendorId > 0) {
      filters.vendorId = vendorId
    }
  }

  return productModelService.list(filters)
})
