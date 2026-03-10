// server/services/notification-master.service.ts
import { notificationMasterRepo } from '~~/server/repositories/notification-master.repo'
import {
  insertNotificationMasterSchema,
  updateNotificationMasterSchema,
  updateNotificationMasterStatusSchema
} from '~~/server/database/schema'
import type { NotificationStatus } from '~~/shared/utils/constants'

export const notificationMasterService = {
  /**
   * List notifications with optional filters.
   */
  async list(filters?: { status?: NotificationStatus, vendorId?: number, search?: string }) {
    return notificationMasterRepo.findAll(filters)
  },

  /**
   * Get a single notification by ID. Throws 404 if not found.
   */
  async getById(id: number) {
    const record = await notificationMasterRepo.findById(id)
    if (!record) {
      throw createError({ statusCode: 404, message: 'Notification not found' })
    }
    return record
  },

  /**
   * Create a new notification. Validates input and checks code uniqueness.
   */
  async create(body: unknown, userId: string) {
    const data = insertNotificationMasterSchema.parse({
      ...body as Record<string, unknown>,
      createdBy: userId,
      updatedBy: userId
    })

    const existing = await notificationMasterRepo.findByCode(data.notificationCode)
    if (existing) {
      throw createError({ statusCode: 409, message: `Notification code '${data.notificationCode}' already exists` })
    }

    return notificationMasterRepo.create(data)
  },

  /**
   * Update an existing notification. Validates input & checks existence.
   */
  async update(id: number, body: unknown, userId: string) {
    const data = updateNotificationMasterSchema.parse({
      ...body as Record<string, unknown>,
      updatedBy: userId
    })

    const existing = await notificationMasterRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Notification not found' })
    }

    return notificationMasterRepo.update(id, data)
  },

  /**
   * Update notification status (NEW → USED → EXPIRED).
   */
  async updateStatus(id: number, body: unknown, userId: string) {
    const data = updateNotificationMasterStatusSchema.parse({
      ...body as Record<string, unknown>,
      updatedBy: userId
    })

    const existing = await notificationMasterRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Notification not found' })
    }

    return notificationMasterRepo.updateStatus(id, data)
  }
}
