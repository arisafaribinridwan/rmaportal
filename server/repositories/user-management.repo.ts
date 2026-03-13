// server/repositories/user-management.repo.ts
// ========================================
// USER MANAGEMENT REPOSITORY
// ========================================
// Query layer untuk tabel user (better-auth).
// Mengikuti pattern vendor.repo.ts — Drizzle relational queries.

import { eq, desc, type SQL } from 'drizzle-orm'
import db from '~~/server/database'
import { user, session } from '~~/server/database/schema'

export const userManagementRepo = {
  /**
   * List semua user dengan optional filters (status, search).
   * Return field minimum sesuai kontrak:
   * id, name, email, username, role, branch, isActive, createdAt
   */
  async findAll(filters?: { isActive?: boolean, search?: string }) {
    return db.query.user.findMany({
      where: (u, { and, eq, or, like }) => {
        const conditions: SQL[] = []

        if (filters?.isActive !== undefined) {
          conditions.push(eq(u.isActive, filters.isActive))
        }

        if (filters?.search) {
          const term = `%${filters.search}%`
          conditions.push(
            or(
              like(u.name, term),
              like(u.email, term),
              like(u.username, term)
            )!
          )
        }

        return conditions.length ? and(...conditions) : undefined
      },
      columns: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        branch: true,
        isActive: true,
        createdAt: true
      },
      orderBy: [desc(user.createdAt)]
    })
  },

  /**
   * Get user by ID — full record untuk validasi service.
   */
  async findById(id: string) {
    return db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, id)
    })
  },

  /**
   * Get user by email — untuk cek duplikasi saat create.
   */
  async findByEmail(email: string) {
    return db.query.user.findFirst({
      where: (u, { eq }) => eq(u.email, email)
    })
  },

  /**
   * Get user by username — untuk cek duplikasi saat create.
   */
  async findByUsername(username: string) {
    return db.query.user.findFirst({
      where: (u, { eq }) => eq(u.username, username)
    })
  },

  /**
   * Update parsial user (role, isActive, branch).
   * Hanya update field yang diberikan.
   */
  async update(id: string, data: Partial<{ role: string, isActive: boolean, branch: string | null }>) {
    const [result] = await db
      .update(user)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning()

    return result
  },

  /**
   * Hapus semua session aktif user — untuk enforce logout saat deactivate.
   */
  async deleteUserSessions(userId: string) {
    await db
      .delete(session)
      .where(eq(session.userId, userId))
  }
}
