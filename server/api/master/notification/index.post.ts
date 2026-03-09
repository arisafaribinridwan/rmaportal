// server/api/master/notification/index.post.ts
// POST /api/master/notification — Create a new notification (QRCC, Admin)
import { notificationMasterService } from '~~/server/services/notification-master.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const body = await readBody(event)

  const created = await notificationMasterService.create(body, Number(user.id))

  setResponseStatus(event, 201)
  return created
})
