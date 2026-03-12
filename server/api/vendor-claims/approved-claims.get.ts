// server/api/vendor-claims/approved-claims.get.ts
// Get approved claims for a vendor that haven't been batched yet
// Used by the vendor claim wizard (Step 1/2) to display available claims
// Auth: QRCC, ADMIN (enforced by global middleware)
import { vendorClaimService } from '~~/server/services/vendor-claim.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const vendorId = Number(query.vendorId)
  if (!vendorId || isNaN(vendorId)) {
    throw createError({ statusCode: 400, message: 'vendorId query parameter is required' })
  }

  return vendorClaimService.getApprovedClaims(vendorId)
})
