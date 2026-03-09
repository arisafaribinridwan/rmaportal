<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { Vendor } from '~/types/master'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'name',
  value: ''
}])
const columnVisibility = ref()
const rowSelection = ref({ 1: true })

const { data, status } = await useFetch<Vendor[]>('/api/master/vendors', {
  lazy: true
})

function getRowItems(row: Row<Vendor>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Copy vendor code',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.code)
        toast.add({
          title: 'Copied to clipboard',
          description: 'Vendor code copied to clipboard'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'View vendor details',
      icon: 'i-lucide-list'
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete vendor',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Vendor deleted',
          description: 'The vendor has been deleted.'
        })
      }
    }
  ]
}

const columns: TableColumn<Vendor>[] = [
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
    accessorKey: 'code',
    header: 'Code'
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Name',
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
    accessorKey: 'requiredPhotos',
    header: 'Required Photos',
    cell: ({ row }) => {
      const photos = row.original.requiredPhotos || []
      if (!photos.length) return '-'
      return h('div', { class: 'flex flex-wrap gap-1' },
        photos.map(photo => h(UBadge, { variant: 'subtle', color: 'neutral', size: 'sm' }, () => photo))
      )
    }
  },
  {
    accessorKey: 'requiredFields',
    header: 'Required Fields',
    cell: ({ row }) => {
      const fields = row.original.requiredFields || []
      if (!fields.length) return '-'
      return h('div', { class: 'flex flex-wrap gap-1' },
        fields.map(field => h(UBadge, { variant: 'subtle', color: 'neutral', size: 'sm' }, () => field))
      )
    }
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    filterFn: 'equals',
    cell: ({ row }) => {
      const isActive = row.original.isActive
      return h(UBadge, { class: 'capitalize', variant: 'subtle', color: isActive ? 'success' : 'error' }, () =>
        isActive ? 'Active' : 'Inactive'
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

  const statusColumn = table.value.tableApi.getColumn('isActive')
  if (!statusColumn) return

  if (newVal === 'all') {
    statusColumn.setFilterValue(undefined)
  } else {
    statusColumn.setFilterValue(newVal === 'active')
  }
})

const name = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('name')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('name')?.setFilterValue(value || undefined)
  }
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
</script>

<template>
  <UDashboardPanel id="vendors">
    <template #header>
      <UDashboardNavbar title="Vendors">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="New vendor"
            trailing-icon="i-lucide-plus"
            color="neutral"
            variant="outline"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="name"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter names..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <UButton
            v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            label="Delete"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
          >
            <template #trailing>
              <UKbd>
                {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
              </UKbd>
            </template>
          </UButton>

          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' }
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
