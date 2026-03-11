// server/api/claims/[id].put.ts
// PUT /api/claims/:id — Update a draft claim
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

  return claimService.updateDraft(id, body, user.id, user.role)
})
