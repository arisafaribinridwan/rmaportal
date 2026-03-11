// server/api/claims/lookup/models.get.ts
// GET /api/claims/lookup/models?vendorId=xxx — Lookup active product models by vendor
import { claimService } from '~~/server/services/claim.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  if (query.vendorId === undefined) {
    throw createError({ statusCode: 400, message: 'vendorId is required' })
  }

  const vendorId = Number(query.vendorId)
  if (isNaN(vendorId) || vendorId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid vendor ID' })
  }

  return claimService.lookupModels(vendorId)
})
