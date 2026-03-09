// server/repositories/product-model.repo.ts
import { eq, desc, and, like, type SQL } from 'drizzle-orm'
import db from '~~/server/database'
import { productModel } from '~~/server/database/schema'
import type { InsertProductModel, UpdateProductModel, UpdateProductModelStatus } from '~~/server/database/schema'

export const productModelRepo = {
  /**
   * Find all product models with optional filters.
   */
  async findAll(filters?: { isActive?: boolean, search?: string, vendorId?: number }) {
    const conditions: SQL[] = []

    if (filters?.isActive !== undefined) {
      conditions.push(eq(productModel.isActive, filters.isActive))
    }

    if (filters?.vendorId !== undefined) {
      conditions.push(eq(productModel.vendorId, filters.vendorId))
    }

    if (filters?.search) {
      conditions.push(like(productModel.name, `%${filters.search}%`))
    }

    return db
      .select()
      .from(productModel)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(productModel.createdAt))
  },

  /**
   * Find a single product model by ID.
   */
  async findById(id: number) {
    return db
      .select()
      .from(productModel)
      .where(eq(productModel.id, id))
      .get()
  },

  /**
   * Find a single product model by Name and VendorId.
   */
  async findByNameAndVendor(name: string, vendorId: number) {
    return db
      .select()
      .from(productModel)
      .where(and(eq(productModel.name, name), eq(productModel.vendorId, vendorId)))
      .get()
  },

  /**
   * Insert a new product model.
   */
  async create(data: InsertProductModel) {
    return db
      .insert(productModel)
      .values(data)
      .returning()
      .get()
  },

  /**
   * Update product model fields by ID.
   */
  async update(id: number, data: UpdateProductModel) {
    return db
      .update(productModel)
      .set(data)
      .where(eq(productModel.id, id))
      .returning()
      .get()
  },

  /**
   * Toggle product model active status (soft delete / restore).
   */
  async updateStatus(id: number, data: UpdateProductModelStatus) {
    return db
      .update(productModel)
      .set({
        isActive: data.isActive,
        updatedBy: data.updatedBy
      })
      .where(eq(productModel.id, id))
      .returning()
      .get()
  }
}
