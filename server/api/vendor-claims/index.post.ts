// server/api/vendor-claims/index.post.ts
// Generate a new vendor claim batch
// Auth: QRCC, ADMIN (enforced by global middleware)
// Ref: Task #26 — Vendor Claim Generate
import { vendorClaimService } from '~~/server/services/vendor-claim.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const body = await readBody(event)

  const created = await vendorClaimService.generate(body, user.id, user.role)

  setResponseStatus(event, 201)
  return created
})
