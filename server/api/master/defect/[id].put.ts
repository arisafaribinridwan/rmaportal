// server/api/master/defect/[id].put.ts
// PUT /api/master/defect/:id — Update defect (QRCC, Admin)
import { defectMasterService } from '~~/server/services/defect-master.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid defect ID' })
  }

  const body = await readBody(event)

  return defectMasterService.update(id, body, Number(user.id))
})
