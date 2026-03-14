// server/services/report.service.ts
import { reportRepo } from '~~/server/repositories/report.repo'
import type { ReportFilters } from '~~/server/repositories/report.repo'
import { CLAIM_STATUSES } from '~~/shared/utils/constants'
import type { ClaimStatus } from '~~/shared/utils/constants'

interface ReportScope {
  role?: string | null
  branch?: string | null
}

function getQueryValue(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw[0]
  return raw
}

function parseFilters(raw: Record<string, unknown>): ReportFilters {
  const filters: ReportFilters = {}

  const dateFromRaw = getQueryValue(raw.dateFrom)
  if (dateFromRaw !== undefined) {
    const v = Number(dateFromRaw)
    if (!isNaN(v)) filters.dateFrom = v
  }

  const dateToRaw = getQueryValue(raw.dateTo)
  if (dateToRaw !== undefined) {
    const v = Number(dateToRaw)
    if (!isNaN(v)) filters.dateTo = v
  }

  const statusRaw = getQueryValue(raw.status)
  if (typeof statusRaw === 'string' && CLAIM_STATUSES.includes(statusRaw as ClaimStatus)) {
    filters.status = statusRaw as ClaimStatus
  }

  const vendorIdRaw = getQueryValue(raw.vendorId)
  if (vendorIdRaw !== undefined) {
    const v = Number(vendorIdRaw)
    if (!isNaN(v) && v > 0) filters.vendorId = v
  }

  const branchRaw = getQueryValue(raw.branch)
  if (typeof branchRaw === 'string' && branchRaw.trim()) {
    filters.branch = branchRaw.trim()
  }

  const pageRaw = getQueryValue(raw.page)
  if (pageRaw !== undefined) {
    const v = Number(pageRaw)
    if (!isNaN(v) && v > 0) filters.page = v
  }

  const limitRaw = getQueryValue(raw.limit)
  if (limitRaw !== undefined) {
    const v = Number(limitRaw)
    if (!isNaN(v) && v > 0) filters.limit = v
  }

  return filters
}

function resolveScopedFilters(raw: Record<string, unknown>, scope?: ReportScope): ReportFilters {
  const filters = parseFilters(raw)

  if (scope?.role === 'MANAGEMENT') {
    if (!scope.branch?.trim()) {
      throw createError({
        statusCode: 403,
        message: 'Forbidden — Management account has no branch assigned'
      })
    }

    filters.branch = scope.branch.trim()
  }

  return filters
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export const reportService = {
  async getSummary(raw: Record<string, unknown>, scope?: ReportScope) {
    const filters = resolveScopedFilters(raw, scope)
    return reportRepo.getSummary(filters)
  },

  async getDetail(raw: Record<string, unknown>, scope?: ReportScope) {
    const filters = resolveScopedFilters(raw, scope)
    return reportRepo.getDetail(filters)
  },

  async exportCsv(raw: Record<string, unknown>, scope?: ReportScope) {
    const filters = resolveScopedFilters(raw, scope)
    const data = await reportRepo.getAllForExport(filters)

    const headers = [
      'No',
      'Claim Number',
      'Vendor',
      'Model',
      'Notification Code',
      'Defect Code',
      'Defect Name',
      'Inch',
      'Branch',
      'Panel SN',
      'OC SN',
      'Status',
      'Submitted By',
      'Created At'
    ]

    const rows = data.map((row, idx) => [
      idx + 1,
      escapeCsv(row.claimNumber),
      escapeCsv(row.vendorName ?? ''),
      escapeCsv(row.modelName ?? ''),
      escapeCsv(row.notificationCode ?? ''),
      escapeCsv(row.defectCode),
      escapeCsv(row.defectName ?? ''),
      row.inch,
      escapeCsv(row.branch),
      escapeCsv(row.panelSerialNo),
      escapeCsv(row.ocSerialNo),
      row.claimStatus,
      escapeCsv(row.submittedBy),
      row.createdAt ? new Date(row.createdAt).toISOString() : ''
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `claim-report-${dateStr}.csv`

    return { csv, filename }
  },

  async getFilterOptions(scope?: ReportScope) {
    if (scope?.role === 'MANAGEMENT' && !scope.branch?.trim()) {
      throw createError({
        statusCode: 403,
        message: 'Forbidden — Management account has no branch assigned'
      })
    }

    const [vendors, branches] = await Promise.all([
      reportRepo.getVendorOptions(),
      reportRepo.getBranchOptions()
    ])

    if (scope?.role === 'MANAGEMENT' && scope.branch?.trim()) {
      return {
        vendors,
        branches: branches.filter(branch => branch === scope.branch)
      }
    }

    return { vendors, branches }
  }
}
