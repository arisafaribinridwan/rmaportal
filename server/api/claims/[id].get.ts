// server/api/claims/[id].get.ts
// GET /api/claims/:id — Get claim detail with photos and history
// Role guard: CS, QRCC, ADMIN (handled by global middleware)
import { claimService } from '~~/server/services/claim.service'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')

  if (!idParam) {
    throw createError({
      statusCode: 400,
      message: 'Claim ID is required'
    })
  }

  const id = Number(idParam)
  if (isNaN(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid claim ID'
    })
  }

  return claimService.getById(id)
})
