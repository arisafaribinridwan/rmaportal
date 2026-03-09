// server/api/master/product-model/index.get.ts
// GET /api/master/product-model — List product models (QRCC, Admin)
import { productModelService } from '~~/server/services/product-model.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const filters = {
    isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
    search: query.search ? String(query.search) : undefined,
    vendorId: query.vendorId ? Number(query.vendorId) : undefined
  }

  return productModelService.list(filters)
})
