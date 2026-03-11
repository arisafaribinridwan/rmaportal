// server/api/claims/lookup/vendors/[id].get.ts
// GET /api/claims/lookup/vendors/:id — Lookup vendor with required config
import { claimService } from '~~/server/services/claim.service'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')

  if (!idParam) {
    throw createError({ statusCode: 400, message: 'Vendor ID is required' })
  }

  const id = Number(idParam)
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid vendor ID' })
  }

  return claimService.lookupVendor(id)
})
