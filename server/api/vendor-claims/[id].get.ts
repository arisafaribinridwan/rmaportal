// server/api/vendor-claims/[id].get.ts
// Get a single vendor claim by ID with its items
// Auth: QRCC, ADMIN (enforced by global middleware)
import { vendorClaimService } from '~~/server/services/vendor-claim.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid vendor claim ID' })
  }

  return vendorClaimService.getById(id)
})
