// server/api/users/index.post.ts
// POST /api/users — Create a new user (Admin only)
// Proteksi admin-only sudah ditangani oleh server/middleware/auth.ts
import { userManagementService } from '~~/server/services/user-management.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = await userManagementService.create(body, event)

  setResponseStatus(event, 201)
  return result
})
