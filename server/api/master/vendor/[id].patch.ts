// server/api/master/vendor/[id].patch.ts
// PATCH /api/master/vendor/:id — Toggle vendor active status (QRCC, Admin)
import { vendorService } from '~~/server/services/vendor.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid vendor ID' })
  }

  const body = await readBody(event)

  return vendorService.updateStatus(id, body, user.id)
})
