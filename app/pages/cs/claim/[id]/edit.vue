<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()
const claimId = route.params.id as string

interface ClaimDetail {
  id: number
  claimNumber: string
  notificationCode: string
  modelName: string
  inch?: string | number
  branch?: string
  claimStatus: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'ARCHIVED'
  createdAt: string
  panelSerialNo: string
  ocSerialNo: string
  defectCode: string
}

const { data: claim, status } = await useFetch<ClaimDetail>(`/api/claims/${claimId}`, {
  lazy: true
})

// Validation Schema for Revision (Similar to Step 1 but with pre-filled readonly data)
const schemaRevision = z.object({
  panelSerialNo: z.string().min(1, 'Panel Serial No. is required'),
  ocSerialNo: z.string().min(1, 'OC Serial No. is required'),
  defectCode: z.string().min(1, 'Defect is required'),
  odfNumber: z.string().optional(),
  version: z.string().optional(),
  week: z.string().optional()
})
type SchemaRevision = z.output<typeof schemaRevision>

// State for Revision
const stateRevision = reactive<Partial<SchemaRevision>>({
  panelSerialNo: undefined,
  ocSerialNo: undefined,
  defectCode: undefined,
  odfNumber: undefined,
  version: undefined,
  week: undefined
})

// Photo upload state (only for rejected photos)
const photoState = reactive<Record<string, File | null>>({
  CLAIM: null,
  CLAIM_ZOOM: null,
  ODF: null,
  PANEL_SN: null,
  WO_PANEL: null,
  WO_PANEL_SN: null
})

// Mock QRCC Review Data to demonstrate revision flow
const qrccReviewNotes = ref<{ field: string, note: string, type: 'field' | 'photo' }[]>([
  { field: 'panelSerialNo', note: 'Serial number is illegible, please re-type correctly.', type: 'field' },
  { field: 'PANEL_SN', note: 'Photo is blurry, please take a clearer picture.', type: 'photo' }
])

const defects = ref([
  { code: 'PANEL_BLANK', name: 'Panel Blank' },
  { code: 'LINE_DEFECT', name: 'Line Defect' },
  { code: 'PHYSICAL_DAMAGE', name: 'Physical Damage' }
])

// Populate state once claim is loaded
watch(claim, (newClaim) => {
  if (newClaim) {
    stateRevision.panelSerialNo = newClaim.panelSerialNo
    stateRevision.ocSerialNo = newClaim.ocSerialNo
    stateRevision.defectCode = newClaim.defectCode
    // other fields...
  }
}, { immediate: true })

function handleFileUpload(event: Event, type: string) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    photoState[type] = input.files[0] || null
  }
}

function removeFile(type: string) {
  photoState[type] = null
}

function isFieldRejected(fieldName: string) {
  return qrccReviewNotes.value.some(n => n.field === fieldName && n.type === 'field')
}

function getFieldRejectNote(fieldName: string) {
  return qrccReviewNotes.value.find(n => n.field === fieldName && n.type === 'field')?.note
}

function getPhotoRejectNote(photoType: string) {
  return qrccReviewNotes.value.find(n => n.field === photoType && n.type === 'photo')?.note
}

async function onSubmitRevision(_event: FormSubmitEvent<SchemaRevision>) {
  // Validate that all rejected photos have new files uploaded
  const rejectedPhotos = qrccReviewNotes.value.filter(n => n.type === 'photo').map(n => n.field)
  const missingPhotos = rejectedPhotos.filter(p => !photoState[p])

  if (missingPhotos.length > 0) {
    toast.add({ title: 'Revision Incomplete', description: `Please re-upload rejected photos: ${missingPhotos.join(', ')}`, color: 'error' })
    return
  }

  toast.add({ title: 'Submitting Revision...', icon: 'i-lucide-loader-2' })
  await new Promise(r => setTimeout(r, 1000))
  toast.add({ title: 'Revision Submitted Successfully', color: 'success' })
  navigateTo('/cs/claim')
}

const _photoLabels: Record<string, string> = {
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
          Revise Claim {{ claimId }}
          <UBadge color="warning" variant="subtle" class="ml-2 uppercase text-xs">
            NEED REVISION
          </UBadge>
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Please address the notes from the QRCC team below.
        </p>
      </div>
    </div>

    <!-- Alert for Revision -->
    <UAlert
      title="Revision Required"
      description="Your claim has been reviewed but requires some corrections. Please fix the highlighted fields and re-upload the rejected photos."
      color="warning"
      variant="soft"
      icon="i-lucide-alert-triangle"
    />

    <UCard v-if="status === 'pending'">
      <div class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary animate-spin" />
        <span class="mt-2 text-gray-500">Loading claim revision data...</span>
      </div>
    </UCard>

    <UForm
      v-else-if="claim"
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
                <UInput v-model="stateRevision.panelSerialNo" :ui="{ base: isFieldRejected('panelSerialNo') ? 'ring-2 ring-red-500 dark:ring-red-400' : '' }" />
                <template v-if="isFieldRejected('panelSerialNo')" #help>
                  <span class="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
                    <UIcon name="i-lucide-alert-circle" class="w-3 h-3" />
                    {{ getFieldRejectNote('panelSerialNo') }}
                  </span>
                </template>
              </UFormField>

              <UFormField name="ocSerialNo" label="OC Serial Number">
                <UInput v-model="stateRevision.ocSerialNo" :ui="{ base: isFieldRejected('ocSerialNo') ? 'ring-2 ring-red-500 dark:ring-red-400' : '' }" />
                <template v-if="isFieldRejected('ocSerialNo')" #help>
                  <span class="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
                    <UIcon name="i-lucide-alert-circle" class="w-3 h-3" />
                    {{ getFieldRejectNote('ocSerialNo') }}
                  </span>
                </template>
              </UFormField>

              <UFormField name="defectCode" label="Defect Type">
                <USelect
                  v-model="stateRevision.defectCode"
                  :items="defects"
                  option-attribute="name"
                  value-attribute="code"
                  :ui="{ base: isFieldRejected('defectCode') ? 'ring-2 ring-red-500 dark:ring-red-400' : '' }"
                />
                <template v-if="isFieldRejected('defectCode')" #help>
                  <span class="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
                    <UIcon name="i-lucide-alert-circle" class="w-3 h-3" />
                    {{ getFieldRejectNote('defectCode') }}
                  </span>
                </template>
              </UFormField>
            </div>
          </UPageCard>
        </div>
      </div>

      <!-- Photo Revisions -->
      <UPageCard title="Fix Photo Evidence" icon="i-lucide-image" class="w-full">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          <!-- Assume we know these from backend, mock listing two photos: one verified, one rejected -->

          <!-- VERIFIED PHOTO (Readonly) -->
          <div class="flex flex-col opacity-75">
            <label class="text-sm font-medium mb-2 text-gray-500">Claim Photo (CLAIM)</label>
            <div class="relative flex-1 min-h-[160px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center p-4">
              <UIcon name="i-lucide-check-circle" class="w-8 h-8 text-success mx-auto mb-2" />
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Verified by QRCC
              </p>
            </div>
          </div>

          <!-- REJECTED PHOTO (Editable) -->
          <div class="flex flex-col">
            <label class="text-sm font-medium mb-1 text-red-600 dark:text-red-400">Panel S/N Photo (PANEL_SN)<span class="ml-1">*</span></label>

            <!-- Reject Note -->
            <div class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs p-2 rounded-t-lg border-x border-t border-red-200 dark:border-red-800 flex items-start gap-1">
              <UIcon name="i-lucide-message-square-x" class="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{{ getPhotoRejectNote('PANEL_SN') }}</span>
            </div>

            <div
              class="relative flex-1 group min-h-[140px] rounded-b-xl border-x border-b-2 border-dashed flex flex-col items-center justify-center p-4 transition-colors overflow-hidden"
              :class="[
                !photoState['PANEL_SN']
                  ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 hover:border-red-500'
                  : 'border-success bg-white dark:bg-gray-900 border-solid'
              ]"
            >
              <input
                type="file"
                accept="image/png, image/jpeg"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                @change="e => handleFileUpload(e, 'PANEL_SN')"
              >

              <div v-if="!photoState['PANEL_SN']" class="text-center">
                <UIcon name="i-lucide-upload-cloud" class="w-8 h-8 text-red-400 mx-auto mb-2 transition-colors" />
                <p class="text-sm font-medium text-red-600 dark:text-red-400">
                  Click to re-upload image
                </p>
              </div>

              <div v-else class="w-full h-full flex flex-col items-center justify-center relative z-20">
                <UIcon name="i-lucide-check-circle-2" class="w-8 h-8 text-success mx-auto mb-2" />
                <p class="text-sm text-center font-medium truncate w-full px-2" :title="photoState['PANEL_SN']?.name">
                  {{ photoState['PANEL_SN']?.name }}
                </p>
                <UIcon name="i-lucide-trash-2" class="w-5 h-5 text-red-500 absolute top-2 right-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950 p-1 rounded transition-colors" @click.stop="removeFile('PANEL_SN')" />
              </div>
            </div>
          </div>
        </div>
      </UPageCard>

      <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <UButton
          type="submit"
          trailing-icon="i-lucide-send"
          color="primary"
          size="lg"
        >
          Submit Revision
        </UButton>
      </div>
    </UForm>
  </div>
</template>
