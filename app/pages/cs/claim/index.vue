<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'notificationCode',
  value: ''
}])
const columnVisibility = ref()
const rowSelection = ref({})

interface ClaimListItem {
  id: number
  claimNumber: string
  notificationCode: string
  modelName: string
  claimStatus: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'ARCHIVED'
  createdAt: string
}

interface ClaimListResponse {
  data: ClaimListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const { data, status } = await useFetch<ClaimListResponse>('/api/claims', {
  lazy: true
})

const columns: TableColumn<ClaimListItem>[] = [
  {
    accessorKey: 'id',
    header: 'Claim ID'
  },
  {
    accessorKey: 'notificationCode',
    header: 'Notification Code'
  },
  {
    accessorKey: 'modelName',
    header: 'Model Name'
  },
  {
    accessorKey: 'claimStatus',
    header: 'Status',
    filterFn: 'equals',
    cell: ({ row }) => {
      type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
      const statusMap: Record<string, { label: string, color: BadgeColor }> = {
        DRAFT: { label: 'Draft', color: 'neutral' },
        SUBMITTED: { label: 'Submitted', color: 'info' },
        IN_REVIEW: { label: 'In Review', color: 'secondary' },
        NEED_REVISION: { label: 'Need Revision', color: 'warning' },
        APPROVED: { label: 'Approved', color: 'success' },
        ARCHIVED: { label: 'Archived', color: 'neutral' }
      }
      const s = statusMap[row.original.claimStatus] || { label: row.original.claimStatus, color: 'neutral' }
      return h(UBadge, { class: 'capitalize', variant: 'subtle', color: s.color }, () => s.label)
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt)
      return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(UButton, {
          icon: 'i-lucide-arrow-right',
          color: 'primary',
          variant: 'ghost',
          class: 'ml-auto',
          to: `/cs/claim/${row.original.id}`
        }, () => 'View Detail')
      )
    }
  }
]

const statusFilter = ref('all')

watch(() => statusFilter.value, (newVal) => {
  if (!table?.value?.tableApi) return

  const statusColumn = table.value.tableApi.getColumn('claimStatus')
  if (!statusColumn) return

  if (newVal === 'all') {
    statusColumn.setFilterValue(undefined)
  } else {
    statusColumn.setFilterValue(newVal)
  }
})

const notificationCodeFilter = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('notificationCode')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('notificationCode')?.setFilterValue(value || undefined)
  }
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
</script>

<template>
  <div class="h-full w-full flex flex-col p-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold font-inter">
          My Claims
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Manage and track your RMA returns.
        </p>
      </div>
      <UButton to="/cs" icon="i-lucide-plus" color="primary">
        New Claim
      </UButton>
    </div>

    <UCard class="flex-1 flex flex-col">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <UInput
          v-model="notificationCodeFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search Notification Code..."
        />

        <div class="flex flex-wrap items-center gap-2">
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All Status', value: 'all' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Submitted', value: 'SUBMITTED' },
              { label: 'In Review', value: 'IN_REVIEW' },
              { label: 'Need Revision', value: 'NEED_REVISION' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Archived', value: 'ARCHIVED' }
            ]"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            placeholder="Filter Status"
            class="min-w-[150px]"
          />
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="data?.data || []"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0 w-full',
          thead: '[&>tr]:bg-gray-50 dark:[&>tr]:bg-gray-800/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-3 px-4 text-left font-semibold text-gray-900 dark:text-white first:rounded-tl-lg last:rounded-tr-lg border-y border-gray-200 dark:border-gray-700 first:border-l last:border-r',
          td: 'py-3 px-4 border-b border-gray-200 dark:border-gray-700'
        }"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <UIcon name="i-lucide-file-x-2" class="w-12 h-12 text-gray-400 mb-4" />
            <p class="text-gray-500 font-medium">
              No claims found.
            </p>
            <p class="text-gray-400 text-sm mt-1">
              Create a new claim to get started.
            </p>
          </div>
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3 pt-4 mt-auto">
        <div class="text-sm text-gray-500">
          Showing {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} result(s).
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>
