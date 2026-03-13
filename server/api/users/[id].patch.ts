// server/api/users/[id].patch.ts
// PATCH /api/users/:id — Update user role/status (Admin only)
// Proteksi admin-only sudah ditangani oleh server/middleware/auth.ts
import { userManagementService } from '~~/server/services/user-management.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const targetUserId = getRouterParam(event, 'id')

  if (!targetUserId) {
    throw createError({ statusCode: 400, message: 'User ID is required' })
  }

  const body = await readBody(event)

  return userManagementService.update(targetUserId, body, user.id, event)
})
