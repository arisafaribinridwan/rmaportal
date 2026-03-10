// server/api/master/vendor/index.post.ts
// POST /api/master/vendor — Create a new vendor (QRCC, Admin)
import { vendorService } from '~~/server/services/vendor.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const body = await readBody(event)

  const created = await vendorService.create(body, user.id)

  setResponseStatus(event, 201)
  return created
})
