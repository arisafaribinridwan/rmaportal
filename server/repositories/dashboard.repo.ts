import { sql, eq, and, gte, lte, count, desc } from 'drizzle-orm'
import db from '~~/server/database'
import {
  claim,
  claimHistory,
  vendorClaimItem
} from '~~/server/database/schema'
import type { Period } from '~~/app/types'

export const dashboardRepo = {
  async getSummary(startDate: Date, endDate: Date) {
    // Total Claims
    const [totalClaimsRow] = await db
      .select({ count: count() })
      .from(claim)
      .where(and(gte(claim.createdAt, startDate), lte(claim.createdAt, endDate)))

    // Submitted Claims
    const [submittedClaimsRow] = await db
      .select({ count: count() })
      .from(claim)
      .where(
        and(
          eq(claim.claimStatus, 'SUBMITTED'),
          gte(claim.createdAt, startDate),
          lte(claim.createdAt, endDate)
        )
      )

    // Need Revision Claims
    const [needRevisionClaimsRow] = await db
      .select({ count: count() })
      .from(claim)
      .where(
        and(
          eq(claim.claimStatus, 'NEED_REVISION'),
          gte(claim.createdAt, startDate),
          lte(claim.createdAt, endDate)
        )
      )

    // Approved Claims
    const [approvedClaimsRow] = await db
      .select({ count: count() })
      .from(claim)
      .where(
        and(
          eq(claim.claimStatus, 'APPROVED'),
          gte(claim.createdAt, startDate),
          lte(claim.createdAt, endDate)
        )
      )

    // Vendor Claim Pending
    const [pendingVendorClaimsRow] = await db
      .select({ count: count() })
      .from(vendorClaimItem)
      .where(
        and(
          eq(vendorClaimItem.vendorDecision, 'PENDING'),
          gte(vendorClaimItem.createdAt, startDate),
          lte(vendorClaimItem.createdAt, endDate)
        )
      )

    return {
      totalClaims: totalClaimsRow?.count ?? 0,
      submitted: submittedClaimsRow?.count ?? 0,
      needRevision: needRevisionClaimsRow?.count ?? 0,
      approved: approvedClaimsRow?.count ?? 0,
      vendorClaimPending: pendingVendorClaimsRow?.count ?? 0
    }
  },

  async getTrend(startDate: Date, endDate: Date, period: Period) {
    // Generate sqlite datetime modification based on period
    // Since createdAt is timestamp_ms, we need to convert it to unix epoch seconds then to datetime format
    let dateFormat = '%Y-%m-%d'
    if (period === 'monthly') {
      dateFormat = '%Y-%m'
    } else if (period === 'weekly') {
      // SQLite strftime('%W') returns week number
      dateFormat = '%Y-%W'
    }

    const dateExpression = sql`strftime(${dateFormat}, ${claim.createdAt} / 1000, 'unixepoch', 'localtime')`

    const data = await db
      .select({
        dateGroup: dateExpression,
        status: claim.claimStatus,
        count: count()
      })
      .from(claim)
      .where(
        and(
          gte(claim.createdAt, startDate),
          lte(claim.createdAt, endDate)
        )
      )
      .groupBy(dateExpression, claim.claimStatus)

    return data
  },

  async getLatestClaims(limit: number = 5) {
    return db
      .select({
        id: claim.id,
        claimNumber: claim.claimNumber,
        claimStatus: claim.claimStatus,
        createdAt: claim.createdAt,
        submittedBy: claim.submittedBy
      })
      .from(claim)
      .orderBy(desc(claim.createdAt))
      .limit(limit)
  },

  async getRecentReviewActivity(limit: number = 5) {
    return db
      .select({
        id: claimHistory.id,
        claimId: claimHistory.claimId,
        claimNumber: claim.claimNumber,
        action: claimHistory.action,
        fromStatus: claimHistory.fromStatus,
        toStatus: claimHistory.toStatus,
        createdAt: claimHistory.createdAt,
        userId: claimHistory.userId
      })
      .from(claimHistory)
      .leftJoin(claim, eq(claimHistory.claimId, claim.id))
      .orderBy(desc(claimHistory.createdAt))
      .limit(limit)
  },

  async getPendingVendorClaimItems(limit: number = 5) {
    return db
      .select({
        id: vendorClaimItem.id,
        claimId: vendorClaimItem.claimId,
        claimNumber: claim.claimNumber,
        vendorDecision: vendorClaimItem.vendorDecision,
        createdAt: vendorClaimItem.createdAt
      })
      .from(vendorClaimItem)
      .leftJoin(claim, eq(vendorClaimItem.claimId, claim.id))
      .where(eq(vendorClaimItem.vendorDecision, 'PENDING'))
      .orderBy(desc(vendorClaimItem.createdAt))
      .limit(limit)
  }
}
