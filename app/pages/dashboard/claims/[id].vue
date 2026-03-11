<script setup lang="ts">
import { format } from 'date-fns'

const route = useRoute()
const claimId = route.params.id as string

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UCard = resolveComponent('UCard')
const UPageCard = resolveComponent('UPageCard')
const UTabs = resolveComponent('UTabs')
const UTable = resolveComponent('UTable')

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

interface PhotoDetail {
  id: number
  photoType: string
  filePath: string
  status: 'PENDING' | 'VERIFIED' | 'REJECT'
}

interface HistoryDetail {
  id: number
  action: string
  fromStatus: string
  toStatus: string
  userId: string
  userRole: string
  note: string | null
  createdAt: number
}

interface ClaimDetail {
  id: number
  claimNumber: string
  notificationCode: string
  modelName: string
  vendorName: string
  branch?: string
  claimStatus: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'ARCHIVED'
  createdAt: string
  panelSerialNo: string
  ocSerialNo: string
  defectName?: string
  photos: PhotoDetail[]
  history: HistoryDetail[]
}

const { data: claim, status, refresh } = await useFetch<ClaimDetail>(`/api/claims/${claimId}`, {
  lazy: true
})

const tabItems = [
  { label: 'Ringkasan', icon: 'i-lucide-file-text', slot: 'summary' },
  { label: 'Foto Review', icon: 'i-lucide-image', slot: 'photos' },
  { label: 'History', icon: 'i-lucide-history', slot: 'history' }
]

const statusMap: Record<string, { label: string, color: BadgeColor }> = {
  DRAFT: { label: 'Draft', color: 'neutral' },
  SUBMITTED: { label: 'Submitted', color: 'info' },
  IN_REVIEW: { label: 'In Review', color: 'warning' },
  NEED_REVISION: { label: 'Need Revision', color: 'error' },
  APPROVED: { label: 'Approved', color: 'success' },
  ARCHIVED: { label: 'Archived', color: 'neutral' }
}

const claimStatus = computed(() => {
  if (!claim.value) return { label: 'Unknown', color: 'neutral' as BadgeColor }
  return statusMap[claim.value.claimStatus] || { label: claim.value.claimStatus, color: 'neutral' as BadgeColor }
})

const historyColumns = [
  { accessorKey: 'createdAt', header: 'Date', cell: ({ row }: { row: { original: HistoryDetail } }) => format(new Date(row.original.createdAt), 'dd MMM yyyy HH:mm') },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'userRole', header: 'Role' },
  { accessorKey: 'note', header: 'Notes' },
  { accessorKey: 'toStatus', header: 'Status' }
]

const pendingPhotos = computed(() => {
  return claim.value?.photos.filter(p => p.status === 'PENDING').length || 0
})

const canFinalize = computed(() => {
  return claim.value && (claim.value.claimStatus === 'SUBMITTED' || claim.value.claimStatus === 'IN_REVIEW') && pendingPhotos.value === 0
})

async function onVerifyPhoto(photoId: number) {
  try {
    await $fetch(`/api/claims/${claimId}/review`, {
      method: 'POST',
      body: {
        reviews: [{ photoId, status: 'VERIFIED' }]
      }
    })
    useToast().add({ title: 'Photo Verified', color: 'success' })
    refresh()
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }, message?: string }
    useToast().add({ title: 'Error', description: error.data?.message || error.message || 'An error occurred', color: 'error' })
  }
}

async function onRejectPhoto(photoId: number) {
  const reason = prompt('Please enter a reason for rejecting this photo:')
  if (!reason) return

  try {
    await $fetch(`/api/claims/${claimId}/review`, {
      method: 'POST',
      body: {
        reviews: [{ photoId, status: 'REJECT', rejectReason: reason }]
      }
    })
    useToast().add({ title: 'Photo Rejected', color: 'error' })
    refresh()
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }, message?: string }
    useToast().add({ title: 'Error', description: error.data?.message || error.message || 'An error occurred', color: 'error' })
  }
}

async function finalizeReview(_decision: 'APPROVED' | 'NEED_REVISION') {
  // Provided for fallback UI, but backend mostly handles status transition automatically
  refresh()
}
</script>

<template>
  <UDashboardPanel id="claim-detail">
    <template #header>
      <UDashboardNavbar title="Claim Details">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            to="/dashboard/claims"
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-left"
            size="sm"
            class="ml-2"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'pending'" class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary animate-spin" />
        <span class="mt-2 text-gray-500">Loading claim data...</span>
      </div>

      <div v-else-if="claim" class="flex flex-col gap-6 max-w-5xl mx-auto w-full">
        <!-- Header Section -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex-1">
            <h1 class="text-2xl font-bold font-inter flex items-center gap-2">
              Claim {{ claim.claimNumber }}
              <UBadge
                :color="claimStatus.color"
                variant="subtle"
                class="ml-2 uppercase"
              >
                {{ claimStatus.label }}
              </UBadge>
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              Vendor: <span class="font-medium text-gray-900 dark:text-white">{{ claim.vendorName }}</span>
            </p>
          </div>

          <!-- Final Action Panel -->
          <div v-if="claim.claimStatus === 'SUBMITTED' || claim.claimStatus === 'IN_REVIEW'" class="flex gap-2">
            <UButton
              color="error"
              variant="outline"
              icon="i-lucide-x-circle"
              :disabled="!canFinalize"
              @click="finalizeReview('NEED_REVISION')"
            >
              Need Revision
            </UButton>
            <UButton
              color="success"
              icon="i-lucide-check-circle-2"
              :disabled="!canFinalize"
              @click="finalizeReview('APPROVED')"
            >
              Approve Claim
            </UButton>
          </div>
        </div>

        <div v-if="(claim.claimStatus === 'SUBMITTED' || claim.claimStatus === 'IN_REVIEW') && pendingPhotos > 0" class="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-md border border-blue-200 dark:border-blue-800">
          <UIcon name="i-lucide-info" class="inline-block mr-1 w-4 h-4" /> Please review all photos before finalizing the claim. Remaining: {{ pendingPhotos }}
        </div>

        <UCard class="flex-1">
          <UTabs :items="tabItems" class="w-full">
            <!-- Tinjauan / Summary Tab -->
            <template #summary>
              <div class="p-4 space-y-6">
                <UPageCard title="Notification Info" icon="i-lucide-bell">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
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
                        {{ format(new Date(claim.createdAt), 'dd MMM yyyy') }}
                      </p>
                    </div>
                  </div>
                </UPageCard>

                <UPageCard title="Defect Details" icon="i-lucide-alert-circle">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div>
                      <label class="text-xs text-gray-500 font-medium uppercase tracking-wider">Defect Name</label>
                      <p class="font-medium text-sm text-gray-900 dark:text-white mt-1">
                        {{ claim.defectName || 'N/A' }}
                      </p>
                    </div>
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

            <!-- Foto Review Tab -->
            <template #photos>
              <div class="p-4">
                <div v-if="!claim.photos?.length" class="text-center py-8 text-gray-500">
                  No photos uploaded for this claim.
                </div>
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <UCard v-for="photo in claim.photos" :key="photo.id" class="flex flex-col relative overflow-hidden group">
                    <UBadge
                      :color="photo.status === 'VERIFIED' ? 'success' : photo.status === 'REJECT' ? 'error' : 'neutral'"
                      class="absolute top-2 right-2 z-10"
                    >
                      {{ photo.status }}
                    </UBadge>

                    <div class="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <img
                        v-if="photo.filePath"
                        :src="photo.filePath"
                        alt="Claim Photo"
                        class="object-cover w-full h-full"
                      >
                      <UIcon v-else name="i-lucide-image" class="w-8 h-8 text-gray-400" />
                    </div>

                    <div class="p-3 border-t border-gray-100 dark:border-gray-800">
                      <p class="font-medium text-sm mb-3">
                        {{ photo.photoType }}
                      </p>

                      <!-- Action buttons for QRCC review -->
                      <div v-if="photo.status === 'PENDING' && (claim.claimStatus === 'SUBMITTED' || claim.claimStatus === 'IN_REVIEW')" class="flex gap-2">
                        <UButton
                          size="sm"
                          color="success"
                          variant="soft"
                          icon="i-lucide-check"
                          class="flex-1 justify-center"
                          @click="onVerifyPhoto(photo.id)"
                        >
                          Verify
                        </UButton>
                        <UButton
                          size="sm"
                          color="error"
                          variant="soft"
                          icon="i-lucide-x"
                          class="flex-1 justify-center"
                          @click="onRejectPhoto(photo.id)"
                        >
                          Reject
                        </UButton>
                      </div>
                    </div>
                  </UCard>
                </div>
              </div>
            </template>

            <!-- History Tab -->
            <template #history>
              <div class="py-2">
                <UTable
                  :data="claim.history"
                  :columns="historyColumns"
                  class="w-full"
                />
              </div>
            </template>
          </UTabs>
        </UCard>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-12 text-center">
        <UIcon name="i-lucide-alert-triangle" class="w-12 h-12 text-red-500 mb-4" />
        <p class="text-gray-900 dark:text-white font-medium">
          Claim Not Found
        </p>
        <p class="text-gray-500 text-sm mt-1">
          The requested claim could not be located.
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>
