// server/api/users/index.get.ts
// GET /api/users — List all users (Admin only)
// Proteksi admin-only sudah ditangani oleh server/middleware/auth.ts
import { userManagementService } from '~~/server/services/user-management.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const filters: { isActive?: boolean, search?: string } = {}

  if (query.isActive !== undefined) {
    filters.isActive = query.isActive === 'true'
  }

  if (typeof query.search === 'string' && query.search.trim()) {
    filters.search = query.search.trim()
  }

  return userManagementService.list(filters)
})
