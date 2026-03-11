// server/api/claims/index.post.ts
// POST /api/claims — Create a draft claim
// Role guard: CS, QRCC, ADMIN (handler-level: only CS creates claims typically)
import { claimService } from '~~/server/services/claim.service'

export default defineEventHandler(async (event) => {
  // Auth is enforced by global middleware; session is attached to event.context.auth
  const session = event.context.auth
  const user = session.user
  const body = await readBody(event)

  const created = await claimService.createDraft(body, user.id, user.role)

  setResponseStatus(event, 201)
  return created
})
