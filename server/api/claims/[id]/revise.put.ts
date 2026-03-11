// server/api/claims/[id]/revise.put.ts
// PUT /api/claims/:id/revise — Submit revision for a NEED_REVISION claim
import { claimService } from '~~/server/services/claim.service'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')

  if (!idParam) {
    throw createError({ statusCode: 400, message: 'Claim ID is required' })
  }

  const id = Number(idParam)
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid claim ID' })
  }

  const session = event.context.auth
  const user = session.user
  const body = await readBody(event)

  return claimService.submitRevision(id, body, user.id, user.role)
})
