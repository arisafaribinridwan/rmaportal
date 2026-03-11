// server/repositories/claim.repo.ts
import { eq, desc, and, gte, lte, count, sql, type SQL } from 'drizzle-orm'
import db from '~~/server/database'
import {
  claim,
  claimPhoto,
  claimHistory,
  vendor,
  productModel,
  notificationMaster,
  defectMaster
} from '~~/server/database/schema'
import type { InsertClaim, UpdateClaim, InsertClaimHistory, InsertClaimPhoto } from '~~/server/database/schema'
import type { ClaimStatus, PhotoType } from '~~/shared/utils/constants'

export interface ClaimListFilters {
  status?: ClaimStatus
  branch?: string
  vendorId?: number
  keyword?: string
  dateFrom?: number // timestamp ms
  dateTo?: number // timestamp ms
  submittedBy?: string
  page?: number
  limit?: number
}

export const claimRepo = {
  /**
   * Find all claims with optional filters, pagination, and joined summary fields.
   */
  async findAll(filters?: ClaimListFilters) {
    const conditions: SQL[] = []

    if (filters?.status) {
      conditions.push(eq(claim.claimStatus, filters.status))
    }

    if (filters?.branch) {
      conditions.push(eq(claim.branch, filters.branch))
    }

    if (filters?.vendorId) {
      conditions.push(eq(claim.vendorId, filters.vendorId))
    }

    if (filters?.submittedBy) {
      conditions.push(eq(claim.submittedBy, filters.submittedBy))
    }

    if (filters?.keyword) {
      const kw = `%${filters.keyword}%`
      // Search across claim number, panel SN, OC SN
      conditions.push(
        sql`(${claim.claimNumber} LIKE ${kw} OR ${claim.panelSerialNo} LIKE ${kw} OR ${claim.ocSerialNo} LIKE ${kw})`
      )
    }

    if (filters?.dateFrom) {
      conditions.push(gte(claim.createdAt, new Date(filters.dateFrom)))
    }

    if (filters?.dateTo) {
      conditions.push(lte(claim.createdAt, new Date(filters.dateTo)))
    }

    const whereClause = conditions.length ? and(...conditions) : undefined

    const page = filters?.page && filters.page > 0 ? filters.page : 1
    const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20
    const offset = (page - 1) * limit

    // Get total count
    const [totalResult] = await db
      .select({ total: count() })
      .from(claim)
      .where(whereClause)

    const total = totalResult?.total ?? 0

    // Get paginated data with joins
    const data = await db
      .select({
        id: claim.id,
        claimNumber: claim.claimNumber,
        notificationId: claim.notificationId,
        notificationCode: notificationMaster.notificationCode,
        modelId: claim.modelId,
        modelName: productModel.name,
        vendorId: claim.vendorId,
        vendorName: vendor.name,
        inch: claim.inch,
        branch: claim.branch,
        panelSerialNo: claim.panelSerialNo,
        ocSerialNo: claim.ocSerialNo,
        defectCode: claim.defectCode,
        defectName: defectMaster.name,
        claimStatus: claim.claimStatus,
        submittedBy: claim.submittedBy,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt
      })
      .from(claim)
      .leftJoin(vendor, eq(claim.vendorId, vendor.id))
      .leftJoin(productModel, eq(claim.modelId, productModel.id))
      .leftJoin(notificationMaster, eq(claim.notificationId, notificationMaster.id))
      .leftJoin(defectMaster, eq(claim.defectCode, defectMaster.code))
      .where(whereClause)
      .orderBy(desc(claim.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  },

  /**
   * Find a single claim by ID with all joined data.
   */
  async findById(id: number) {
    return db
      .select({
        id: claim.id,
        claimNumber: claim.claimNumber,
        notificationId: claim.notificationId,
        notificationCode: notificationMaster.notificationCode,
        modelId: claim.modelId,
        modelName: productModel.name,
        vendorId: claim.vendorId,
        vendorCode: vendor.code,
        vendorName: vendor.name,
        vendorRequiredPhotos: vendor.requiredPhotos,
        vendorRequiredFields: vendor.requiredFields,
        inch: claim.inch,
        branch: claim.branch,
        odfNumber: claim.odfNumber,
        panelSerialNo: claim.panelSerialNo,
        ocSerialNo: claim.ocSerialNo,
        defectCode: claim.defectCode,
        defectName: defectMaster.name,
        version: claim.version,
        week: claim.week,
        claimStatus: claim.claimStatus,
        submittedBy: claim.submittedBy,
        updatedBy: claim.updatedBy,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt
      })
      .from(claim)
      .leftJoin(vendor, eq(claim.vendorId, vendor.id))
      .leftJoin(productModel, eq(claim.modelId, productModel.id))
      .leftJoin(notificationMaster, eq(claim.notificationId, notificationMaster.id))
      .leftJoin(defectMaster, eq(claim.defectCode, defectMaster.code))
      .where(eq(claim.id, id))
      .get()
  },

  /**
   * Find a claim by claim number.
   */
  async findByClaimNumber(claimNumber: string) {
    return db
      .select()
      .from(claim)
      .where(eq(claim.claimNumber, claimNumber))
      .get()
  },

  /**
   * Insert a new claim.
   */
  async create(data: InsertClaim) {
    return db
      .insert(claim)
      .values(data)
      .returning()
      .get()
  },

  /**
   * Update claim fields by ID.
   */
  async update(id: number, data: UpdateClaim) {
    return db
      .update(claim)
      .set(data)
      .where(eq(claim.id, id))
      .returning()
      .get()
  },

  /**
   * Update claim status.
   */
  async updateStatus(id: number, status: ClaimStatus, updatedBy: string) {
    return db
      .update(claim)
      .set({ claimStatus: status, updatedBy })
      .where(eq(claim.id, id))
      .returning()
      .get()
  },

  // ── Claim Photos ─────────────────────────────────────────

  /**
   * Find all photos for a claim.
   */
  async findPhotosByClaimId(claimId: number) {
    return db
      .select()
      .from(claimPhoto)
      .where(eq(claimPhoto.claimId, claimId))
      .orderBy(claimPhoto.photoType)
  },

  /**
   * Find a specific photo by claim ID and photo type.
   */
  async findPhotoByClaimAndType(claimId: number, photoType: PhotoType) {
    return db
      .select()
      .from(claimPhoto)
      .where(and(eq(claimPhoto.claimId, claimId), eq(claimPhoto.photoType, photoType)))
      .get()
  },

  /**
   * Insert or replace a claim photo (upsert by claimId + photoType).
   */
  async upsertPhoto(data: InsertClaimPhoto) {
    // Check if photo for this claim + type already exists
    const existing = await this.findPhotoByClaimAndType(data.claimId, data.photoType)

    if (existing) {
      // Update existing photo
      return db
        .update(claimPhoto)
        .set({ filePath: data.filePath, thumbnailPath: data.thumbnailPath, status: 'PENDING' })
        .where(eq(claimPhoto.id, existing.id))
        .returning()
        .get()
    }

    // Insert new photo
    return db
      .insert(claimPhoto)
      .values(data)
      .returning()
      .get()
  },

  /**
   * Delete a claim photo by ID.
   */
  async deletePhoto(photoId: number) {
    return db
      .delete(claimPhoto)
      .where(eq(claimPhoto.id, photoId))
      .returning()
      .get()
  },

  // ── Claim History ────────────────────────────────────────

  /**
   * Insert a claim history entry.
   */
  async createHistory(data: InsertClaimHistory) {
    return db
      .insert(claimHistory)
      .values(data)
      .returning()
      .get()
  },

  /**
   * Find history for a claim (ordered by newest first).
   */
  async findHistoryByClaimId(claimId: number) {
    return db
      .select()
      .from(claimHistory)
      .where(eq(claimHistory.claimId, claimId))
      .orderBy(desc(claimHistory.createdAt))
  }
}
