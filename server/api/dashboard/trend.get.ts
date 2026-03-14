import { z } from 'zod'
import { dashboardService } from '~~/server/services/dashboard.service'
import type { Period } from '~~/app/types'

const querySchema = z.object({
  start: z.string().transform(str => new Date(str)),
  end: z.string().transform(str => new Date(str)),
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily')
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)

  try {
    const trend = await dashboardService.getTrend(query.start, query.end, query.period as Period)
    return trend
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get dashboard trend',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})
