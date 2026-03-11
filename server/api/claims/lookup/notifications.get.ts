// server/api/claims/lookup/notifications.get.ts
// GET /api/claims/lookup/notifications?search=xxx — Lookup NEW notifications for wizard
import { claimService } from '~~/server/services/claim.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const search = typeof query.search === 'string' ? query.search.trim() : ''

  if (!search) {
    return []
  }

  return claimService.lookupNotification(search)
})
