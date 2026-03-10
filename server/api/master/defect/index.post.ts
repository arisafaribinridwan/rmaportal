// server/api/master/defect/index.post.ts
// POST /api/master/defect — Create a new defect (QRCC, Admin)
import { defectMasterService } from '~~/server/services/defect-master.service'

export default defineEventHandler(async (event) => {
  const { user } = event.context.auth
  const body = await readBody(event)

  const created = await defectMasterService.create(body, user.id)

  setResponseStatus(event, 201)
  return created
})
