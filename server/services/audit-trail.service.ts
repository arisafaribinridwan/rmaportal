// server/services/audit-trail.service.ts
import { auditTrailRepo } from '~~/server/repositories/audit-trail.repo'
import type { AuditTrailFilters } from '~~/server/repositories/audit-trail.repo'
import { CLAIM_HISTORY_ACTIONS } from '~~/shared/utils/constants'
import type { ClaimHistoryAction } from '~~/shared/utils/constants'

// ── Service ─────────────────────────────────────────────────

export const auditTrailService = {
  /**
   * List audit trail entries with validated filters.
   */
  async list(rawFilters: Record<string, unknown>) {
    const filters: AuditTrailFilters = {}

    if (typeof rawFilters.action === 'string' && CLAIM_HISTORY_ACTIONS.includes(rawFilters.action as ClaimHistoryAction)) {
      filters.action = rawFilters.action as ClaimHistoryAction
    }

    if (typeof rawFilters.userId === 'string' && rawFilters.userId.trim()) {
      filters.userId = rawFilters.userId.trim()
    }

    if (typeof rawFilters.keyword === 'string' && rawFilters.keyword.trim()) {
      filters.keyword = rawFilters.keyword.trim()
    }

    if (rawFilters.dateFrom !== undefined) {
      const dateFrom = Number(rawFilters.dateFrom)
      if (!isNaN(dateFrom)) filters.dateFrom = dateFrom
    }

    if (rawFilters.dateTo !== undefined) {
      const dateTo = Number(rawFilters.dateTo)
      if (!isNaN(dateTo)) filters.dateTo = dateTo
    }

    if (rawFilters.page !== undefined) {
      const page = Number(rawFilters.page)
      if (!isNaN(page) && page > 0) filters.page = page
    }

    if (rawFilters.limit !== undefined) {
      const limit = Number(rawFilters.limit)
      if (!isNaN(limit) && limit > 0) filters.limit = limit
    }

    return auditTrailRepo.findAll(filters)
  },

  /**
   * Export audit trail as CSV string.
   * Returns { csv, filename }.
   */
  async exportCsv(rawFilters: Record<string, unknown>) {
    const filters: AuditTrailFilters = {}

    if (typeof rawFilters.action === 'string' && CLAIM_HISTORY_ACTIONS.includes(rawFilters.action as ClaimHistoryAction)) {
      filters.action = rawFilters.action as ClaimHistoryAction
    }

    if (typeof rawFilters.userId === 'string' && rawFilters.userId.trim()) {
      filters.userId = rawFilters.userId.trim()
    }

    if (typeof rawFilters.keyword === 'string' && rawFilters.keyword.trim()) {
      filters.keyword = rawFilters.keyword.trim()
    }

    if (rawFilters.dateFrom !== undefined) {
      const dateFrom = Number(rawFilters.dateFrom)
      if (!isNaN(dateFrom)) filters.dateFrom = dateFrom
    }

    if (rawFilters.dateTo !== undefined) {
      const dateTo = Number(rawFilters.dateTo)
      if (!isNaN(dateTo)) filters.dateTo = dateTo
    }

    const data = await auditTrailRepo.findAllForExport(filters)

    // Build CSV
    const headers = [
      'No',
      'Claim Number',
      'Action',
      'From Status',
      'To Status',
      'User ID',
      'User Role',
      'Note',
      'Date'
    ]

    const rows = data.map((row, idx) => [
      idx + 1,
      this._escapeCsv(row.claimNumber ?? ''),
      row.action,
      row.fromStatus,
      row.toStatus,
      row.userId,
      row.userRole,
      this._escapeCsv(row.note ?? ''),
      row.createdAt ? new Date(row.createdAt).toISOString() : ''
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `audit-trail-${dateStr}.csv`

    return { csv, filename }
  },

  /**
   * Escape a value for CSV (handle commas, quotes, newlines).
   */
  _escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
}
