// server/api/vendor-claims/index.get.ts
// List vendor claims with optional filters (paginated)
// Auth: QRCC, ADMIN (enforced by global middleware)
import { vendorClaimService } from '~~/server/services/vendor-claim.service'
import type { VendorClaimStatus } from '~~/shared/utils/constants'
import { VENDOR_CLAIM_STATUSES } from '~~/shared/utils/constants'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const filters: {
    vendorId?: number
    status?: VendorClaimStatus
    page?: number
    limit?: number
  } = {}

  if (query.vendorId) {
    const vendorId = Number(query.vendorId)
    if (!isNaN(vendorId) && vendorId > 0) filters.vendorId = vendorId
  }

  if (typeof query.status === 'string' && VENDOR_CLAIM_STATUSES.includes(query.status as VendorClaimStatus)) {
    filters.status = query.status as VendorClaimStatus
  }

  if (query.page) {
    const page = Number(query.page)
    if (!isNaN(page) && page > 0) filters.page = page
  }

  if (query.limit) {
    const limit = Number(query.limit)
    if (!isNaN(limit) && limit > 0) filters.limit = limit
  }

  return vendorClaimService.list(filters)
})
