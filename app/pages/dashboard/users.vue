<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import { format } from 'date-fns'
import type { ManagedUser, UserStatusFilter } from '~/types/user-management'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'dashboard',
  middleware: 'dashboard'
})

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// const toast = useToast()
const table = useTemplateRef('table')
const { user: currentUser } = useAuth()

// ────────────────────────────────────────────────────────────
// Data Fetching
// ────────────────────────────────────────────────────────────

const { data, status, refresh } = await useFetch<ManagedUser[]>('/api/users', {
  lazy: true
})

// ────────────────────────────────────────────────────────────
// Modals State
// ────────────────────────────────────────────────────────────

const roleModalOpen = ref(false)
const statusModalOpen = ref(false)
const selectedUser = ref<ManagedUser | null>(null)

function openRoleModal(user: ManagedUser) {
  selectedUser.value = user
  roleModalOpen.value = true
}

function openStatusModal(user: ManagedUser) {
  selectedUser.value = user
  statusModalOpen.value = true
}

// ────────────────────────────────────────────────────────────
// Row Actions
// ────────────────────────────────────────────────────────────

function isSelf(row: ManagedUser): boolean {
  return row.id === currentUser.value?.id
}

function getRowItems(row: Row<ManagedUser>) {
  const user = row.original
  const self = isSelf(user)

  return [
    {
      type: 'label' as const,
      label: 'Actions'
    },
    {
      label: 'Change role',
      icon: 'i-lucide-shield',
      disabled: self,
      onSelect() {
        if (!self) openRoleModal(user)
      }
    },
    {
      type: 'separator' as const
    },
    {
      label: user.isActive ? 'Deactivate user' : 'Activate user',
      icon: user.isActive ? 'i-lucide-user-x' : 'i-lucide-user-check',
      color: user.isActive ? 'error' as const : 'success' as const,
      disabled: self,
      onSelect() {
        if (!self) openStatusModal(user)
      }
    }
  ]
}

// ────────────────────────────────────────────────────────────
// Role Color Helper
// ────────────────────────────────────────────────────────────

function getRoleBadgeColor(role: string | null): string {
  switch (role) {
    case 'ADMIN': return 'error'
    case 'QRCC': return 'info'
    case 'MANAGEMENT': return 'warning'
    case 'CS': return 'success'
    default: return 'neutral'
  }
}

// ────────────────────────────────────────────────────────────
// Table Columns
// ────────────────────────────────────────────────────────────

const columns: TableColumn<ManagedUser>[] = [
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
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'username',
    header: 'Username',
    cell: ({ row }) => row.original.username || '-'
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.original.role as string | null
      return h(UBadge, {
        variant: 'subtle',
        color: getRoleBadgeColor(role)
      }, () => role || 'N/A')
    }
  },
  {
    accessorKey: 'branch',
    header: 'Branch',
    cell: ({ row }) => row.original.branch || '-'
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    filterFn: 'equals',
    cell: ({ row }) => {
      const isActive = row.original.isActive
      return h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color: isActive ? 'success' : 'error'
      }, () => isActive ? 'Active' : 'Inactive')
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const date = row.original.createdAt
      if (!date) return '-'
      return format(new Date(date), 'dd MMM yyyy')
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
            content: { align: 'end' },
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

// ────────────────────────────────────────────────────────────
// Filters
// ────────────────────────────────────────────────────────────

const statusFilter = ref<UserStatusFilter>('all')
const columnFilters = ref([{ id: 'name', value: '' }])

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

const searchName = computed({
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
  <UDashboardPanel id="users">
    <template #header>
      <UDashboardNavbar title="User Management">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UsersUserCreateModal @success="refresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Role Modal -->
      <UsersUserRoleModal
        v-if="selectedUser"
        v-model:open="roleModalOpen"
        :user="selectedUser"
        @success="refresh"
      />

      <!-- Status Modal -->
      <UsersUserStatusModal
        v-if="selectedUser"
        v-model:open="statusModalOpen"
        :user="selectedUser"
        @success="refresh"
      />

      <!-- Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="searchName"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search by name..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
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
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            @click="refresh()"
          />
        </div>
      </div>

      <!-- Table -->
      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
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

      <!-- Pagination -->
      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} user(s) found.
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
