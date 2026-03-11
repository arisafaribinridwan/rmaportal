// server/api/claims/[id]/review.post.ts
// POST /api/claims/:id/review — Submit photo reviews for a claim
// Role guard: QRCC, ADMIN (enforced at handler level)
import { photoReviewService } from '~~/server/services/photo-review.service'

export default defineEventHandler(async (event) => {
  // Enforce QRCC/ADMIN role
  const { user } = await requireRole(event, ['QRCC', 'ADMIN'])

  const idParam = getRouterParam(event, 'id')
  if (!idParam) {
    throw createError({ statusCode: 400, message: 'Claim ID is required' })
  }

  const id = Number(idParam)
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid claim ID' })
  }

  const body = await readBody(event)

  return photoReviewService.reviewPhotos(
    id,
    body,
    user.id,
    user.role as string
  )
})
