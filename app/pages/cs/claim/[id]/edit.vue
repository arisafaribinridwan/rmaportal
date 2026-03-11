<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()
const claimId = route.params.id as string
const isLoading = ref(false)

// ── Types ───────────────────────────────────────────────────

interface ClaimPhoto {
  id: number
  claimId: number
  photoType: string
  filePath: string
  thumbnailPath: string | null
  status: 'PENDING' | 'VERIFIED' | 'REJECT'
  createdAt: string
}

interface ClaimHistoryEntry {
  id: number
  claimId: number
  action: string
  fromStatus: string
  toStatus: string
  userId: string
  userRole: string
  note: string | null
  createdAt: string
}

interface ClaimDetail {
  id: number
  claimNumber: string
  notificationId: number
  notificationCode: string
  modelId: number
  modelName: string
  vendorId: number
  vendorCode: string
  vendorName: string
  vendorRequiredPhotos: string[] | null
  vendorRequiredFields: string[] | null
  inch: number
  branch: string
  odfNumber: string | null
  panelSerialNo: string
  ocSerialNo: string
  defectCode: string
  defectName: string
  version: string | null
  week: string | null
  claimStatus: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'ARCHIVED'
  submittedBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  photos: ClaimPhoto[]
  history: ClaimHistoryEntry[]
}

// ── Fetch Claim Detail ──────────────────────────────────────

const { data: claim, pending: fetchPending } = await useFetch<ClaimDetail>(`/api/claims/${claimId}`, {
  lazy: true
})

// ── Fetch Defects from Lookup ───────────────────────────────

const { data: defectsData } = await useFetch<{ id: number, code: string, name: string }[]>('/api/claims/lookup/defects', { lazy: true })
const defects = computed(() => defectsData.value || [])

const defectSelectItems = computed(() =>
  defects.value.map(d => ({ label: d.name, value: d.code }))
)

// ── Validation Schema ───────────────────────────────────────

const schemaRevision = z.object({
  panelSerialNo: z.string().min(1, 'Panel Serial No. is required'),
  ocSerialNo: z.string().min(1, 'OC Serial No. is required'),
  defectCode: z.string().min(1, 'Defect is required'),
  odfNumber: z.string().optional(),
  version: z.string().optional(),
  week: z.string().optional(),
  note: z.string().optional()
})
type SchemaRevision = z.output<typeof schemaRevision>

// ── State ───────────────────────────────────────────────────

const stateRevision = reactive<Partial<SchemaRevision>>({
  panelSerialNo: undefined,
  ocSerialNo: undefined,
  defectCode: undefined,
  odfNumber: undefined,
  version: undefined,
  week: undefined,
  note: undefined
})

// Photo upload state (only for rejected photos that need re-upload)
const photoState = reactive<Record<string, File | null>>({})

// ── Computed: Extract Review Info from History & Photos ──────

const rejectedPhotos = computed(() => {
  if (!claim.value?.photos) return []
  return claim.value.photos.filter(p => p.status === 'REJECT')
})

// Extract the latest REQUEST_REVISION note from history
const revisionHistory = computed(() => {
  if (!claim.value?.history) return []
  return claim.value.history.filter(h => h.action === 'REQUEST_REVISION')
})

const latestRevisionNote = computed(() => {
  if (revisionHistory.value.length === 0) return null
  return revisionHistory.value[0] // already sorted newest first from backend
})

// Extract photo-level review notes from history
const photoReviewNotes = computed(() => {
  if (!claim.value?.history) return new Map<string, string>()
  const map = new Map<string, string>()

  // Look for REVIEW_PHOTO actions with notes that reference specific photo types
  const reviewActions = claim.value.history.filter(h => h.action === 'REVIEW_PHOTO' && h.note)
  for (const action of reviewActions) {
    // Parse note to find photo type reference
    // Convention: note format "Photo rejected: PANEL_SN - reason text"
    const match = action.note?.match(/^Photo (?:rejected|reviewed): (\w+)\s*[-–]\s*(.+)$/i)
    if (match && match[1] && match[2]) {
      map.set(match[1], match[2])
    }
  }

  return map
})

// Vendor required fields from claim detail
const requiredFields = computed(() => {
  if (!claim.value?.vendorRequiredFields) return []
  return claim.value.vendorRequiredFields as string[]
})

const requiredPhotos = computed(() => {
  if (!claim.value?.vendorRequiredPhotos) return []
  return claim.value.vendorRequiredPhotos as string[]
})

// ── Populate State When Claim Loads ─────────────────────────

watch(claim, (newClaim) => {
  if (newClaim) {
    stateRevision.panelSerialNo = newClaim.panelSerialNo
    stateRevision.ocSerialNo = newClaim.ocSerialNo
    stateRevision.defectCode = newClaim.defectCode
    stateRevision.odfNumber = newClaim.odfNumber || undefined
    stateRevision.version = newClaim.version || undefined
    stateRevision.week = newClaim.week || undefined

    // Initialize photo state for rejected photos
    for (const photo of (newClaim.photos || []).filter(p => p.status === 'REJECT')) {
      photoState[photo.photoType] = null
    }
  }
}, { immediate: true })

// ── Helpers ─────────────────────────────────────────────────

function handleFileUpload(event: Event, type: string) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    photoState[type] = input.files[0] || null
  }
}

function removeFile(type: string) {
  photoState[type] = null
}

function getPhotoStatus(photoType: string): 'VERIFIED' | 'REJECT' | 'PENDING' | 'MISSING' {
  if (!claim.value?.photos) return 'MISSING'
  const photo = claim.value.photos.find(p => p.photoType === photoType)
  if (!photo) return 'MISSING'
  return photo.status
}

function getPhotoRejectNote(photoType: string): string | null {
  return photoReviewNotes.value.get(photoType) || null
}

function isFieldRejected(_fieldName: string): boolean {
  // Fields are considered "rejected" if the latest revision request mentions them
  // or if the general revision note exists (conservative approach: highlight all editable fields)
  return !!latestRevisionNote.value
}

// ── Upload Photo (for rejected photos) ──────────────────────

async function uploadPhoto(photoType: string, file: File): Promise<boolean> {
  const formData = new FormData()
  formData.append('photoType', photoType)
  formData.append('file', file)

  try {
    await $fetch(`/api/claims/${claimId}/photos`, {
      method: 'POST',
      body: formData
    })
    return true
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : `Failed to upload ${photoType}`
    toast.add({ title: 'Upload failed', description: message, color: 'error' })
    return false
  }
}

// ── Submit Revision ─────────────────────────────────────────

async function onSubmitRevision(_event: FormSubmitEvent<SchemaRevision>) {
  // Validate that all rejected photos have new files uploaded
  const missingPhotos = rejectedPhotos.value.filter(p => !photoState[p.photoType]).map(p => p.photoType)

  if (missingPhotos.length > 0) {
    toast.add({
      title: 'Revision Incomplete',
      description: `Please re-upload rejected photos: ${missingPhotos.map(p => photoLabels[p] || p).join(', ')}`,
      color: 'error'
    })
    return
  }

  isLoading.value = true
  try {
    // 1. Upload all new/re-uploaded photos first
    for (const [photoType, file] of Object.entries(photoState)) {
      if (file) {
        const ok = await uploadPhoto(photoType, file)
        if (!ok) {
          isLoading.value = false
          return
        }
      }
    }

    // 2. Submit revision (updates fields + changes status NEED_REVISION → SUBMITTED)
    await $fetch(`/api/claims/${claimId}/revise`, {
      method: 'PUT',
      body: {
        panelSerialNo: stateRevision.panelSerialNo,
        ocSerialNo: stateRevision.ocSerialNo,
        defectCode: stateRevision.defectCode,
        odfNumber: stateRevision.odfNumber || undefined,
        version: stateRevision.version || undefined,
        week: stateRevision.week || undefined,
        note: stateRevision.note || undefined
      }
    })

    toast.add({ title: 'Revision Submitted Successfully', color: 'success' })
    navigateTo('/cs/claim')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Submit revision failed'
    toast.add({ title: 'Submit failed', description: message, color: 'error' })
  } finally {
    isLoading.value = false
  }
}

const photoLabels: Record<string, string> = {
  CLAIM: 'Claim Photo',
  CLAIM_ZOOM: 'Claim Photo (Zoom)',
  ODF: 'ODF Label Photo',
  PANEL_SN: 'Panel S/N Photo',
  WO_PANEL: 'WO Panel Photo',
  WO_PANEL_SN: 'WO Panel S/N Photo'
}
</script>

<template>
  <div class="h-full w-full flex flex-col p-4 max-w-5xl mx-auto space-y-6">
    <div class="flex items-center gap-3">
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
          Revise Claim {{ claim?.claimNumber || claimId }}
          <UBadge color="warning" variant="subtle" class="ml-2 uppercase text-xs">
            NEED REVISION
          </UBadge>
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Please address the notes from the QRCC team below.
        </p>
      </div>
    </div>

    <!-- Alert with latest revision note from history -->
    <UAlert
      title="Revision Required"
      :description="latestRevisionNote?.note || 'Your claim has been reviewed but requires some corrections. Please fix the highlighted fields and re-upload the rejected photos.'"
      color="warning"
      variant="soft"
      icon="i-lucide-alert-triangle"
    />

    <!-- Revision History Timeline (if multiple revisions exist) -->
    <UCard v-if="revisionHistory.length > 1">
      <template #header>
        <div class="flex items-center gap-2 text-sm font-semibold">
          <UIcon name="i-lucide-history" class="w-4 h-4" />
          Revision History
        </div>
      </template>
      <div class="space-y-3">
        <div v-for="entry in revisionHistory" :key="entry.id" class="flex gap-3 text-sm">
          <div class="shrink-0 w-2 h-2 rounded-full bg-warning mt-1.5" />
          <div>
            <p class="text-gray-700 dark:text-gray-300">
              {{ entry.note || 'Revision requested' }}
            </p>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt)) }}
              &middot; by {{ entry.userRole }}
            </p>
          </div>
        </div>
      </div>
    </UCard>

    <UCard v-if="fetchPending">
      <div class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary animate-spin" />
        <span class="mt-2 text-gray-500">Loading claim revision data...</span>
      </div>
    </UCard>

    <template v-else-if="claim && claim.claimStatus === 'NEED_REVISION'">
      <UForm
        :schema="schemaRevision"
        :state="stateRevision"
        class="space-y-6"
        @submit="onSubmitRevision"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Left: Readonly Context -->
          <UPageCard title="Context (Read-only)" icon="i-lucide-file-text" class="flex-1">
            <div class="space-y-4 mt-4">
              <div>
                <label class="text-xs text-gray-500 font-medium uppercase tracking-wider">Notification Code</label>
                <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {{ claim.notificationCode }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500 font-medium uppercase tracking-wider">Product Model</label>
                <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {{ claim.modelName }} ({{ claim.inch }}")
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500 font-medium uppercase tracking-wider">Vendor</label>
                <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {{ claim.vendorName }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500 font-medium uppercase tracking-wider">Branch</label>
                <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {{ claim.branch || 'N/A' }}
                </p>
              </div>
            </div>
          </UPageCard>

          <!-- Right: Editable Form -->
          <div class="space-y-4">
            <UPageCard title="Fix Defect Information" icon="i-lucide-edit-3" class="flex-1 h-full">
              <div class="space-y-4 mt-4">
                <UFormField name="panelSerialNo" label="Panel Serial Number">
                  <UInput v-model="stateRevision.panelSerialNo" :ui="{ base: isFieldRejected('panelSerialNo') ? 'ring-2 ring-warning dark:ring-warning' : '' }" />
                </UFormField>

                <UFormField name="ocSerialNo" label="OC Serial Number">
                  <UInput v-model="stateRevision.ocSerialNo" :ui="{ base: isFieldRejected('ocSerialNo') ? 'ring-2 ring-warning dark:ring-warning' : '' }" />
                </UFormField>

                <UFormField name="defectCode" label="Defect Type">
                  <USelect
                    v-model="stateRevision.defectCode"
                    :items="defectSelectItems"
                    placeholder="Select defect..."
                  />
                </UFormField>

                <!-- Vendor required fields -->
                <template v-if="requiredFields.length > 0">
                  <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-4">
                    <div class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <UIcon name="i-lucide-info" class="w-4 h-4" />
                      Vendor Required Fields
                    </div>
                    <UFormField v-if="requiredFields.includes('odfNumber')" name="odfNumber" label="ODF Number">
                      <UInput v-model="stateRevision.odfNumber" />
                    </UFormField>
                    <UFormField v-if="requiredFields.includes('version')" name="version" label="Version">
                      <UInput v-model="stateRevision.version" />
                    </UFormField>
                    <UFormField v-if="requiredFields.includes('week')" name="week" label="Week">
                      <UInput v-model="stateRevision.week" />
                    </UFormField>
                  </div>
                </template>

                <!-- Revision Note -->
                <UFormField name="note" label="Revision Note (optional)">
                  <UTextarea
                    v-model="stateRevision.note"
                    placeholder="Describe what was corrected..."
                    :rows="3"
                  />
                </UFormField>
              </div>
            </UPageCard>
          </div>
        </div>

        <!-- Photo Revisions -->
        <UPageCard title="Photo Evidence" icon="i-lucide-image" class="w-full">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            <div v-for="photoType in requiredPhotos" :key="photoType" class="flex flex-col">
              <!-- VERIFIED PHOTO (Read-only) -->
              <template v-if="getPhotoStatus(photoType) === 'VERIFIED'">
                <label class="text-sm font-medium mb-2 text-gray-500">{{ photoLabels[photoType] || photoType }}</label>
                <div class="relative flex-1 min-h-[160px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center p-4 opacity-75">
                  <UIcon name="i-lucide-check-circle" class="w-8 h-8 text-success mx-auto mb-2" />
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Verified by QRCC
                  </p>
                </div>
              </template>

              <!-- REJECTED PHOTO (Needs re-upload) -->
              <template v-else-if="getPhotoStatus(photoType) === 'REJECT'">
                <label class="text-sm font-medium mb-1 text-red-600 dark:text-red-400">{{ photoLabels[photoType] || photoType }}<span class="ml-1">*</span></label>

                <!-- Reject Note (if available from history) -->
                <div class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs p-2 rounded-t-lg border-x border-t border-red-200 dark:border-red-800 flex items-start gap-1">
                  <UIcon name="i-lucide-message-square-x" class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{{ getPhotoRejectNote(photoType) || 'This photo was rejected. Please re-upload.' }}</span>
                </div>

                <div
                  class="relative flex-1 group min-h-[140px] rounded-b-xl border-x border-b-2 border-dashed flex flex-col items-center justify-center p-4 transition-colors overflow-hidden"
                  :class="[
                    !photoState[photoType]
                      ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 hover:border-red-500'
                      : 'border-success bg-white dark:bg-gray-900 border-solid'
                  ]"
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    @change="e => handleFileUpload(e, photoType)"
                  >

                  <div v-if="!photoState[photoType]" class="text-center">
                    <UIcon name="i-lucide-upload-cloud" class="w-8 h-8 text-red-400 mx-auto mb-2 transition-colors" />
                    <p class="text-sm font-medium text-red-600 dark:text-red-400">
                      Click to re-upload image
                    </p>
                  </div>

                  <div v-else class="w-full h-full flex flex-col items-center justify-center relative z-20">
                    <UIcon name="i-lucide-check-circle-2" class="w-8 h-8 text-success mx-auto mb-2" />
                    <p class="text-sm text-center font-medium truncate w-full px-2" :title="photoState[photoType]?.name">
                      {{ photoState[photoType]?.name }}
                    </p>
                    <UIcon name="i-lucide-trash-2" class="w-5 h-5 text-red-500 absolute top-2 right-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950 p-1 rounded transition-colors" @click.stop="removeFile(photoType)" />
                  </div>
                </div>
              </template>

              <!-- PENDING PHOTO (Uploaded but not reviewed yet) -->
              <template v-else-if="getPhotoStatus(photoType) === 'PENDING'">
                <label class="text-sm font-medium mb-2 text-gray-500">{{ photoLabels[photoType] || photoType }}</label>
                <div class="relative flex-1 min-h-[160px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center p-4 opacity-75">
                  <UIcon name="i-lucide-clock" class="w-8 h-8 text-warning mx-auto mb-2" />
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pending Review
                  </p>
                </div>
              </template>

              <!-- MISSING PHOTO (Not uploaded yet — shouldn't happen for revision but handle gracefully) -->
              <template v-else>
                <label class="text-sm font-medium mb-2 text-gray-500">{{ photoLabels[photoType] || photoType }}</label>
                <div
                  class="relative flex-1 group min-h-[160px] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center p-4 transition-colors hover:border-primary overflow-hidden bg-gray-50 dark:bg-gray-800/50"
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    @change="e => handleFileUpload(e, photoType)"
                  >
                  <div v-if="!photoState[photoType]" class="text-center">
                    <UIcon name="i-lucide-upload-cloud" class="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Click to upload image
                    </p>
                  </div>
                  <div v-else class="w-full h-full flex flex-col items-center justify-center relative z-20">
                    <UIcon name="i-lucide-check-circle-2" class="w-8 h-8 text-success mx-auto mb-2" />
                    <p class="text-sm text-center font-medium truncate w-full px-2" :title="photoState[photoType]?.name">
                      {{ photoState[photoType]?.name }}
                    </p>
                    <UIcon name="i-lucide-trash-2" class="w-5 h-5 text-red-500 absolute top-2 right-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950 p-1 rounded transition-colors" @click.stop="removeFile(photoType)" />
                  </div>
                </div>
              </template>
            </div>
          </div>
        </UPageCard>

        <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <UButton
            type="submit"
            trailing-icon="i-lucide-send"
            color="primary"
            size="lg"
            :loading="isLoading"
          >
            Submit Revision
          </UButton>
        </div>
      </UForm>
    </template>

    <!-- Guard: Claim is not in NEED_REVISION status -->
    <UCard v-else-if="claim && claim.claimStatus !== 'NEED_REVISION'" class="flex-1">
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <UIcon name="i-lucide-shield-alert" class="w-12 h-12 text-warning mb-4" />
        <p class="text-gray-900 dark:text-white font-medium">
          This claim cannot be revised
        </p>
        <p class="text-gray-500 text-sm mt-1">
          Current status: <UBadge variant="subtle" color="neutral">
            {{ claim.claimStatus }}
          </UBadge>
        </p>
        <UButton
          to="/cs/claim"
          class="mt-4"
          variant="soft"
          icon="i-lucide-arrow-left"
        >
          Back to Claims
        </UButton>
      </div>
    </UCard>

    <!-- Not found -->
    <UCard v-else-if="!fetchPending && !claim" class="flex-1">
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <UIcon name="i-lucide-alert-triangle" class="w-12 h-12 text-red-500 mb-4" />
        <p class="text-gray-900 dark:text-white font-medium">
          Claim Not Found
        </p>
        <p class="text-gray-500 text-sm mt-1">
          The requested claim could not be located.
        </p>
        <UButton
          to="/cs/claim"
          class="mt-4"
          variant="soft"
          icon="i-lucide-arrow-left"
        >
          Back to Claims
        </UButton>
      </div>
    </UCard>
  </div>
</template>
