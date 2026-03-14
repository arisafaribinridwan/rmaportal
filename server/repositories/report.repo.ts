// server/repositories/report.repo.ts
import { eq, and, gte, lte, count, desc, type SQL } from 'drizzle-orm'
import db from '~~/server/database'
import {
  claim,
  vendor,
  productModel,
  notificationMaster,
  defectMaster
} from '~~/server/database/schema'
import type { ClaimStatus } from '~~/shared/utils/constants'
import { CLAIM_STATUSES } from '~~/shared/utils/constants'

export interface ReportFilters {
  dateFrom?: number // timestamp ms
  dateTo?: number // timestamp ms
  status?: ClaimStatus
  vendorId?: number
  branch?: string
  page?: number
  limit?: number
}

function buildConditions(filters?: ReportFilters): SQL[] {
  const conditions: SQL[] = []

  if (filters?.status) {
    conditions.push(eq(claim.claimStatus, filters.status))
  }

  if (filters?.vendorId) {
    conditions.push(eq(claim.vendorId, filters.vendorId))
  }

  if (filters?.branch) {
    conditions.push(eq(claim.branch, filters.branch))
  }

  if (filters?.dateFrom) {
    conditions.push(gte(claim.createdAt, new Date(filters.dateFrom)))
  }

  if (filters?.dateTo) {
    conditions.push(lte(claim.createdAt, new Date(filters.dateTo)))
  }

  return conditions
}

export const reportRepo = {
  /**
   * Get summary count per claim status within the given filters.
   */
  async getSummary(filters?: ReportFilters) {
    const conditions = buildConditions(filters)
    const whereClause = conditions.length ? and(...conditions) : undefined

    const rows = await db
      .select({
        status: claim.claimStatus,
        count: count()
      })
      .from(claim)
      .where(whereClause)
      .groupBy(claim.claimStatus)

    // Build full summary with 0 defaults for all statuses
    const summaryMap: Record<string, number> = {}
    for (const s of CLAIM_STATUSES) {
      summaryMap[s] = 0
    }
    for (const row of rows) {
      summaryMap[row.status] = row.count
    }

    const total = Object.values(summaryMap).reduce((a, b) => a + b, 0)

    return {
      total,
      DRAFT: summaryMap['DRAFT'] ?? 0,
      SUBMITTED: summaryMap['SUBMITTED'] ?? 0,
      IN_REVIEW: summaryMap['IN_REVIEW'] ?? 0,
      NEED_REVISION: summaryMap['NEED_REVISION'] ?? 0,
      APPROVED: summaryMap['APPROVED'] ?? 0,
      ARCHIVED: summaryMap['ARCHIVED'] ?? 0
    }
  },

  /**
   * Get detail report rows with pagination.
   */
  async getDetail(filters?: ReportFilters) {
    const conditions = buildConditions(filters)
    const whereClause = conditions.length ? and(...conditions) : undefined

    const page = filters?.page && filters.page > 0 ? filters.page : 1
    const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20
    const offset = (page - 1) * limit

    const [totalResult] = await db
      .select({ total: count() })
      .from(claim)
      .where(whereClause)

    const total = totalResult?.total ?? 0

    const data = await db
      .select({
        id: claim.id,
        claimNumber: claim.claimNumber,
        vendorId: claim.vendorId,
        vendorName: vendor.name,
        modelName: productModel.name,
        notificationCode: notificationMaster.notificationCode,
        defectCode: claim.defectCode,
        defectName: defectMaster.name,
        inch: claim.inch,
        branch: claim.branch,
        panelSerialNo: claim.panelSerialNo,
        ocSerialNo: claim.ocSerialNo,
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
   * Get all rows for CSV export (no pagination).
   */
  async getAllForExport(filters?: ReportFilters) {
    const conditions = buildConditions(filters)
    const whereClause = conditions.length ? and(...conditions) : undefined

    return db
      .select({
        claimNumber: claim.claimNumber,
        vendorName: vendor.name,
        modelName: productModel.name,
        notificationCode: notificationMaster.notificationCode,
        defectCode: claim.defectCode,
        defectName: defectMaster.name,
        inch: claim.inch,
        branch: claim.branch,
        panelSerialNo: claim.panelSerialNo,
        ocSerialNo: claim.ocSerialNo,
        claimStatus: claim.claimStatus,
        submittedBy: claim.submittedBy,
        createdAt: claim.createdAt
      })
      .from(claim)
      .leftJoin(vendor, eq(claim.vendorId, vendor.id))
      .leftJoin(productModel, eq(claim.modelId, productModel.id))
      .leftJoin(notificationMaster, eq(claim.notificationId, notificationMaster.id))
      .leftJoin(defectMaster, eq(claim.defectCode, defectMaster.code))
      .where(whereClause)
      .orderBy(desc(claim.createdAt))
  },

  /**
   * Get distinct vendor list for filter dropdown (safe for all roles).
   */
  async getVendorOptions() {
    return db
      .selectDistinct({ id: vendor.id, name: vendor.name })
      .from(claim)
      .innerJoin(vendor, eq(claim.vendorId, vendor.id))
      .orderBy(vendor.name)
  },

  /**
   * Get distinct branch list from existing claims.
   */
  async getBranchOptions() {
    const rows = await db
      .selectDistinct({ branch: claim.branch })
      .from(claim)
      .orderBy(claim.branch)

    return rows.map(r => r.branch)
  }
}
