<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { NotificationMaster } from '~/types/master'
import { format } from 'date-fns'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'notificationCode',
  value: ''
}])
const columnVisibility = ref()
const rowSelection = ref({})

const { data, status, refresh } = await useFetch<NotificationMaster[]>('/api/master/notifications', {
  lazy: true
})

// Modals State
const editModalOpen = ref(false)
const deleteModalOpen = ref(false)
const selectedNotification = ref<NotificationMaster | null>(null)

function openEditModal(notification: NotificationMaster) {
  selectedNotification.value = notification
  editModalOpen.value = true
}

function openDeleteModal(notification: NotificationMaster) {
  selectedNotification.value = notification
  deleteModalOpen.value = true
}

function getRowItems(row: Row<NotificationMaster>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Copy code',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.notificationCode)
        toast.add({
          title: 'Copied to clipboard',
          description: 'Notification code copied to clipboard'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Edit notification',
      icon: 'i-lucide-pencil',
      onSelect() {
        openEditModal(row.original)
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Expire notification',
      icon: 'i-lucide-trash',
      color: 'error',
      disabled: row.original.status === 'EXPIRED',
      onSelect() {
        openDeleteModal(row.original)
      }
    }
  ]
}

const columns: TableColumn<NotificationMaster>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'notificationCode',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Notification Code',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  {
    accessorKey: 'notificationDate',
    header: 'Date',
    cell: ({ row }) => format(new Date(row.original.notificationDate), 'dd MMM yyyy')
  },
  {
    accessorKey: 'modelName',
    header: 'Product Model',
    cell: ({ row }) => row.original.modelName || row.original.modelId
  },
  {
    accessorKey: 'branch',
    header: 'Branch'
  },
  {
    accessorKey: 'vendorName',
    header: 'Vendor Name',
    cell: ({ row }) => row.original.vendorName || row.original.vendorId
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'equals',
    cell: ({ row }) => {
      const statusColor = {
        NEW: 'success' as const,
        USED: 'warning' as const,
        EXPIRED: 'error' as const
      }[row.original.status]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color: statusColor }, () =>
        row.original.status
      )
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]

const statusFilter = ref('all')

watch(() => statusFilter.value, (newVal) => {
  if (!table?.value?.tableApi) return

  const statusColumn = table.value.tableApi.getColumn('status')
  if (!statusColumn) return

  if (newVal === 'all') {
    statusColumn.setFilterValue(undefined)
  } else {
    statusColumn.setFilterValue(newVal)
  }
})

const codeSearch = computed({
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
  <UDashboardPanel id="notifications">
    <template #header>
      <UDashboardNavbar title="Notifications">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Import Excel"
            icon="i-lucide-file-spreadsheet"
            color="neutral"
            variant="outline"
            @click="toast.add({ title: 'Coming Soon', description: 'Excel import functionality is in development', color: 'info' })"
          />
          <MasterNotificationAddModal @success="refresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Remote Modals handled via state -->
      <MasterNotificationEditModal
        v-if="selectedNotification"
        v-model:open="editModalOpen"
        :notification="selectedNotification"
        @success="refresh"
      />
      <MasterNotificationDeleteModal
        v-if="selectedNotification"
        v-model:open="deleteModalOpen"
        :notification="selectedNotification"
        @success="refresh"
      />

      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="codeSearch"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter notification codes..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All', value: 'all' },
              { label: 'New', value: 'NEW' },
              { label: 'Used', value: 'USED' },
              { label: 'Expired', value: 'EXPIRED' }
            ]"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            placeholder="Filter status"
            class="min-w-28"
          />
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Display"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
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
        :data="data"
        :columns="columns"
        :loading="status === 'pending'"
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
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
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
    </template>
  </UDashboardPanel>
</template>
