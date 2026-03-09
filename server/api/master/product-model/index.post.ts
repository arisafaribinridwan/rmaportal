// server/api/master/product-model/index.post.ts
// POST /api/master/product-model — Create a new product model (QRCC, Admin)
import { productModelService } from '~~/server/services/product-model.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const body = await readBody(event)

  const created = await productModelService.create(body, user.id)

  setResponseStatus(event, 201)
  return created
})
