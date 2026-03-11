// server/repositories/audit-trail.repo.ts
import { eq, desc, and, gte, lte, count, sql, type SQL } from 'drizzle-orm'
import db from '~~/server/database'
import {
  claimHistory,
  claim
} from '~~/server/database/schema'
import type { ClaimHistoryAction } from '~~/shared/utils/constants'

export interface AuditTrailFilters {
  action?: ClaimHistoryAction
  userId?: string
  keyword?: string // search by claim number
  dateFrom?: number // timestamp ms
  dateTo?: number // timestamp ms
  page?: number
  limit?: number
}

const auditSelect = {
  id: claimHistory.id,
  claimId: claimHistory.claimId,
  claimNumber: claim.claimNumber,
  action: claimHistory.action,
  fromStatus: claimHistory.fromStatus,
  toStatus: claimHistory.toStatus,
  userId: claimHistory.userId,
  userRole: claimHistory.userRole,
  note: claimHistory.note,
  createdAt: claimHistory.createdAt
}

function buildConditions(filters?: AuditTrailFilters): SQL[] {
  const conditions: SQL[] = []

  if (filters?.action) {
    conditions.push(eq(claimHistory.action, filters.action))
  }

  if (filters?.userId) {
    conditions.push(eq(claimHistory.userId, filters.userId))
  }

  if (filters?.keyword) {
    const kw = `%${filters.keyword}%`
    conditions.push(sql`${claim.claimNumber} LIKE ${kw}`)
  }

  if (filters?.dateFrom) {
    conditions.push(gte(claimHistory.createdAt, new Date(filters.dateFrom)))
  }

  if (filters?.dateTo) {
    conditions.push(lte(claimHistory.createdAt, new Date(filters.dateTo)))
  }

  return conditions
}

export const auditTrailRepo = {
  /**
   * Find all audit trail entries with filters and pagination.
   */
  async findAll(filters?: AuditTrailFilters) {
    const conditions = buildConditions(filters)
    const whereClause = conditions.length ? and(...conditions) : undefined

    const page = filters?.page && filters.page > 0 ? filters.page : 1
    const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20
    const offset = (page - 1) * limit

    // Get total count
    const [totalResult] = await db
      .select({ total: count() })
      .from(claimHistory)
      .innerJoin(claim, eq(claimHistory.claimId, claim.id))
      .where(whereClause)

    const total = totalResult?.total ?? 0

    // Get paginated data
    const data = await db
      .select(auditSelect)
      .from(claimHistory)
      .innerJoin(claim, eq(claimHistory.claimId, claim.id))
      .where(whereClause)
      .orderBy(desc(claimHistory.createdAt))
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
   * Find all entries for export (no pagination).
   */
  async findAllForExport(filters?: AuditTrailFilters) {
    const conditions = buildConditions(filters)
    const whereClause = conditions.length ? and(...conditions) : undefined

    return db
      .select(auditSelect)
      .from(claimHistory)
      .innerJoin(claim, eq(claimHistory.claimId, claim.id))
      .where(whereClause)
      .orderBy(desc(claimHistory.createdAt))
  }
}
