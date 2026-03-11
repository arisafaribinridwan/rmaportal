// server/repositories/photo-review.repo.ts
import { eq, desc } from 'drizzle-orm'
import db from '~~/server/database'
import {
  photoReview,
  claimPhoto
} from '~~/server/database/schema'
import type { InsertPhotoReview } from '~~/server/database/schema'
import type { ClaimPhotoStatus } from '~~/shared/utils/constants'

export const photoReviewRepo = {
  /**
   * Insert a photo review record.
   */
  async create(data: InsertPhotoReview) {
    return db
      .insert(photoReview)
      .values(data)
      .returning()
      .get()
  },

  /**
   * Find all reviews for a specific claim photo.
   */
  async findByClaimPhotoId(claimPhotoId: number) {
    return db
      .select()
      .from(photoReview)
      .where(eq(photoReview.claimPhotoId, claimPhotoId))
      .orderBy(desc(photoReview.reviewedAt))
  },

  /**
   * Find all reviews for a claim (join through claimPhoto).
   */
  async findByClaimId(claimId: number) {
    return db
      .select({
        id: photoReview.id,
        claimPhotoId: photoReview.claimPhotoId,
        photoType: claimPhoto.photoType,
        photoStatus: claimPhoto.status,
        reviewedBy: photoReview.reviewedBy,
        status: photoReview.status,
        rejectReason: photoReview.rejectReason,
        reviewedAt: photoReview.reviewedAt
      })
      .from(photoReview)
      .innerJoin(claimPhoto, eq(photoReview.claimPhotoId, claimPhoto.id))
      .where(eq(claimPhoto.claimId, claimId))
      .orderBy(desc(photoReview.reviewedAt))
  },

  /**
   * Update a claim photo's status (VERIFIED / REJECT).
   */
  async updatePhotoStatus(photoId: number, status: ClaimPhotoStatus, rejectReason?: string) {
    return db
      .update(claimPhoto)
      .set({
        status,
        rejectReason: rejectReason || null
      })
      .where(eq(claimPhoto.id, photoId))
      .returning()
      .get()
  }
}
