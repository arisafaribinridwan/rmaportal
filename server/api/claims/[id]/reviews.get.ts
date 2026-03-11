// server/api/claims/[id]/reviews.get.ts
// GET /api/claims/:id/reviews — Get photo reviews for a claim
import { photoReviewService } from '~~/server/services/photo-review.service'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  if (!idParam) {
    throw createError({ statusCode: 400, message: 'Claim ID is required' })
  }

  const id = Number(idParam)
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid claim ID' })
  }

  return photoReviewService.getReviewsByClaimId(id)
})
