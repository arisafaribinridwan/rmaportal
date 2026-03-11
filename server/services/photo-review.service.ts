// server/services/photo-review.service.ts
import { z } from 'zod'
import { claimRepo } from '~~/server/repositories/claim.repo'
import { photoReviewRepo } from '~~/server/repositories/photo-review.repo'
import type { ClaimStatus, ClaimPhotoStatus } from '~~/shared/utils/constants'

// ── Validation Schemas ──────────────────────────────────────

const photoReviewItemSchema = z.object({
  photoId: z.number().int().positive('Invalid photo ID'),
  status: z.enum(['VERIFIED', 'REJECT'] as const),
  rejectReason: z.string().trim().optional()
})

const reviewPhotosSchema = z.object({
  reviews: z.array(photoReviewItemSchema).min(1, 'At least one photo review is required')
})

// ── Allowed statuses for review ─────────────────────────────

const REVIEWABLE_STATUSES: ClaimStatus[] = ['SUBMITTED', 'IN_REVIEW']

// ── Service ─────────────────────────────────────────────────

export const photoReviewService = {
  /**
   * Submit batch photo reviews for a claim.
   * 1. Validate claim exists and is in reviewable state
   * 2. Transition to IN_REVIEW if currently SUBMITTED
   * 3. Review each photo: save review record, update photo status
   * 4. Calculate final claim status from all photo statuses
   * 5. Record audit history
   */
  async reviewPhotos(
    claimId: number,
    body: unknown,
    userId: string,
    userRole: string
  ) {
    const { reviews } = reviewPhotosSchema.parse(body)

    // 1. Validate claim exists
    const existing = await claimRepo.findById(claimId)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Claim not found' })
    }

    // 2. Check claim is in reviewable state
    if (!REVIEWABLE_STATUSES.includes(existing.claimStatus as ClaimStatus)) {
      throw createError({
        statusCode: 400,
        message: `Cannot review claim with status '${existing.claimStatus}'. Must be SUBMITTED or IN_REVIEW.`
      })
    }

    // 3. Transition to IN_REVIEW if currently SUBMITTED
    const previousStatus = existing.claimStatus
    if (previousStatus === 'SUBMITTED') {
      await claimRepo.updateStatus(claimId, 'IN_REVIEW', userId)
      await claimRepo.createHistory({
        claimId,
        action: 'REVIEW',
        fromStatus: 'SUBMITTED',
        toStatus: 'IN_REVIEW',
        userId,
        userRole,
        note: 'Claim review started'
      })
    }

    // 4. Validate photos belong to this claim and review each
    const claimPhotos = await claimRepo.findPhotosByClaimId(claimId)
    const photoMap = new Map(claimPhotos.map(p => [p.id, p]))

    for (const review of reviews) {
      const photo = photoMap.get(review.photoId)
      if (!photo) {
        throw createError({
          statusCode: 400,
          message: `Photo ID ${review.photoId} does not belong to claim ${claimId}`
        })
      }

      // Validate reject reason is provided when rejecting
      if (review.status === 'REJECT' && !review.rejectReason?.trim()) {
        throw createError({
          statusCode: 400,
          message: `Reject reason is required for photo ID ${review.photoId}`
        })
      }

      // Save photo review record
      // Note: reviewedBy stored as number — using a hash or truncated approach
      // Since schema defines reviewedBy as integer, we store 0 and rely on history for user tracking
      await photoReviewRepo.create({
        claimPhotoId: review.photoId,
        reviewedBy: 0, // userId tracked via claimHistory
        status: review.status as ClaimPhotoStatus,
        rejectReason: review.status === 'REJECT' ? review.rejectReason : undefined
      })

      // Update photo status
      await photoReviewRepo.updatePhotoStatus(
        review.photoId,
        review.status as ClaimPhotoStatus,
        review.status === 'REJECT' ? review.rejectReason : undefined
      )

      // Record per-photo review history
      await claimRepo.createHistory({
        claimId,
        action: 'REVIEW_PHOTO',
        fromStatus: 'IN_REVIEW',
        toStatus: 'IN_REVIEW',
        userId,
        userRole,
        note: review.status === 'REJECT'
          ? `Photo ${photo.photoType} rejected: ${review.rejectReason}`
          : `Photo ${photo.photoType} verified`
      })
    }

    // 5. Calculate final claim status from ALL photo statuses
    const updatedPhotos = await claimRepo.findPhotosByClaimId(claimId)
    const finalStatus = this._calculateClaimStatus(updatedPhotos)

    // 6. Update claim status
    await claimRepo.updateStatus(claimId, finalStatus, userId)

    // 7. Record final decision history
    const actionType = finalStatus === 'APPROVED' ? 'APPROVE' : 'REQUEST_REVISION'
    const note = finalStatus === 'APPROVED'
      ? 'All photos verified — claim approved'
      : 'One or more photos rejected — revision required'

    await claimRepo.createHistory({
      claimId,
      action: actionType,
      fromStatus: 'IN_REVIEW',
      toStatus: finalStatus,
      userId,
      userRole,
      note
    })

    return {
      claimId,
      finalStatus,
      reviewedPhotos: reviews.length,
      totalPhotos: updatedPhotos.length
    }
  },

  /**
   * Get all photo reviews for a claim.
   */
  async getReviewsByClaimId(claimId: number) {
    const existing = await claimRepo.findById(claimId)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Claim not found' })
    }

    return photoReviewRepo.findByClaimId(claimId)
  },

  // ── Internal helpers ────────────────────────────────────

  /**
   * Calculate final claim status based on photo statuses.
   * - If ANY photo is REJECT → NEED_REVISION
   * - If ALL photos are VERIFIED → APPROVED
   * - Otherwise stays IN_REVIEW (partial review)
   */
  _calculateClaimStatus(photos: { status: string }[]): ClaimStatus {
    if (photos.length === 0) {
      return 'IN_REVIEW'
    }

    const hasRejected = photos.some(p => p.status === 'REJECT')
    if (hasRejected) {
      return 'NEED_REVISION'
    }

    const allVerified = photos.every(p => p.status === 'VERIFIED')
    if (allVerified) {
      return 'APPROVED'
    }

    // Some still PENDING — partial review
    return 'IN_REVIEW'
  }
}
