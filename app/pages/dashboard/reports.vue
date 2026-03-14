<script setup lang="ts">
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import type { TableColumn } from '@nuxt/ui'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'dashboard',
  middleware: 'dashboard'
})

const UBadge = resolveComponent('UBadge')

const CLAIM_STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'In Review', value: 'IN_REVIEW' },
  { label: 'Need Revision', value: 'NEED_REVISION' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Archived', value: 'ARCHIVED' }
]

interface ReportSummary {
  total: number
  DRAFT: number
  SUBMITTED: number
  IN_REVIEW: number
  NEED_REVISION: number
  APPROVED: number
  ARCHIVED: number
}

interface ReportDetailItem {
  id: number
  claimNumber: string
  vendorName: string | null
  modelName: string | null
  notificationCode: string | null
  defectCode: string
  defectName: string | null
  branch: string
  claimStatus: string
  submittedBy: string
  createdAt: string
}

interface ReportDetailResponse {
  data: ReportDetailItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ReportFilterOptions {
  vendors: Array<{ id: number, name: string }>
  branches: string[]
}

const { role, user } = useAuth()
const userBranch = computed(() => (user.value as { branch?: string | null } | null)?.branch || undefined)

function toDateInputValue(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function toTimestampRange(dateInput: string, kind: 'from' | 'to'): number | undefined {
  if (!dateInput) return undefined
  const parsed = new Date(`${dateInput}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return undefined
  return kind === 'from' ? startOfDay(parsed).getTime() : endOfDay(parsed).getTime()
}

const page = ref(1)
const limit = ref(10)
const statusFilter = ref<string>('all')
const vendorFilter = ref<string>('all')
const branchFilter = ref<string>('all')

const dateFrom = ref(toDateInputValue(subDays(new Date(), 30)))
const dateTo = ref(toDateInputValue(new Date()))

const isManagement = computed(() => role.value === 'MANAGEMENT')

watch([dateFrom, dateTo, statusFilter, vendorFilter, branchFilter], () => {
  page.value = 1
})

const normalizedVendorId = computed<number | undefined>(() => {
  if (vendorFilter.value === 'all') return undefined
  const parsed = Number(vendorFilter.value)
  if (Number.isNaN(parsed) || parsed <= 0) return undefined
  return parsed
})

const normalizedBranch = computed<string | undefined>(() => {
  if (isManagement.value) {
    return userBranch.value?.trim() || undefined
  }
  return branchFilter.value === 'all' ? undefined : branchFilter.value
})

const baseQuery = computed(() => ({
  dateFrom: toTimestampRange(dateFrom.value, 'from'),
  dateTo: toTimestampRange(dateTo.value, 'to'),
  status: statusFilter.value === 'all' ? undefined : statusFilter.value,
  vendorId: normalizedVendorId.value,
  branch: normalizedBranch.value
}))

const summaryQuery = computed(() => ({
  ...baseQuery.value
}))

const detailQuery = computed(() => ({
  ...baseQuery.value,
  page: page.value,
  limit: limit.value
}))

const {
  data: filterOptions,
  status: filterStatus,
  error: filterError,
  refresh: refreshFilterOptions
} = await useFetch<ReportFilterOptions>('/api/reports/claims/filters', {
  default: () => ({ vendors: [], branches: [] })
})

const {
  data: summaryData,
  status: summaryStatus,
  error: summaryError,
  refresh: refreshSummary
} = await useFetch<ReportSummary>('/api/reports/claims/summary', {
  query: summaryQuery,
  watch: [summaryQuery]
})

const {
  data: detailData,
  status: detailStatus,
  error: detailError,
  refresh: refreshDetail
} = await useFetch<ReportDetailResponse>('/api/reports/claims/detail', {
  query: detailQuery,
  watch: [detailQuery]
})

watch(filterOptions, (next) => {
  if (!next) return

  if (vendorFilter.value !== 'all') {
    const exists = next.vendors.some(v => String(v.id) === vendorFilter.value)
    if (!exists) vendorFilter.value = 'all'
  }

  if (!isManagement.value && branchFilter.value !== 'all') {
    const exists = next.branches.includes(branchFilter.value)
    if (!exists) branchFilter.value = 'all'
  }
})

const summary = computed<ReportSummary>(() => summaryData.value || {
  total: 0,
  DRAFT: 0,
  SUBMITTED: 0,
  IN_REVIEW: 0,
  NEED_REVISION: 0,
  APPROVED: 0,
  ARCHIVED: 0
})

const summaryCards = computed(() => ([
  { key: 'total', label: 'Total Claims', value: summary.value.total },
  { key: 'draft', label: 'Draft', value: summary.value.DRAFT },
  { key: 'submitted', label: 'Submitted', value: summary.value.SUBMITTED },
  { key: 'in-review', label: 'In Review', value: summary.value.IN_REVIEW },
  { key: 'need-revision', label: 'Need Revision', value: summary.value.NEED_REVISION },
  { key: 'approved', label: 'Approved', value: summary.value.APPROVED },
  { key: 'archived', label: 'Archived', value: summary.value.ARCHIVED }
]))

const columns: TableColumn<ReportDetailItem>[] = [
  {
    accessorKey: 'claimNumber',
    header: 'Claim Number',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.claimNumber)
  },
  {
    accessorKey: 'vendorName',
    header: 'Vendor',
    cell: ({ row }) => row.original.vendorName || '-'
  },
  {
    accessorKey: 'modelName',
    header: 'Model',
    cell: ({ row }) => row.original.modelName || '-'
  },
  {
    accessorKey: 'notificationCode',
    header: 'Notification',
    cell: ({ row }) => row.original.notificationCode || '-'
  },
  {
    accessorKey: 'branch',
    header: 'Branch'
  },
  {
    accessorKey: 'claimStatus',
    header: 'Status',
    cell: ({ row }) => {
      const statusMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'neutral'> = {
        DRAFT: 'neutral',
        SUBMITTED: 'info',
        IN_REVIEW: 'warning',
        NEED_REVISION: 'error',
        APPROVED: 'success',
        ARCHIVED: 'neutral'
      }

      const color = statusMap[row.original.claimStatus] || 'neutral'
      return h(UBadge, { variant: 'subtle', color }, () => row.original.claimStatus.replace('_', ' '))
    }
  },
  {
    accessorKey: 'submittedBy',
    header: 'Submitted By'
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'dd MMM yyyy HH:mm')
  }
]

const pagination = computed({
  get: () => ({
    pageIndex: page.value - 1,
    pageSize: limit.value
  }),
  set: (val: { pageIndex: number, pageSize: number }) => {
    page.value = val.pageIndex + 1
    limit.value = val.pageSize
  }
})

const hasError = computed(() => !!(filterError.value || summaryError.value || detailError.value))

const errorMessage = computed(() => {
  const err = filterError.value || summaryError.value || detailError.value
  if (!err) return ''
  return (err as { data?: { message?: string }, message?: string }).data?.message || err.message || 'Failed to load reports'
})

const vendorOptions = computed(() => [
  { label: 'All Vendors', value: 'all' },
  ...(filterOptions.value?.vendors || []).map(v => ({ label: v.name, value: String(v.id) }))
])

const branchOptions = computed(() => [
  { label: 'All Branches', value: 'all' },
  ...(filterOptions.value?.branches || []).map(branch => ({ label: branch, value: branch }))
])

const isLoading = computed(() => summaryStatus.value === 'pending' || detailStatus.value === 'pending')

function refreshAll() {
  refreshFilterOptions()
  refreshSummary()
  refreshDetail()
}

function exportCsv() {
  const params = new URLSearchParams()

  if (baseQuery.value.dateFrom !== undefined) params.set('dateFrom', String(baseQuery.value.dateFrom))
  if (baseQuery.value.dateTo !== undefined) params.set('dateTo', String(baseQuery.value.dateTo))
  if (baseQuery.value.status) params.set('status', baseQuery.value.status)
  if (baseQuery.value.vendorId !== undefined) params.set('vendorId', String(baseQuery.value.vendorId))
  if (baseQuery.value.branch) params.set('branch', baseQuery.value.branch)

  const qs = params.toString()
  const url = qs ? `/api/reports/claims/export?${qs}` : '/api/reports/claims/export'
  window.open(url, '_blank')
}
</script>

<template>
  <UDashboardPanel id="reports">
    <template #header>
      <UDashboardNavbar title="Claim Status Report">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="outline"
              :loading="filterStatus === 'pending' || isLoading"
              @click="refreshAll"
            />
            <UButton
              icon="i-lucide-download"
              color="primary"
              :loading="detailStatus === 'pending'"
              @click="exportCsv"
            >
              Export CSV
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-end gap-3 pb-4">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-muted">Date From</label>
          <input
            v-model="dateFrom"
            type="date"
            class="h-8 rounded-md border border-default bg-default px-2 text-sm"
          >
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs text-muted">Date To</label>
          <input
            v-model="dateTo"
            type="date"
            class="h-8 rounded-md border border-default bg-default px-2 text-sm"
          >
        </div>

        <div class="min-w-[170px]">
          <label class="mb-1 block text-xs text-muted">Status</label>
          <USelect
            v-model="statusFilter"
            :items="CLAIM_STATUS_OPTIONS"
          />
        </div>

        <div class="min-w-[200px]">
          <label class="mb-1 block text-xs text-muted">Vendor</label>
          <USelect
            v-model="vendorFilter"
            :items="vendorOptions"
            :loading="filterStatus === 'pending'"
          />
        </div>

        <div class="min-w-[180px]">
          <label class="mb-1 block text-xs text-muted">Branch</label>
          <USelect
            v-if="!isManagement"
            v-model="branchFilter"
            :items="branchOptions"
            :loading="filterStatus === 'pending'"
          />
          <UInput
            v-else
            :model-value="userBranch || '-'"
            disabled
          />
        </div>
      </div>

      <UAlert
        v-if="hasError"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        :title="errorMessage"
        class="mb-4"
      />

      <div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-7">
        <UCard v-for="item in summaryCards" :key="item.key" :ui="{ body: 'py-3' }">
          <div class="text-xs text-muted mb-1">
            {{ item.label }}
          </div>
          <div class="text-2xl font-semibold leading-none">
            {{ item.value }}
          </div>
        </UCard>
      </div>

      <UTable
        v-model:pagination="pagination"
        :data="detailData?.data || []"
        :columns="columns"
        :loading="isLoading"
        class="shrink-0"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default text-sm',
          separator: 'h-0'
        }"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center py-10 text-center">
            <UIcon name="i-lucide-file-search" class="mb-3 size-10 text-muted" />
            <p class="font-medium">
              No report data found.
            </p>
            <p class="text-sm text-muted mt-1">
              Try adjusting your filters or date range.
            </p>
          </div>
        </template>
      </UTable>

      <div class="mt-auto flex items-center justify-between gap-3 border-t border-default pt-4">
        <div class="text-sm text-muted">
          Showing {{ detailData?.data?.length || 0 }} of {{ detailData?.pagination?.total || 0 }} records.
        </div>

        <UPagination
          :default-page="page"
          :items-per-page="limit"
          :total="detailData?.pagination?.total || 0"
          @update:page="(p: number) => page = p"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
