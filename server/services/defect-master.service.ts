// server/services/defect-master.service.ts
import { defectMasterRepo } from '~~/server/repositories/defect-master.repo'
import { insertDefectMasterSchema, updateDefectMasterSchema, updateDefectMasterStatusSchema } from '~~/server/database/schema'

export const defectMasterService = {
  async list(filters?: { isActive?: boolean, search?: string }) {
    return defectMasterRepo.findAll(filters)
  },

  async getById(id: number) {
    const record = await defectMasterRepo.findById(id)
    if (!record) {
      throw createError({ statusCode: 404, message: 'Defect not found' })
    }
    return record
  },

  async create(body: unknown, userId: string) {
    const data = insertDefectMasterSchema.parse({
      ...body as Record<string, unknown>,
      createdBy: userId,
      updatedBy: userId
    })

    const existingCode = await defectMasterRepo.findByCode(data.code)
    if (existingCode) {
      throw createError({ statusCode: 409, message: `Defect code '${data.code}' already exists` })
    }

    const existingName = await defectMasterRepo.findByName(data.name)
    if (existingName) {
      throw createError({ statusCode: 409, message: `Defect name '${data.name}' already exists` })
    }

    return defectMasterRepo.create(data)
  },

  async update(id: number, body: unknown, userId: string) {
    const data = updateDefectMasterSchema.parse({
      ...body as Record<string, unknown>,
      updatedBy: userId
    })

    const existing = await defectMasterRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Defect not found' })
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await defectMasterRepo.findByCode(data.code)
      if (duplicate) {
        throw createError({ statusCode: 409, message: `Defect code '${data.code}' already exists` })
      }
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await defectMasterRepo.findByName(data.name)
      if (duplicate) {
        throw createError({ statusCode: 409, message: `Defect name '${data.name}' already exists` })
      }
    }

    return defectMasterRepo.update(id, data)
  },

  async updateStatus(id: number, body: unknown, userId: string) {
    const data = updateDefectMasterStatusSchema.parse({
      ...body as Record<string, unknown>,
      updatedBy: userId
    })

    const existing = await defectMasterRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Defect not found' })
    }

    return defectMasterRepo.updateStatus(id, data)
  }
}
