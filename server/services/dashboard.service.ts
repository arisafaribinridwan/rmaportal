import { dashboardRepo } from '../repositories/dashboard.repo'
import type { Period } from '~~/app/types'

export const dashboardService = {
  async getSummary(startDate: Date, endDate: Date) {
    return dashboardRepo.getSummary(startDate, endDate)
  },

  async getTrend(startDate: Date, endDate: Date, period: Period) {
    const rawData = await dashboardRepo.getTrend(startDate, endDate, period)

    // Process the data to group by date
    const formattedData: Record<string, { submitted: number, approved: number }> = {}

    for (const row of rawData) {
      const dateKey = row.dateGroup as string
      if (!formattedData[dateKey]) {
        formattedData[dateKey] = { submitted: 0, approved: 0 }
      }

      if (row.status === 'SUBMITTED') {
        formattedData[dateKey].submitted += row.count
      } else if (row.status === 'APPROVED') {
        formattedData[dateKey].approved += row.count
      }
    }

    // Transform into an array format suitable for charts
    return Object.entries(formattedData).map(([date, counts]) => ({
      date,
      ...counts
    })).sort((a, b) => a.date.localeCompare(b.date))
  },

  async getLatest() {
    const [latestClaims, recentReviewActivity, pendingVendorClaimItems] = await Promise.all([
      dashboardRepo.getLatestClaims(5),
      dashboardRepo.getRecentReviewActivity(5),
      dashboardRepo.getPendingVendorClaimItems(5)
    ])

    return {
      latestClaims,
      recentReviewActivity,
      pendingVendorClaimItems
    }
  }
}
