// server/api/master/vendor/[id].get.ts
// GET /api/master/vendor/:id — Get vendor by ID (QRCC, Admin)
import { vendorService } from '~~/server/services/vendor.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid vendor ID' })
  }

  return vendorService.getById(id)
})
