// server/repositories/defect-master.repo.ts
import { eq, desc, and, like, type SQL } from 'drizzle-orm'
import db from '~~/server/database'
import { defectMaster } from '~~/server/database/schema'
import type { InsertDefectMaster, UpdateDefectMaster, UpdateDefectMasterStatus } from '~~/server/database/schema'

export const defectMasterRepo = {
  async findAll(filters?: { isActive?: boolean, search?: string }) {
    const conditions: SQL[] = []

    if (filters?.isActive !== undefined) {
      conditions.push(eq(defectMaster.isActive, filters.isActive))
    }

    if (filters?.search) {
      conditions.push(like(defectMaster.name, `%${filters.search}%`))
    }

    return db
      .select()
      .from(defectMaster)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(defectMaster.createdAt))
  },

  async findById(id: number) {
    return db
      .select()
      .from(defectMaster)
      .where(eq(defectMaster.id, id))
      .get()
  },

  async findByCode(code: string) {
    return db
      .select()
      .from(defectMaster)
      .where(eq(defectMaster.code, code))
      .get()
  },

  async findByName(name: string) {
    return db
      .select()
      .from(defectMaster)
      .where(eq(defectMaster.name, name))
      .get()
  },

  async create(data: InsertDefectMaster) {
    return db
      .insert(defectMaster)
      .values(data)
      .returning()
      .get()
  },

  async update(id: number, data: UpdateDefectMaster) {
    return db
      .update(defectMaster)
      .set(data)
      .where(eq(defectMaster.id, id))
      .returning()
      .get()
  },

  async updateStatus(id: number, data: UpdateDefectMasterStatus) {
    return db
      .update(defectMaster)
      .set(data)
      .where(eq(defectMaster.id, id))
      .returning()
      .get()
  }
}
