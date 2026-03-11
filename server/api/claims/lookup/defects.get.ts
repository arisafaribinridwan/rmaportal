// server/api/claims/lookup/defects.get.ts
// GET /api/claims/lookup/defects — Lookup active defects
import { claimService } from '~~/server/services/claim.service'

export default defineEventHandler(async () => {
  return claimService.lookupDefects()
})
