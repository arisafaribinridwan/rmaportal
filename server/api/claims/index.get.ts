// server/api/claims/index.get.ts
// GET /api/claims — List claims with filters and pagination
// Role guard: CS, QRCC, ADMIN (handled by global middleware)
import { claimService } from '~~/server/services/claim.service'
import { CLAIM_STATUSES } from '~~/shared/utils/constants'
import type { ClaimStatus } from '~~/shared/utils/constants'
import type { ClaimListFilters } from '~~/server/repositories/claim.repo'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const filters: ClaimListFilters = {}

  // Filter: status
  if (typeof query.status === 'string' && CLAIM_STATUSES.includes(query.status as ClaimStatus)) {
    filters.status = query.status as ClaimStatus
  }

  // Filter: branch
  if (typeof query.branch === 'string' && query.branch.trim()) {
    filters.branch = query.branch.trim()
  }

  // Filter: vendorId
  if (query.vendorId !== undefined) {
    const vendorId = Number(query.vendorId)
    if (!isNaN(vendorId) && vendorId > 0) {
      filters.vendorId = vendorId
    }
  }

  // Filter: keyword (search claim number, panel SN, OC SN)
  if (typeof query.keyword === 'string' && query.keyword.trim()) {
    filters.keyword = query.keyword.trim()
  }

  // Filter: date range
  if (query.dateFrom !== undefined) {
    const dateFrom = Number(query.dateFrom)
    if (!isNaN(dateFrom)) {
      filters.dateFrom = dateFrom
    }
  }

  if (query.dateTo !== undefined) {
    const dateTo = Number(query.dateTo)
    if (!isNaN(dateTo)) {
      filters.dateTo = dateTo
    }
  }

  // Pagination
  if (query.page !== undefined) {
    const page = Number(query.page)
    if (!isNaN(page) && page > 0) {
      filters.page = page
    }
  }

  if (query.limit !== undefined) {
    const limit = Number(query.limit)
    if (!isNaN(limit) && limit > 0) {
      filters.limit = limit
    }
  }

  return claimService.list(filters)
})
