<script setup lang="ts">
import { format } from 'date-fns'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

interface AuditTrail {
  id: number
  action: string
  claimNumber?: string // Expecting backend to join claimNumber
  fromStatus: string
  toStatus: string
  userId: string
  userRole: string
  note: string | null
  createdAt: number
}

const page = ref(1)
const limit = ref(10)
const actionFilter = ref<string>('all')
const keywordFilter = ref<string>('')
const debouncedKeyword = refDebounced(keywordFilter, 500)

// Call real audit trail endpoint
const { data, status, refresh } = await useFetch('/api/audit-trail', {
  query: computed(() => ({
    page: page.value,
    limit: limit.value,
    action: actionFilter.value === 'all' ? undefined : actionFilter.value,
    keyword: debouncedKeyword.value || undefined // used to search claimNo or User
  })),
  watch: [page, limit, actionFilter, debouncedKeyword]
})

const columns = [
  { accessorKey: 'createdAt', header: 'Date & Time', cell: ({ row }: { row: { original: AuditTrail } }) => format(new Date(row.original.createdAt), 'dd MMM yyyy HH:mm:ss') },
  { accessorKey: 'action', header: 'Action', cell: ({ row }: { row: { original: AuditTrail } }) => h('span', { class: 'font-semibold' }, row.original.action) },
  { accessorKey: 'claimNumber', header: 'Claim No.', cell: ({ row }: { row: { original: AuditTrail } }) => row.original.claimNumber || '-' },
  { accessorKey: 'userRole', header: 'User Role', cell: ({ row }: { row: { original: AuditTrail } }) => h(UBadge, { color: 'neutral', variant: 'subtle' }, () => row.original.userRole) },
  { accessorKey: 'note', header: 'Notes', cell: ({ row }: { row: { original: AuditTrail } }) => row.original.note || '-' },
  { accessorKey: 'toStatus', header: 'New Status', cell: ({ row }: { row: { original: AuditTrail } }) => {
    const isStatusChange = row.original.fromStatus !== row.original.toStatus && row.original.toStatus
    if (!isStatusChange) return '-'

    return h(UBadge, { color: 'info', variant: 'soft', class: 'capitalize' }, () => row.original.toStatus.replace('_', ' '))
  }
  }
]

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

function exportToExcel() {
  // Trigger export
  useToast().add({
    title: 'Export Started',
    description: 'Preparing your CSV download...',
    color: 'success'
  })

  const queryParams = new URLSearchParams()
  if (actionFilter.value !== 'all') queryParams.set('action', actionFilter.value)
  if (debouncedKeyword.value) queryParams.set('keyword', debouncedKeyword.value)

  window.open(`/api/audit-trail/export?${queryParams.toString()}`, '_blank')
}
</script>

<template>
  <UDashboardPanel id="audit-trail">
    <template #header>
      <UDashboardNavbar title="Audit Trail">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-download"
            color="primary"
            class="ml-2"
            @click="exportToExcel"
          >
            Export CSV
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5 pb-4">
        <UInput
          v-model="keywordFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search by Claim No or User ID..."
        />

        <div class="flex items-center gap-1.5">
          <USelect
            v-model="actionFilter"
            :items="[
              { label: 'All Actions', value: 'all' },
              { label: 'CREATE', value: 'CREATE' },
              { label: 'UPDATE', value: 'UPDATE' },
              { label: 'SUBMIT', value: 'SUBMIT' },
              { label: 'UPLOAD_PHOTO', value: 'UPLOAD_PHOTO' },
              { label: 'VERIFY_PHOTO', value: 'VERIFY_PHOTO' },
              { label: 'APPROVE', value: 'APPROVE' }
            ]"
            placeholder="Filter action"
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

      <!-- We safely assume data structure once backend is ready -->
      <UTable
        ref="table"
        v-model:pagination="pagination"
        :data="(data as any)?.data || []"
        :columns="columns"
        :loading="status === 'pending'"
        class="shrink-0"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default text-sm',
          separator: 'h-0'
        }"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          Showing {{ (data as any)?.data?.length || 0 }} of {{ (data as any)?.pagination?.total || 0 }} records.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="page"
            :items-per-page="limit"
            :total="(data as any)?.pagination?.total || 0"
            @update:page="(p: number) => page = p"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
