import { z } from 'zod'
import { dashboardService } from '~~/server/services/dashboard.service'

const querySchema = z.object({
  start: z.string().transform(str => new Date(str)),
  end: z.string().transform(str => new Date(str))
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)

  try {
    const summary = await dashboardService.getSummary(query.start, query.end)
    return summary
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get dashboard summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})
