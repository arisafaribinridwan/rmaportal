// server/api/master/product-model/[id].get.ts
// GET /api/master/product-model/:id — Get a product model by ID (QRCC, Admin)
import { productModelService } from '~~/server/services/product-model.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product model ID' })
  }

  return productModelService.getById(id)
})
