// server/api/master/notification/[id].get.ts
// GET /api/master/notification/:id — Get notification by ID (QRCC, Admin)
import { notificationMasterService } from '~~/server/services/notification-master.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid notification ID' })
  }

  return notificationMasterService.getById(id)
})
