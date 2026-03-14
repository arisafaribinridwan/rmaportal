<script setup lang="ts">
import type { Period, Range } from '~/types'

const props = defineProps<{
  period: Period
  range: Range
}>()

const { data: summary } = await useFetch<{
  totalClaims: number
  submitted: number
  needRevision: number
  approved: number
  vendorClaimPending: number
}>('/api/dashboard/summary', {
  query: computed(() => ({
    start: props.range.start.toISOString(),
    end: props.range.end.toISOString()
  })),
  watch: [() => props.period, () => props.range],
  default: () => ({
    totalClaims: 0,
    submitted: 0,
    needRevision: 0,
    approved: 0,
    vendorClaimPending: 0
  })
})

const stats = computed(() => [
  {
    title: 'Total Claims',
    icon: 'i-lucide-clipboard-list',
    value: summary.value.totalClaims,
    to: '/dashboard/claims'
  },
  {
    title: 'Submitted',
    icon: 'i-lucide-send',
    value: summary.value.submitted,
    to: '/dashboard/claims?status=SUBMITTED'
  },
  {
    title: 'Need Revision',
    icon: 'i-lucide-alert-circle',
    value: summary.value.needRevision,
    to: '/dashboard/claims?status=NEED_REVISION'
  },
  {
    title: 'Approved',
    icon: 'i-lucide-check-circle',
    value: summary.value.approved,
    to: '/dashboard/claims?status=APPROVED'
  },
  {
    title: 'Vendor Claim Pending',
    icon: 'i-lucide-clock',
    value: summary.value.vendorClaimPending,
    color: 'warning'
  }
])
</script>

<template>
  <UPageGrid class="lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      :to="stat.to"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
