// app/types/user-management.ts
// ========================================
// USER MANAGEMENT — Frontend Types
// ========================================
// Type khusus user management agar tidak bentrok
// dengan type dummy di app/types/index.d.ts

import type { UserRole } from '~~/shared/utils/constants'

/**
 * Shape data user yang ditampilkan di tabel user management.
 * Sesuai kontrak response minimum dari GET /api/users.
 */
export interface ManagedUser {
  id: string
  name: string
  email: string
  username: string | null
  role: UserRole | string | null
  branch: string | null
  isActive: boolean
  createdAt: string | number | Date
}

/**
 * Payload untuk create user baru (POST /api/users).
 */
export interface CreateUserPayload {
  name: string
  email: string
  username: string
  role: UserRole
  branch?: string
}

/**
 * Response dari create user — menyertakan info password default.
 */
export interface CreateUserResponse {
  user: ManagedUser
  defaultPassword: string
}

/**
 * Payload untuk update role user (PATCH /api/users/[id]).
 */
export interface UpdateUserRolePayload {
  role: UserRole
}

/**
 * Payload untuk update status aktif user (PATCH /api/users/[id]).
 */
export interface UpdateUserStatusPayload {
  isActive: boolean
}

/**
 * Union payload untuk PATCH — bisa role saja, status saja, atau keduanya.
 */
export type UpdateUserPayload = UpdateUserRolePayload | UpdateUserStatusPayload

/**
 * Filter status untuk tabel user management.
 */
export type UserStatusFilter = 'all' | 'active' | 'inactive'
