import { dashboardService } from '~~/server/services/dashboard.service'

export default defineEventHandler(async () => {
  try {
    const latest = await dashboardService.getLatest()
    return latest
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get latest dashboard activity',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})
