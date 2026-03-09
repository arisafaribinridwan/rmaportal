// server/api/master/product-model/[id].patch.ts
// PATCH /api/master/product-model/:id — Toggle active status (QRCC, Admin)
import { productModelService } from '~~/server/services/product-model.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid product model ID' })
  }

  const body = await readBody(event)

  return productModelService.updateStatus(id, body, user.id)
})
