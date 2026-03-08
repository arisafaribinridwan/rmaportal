// server/api/master/vendor/[id].put.ts
// PUT /api/master/vendor/:id — Update vendor (QRCC, Admin)
import { vendorService } from '~~/server/services/vendor.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid vendor ID' })
  }

  const body = await readBody(event)

  return vendorService.update(id, body, Number(user.id))
})
