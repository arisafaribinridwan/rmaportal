// server/api/master/product-model/[id].put.ts
// PUT /api/master/product-model/:id — Update product model (QRCC, Admin)
import { productModelService } from '~~/server/services/product-model.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product model ID' })
  }

  const body = await readBody(event)

  return productModelService.update(id, body, user.id)
})
