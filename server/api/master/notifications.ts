// server/api/master/notifications.ts
// GET /api/master/notifications — List all notifications (used by frontend data tables)
import { notificationMasterService } from '~~/server/services/notification-master.service'
import { NOTIFICATION_STATUSES } from '~~/shared/utils/constants'
import type { NotificationStatus } from '~~/shared/utils/constants'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const filters: { status?: NotificationStatus, vendorId?: number, search?: string } = {}

  if (typeof query.status === 'string' && NOTIFICATION_STATUSES.includes(query.status as NotificationStatus)) {
    filters.status = query.status as NotificationStatus
  }

  if (query.vendorId !== undefined) {
    const vendorId = Number(query.vendorId)
    if (!isNaN(vendorId) && vendorId > 0) {
      filters.vendorId = vendorId
    }
  }

  if (typeof query.search === 'string' && query.search.trim()) {
    filters.search = query.search.trim()
  }

  return notificationMasterService.list(filters)
})
