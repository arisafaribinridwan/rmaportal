// server/repositories/notification-master.repo.ts
import { eq, desc, and, like, type SQL } from 'drizzle-orm'
import db from '~~/server/database'
import { notificationMaster, vendor, productModel } from '~~/server/database/schema'
import type { InsertNotificationMaster, UpdateNotificationMaster, UpdateNotificationMasterStatus } from '~~/server/database/schema'
import type { NotificationStatus } from '~~/shared/utils/constants'

export const notificationMasterRepo = {
  /**
   * Find all notifications with optional filters.
   */
  async findAll(filters?: { status?: NotificationStatus, vendorId?: number, search?: string }) {
    const conditions: SQL[] = []

    if (filters?.status) {
      conditions.push(eq(notificationMaster.status, filters.status))
    }

    if (filters?.vendorId) {
      conditions.push(eq(notificationMaster.vendorId, filters.vendorId))
    }

    if (filters?.search) {
      conditions.push(like(notificationMaster.notificationCode, `%${filters.search}%`))
    }

    return db
      .select({
        id: notificationMaster.id,
        notificationCode: notificationMaster.notificationCode,
        notificationDate: notificationMaster.notificationDate,
        modelId: notificationMaster.modelId,
        modelName: productModel.name,
        branch: notificationMaster.branch,
        vendorId: notificationMaster.vendorId,
        vendorName: vendor.name,
        status: notificationMaster.status,
        createdBy: notificationMaster.createdBy,
        updatedBy: notificationMaster.updatedBy,
        createdAt: notificationMaster.createdAt,
        updatedAt: notificationMaster.updatedAt
      })
      .from(notificationMaster)
      .leftJoin(vendor, eq(notificationMaster.vendorId, vendor.id))
      .leftJoin(productModel, eq(notificationMaster.modelId, productModel.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(notificationMaster.createdAt))
  },

  /**
   * Find a single notification by ID (with joins).
   */
  async findById(id: number) {
    return db
      .select({
        id: notificationMaster.id,
        notificationCode: notificationMaster.notificationCode,
        notificationDate: notificationMaster.notificationDate,
        modelId: notificationMaster.modelId,
        modelName: productModel.name,
        branch: notificationMaster.branch,
        vendorId: notificationMaster.vendorId,
        vendorName: vendor.name,
        status: notificationMaster.status,
        createdBy: notificationMaster.createdBy,
        updatedBy: notificationMaster.updatedBy,
        createdAt: notificationMaster.createdAt,
        updatedAt: notificationMaster.updatedAt
      })
      .from(notificationMaster)
      .leftJoin(vendor, eq(notificationMaster.vendorId, vendor.id))
      .leftJoin(productModel, eq(notificationMaster.modelId, productModel.id))
      .where(eq(notificationMaster.id, id))
      .get()
  },

  /**
   * Find a single notification by code (for uniqueness check).
   */
  async findByCode(code: string) {
    return db
      .select()
      .from(notificationMaster)
      .where(eq(notificationMaster.notificationCode, code))
      .get()
  },

  /**
   * Insert a new notification.
   */
  async create(data: InsertNotificationMaster) {
    const { notificationDate, ...rest } = data

    return db
      .insert(notificationMaster)
      .values({
        ...rest,
        notificationDate: new Date(notificationDate)
      })
      .returning()
      .get()
  },

  /**
   * Update notification fields by ID.
   */
  async update(id: number, data: UpdateNotificationMaster) {
    const { notificationDate, ...rest } = data

    return db
      .update(notificationMaster)
      .set({
        ...rest,
        ...(notificationDate !== undefined ? { notificationDate: new Date(notificationDate) } : {})
      })
      .where(eq(notificationMaster.id, id))
      .returning()
      .get()
  },

  /**
   * Update notification status (NEW → USED → EXPIRED).
   */
  async updateStatus(id: number, data: UpdateNotificationMasterStatus) {
    return db
      .update(notificationMaster)
      .set(data)
      .where(eq(notificationMaster.id, id))
      .returning()
      .get()
  }
}
