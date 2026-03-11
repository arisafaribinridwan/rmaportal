// server/api/claims/[id]/history.get.ts
// GET /api/claims/:id/history — Get claim revision/action history
import { claimRepo } from '~~/server/repositories/claim.repo'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')

  if (!idParam) {
    throw createError({ statusCode: 400, message: 'Claim ID is required' })
  }

  const id = Number(idParam)
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid claim ID' })
  }

  // Verify claim exists
  const existing = await claimRepo.findById(id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Claim not found' })
  }

  return claimRepo.findHistoryByClaimId(id)
})
