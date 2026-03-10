// server/api/master/defects.ts
// GET /api/master/defects — List all defects (used by frontend data tables)
import { defectMasterService } from '~~/server/services/defect-master.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const filters: { isActive?: boolean, search?: string } = {}

  if (query.isActive !== undefined) {
    filters.isActive = query.isActive === 'true'
  }

  if (typeof query.search === 'string' && query.search.trim()) {
    filters.search = query.search.trim()
  }

  return defectMasterService.list(filters)
})
