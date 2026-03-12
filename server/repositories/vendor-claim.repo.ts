// server/repositories/vendor-claim.repo.ts
import { eq, desc, and, count, notInArray, type SQL } from 'drizzle-orm'
import db from '~~/server/database'
import type { db as DbClient, DbTransaction } from '~~/server/database'
import {
  vendorClaim,
  vendorClaimItem,
  claim,
  vendor,
  claimHistory
} from '~~/server/database/schema'
import type { InsertClaimHistory } from '~~/server/database/schema'
import type { VendorClaimStatus } from '~~/shared/utils/constants'

export interface VendorClaimListFilters {
  vendorId?: number
  status?: VendorClaimStatus
  page?: number
  limit?: number
}

export const vendorClaimRepo = {
  // ── Vendor Claim ──────────────────────────────────────────

  /**
   * Find all vendor claims with pagination and optional filters.
   */
  async findAll(filters?: VendorClaimListFilters) {
    const conditions: SQL[] = []

    if (filters?.vendorId) {
      conditions.push(eq(vendorClaim.vendorId, filters.vendorId))
    }

    if (filters?.status) {
      conditions.push(eq(vendorClaim.status, filters.status))
    }

    const whereClause = conditions.length ? and(...conditions) : undefined

    const page = filters?.page && filters.page > 0 ? filters.page : 1
    const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20
    const offset = (page - 1) * limit

    // Get total count
    const [totalResult] = await db
      .select({ total: count() })
      .from(vendorClaim)
      .where(whereClause)

    const total = totalResult?.total ?? 0

    // Get paginated data with vendor join
    const data = await db
      .select({
        id: vendorClaim.id,
        vendorClaimNo: vendorClaim.vendorClaimNo,
        vendorId: vendorClaim.vendorId,
        vendorName: vendor.name,
        vendorCode: vendor.code,
        submittedAt: vendorClaim.submittedAt,
        status: vendorClaim.status,
        createdBy: vendorClaim.createdBy,
        createdAt: vendorClaim.createdAt,
        updatedAt: vendorClaim.updatedAt
      })
      .from(vendorClaim)
      .leftJoin(vendor, eq(vendorClaim.vendorId, vendor.id))
      .where(whereClause)
      .orderBy(desc(vendorClaim.createdAt))
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
   * Find a single vendor claim by ID with vendor info.
   */
  async findById(id: number) {
    return db
      .select({
        id: vendorClaim.id,
        vendorClaimNo: vendorClaim.vendorClaimNo,
        vendorId: vendorClaim.vendorId,
        vendorName: vendor.name,
        vendorCode: vendor.code,
        submittedAt: vendorClaim.submittedAt,
        reportSnapshot: vendorClaim.reportSnapshot,
        status: vendorClaim.status,
        createdBy: vendorClaim.createdBy,
        updatedBy: vendorClaim.updatedBy,
        createdAt: vendorClaim.createdAt,
        updatedAt: vendorClaim.updatedAt
      })
      .from(vendorClaim)
      .leftJoin(vendor, eq(vendorClaim.vendorId, vendor.id))
      .where(eq(vendorClaim.id, id))
      .get()
  },

  /**
   * Insert a new vendor claim.
   * Uses Drizzle's native table infer type for proper timestamp handling.
   */
  async create(data: typeof vendorClaim.$inferInsert, executor: DbClient | DbTransaction = db) {
    return executor
      .insert(vendorClaim)
      .values(data)
      .returning()
      .get()
  },

  /**
   * Update a vendor claim by ID.
   */
  async update(id: number, data: Partial<typeof vendorClaim.$inferInsert>, executor: DbClient | DbTransaction = db) {
    return executor
      .update(vendorClaim)
      .set(data)
      .where(eq(vendorClaim.id, id))
      .returning()
      .get()
  },

  // ── Vendor Claim Items ────────────────────────────────────

  /**
   * Bulk insert vendor claim items.
   * Uses Drizzle's native table infer type for proper timestamp handling.
   */
  async createItems(items: (typeof vendorClaimItem.$inferInsert)[], executor: DbClient | DbTransaction = db) {
    return executor
      .insert(vendorClaimItem)
      .values(items)
      .returning()
  },

  /**
   * Find all items for a vendor claim, joined with claim data.
   */
  async findItemsByVendorClaimId(vendorClaimId: number) {
    return db
      .select({
        id: vendorClaimItem.id,
        vendorClaimId: vendorClaimItem.vendorClaimId,
        claimId: vendorClaimItem.claimId,
        claimNumber: claim.claimNumber,
        panelSerialNo: claim.panelSerialNo,
        ocSerialNo: claim.ocSerialNo,
        defectCode: claim.defectCode,
        branch: claim.branch,
        inch: claim.inch,
        vendorDecision: vendorClaimItem.vendorDecision,
        compensation: vendorClaimItem.compensation,
        rejectReason: vendorClaimItem.rejectReason,
        vendorDecisionBy: vendorClaimItem.vendorDecisionBy,
        vendorDecisionAt: vendorClaimItem.vendorDecisionAt,
        createdAt: vendorClaimItem.createdAt,
        updatedAt: vendorClaimItem.updatedAt
      })
      .from(vendorClaimItem)
      .leftJoin(claim, eq(vendorClaimItem.claimId, claim.id))
      .where(eq(vendorClaimItem.vendorClaimId, vendorClaimId))
      .orderBy(vendorClaimItem.id)
  },

  // ── Approved Claims Query ─────────────────────────────────

  /**
   * Find all APPROVED claims for a specific vendor that are NOT yet
   * included in any vendor claim batch.
   * Uses NOT IN subquery to exclude claims already in vendor_claim_item.
   */
  async findApprovedClaimsForVendor(vendorId: number, executor: DbClient | DbTransaction = db) {
    // Get claim IDs already in vendor_claim_item
    const existingClaimIds = await executor
      .select({ claimId: vendorClaimItem.claimId })
      .from(vendorClaimItem)

    const excludeIds = existingClaimIds.map((r: { claimId: number }) => r.claimId)

    const conditions: SQL[] = [
      eq(claim.vendorId, vendorId),
      eq(claim.claimStatus, 'APPROVED')
    ]

    // Exclude claims already batched
    if (excludeIds.length > 0) {
      conditions.push(notInArray(claim.id, excludeIds))
    }

    return executor
      .select({
        id: claim.id,
        claimNumber: claim.claimNumber,
        notificationId: claim.notificationId,
        modelId: claim.modelId,
        vendorId: claim.vendorId,
        inch: claim.inch,
        branch: claim.branch,
        odfNumber: claim.odfNumber,
        panelSerialNo: claim.panelSerialNo,
        ocSerialNo: claim.ocSerialNo,
        defectCode: claim.defectCode,
        version: claim.version,
        week: claim.week,
        claimStatus: claim.claimStatus,
        createdAt: claim.createdAt
      })
      .from(claim)
      .where(and(...conditions))
      .orderBy(desc(claim.createdAt))
  },

  // ── Claim History ─────────────────────────────────────────

  /**
   * Record a claim history entry (used when generating vendor claim).
   */
  async createClaimHistory(data: InsertClaimHistory, executor: DbClient | DbTransaction = db) {
    return executor
      .insert(claimHistory)
      .values(data)
      .returning()
      .get()
  }
}
