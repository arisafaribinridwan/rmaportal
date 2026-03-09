// server/api/master/notification/[id].put.ts
// PUT /api/master/notification/:id — Update notification (QRCC, Admin)
import { notificationMasterService } from '~~/server/services/notification-master.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid notification ID' })
  }

  const body = await readBody(event)

  return notificationMasterService.update(id, body, Number(user.id))
})
