// server/repositories/vendor.repo.ts
import { eq, desc, and, like, type SQL } from 'drizzle-orm'
import db from '~~/server/database'
import { vendor } from '~~/server/database/schema'
import type { InsertVendor, UpdateVendor, UpdateVendorStatus } from '~~/server/database/schema'

export const vendorRepo = {
  /**
   * Find all vendors with optional filters.
   */
  async findAll(filters?: { isActive?: boolean, search?: string }) {
    const conditions: SQL[] = []

    if (filters?.isActive !== undefined) {
      conditions.push(eq(vendor.isActive, filters.isActive))
    }

    if (filters?.search) {
      conditions.push(like(vendor.name, `%${filters.search}%`))
    }

    return db
      .select()
      .from(vendor)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(vendor.createdAt))
  },

  /**
   * Find a single vendor by ID.
   */
  async findById(id: number) {
    return db
      .select()
      .from(vendor)
      .where(eq(vendor.id, id))
      .get()
  },

  /**
   * Find a single vendor by code.
   */
  async findByCode(code: string) {
    return db
      .select()
      .from(vendor)
      .where(eq(vendor.code, code))
      .get()
  },

  /**
   * Insert a new vendor.
   */
  async create(data: InsertVendor) {
    return db
      .insert(vendor)
      .values(data)
      .returning()
      .get()
  },

  /**
   * Update vendor fields by ID.
   */
  async update(id: number, data: UpdateVendor) {
    return db
      .update(vendor)
      .set(data)
      .where(eq(vendor.id, id))
      .returning()
      .get()
  },

  /**
   * Toggle vendor active status (soft delete / restore).
   */
  async updateStatus(id: number, data: UpdateVendorStatus) {
    return db
      .update(vendor)
      .set(data)
      .where(eq(vendor.id, id))
      .returning()
      .get()
  }
}
