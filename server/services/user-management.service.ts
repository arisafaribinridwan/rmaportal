// server/services/user-management.service.ts
// ========================================
// USER MANAGEMENT SERVICE
// ========================================
// Business logic untuk list/create/update user.
// Menggunakan better-auth admin API untuk create user
// agar jalur auth valid (akun bisa login normal).

import { z } from 'zod'
import { USER_ROLES, DEFAULT_INITIAL_PASSWORD } from '~~/shared/utils/constants'
import { userManagementRepo } from '~~/server/repositories/user-management.repo'
import { auth } from '~~/server/utils/auth'
import type { H3Event } from 'h3'

// ────────────────────────────────────────────────────────────
// Zod Schemas
// ────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dots, and hyphens'),
  role: z.enum(USER_ROLES, { message: 'Invalid role' }),
  branch: z.string().optional()
})

const updateUserSchema = z.object({
  role: z.enum(USER_ROLES, { message: 'Invalid role' }).optional(),
  isActive: z.boolean().optional()
})

export const userManagementService = {
  /**
   * List semua user dengan optional filters.
   */
  async list(filters?: { isActive?: boolean, search?: string }) {
    return userManagementRepo.findAll(filters)
  },

  /**
   * Create user baru melalui better-auth admin API.
   * Menggunakan jalur auth yang valid agar akun bisa login normal.
   *
   * Rules:
   * - branch wajib jika role = CS
   * - email dan username harus unik
   * - password menggunakan DEFAULT_INITIAL_PASSWORD
   */
  async create(body: unknown, event: H3Event) {
    const data = createUserSchema.parse(body)

    // Rule: branch wajib jika role CS
    if (data.role === 'CS' && !data.branch?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Branch is required when role is CS'
      })
    }

    // Cek duplikasi email
    const existingEmail = await userManagementRepo.findByEmail(data.email)
    if (existingEmail) {
      throw createError({
        statusCode: 409,
        message: `Email '${data.email}' is already registered`
      })
    }

    // Cek duplikasi username
    const existingUsername = await userManagementRepo.findByUsername(data.username)
    if (existingUsername) {
      throw createError({
        statusCode: 409,
        message: `Username '${data.username}' is already taken`
      })
    }

    // Create user via better-auth admin API (jalur auth valid)
    // Ini akan membuat record di tabel user + account dengan password yang di-hash.
    // better-auth createUser membutuhkan headers dari request yang sudah authenticated
    // supaya admin context tervalidasi.
    const result = await auth.api.createUser({
      body: {
        email: data.email,
        password: DEFAULT_INITIAL_PASSWORD,
        name: data.name,
        role: data.role,
        data: {
          username: data.username,
          displayUsername: data.username,
          branch: data.role === 'CS' ? data.branch!.trim() : (data.branch?.trim() || null),
          isActive: true
        }
      },
      headers: event.headers
    })

    if (!result) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create user through auth system'
      })
    }

    // better-auth createUser returns { user: UserWithRole }
    const newUser = result.user ?? result
    // Cast ke shape eksplisit untuk additionalFields (username, branch, isActive)
    // yang ada di DB tapi tidak di-type oleh better-auth UserWithRole
    const userWithAdditionalFields = newUser as unknown as {
      username?: string | null
      branch?: string | null
      isActive?: boolean
    }

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        username: userWithAdditionalFields.username ?? null,
        role: newUser.role,
        branch: userWithAdditionalFields.branch ?? null,
        isActive: userWithAdditionalFields.isActive ?? true,
        createdAt: newUser.createdAt
      },
      defaultPassword: DEFAULT_INITIAL_PASSWORD
    }
  },

  /**
   * Update parsial user (role dan/atau isActive).
   *
   * Rules:
   * - Admin tidak boleh update dirinya sendiri
   * - Role CS ditolak jika target tidak punya branch
   * - Deactivate user → revoke semua session (enforce logout)
   */
  async update(targetUserId: string, body: unknown, adminId: string, event: H3Event) {
    const data = updateUserSchema.parse(body)

    // Minimal harus ada satu field yang diupdate
    if (data.role === undefined && data.isActive === undefined) {
      throw createError({
        statusCode: 400,
        message: 'At least one field (role or isActive) must be provided'
      })
    }

    // Rule: Admin tidak boleh update dirinya sendiri
    if (targetUserId === adminId) {
      throw createError({
        statusCode: 403,
        message: 'You cannot modify your own role or status'
      })
    }

    // Pastikan target user ada
    const targetUser = await userManagementRepo.findById(targetUserId)
    if (!targetUser) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      })
    }

    // Rule: Jika role diubah ke CS, target harus punya branch
    if (data.role === 'CS' && !targetUser.branch?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Cannot set role to CS — user does not have a branch assigned'
      })
    }

    // Update role via better-auth setRole jika role berubah
    // Pass headers agar better-auth bisa validasi admin context
    if (data.role !== undefined && data.role !== targetUser.role) {
      await auth.api.setRole({
        body: {
          userId: targetUserId,
          role: data.role
        },
        headers: event.headers
      })
    }

    // Update isActive via repository (isActive bukan bagian better-auth core,
    // melainkan additionalField yang kita kelola sendiri)
    if (data.isActive !== undefined && data.isActive !== targetUser.isActive) {
      await userManagementRepo.update(targetUserId, { isActive: data.isActive })

      // Jika user dinonaktifkan → revoke semua session untuk enforce logout
      if (data.isActive === false) {
        try {
          await auth.api.revokeUserSessions({
            body: { userId: targetUserId },
            headers: event.headers
          })
        } catch {
          // Fallback: hapus session langsung dari DB jika better-auth API gagal
          await userManagementRepo.deleteUserSessions(targetUserId)
        }
      }
    }

    // Ambil data user yang sudah diupdate
    const updatedUser = await userManagementRepo.findById(targetUserId)
    return updatedUser
  }
}
