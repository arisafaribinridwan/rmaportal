// server/services/vendor.service.ts
import { vendorRepo } from '~~/server/repositories/vendor.repo'
import { insertVendorSchema, updateVendorSchema, updateVendorStatusSchema } from '~~/server/database/schema'

export const vendorService = {
  /**
   * List vendors with optional filters.
   */
  async list(filters?: { isActive?: boolean, search?: string }) {
    return vendorRepo.findAll(filters)
  },

  /**
   * Get a single vendor by ID. Throws 404 if not found.
   */
  async getById(id: number) {
    const record = await vendorRepo.findById(id)
    if (!record) {
      throw createError({ statusCode: 404, message: 'Vendor not found' })
    }
    return record
  },

  /**
   * Create a new vendor. Validates input and checks code uniqueness.
   */
  async create(body: unknown, userId: number) {
    const data = insertVendorSchema.parse({
      ...body as Record<string, unknown>,
      createdBy: userId,
      updatedBy: userId
    })

    const existing = await vendorRepo.findByCode(data.code)
    if (existing) {
      throw createError({ statusCode: 409, message: `Vendor code '${data.code}' already exists` })
    }

    return vendorRepo.create(data)
  },

  /**
   * Update an existing vendor. Validates input, checks existence & code uniqueness.
   */
  async update(id: number, body: unknown, userId: number) {
    const data = updateVendorSchema.parse({
      ...body as Record<string, unknown>,
      updatedBy: userId
    })

    // Ensure vendor exists
    const existing = await vendorRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Vendor not found' })
    }

    // If code is being changed, check uniqueness
    if (data.code && data.code !== existing.code) {
      const duplicate = await vendorRepo.findByCode(data.code)
      if (duplicate) {
        throw createError({ statusCode: 409, message: `Vendor code '${data.code}' already exists` })
      }
    }

    return vendorRepo.update(id, data)
  },

  /**
   * Toggle vendor active status (soft delete / restore).
   */
  async updateStatus(id: number, body: unknown, userId: number) {
    const data = updateVendorStatusSchema.parse({
      ...body as Record<string, unknown>,
      updatedBy: userId
    })

    const existing = await vendorRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Vendor not found' })
    }

    return vendorRepo.updateStatus(id, data)
  }
}
