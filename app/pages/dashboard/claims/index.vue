<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

// We don't have exact types from backend exported for frontend directly yet,
// so we type it inline based on repo response or we could use any if complex.
interface ClaimSummary {
  id: number
  claimNumber: string
  notificationId: number | null
  notificationCode: string | null
  modelId: number
  modelName: string | null
  vendorId: number
  vendorName: string | null
  inch: number
  branch: string
  panelSerialNo: string
  ocSerialNo: string
  defectCode: string
  defectName: string | null
  claimStatus: string
  submittedBy: string
  createdAt: string
  updatedAt: string
}

interface ClaimsResponse {
  data: ClaimSummary[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const table = useTemplateRef('table')

const page = ref(1)
const limit = ref(10)
const statusFilter = ref<string>('all')
const keywordFilter = ref<string>('')
const debouncedKeyword = refDebounced(keywordFilter, 500)

const { data, status, refresh } = await useFetch<ClaimsResponse>('/api/claims', {
  query: computed(() => ({
    page: page.value,
    limit: limit.value,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    keyword: debouncedKeyword.value || undefined
  })),
  watch: [page, limit, statusFilter, debouncedKeyword]
})

const columns: TableColumn<ClaimSummary>[] = [
  {
    accessorKey: 'claimNumber',
    header: 'Claim Number',
    cell: ({ row }) => {
      return h('span', { class: 'font-medium' }, row.original.claimNumber)
    }
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
    accessorKey: 'branch',
    header: 'Branch'
  },
  {
    accessorKey: 'createdAt',
    header: 'Date Created',
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleDateString()
    }
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

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        row.original.claimStatus.replace('_', ' ')
      )
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h('div', { class: 'text-right' }, [
        h(UButton, {
          icon: 'i-lucide-arrow-right',
          color: 'neutral',
          variant: 'ghost',
          to: `/dashboard/claims/${row.original.id}`
        })
      ])
    }
  }
]

// To wire pagination up properly with nuxt-ui
const pagination = computed({
  get: () => ({
    pageIndex: page.value - 1,
    pageSize: limit.value
  }),
  set: (val) => {
    page.value = val.pageIndex + 1
    limit.value = val.pageSize
  }
})
</script>

<template>
  <UDashboardPanel id="claims">
    <template #header>
      <UDashboardNavbar title="Claims List">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5 pb-4">
        <UInput
          v-model="keywordFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search Claim No, Panel SN, OC SN..."
        />

        <div class="flex items-center gap-1.5">
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All Statuses', value: 'all' },
              { label: 'Submitted', value: 'SUBMITTED' },
              { label: 'In Review', value: 'IN_REVIEW' },
              { label: 'Need Revision', value: 'NEED_REVISION' },
              { label: 'Approved', value: 'APPROVED' }
            ]"
            placeholder="Filter status"
            class="min-w-[150px]"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            @click="refresh"
          />
        </div>
      </div>

      <!-- Ensure we have data structure handled -->
      <UTable
        ref="table"
        v-model:pagination="pagination"
        :data="data?.data || []"
        :columns="columns"
        :loading="status === 'pending'"
        class="shrink-0"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          Showing {{ data?.data?.length || 0 }} of {{ data?.pagination?.total || 0 }} claims.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="page"
            :items-per-page="limit"
            :total="data?.pagination?.total || 0"
            @update:page="(p: number) => page = p"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
