<script setup lang="ts">
const route = useRoute()
const claimId = route.params.id as string

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

interface ClaimDetail {
  id: number
  claimNumber: string
  notificationCode: string
  modelName: string
  branch?: string
  claimStatus: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'ARCHIVED'
  createdAt: string
  panelSerialNo: string
  ocSerialNo: string
}

const { data: claim, status } = await useFetch<ClaimDetail>(`/api/claims/${claimId}`, {
  lazy: true
})

const items = [{
  label: 'Claim Overview',
  icon: 'i-lucide-file-text',
  slot: 'overview'
}]

const statusMap: Record<string, { label: string, color: BadgeColor }> = {
  DRAFT: { label: 'Draft', color: 'neutral' },
  SUBMITTED: { label: 'Submitted', color: 'info' },
  IN_REVIEW: { label: 'In Review', color: 'secondary' },
  NEED_REVISION: { label: 'Need Revision', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'success' },
  ARCHIVED: { label: 'Archived', color: 'neutral' }
}

const claimStatus = computed(() => {
  if (!claim.value) return { label: 'Unknown', color: 'neutral' as BadgeColor }
  return statusMap[claim.value.claimStatus] || { label: claim.value.claimStatus, color: 'neutral' as BadgeColor }
})
</script>

<template>
  <div class="h-full w-full flex flex-col p-4 max-w-5xl mx-auto">
    <div class="mb-4 flex items-center gap-3">
      <UButton
        to="/cs/claim"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        size="sm"
        class="shrink-0"
      />
      <div>
        <h1 class="text-2xl font-bold font-inter flex items-center gap-2">
          Claim {{ claim?.claimNumber || claimId }}
          <UBadge
            v-if="claim"
            :color="claimStatus.color"
            variant="subtle"
            class="ml-2 uppercase"
          >
            {{ claimStatus.label }}
          </UBadge>
        </h1>
      </div>
    </div>

    <UCard v-if="status === 'pending'" class="flex-1">
      <div class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary animate-spin" />
        <span class="mt-2 text-gray-500">Loading claim data...</span>
      </div>
    </UCard>

    <UCard v-else-if="claim" class="flex-1">
      <UTabs :items="items" class="w-full">
        <template #overview>
          <div class="p-4 space-y-6">
            <UPageCard title="Notification Info" icon="i-lucide-bell">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="text-xs text-gray-500 font-medium uppercase tracking-wider">Notification Code</label>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {{ claim.notificationCode }}
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500 font-medium uppercase tracking-wider">Model</label>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {{ claim.modelName }}
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500 font-medium uppercase tracking-wider">Branch</label>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {{ claim.branch || 'N/A' }}
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500 font-medium uppercase tracking-wider">Created At</label>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {{ new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(claim.createdAt)) }}
                  </p>
                </div>
              </div>
            </UPageCard>

            <UPageCard title="Defect Details" icon="i-lucide-alert-circle">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="text-xs text-gray-500 font-medium uppercase tracking-wider">Panel Serial No.</label>
                  <p class="font-mono text-sm text-gray-900 dark:text-white mt-1">
                    {{ claim.panelSerialNo }}
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500 font-medium uppercase tracking-wider">OC Serial No.</label>
                  <p class="font-mono text-sm text-gray-900 dark:text-white mt-1">
                    {{ claim.ocSerialNo }}
                  </p>
                </div>
              </div>
            </UPageCard>
          </div>
        </template>
      </UTabs>
    </UCard>

    <UCard v-else class="flex-1">
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <UIcon name="i-lucide-alert-triangle" class="w-12 h-12 text-red-500 mb-4" />
        <p class="text-gray-900 dark:text-white font-medium">
          Claim Not Found
        </p>
        <p class="text-gray-500 text-sm mt-1">
          The requested claim could not be located.
        </p>
      </div>
    </UCard>
  </div>
</template>
