<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { VendorClaimStatus } from '~~/shared/utils/constants'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

// ── Types ───────────────────────────────────────────────────

interface VendorClaimSummary {
  id: number
  vendorClaimNo: string
  vendorId: number
  vendorName: string | null
  vendorCode: string | null
  submittedAt: string | number
  status: VendorClaimStatus
  createdBy: string
  createdAt: string | number
  updatedAt: string | number
}

interface VendorClaimsResponse {
  data: VendorClaimSummary[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ── State ───────────────────────────────────────────────────

const page = ref(1)
const limit = ref(10)
const statusFilter = ref<string>('all')

const { data, status, refresh } = await useFetch<VendorClaimsResponse>('/api/vendor-claims', {
  query: computed(() => ({
    page: page.value,
    limit: limit.value,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value
  })),
  watch: [page, limit, statusFilter]
})

// ── Table Columns ───────────────────────────────────────────

const statusMap: Record<string, { label: string, color: 'success' | 'error' | 'warning' | 'info' | 'neutral' }> = {
  CREATED: { label: 'Created', color: 'info' },
  PROCESSING: { label: 'Processing', color: 'warning' },
  COMPLETED: { label: 'Completed', color: 'success' },
  DRAFT: { label: 'Draft', color: 'neutral' }
}

const columns: TableColumn<VendorClaimSummary>[] = [
  {
    accessorKey: 'vendorClaimNo',
    header: 'VC Number',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.vendorClaimNo)
  },
  {
    accessorKey: 'vendorName',
    header: 'Vendor',
    cell: ({ row }) => {
      const code = row.original.vendorCode ?? ''
      const name = row.original.vendorName ?? '-'
      return code ? `${code} — ${name}` : name
    }
  },
  {
    accessorKey: 'submittedAt',
    header: 'Submitted',
    cell: ({ row }) => new Date(row.original.submittedAt).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const info = statusMap[row.original.status] ?? { label: row.original.status, color: 'neutral' as const }
      return h(UBadge, { color: info.color, variant: 'subtle', class: 'capitalize' }, () => info.label)
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'text-right' }, [
      h(UButton, {
        icon: 'i-lucide-arrow-right',
        color: 'neutral',
        variant: 'ghost',
        to: `/dashboard/vendor-claims/${row.original.id}`
      })
    ])
  }
]

// ── Pagination ──────────────────────────────────────────────

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
  <UDashboardPanel id="vendor-claims">
    <template #header>
      <UDashboardNavbar title="Vendor Claims">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5 pb-4">
        <div class="flex items-center gap-1.5">
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All Statuses', value: 'all' },
              { label: 'Created', value: 'CREATED' },
              { label: 'Processing', value: 'PROCESSING' },
              { label: 'Completed', value: 'COMPLETED' }
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

        <UButton
          icon="i-lucide-plus"
          to="/dashboard/vendor-claims/create"
        >
          Create Vendor Claim
        </UButton>
      </div>

      <UTable
        v-model:pagination="pagination"
        :data="data?.data ?? []"
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
          Showing {{ data?.data?.length ?? 0 }} of {{ data?.pagination?.total ?? 0 }} vendor claims.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="page"
            :items-per-page="limit"
            :total="data?.pagination?.total ?? 0"
            @update:page="(p: number) => page = p"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
