<script setup lang="ts">
import { format } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { Period, Range } from '~/types'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const props = defineProps<{
  period: Period
  range: Range
}>()

type TrendRecord = {
  date: string
  submitted: number
  approved: number
}

const { width } = useElementSize(cardRef)

const { data } = await useFetch<TrendRecord[]>('/api/dashboard/trend', {
  query: computed(() => ({
    start: props.range.start.toISOString(),
    end: props.range.end.toISOString(),
    period: props.period
  })),
  watch: [() => props.period, () => props.range],
  default: () => []
})

const x = (_: TrendRecord, i: number) => i
const y = [
  (d: TrendRecord) => d.submitted,
  (d: TrendRecord) => d.approved
]

const totalClaims = computed(() => data.value?.reduce((acc: number, cur: TrendRecord) => acc + cur.submitted + cur.approved, 0) ?? 0)

const formatNumber = new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format

const formatDate = (dateString: string): string => {
  // If period is monthly, dateString is YYYY-MM
  // If period is weekly, dateString is YYYY-WW
  // If period is daily, dateString is YYYY-MM-DD
  if (props.period === 'monthly' && dateString.length === 7) {
    const d = new Date(`${dateString}-01`)
    return format(d, 'MMM yyyy')
  }
  if (props.period === 'daily' && dateString.length === 10) {
    const d = new Date(dateString)
    return format(d, 'd MMM')
  }
  return dateString
}

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) {
    return ''
  }

  return formatDate(data.value[i].date)
}

const template = (d: TrendRecord) => `${formatDate(d.date)}<br/>Submitted: ${formatNumber(d.submitted)}<br/>Approved: ${formatNumber(d.approved)}`
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">
          RMA Claim Trend
        </p>
        <p class="text-3xl text-highlighted font-semibold">
          {{ formatNumber(totalClaims) }}
        </p>
      </div>
    </template>

    <VisXYContainer
      :data="data"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
    >
      <VisLine
        :x="x"
        :y="y"
        :color="['var(--ui-primary)', 'var(--ui-success)']"
      />
      <VisArea
        :x="x"
        :y="y"
        :color="['var(--ui-primary)', 'var(--ui-success)']"
        :opacity="0.1"
      />

      <VisAxis
        type="x"
        :x="x"
        :tick-format="xTicks"
      />

      <VisCrosshair
        color="var(--ui-primary)"
        :template="template"
      />

      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
