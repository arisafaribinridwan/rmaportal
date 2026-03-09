// server/api/master/defect/[id].patch.ts
// PATCH /api/master/defect/:id — Toggle defect active status (QRCC, Admin)
import { defectMasterService } from '~~/server/services/defect-master.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid defect ID' })
  }

  const body = await readBody(event)

  return defectMasterService.updateStatus(id, body, Number(user.id))
})
