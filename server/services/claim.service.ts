// server/services/claim.service.ts
import { z } from 'zod'
import { claimRepo } from '~~/server/repositories/claim.repo'
import type { ClaimListFilters } from '~~/server/repositories/claim.repo'
import { sequenceGeneratorRepo } from '~~/server/repositories/sequence-generator.repo'
import { notificationMasterRepo } from '~~/server/repositories/notification-master.repo'
import { vendorRepo } from '~~/server/repositories/vendor.repo'
import { productModelRepo } from '~~/server/repositories/product-model.repo'
import { defectMasterRepo } from '~~/server/repositories/defect-master.repo'
import { insertClaimSchema, updateClaimSchema, insertClaimPhotoSchema } from '~~/server/database/schema'
import { PHOTO_TYPES } from '~~/shared/utils/constants'
import type { ClaimStatus, PhotoType } from '~~/shared/utils/constants'

// ── Validation Schemas ──────────────────────────────────────

const createClaimDraftSchema = z.object({
  notificationId: z.number().int().positive('Invalid notification ID'),
  modelId: z.number().int().positive('Invalid model ID'),
  vendorId: z.number().int().positive('Invalid vendor ID'),
  inch: z.number().int().positive('Inch must be positive'),
  branch: z.string().min(1, 'Branch is required').trim(),
  odfNumber: z.string().trim().optional(),
  panelSerialNo: z.string().min(1, 'Panel SN is required').trim(),
  ocSerialNo: z.string().min(1, 'OC SN is required').trim(),
  defectCode: z.string().min(1, 'Defect code is required').trim(),
  version: z.string().trim().optional(),
  week: z.string().trim().optional()
})

const updateClaimDraftSchema = createClaimDraftSchema.partial()

const submitRevisionSchema = z.object({
  notificationId: z.number().int().positive().optional(),
  modelId: z.number().int().positive().optional(),
  vendorId: z.number().int().positive().optional(),
  inch: z.number().int().positive().optional(),
  branch: z.string().min(1).trim().optional(),
  odfNumber: z.string().trim().optional(),
  panelSerialNo: z.string().min(1).trim().optional(),
  ocSerialNo: z.string().min(1).trim().optional(),
  defectCode: z.string().min(1).trim().optional(),
  version: z.string().trim().optional(),
  week: z.string().trim().optional(),
  note: z.string().trim().optional()
})

// ── Allowed status transitions ──────────────────────────────

const REVISION_ALLOWED_STATUSES: ClaimStatus[] = ['NEED_REVISION']
const SUBMIT_ALLOWED_STATUSES: ClaimStatus[] = ['DRAFT']

// ── Service ─────────────────────────────────────────────────

export const claimService = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // #17 — CS Claim List
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * List claims with filters and pagination.
   */
  async list(filters?: ClaimListFilters) {
    return claimRepo.findAll(filters)
  },

  /**
   * Get a single claim by ID with full detail (photos, history).
   * Throws 404 if not found.
   */
  async getById(id: number) {
    const record = await claimRepo.findById(id)
    if (!record) {
      throw createError({ statusCode: 404, message: 'Claim not found' })
    }

    // Load photos and history in parallel
    const [photos, history] = await Promise.all([
      claimRepo.findPhotosByClaimId(id),
      claimRepo.findHistoryByClaimId(id)
    ])

    return {
      ...record,
      photos,
      history
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // #19 — Claim Wizard Create
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Create a new draft claim.
   * Validates all foreign keys exist, generates claim number, records history.
   */
  async createDraft(body: unknown, userId: string, userRole: string) {
    const data = createClaimDraftSchema.parse(body)

    // Validate foreign keys exist
    await this._validateForeignKeys(data)

    // Validate vendor-specific required fields
    const vendorRecord = await vendorRepo.findById(data.vendorId)
    if (vendorRecord) {
      this._validateVendorRequiredFields(vendorRecord, data)
    }

    // Generate claim number
    const claimNumber = await sequenceGeneratorRepo.getNextSequence('CLAIM', new Date())

    // Build insert data
    const insertData = insertClaimSchema.parse({
      ...data,
      claimNumber,
      claimStatus: 'DRAFT' as ClaimStatus,
      submittedBy: userId,
      updatedBy: userId
    })

    // Insert claim
    const created = await claimRepo.create(insertData)

    // Record history
    await claimRepo.createHistory({
      claimId: created.id,
      action: 'CREATE',
      fromStatus: '',
      toStatus: 'DRAFT',
      userId,
      userRole,
      note: 'Claim draft created'
    })

    return created
  },

  /**
   * Update a draft claim (only allowed when status is DRAFT).
   */
  async updateDraft(id: number, body: unknown, userId: string, userRole: string) {
    const existing = await claimRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Claim not found' })
    }

    if (existing.claimStatus !== 'DRAFT') {
      throw createError({
        statusCode: 400,
        message: 'Only draft claims can be updated. Current status: ' + existing.claimStatus
      })
    }

    const data = updateClaimDraftSchema.parse(body)

    // Validate FK if present
    await this._validateForeignKeys(data)

    const updateData = updateClaimSchema.parse({
      ...data,
      updatedBy: userId
    })

    const updated = await claimRepo.update(id, updateData)

    // Record history
    await claimRepo.createHistory({
      claimId: id,
      action: 'UPDATE',
      fromStatus: 'DRAFT',
      toStatus: 'DRAFT',
      userId,
      userRole,
      note: 'Draft updated'
    })

    return updated
  },

  /**
   * Submit a draft claim.
   * Changes status DRAFT → SUBMITTED.
   * Validates required photos based on vendor config.
   */
  async submit(id: number, userId: string, userRole: string) {
    const existing = await claimRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Claim not found' })
    }

    if (!SUBMIT_ALLOWED_STATUSES.includes(existing.claimStatus as ClaimStatus)) {
      throw createError({
        statusCode: 400,
        message: `Cannot submit claim with status '${existing.claimStatus}'. Must be DRAFT.`
      })
    }

    // Validate required photos exist
    const photos = await claimRepo.findPhotosByClaimId(id)
    const vendorRecord = await vendorRepo.findById(existing.vendorId)

    if (vendorRecord && vendorRecord.requiredPhotos) {
      const requiredPhotos = vendorRecord.requiredPhotos as string[]
      const uploadedTypes = photos.map(p => p.photoType)

      const missing = requiredPhotos.filter(rp => !uploadedTypes.includes(rp as PhotoType))
      if (missing.length > 0) {
        throw createError({
          statusCode: 400,
          message: `Missing required photos: ${missing.join(', ')}`
        })
      }
    }

    // Update status
    const updated = await claimRepo.updateStatus(id, 'SUBMITTED', userId)

    // Record history
    await claimRepo.createHistory({
      claimId: id,
      action: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      userId,
      userRole,
      note: 'Claim submitted for review'
    })

    // Mark notification as USED
    if (existing.notificationId) {
      await notificationMasterRepo.updateStatus(existing.notificationId, {
        status: 'USED',
        updatedBy: userId
      })
    }

    return updated
  },

  /**
   * Upload a photo for a claim.
   * Only allowed when claim is DRAFT or NEED_REVISION.
   */
  async uploadPhoto(
    claimId: number,
    photoType: string,
    filePath: string,
    thumbnailPath: string | undefined,
    userId: string,
    userRole: string
  ) {
    const existing = await claimRepo.findById(claimId)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Claim not found' })
    }

    const allowedStatuses: ClaimStatus[] = ['DRAFT', 'NEED_REVISION']
    if (!allowedStatuses.includes(existing.claimStatus as ClaimStatus)) {
      throw createError({
        statusCode: 400,
        message: `Cannot upload photo for claim with status '${existing.claimStatus}'`
      })
    }

    // Validate photo type
    if (!PHOTO_TYPES.includes(photoType as PhotoType)) {
      throw createError({
        statusCode: 400,
        message: `Invalid photo type '${photoType}'. Valid types: ${PHOTO_TYPES.join(', ')}`
      })
    }

    const photoData = insertClaimPhotoSchema.parse({
      claimId,
      photoType: photoType as PhotoType,
      filePath,
      thumbnailPath,
      status: 'PENDING'
    })

    const photo = await claimRepo.upsertPhoto(photoData)

    // Record history
    await claimRepo.createHistory({
      claimId,
      action: 'UPLOAD_PHOTO',
      fromStatus: existing.claimStatus,
      toStatus: existing.claimStatus,
      userId,
      userRole,
      note: `Photo uploaded: ${photoType}`
    })

    return photo
  },

  /**
   * Delete a photo from a claim.
   * Only allowed when claim is DRAFT or NEED_REVISION.
   */
  async deletePhoto(claimId: number, photoId: number, _userId: string, _userRole: string) {
    const existing = await claimRepo.findById(claimId)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Claim not found' })
    }

    const allowedStatuses: ClaimStatus[] = ['DRAFT', 'NEED_REVISION']
    if (!allowedStatuses.includes(existing.claimStatus as ClaimStatus)) {
      throw createError({
        statusCode: 400,
        message: `Cannot delete photo for claim with status '${existing.claimStatus}'`
      })
    }

    const deleted = await claimRepo.deletePhoto(photoId)
    if (!deleted) {
      throw createError({ statusCode: 404, message: 'Photo not found' })
    }

    return deleted
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // #21 — Claim Revision Flow
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Submit a revision for a claim with NEED_REVISION status.
   * Updates claim data and re-submits (NEED_REVISION → SUBMITTED).
   */
  async submitRevision(id: number, body: unknown, userId: string, userRole: string) {
    const existing = await claimRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Claim not found' })
    }

    if (!REVISION_ALLOWED_STATUSES.includes(existing.claimStatus as ClaimStatus)) {
      throw createError({
        statusCode: 400,
        message: `Cannot revise claim with status '${existing.claimStatus}'. Must be NEED_REVISION.`
      })
    }

    const data = submitRevisionSchema.parse(body)
    const { note, ...updateFields } = data

    // Validate FKs if they changed
    if (Object.keys(updateFields).length > 0) {
      await this._validateForeignKeys(updateFields)
    }

    // Update claim fields if any
    if (Object.keys(updateFields).length > 0) {
      const updateData = updateClaimSchema.parse({
        ...updateFields,
        updatedBy: userId
      })
      await claimRepo.update(id, updateData)
    }

    // Change status back to SUBMITTED
    const updated = await claimRepo.updateStatus(id, 'SUBMITTED', userId)

    // Record history
    await claimRepo.createHistory({
      claimId: id,
      action: 'SUBMIT',
      fromStatus: 'NEED_REVISION',
      toStatus: 'SUBMITTED',
      userId,
      userRole,
      note: note || 'Revision submitted'
    })

    return updated
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // #19 — Lookup Endpoints (used by Wizard)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Lookup notification by code (for wizard step 1).
   * Returns notification detail with model and vendor info.
   * Only returns NEW notifications (not yet used in a claim).
   */
  async lookupNotification(code: string) {
    const notifications = await notificationMasterRepo.findAll({
      search: code,
      status: 'NEW'
    })

    return notifications
  },

  /**
   * Lookup vendor with required photo/field config.
   */
  async lookupVendor(id: number) {
    const record = await vendorRepo.findById(id)
    if (!record) {
      throw createError({ statusCode: 404, message: 'Vendor not found' })
    }
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      requiredPhotos: record.requiredPhotos,
      requiredFields: record.requiredFields
    }
  },

  /**
   * Lookup product models by vendor.
   */
  async lookupModels(vendorId: number) {
    return productModelRepo.findAll({ vendorId, isActive: true })
  },

  /**
   * Lookup active defects.
   */
  async lookupDefects() {
    return defectMasterRepo.findAll({ isActive: true })
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Internal helpers
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async _validateForeignKeys(data: Record<string, unknown>) {
    if (data.notificationId) {
      const notif = await notificationMasterRepo.findById(data.notificationId as number)
      if (!notif) {
        throw createError({ statusCode: 400, message: 'Notification not found' })
      }
    }

    if (data.vendorId) {
      const v = await vendorRepo.findById(data.vendorId as number)
      if (!v) {
        throw createError({ statusCode: 400, message: 'Vendor not found' })
      }
      if (!v.isActive) {
        throw createError({ statusCode: 400, message: 'Vendor is inactive' })
      }
    }

    if (data.modelId) {
      const m = await productModelRepo.findById(data.modelId as number)
      if (!m) {
        throw createError({ statusCode: 400, message: 'Product model not found' })
      }
      if (!m.isActive) {
        throw createError({ statusCode: 400, message: 'Product model is inactive' })
      }
    }

    if (data.defectCode) {
      const d = await defectMasterRepo.findByCode(data.defectCode as string)
      if (!d) {
        throw createError({ statusCode: 400, message: `Defect code '${data.defectCode}' not found` })
      }
      if (!d.isActive) {
        throw createError({ statusCode: 400, message: 'Defect is inactive' })
      }
    }
  },

  _validateVendorRequiredFields(
    vendorRecord: { requiredFields: string[] },
    data: Record<string, unknown>
  ) {
    const requiredFields = vendorRecord.requiredFields as string[]
    const missing: string[] = []

    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && !(data[field] as string).trim())) {
        missing.push(field)
      }
    }

    if (missing.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Vendor requires the following fields: ${missing.join(', ')}`
      })
    }
  }
}
