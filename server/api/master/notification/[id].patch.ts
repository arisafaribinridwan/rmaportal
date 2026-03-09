// server/api/master/notification/[id].patch.ts
// PATCH /api/master/notification/:id — Update notification status (QRCC, Admin)
import { notificationMasterService } from '~~/server/services/notification-master.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid notification ID' })
  }

  const body = await readBody(event)

  return notificationMasterService.updateStatus(id, body, Number(user.id))
})
