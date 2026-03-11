// server/api/claims/[id]/photos/[photoId].delete.ts
// DELETE /api/claims/:id/photos/:photoId — Delete a photo from a claim
import { claimService } from '~~/server/services/claim.service'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const photoIdParam = getRouterParam(event, 'photoId')

  if (!idParam) {
    throw createError({ statusCode: 400, message: 'Claim ID is required' })
  }
  if (!photoIdParam) {
    throw createError({ statusCode: 400, message: 'Photo ID is required' })
  }

  const claimId = Number(idParam)
  const photoId = Number(photoIdParam)

  if (isNaN(claimId) || claimId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid claim ID' })
  }
  if (isNaN(photoId) || photoId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid photo ID' })
  }

  const session = event.context.auth
  const user = session.user

  return claimService.deletePhoto(claimId, photoId, user.id, user.role)
})
