// server/services/product-model.service.ts
import { productModelRepo } from '~~/server/repositories/product-model.repo'
import { insertProductModelSchema, updateProductModelSchema, updateProductModelStatusSchema } from '~~/server/database/schema'

export const productModelService = {
  /**
   * List product models with optional filters.
   */
  async list(filters?: { isActive?: boolean, search?: string, vendorId?: number }) {
    return productModelRepo.findAll(filters)
  },

  /**
   * Get a single product model by ID. Throws 404 if not found.
   */
  async getById(id: number) {
    const record = await productModelRepo.findById(id)
    if (!record) {
      throw createError({ statusCode: 404, message: 'Product model not found' })
    }
    return record
  },

  /**
   * Create a new product model. Validates input and checks unique constraint (name, vendorId).
   */
  async create(body: unknown, userId: string) {
    const data = insertProductModelSchema.parse({
      ...body as Record<string, unknown>,
      createdBy: userId,
      updatedBy: userId
    })

    const existing = await productModelRepo.findByNameAndVendor(data.name, data.vendorId)
    if (existing) {
      throw createError({ statusCode: 409, message: `Product model '${data.name}' for this vendor already exists` })
    }

    return productModelRepo.create(data)
  },

  /**
   * Update an existing product model. Validates input, checks existence & unique constraint.
   */
  async update(id: number, body: unknown, userId: string) {
    const data = updateProductModelSchema.parse({
      ...body as Record<string, unknown>,
      updatedBy: userId
    })

    // Ensure product model exists
    const existing = await productModelRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Product model not found' })
    }

    // Check uniqueness constraint if name or vendorId is being changed
    const newName = data.name ?? existing.name
    const newVendorId = data.vendorId ?? existing.vendorId

    if (newName !== existing.name || newVendorId !== existing.vendorId) {
      const duplicate = await productModelRepo.findByNameAndVendor(newName, newVendorId)
      if (duplicate && duplicate.id !== id) {
        throw createError({ statusCode: 409, message: `Product model '${newName}' for this vendor already exists` })
      }
    }

    return productModelRepo.update(id, data)
  },

  /**
   * Toggle product model active status (soft delete / restore).
   */
  async updateStatus(id: number, body: unknown, userId: string) {
    const data = updateProductModelStatusSchema.parse({
      ...body as Record<string, unknown>,
      updatedBy: userId
    })

    const existing = await productModelRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Product model not found' })
    }

    return productModelRepo.updateStatus(id, data)
  }
}
