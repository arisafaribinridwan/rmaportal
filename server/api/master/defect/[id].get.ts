// server/api/master/defect/[id].get.ts
// GET /api/master/defect/:id — Get defect by ID (QRCC, Admin)
import { defectMasterService } from '~~/server/services/defect-master.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid defect ID' })
  }

  return defectMasterService.getById(id)
})
