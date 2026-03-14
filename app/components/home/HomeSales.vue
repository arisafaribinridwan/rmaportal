<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const UBadge = resolveComponent('UBadge')

const { data } = await useFetch<{
  latestClaims: Record<string, unknown>[]
  recentReviewActivity: Record<string, unknown>[]
  pendingVendorClaimItems: Record<string, unknown>[]
}>('/api/dashboard/latest', {
  default: () => ({
    latestClaims: [],
    recentReviewActivity: [],
    pendingVendorClaimItems: []
  })
})

const tabs = [
  { label: 'Latest Claims', slot: 'latest' },
  { label: 'Recent Review Activity', slot: 'reviews' },
  { label: 'Pending Vendor Claim Items', slot: 'vendor' }
]

const claimColumns: TableColumn<Record<string, unknown>>[] = [
  { accessorKey: 'claimNumber', header: 'Claim Number' },
  {
    accessorKey: 'claimStatus',
    header: 'Status',
    cell: ({ row }) => {
      const statusColors: Record<string, string> = {
        DRAFT: 'neutral',
        SUBMITTED: 'primary',
        IN_REVIEW: 'info',
        NEED_REVISION: 'warning',
        APPROVED: 'success',
        ARCHIVED: 'neutral'
      }
      const status = row.getValue('claimStatus') as string
      const color = statusColors[status] || 'neutral'
      return h(UBadge, { color, variant: 'subtle', class: 'capitalize' }, () => status.replace('_', ' '))
    }
  },
  { accessorKey: 'submittedBy', header: 'Submitted By' },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleString()
  }
]

const reviewColumns: TableColumn<Record<string, unknown>>[] = [
  { accessorKey: 'claimNumber', header: 'Claim Number' },
  { accessorKey: 'action', header: 'Action' },
  {
    accessorKey: 'statusChange',
    header: 'Status Change',
    cell: ({ row }) => {
      const original = row.original as Record<string, string>
      return `${original.fromStatus} → ${original.toStatus}`
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleString()
  }
]

const vendorColumns: TableColumn<Record<string, unknown>>[] = [
  { accessorKey: 'claimNumber', header: 'Claim Number' },
  {
    accessorKey: 'vendorDecision',
    header: 'Vendor Decision',
    cell: ({ row }) => h(UBadge, { color: 'warning', variant: 'subtle' }, () => row.getValue('vendorDecision'))
  },
  {
    accessorKey: 'createdAt',
    header: 'Pending Since',
    cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleString()
  }
]
</script>

<template>
  <UCard class="shrink-0" :ui="{ body: '!p-0' }">
    <UTabs :items="tabs" class="w-full">
      <template #latest>
        <UTable
          :data="data.latestClaims ?? []"
          :columns="claimColumns"
          class="w-full"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default'
          }"
        />
      </template>

      <template #reviews>
        <UTable
          :data="data.recentReviewActivity ?? []"
          :columns="reviewColumns"
          class="w-full"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default'
          }"
        />
      </template>

      <template #vendor>
        <UTable
          :data="data.pendingVendorClaimItems ?? []"
          :columns="vendorColumns"
          class="w-full"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default'
          }"
        />
      </template>
    </UTabs>
  </UCard>
</template>
