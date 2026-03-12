<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()
const notificationCode = route.query.notification as string | undefined

const currentStep = ref(1)
const isLoading = ref(false)
const draftClaimId = ref<number | null>(null)

// ── Lookup Data (fetched from API) ──────────────────────────

const { data: defectsData } = await useFetch<{ id: number, code: string, name: string }[]>('/api/claims/lookup/defects', { lazy: true })
const defects = computed(() => defectsData.value || [])

const notificationSearch = ref(notificationCode || '')
const notificationResults = ref<{
  id: number
  notificationCode: string
  modelId: number | null
  modelName: string | null
  branch: string | null
  vendorId: number | null
  vendorName: string | null
}[]>([])

const selectedNotification = ref<typeof notificationResults.value[0] | null>(null)

// Vendor config (loaded when vendor is known)
const vendorConfig = ref<{
  id: number
  code: string
  name: string
  requiredPhotos: string[]
  requiredFields: string[]
} | null>(null)

// Models for selected vendor
const modelResults = ref<{ id: number, name: string, inch: number, vendorId: number }[]>([])

// Validation Schema for Step 1
const schemaStep1 = z.object({
  notificationId: z.number().min(1, 'Notification is required'),
  modelId: z.number().min(1, 'Model is required'),
  vendorId: z.number().min(1, 'Vendor is required'),
  inch: z.number().min(1, 'Inch is required'),
  branch: z.string().min(1, 'Branch is required'),
  panelSerialNo: z.string().min(1, 'Panel Serial No. is required'),
  ocSerialNo: z.string().min(1, 'OC Serial No. is required'),
  defectCode: z.string().min(1, 'Defect is required'),
  odfNumber: z.string().optional(),
  version: z.string().optional(),
  week: z.string().optional()
})
type SchemaStep1 = z.output<typeof schemaStep1>

// State for Step 1
const stateStep1 = reactive<Partial<SchemaStep1>>({
  notificationId: undefined,
  modelId: undefined,
  vendorId: undefined,
  inch: undefined,
  branch: undefined,
  panelSerialNo: undefined,
  ocSerialNo: undefined,
  defectCode: undefined,
  odfNumber: undefined,
  version: undefined,
  week: undefined
})

// Photo upload state: photoType -> File
const stateStep2 = reactive<Record<string, File | null>>({})

// ── Lookup Functions ────────────────────────────────────────

async function lookupNotification() {
  if (!notificationSearch.value.trim()) return

  try {
    const results = await $fetch<typeof notificationResults.value>('/api/claims/lookup/notifications', {
      query: { search: notificationSearch.value.trim() }
    })
    notificationResults.value = results

    if (results.length === 0) {
      toast.add({ title: 'No notifications found', description: 'Try a different search term.', color: 'warning' })
    }
  } catch {
    toast.add({ title: 'Lookup failed', color: 'error' })
  }
}

async function selectNotification(notif: typeof notificationResults.value[0]) {
  selectedNotification.value = notif
  stateStep1.notificationId = notif.id
  stateStep1.branch = notif.branch || undefined

  // Load vendor config if notification has a vendor
  if (notif.vendorId) {
    stateStep1.vendorId = notif.vendorId
    await loadVendorConfig(notif.vendorId)
  }

  // Load models for the vendor
  if (notif.vendorId) {
    await loadModels(notif.vendorId)
  }

  // If notification has a model, pre-select it
  if (notif.modelId) {
    stateStep1.modelId = notif.modelId
    const model = modelResults.value.find(m => m.id === notif.modelId)
    if (model) {
      stateStep1.inch = model.inch
    }
  }

  toast.add({ title: 'Notification selected', color: 'success' })
}

async function loadVendorConfig(vendorId: number) {
  try {
    vendorConfig.value = await $fetch(`/api/claims/lookup/vendors/${vendorId}`)
    // Initialize photo state for required photos
    for (const pt of (vendorConfig.value?.requiredPhotos || [])) {
      if (!(pt in stateStep2)) {
        stateStep2[pt] = null
      }
    }
  } catch {
    toast.add({ title: 'Failed to load vendor config', color: 'error' })
  }
}

async function loadModels(vendorId: number) {
  try {
    modelResults.value = await $fetch('/api/claims/lookup/models', {
      query: { vendorId }
    })
  } catch {
    toast.add({ title: 'Failed to load models', color: 'error' })
  }
}

// Watch vendorId changes (manual selection)
watch(() => stateStep1.vendorId, async (newVal) => {
  if (newVal && (!vendorConfig.value || vendorConfig.value.id !== newVal)) {
    await loadVendorConfig(newVal)
    await loadModels(newVal)
    // Reset model selection when vendor changes
    stateStep1.modelId = undefined
    stateStep1.inch = undefined
  }
})

// Watch modelId to auto-fill inch
watch(() => stateStep1.modelId, (newVal) => {
  if (newVal) {
    const model = modelResults.value.find(m => m.id === newVal)
    if (model) {
      stateStep1.inch = model.inch
    }
  }
})

// Computed for Vendor Rules
const requiredFields = computed(() => vendorConfig.value?.requiredFields || [])
const requiredPhotos = computed(() => vendorConfig.value?.requiredPhotos || [])

const modelSelectItems = computed(() =>
  modelResults.value.map(m => ({ label: m.name + ' (' + m.inch + '")', value: m.id }))
)

const defectSelectItems = computed(() =>
  defects.value.map(d => ({ label: d.name, value: d.code }))
)

// Auto run lookup on mount if notification query param exists
onMounted(() => {
  if (notificationCode) {
    lookupNotification()
  }
})

// ── Draft Management ────────────────────────────────────────

async function saveDraft(): Promise<boolean> {
  try {
    if (!draftClaimId.value) {
      // Create new draft
      const created = await $fetch<{ id: number }>('/api/claims', {
        method: 'POST',
        body: {
          notificationId: stateStep1.notificationId,
          modelId: stateStep1.modelId,
          vendorId: stateStep1.vendorId,
          inch: stateStep1.inch,
          branch: stateStep1.branch,
          panelSerialNo: stateStep1.panelSerialNo,
          ocSerialNo: stateStep1.ocSerialNo,
          defectCode: stateStep1.defectCode,
          odfNumber: stateStep1.odfNumber || undefined,
          version: stateStep1.version || undefined,
          week: stateStep1.week || undefined
        }
      })
      draftClaimId.value = created.id
      toast.add({ title: 'Draft created', color: 'success' })
    } else {
      // Update existing draft
      await $fetch(`/api/claims/${draftClaimId.value}`, {
        method: 'PUT',
        body: {
          notificationId: stateStep1.notificationId,
          modelId: stateStep1.modelId,
          vendorId: stateStep1.vendorId,
          inch: stateStep1.inch,
          branch: stateStep1.branch,
          panelSerialNo: stateStep1.panelSerialNo,
          ocSerialNo: stateStep1.ocSerialNo,
          defectCode: stateStep1.defectCode,
          odfNumber: stateStep1.odfNumber || undefined,
          version: stateStep1.version || undefined,
          week: stateStep1.week || undefined
        }
      })
      toast.add({ title: 'Draft updated', color: 'success' })
    }
    return true
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save draft'
    toast.add({ title: 'Save failed', description: message, color: 'error' })
    return false
  }
}

// ── Photo Upload ────────────────────────────────────────────

async function uploadPhoto(photoType: string, file: File): Promise<boolean> {
  if (!draftClaimId.value) return false

  const formData = new FormData()
  formData.append('photoType', photoType)
  formData.append('file', file)

  try {
    await $fetch(`/api/claims/${draftClaimId.value}/photos`, {
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

async function uploadAllPhotos(): Promise<boolean> {
  const photosToUpload = requiredPhotos.value.filter(pt => stateStep2[pt])
  let allSuccess = true

  for (const pt of photosToUpload) {
    const file = stateStep2[pt]
    if (file) {
      const ok = await uploadPhoto(pt, file)
      if (!ok) allSuccess = false
    }
  }

  return allSuccess
}

// ── Form Navigation ─────────────────────────────────────────

async function nextStep(_event?: FormSubmitEvent<SchemaStep1>) {
  if (currentStep.value === 1) {
    isLoading.value = true
    const saved = await saveDraft()
    isLoading.value = false
    if (!saved) return
    currentStep.value = 2
  } else if (currentStep.value === 2) {
    // Validate required photos
    const missing = requiredPhotos.value.filter(p => !stateStep2[p])
    if (missing.length > 0) {
      toast.add({ title: 'Missing Photos', description: `Please upload: ${missing.map(p => photoLabels[p] || p).join(', ')}`, color: 'error' })
      return
    }

    isLoading.value = true
    const uploaded = await uploadAllPhotos()
    isLoading.value = false
    if (!uploaded) return

    currentStep.value = 3
    toast.add({ title: 'All photos uploaded', color: 'success' })
  }
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

function handleFileUpload(event: Event, type: string) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    stateStep2[type] = input.files[0] || null
  }
}

function removeFile(type: string) {
  stateStep2[type] = null
}

// ── Submit Claim ────────────────────────────────────────────

async function onSubmitClaim() {
  if (!draftClaimId.value) {
    toast.add({ title: 'No draft to submit', color: 'error' })
    return
  }

  isLoading.value = true
  try {
    await $fetch(`/api/claims/${draftClaimId.value}/submit`, { method: 'PUT' })
    toast.add({ title: 'Claim Submitted Successfully', color: 'success' })
    navigateTo('/cs/claim')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Submit failed'
    toast.add({ title: 'Submit failed', description: message, color: 'error' })
  } finally {
    isLoading.value = false
  }
}

async function onSaveAsDraft() {
  isLoading.value = true
  await saveDraft()
  isLoading.value = false
}

// Map enum to label
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
  <div class="h-full w-full flex flex-col p-4 max-w-4xl mx-auto">
    <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold font-inter">
          Create New Claim
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Complete the wizard below to submit a claim.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UBadge
          v-if="draftClaimId"
          color="neutral"
          variant="soft"
          icon="i-lucide-check-circle"
          size="sm"
        >
          Draft #{{ draftClaimId }}
        </UBadge>
      </div>
    </div>

    <!-- Stepper UI -->
    <div class="mb-8">
      <div class="flex items-center justify-between relative">
        <div class="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
        <div
          v-for="step in [1, 2, 3]"
          :key="step"
          class="flex flex-col items-center gap-2 bg-white dark:bg-gray-900 px-2"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200"
            :class="[
              currentStep === step ? 'bg-primary-500 text-white ring-4 ring-primary-50 dark:ring-primary-950'
              : currentStep > step ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            ]"
          >
            <UIcon v-if="currentStep > step" name="i-lucide-check" class="w-4 h-4" />
            <span v-else>{{ step }}</span>
          </div>
          <span class="text-xs font-medium" :class="currentStep >= step ? 'text-gray-900 dark:text-white' : 'text-gray-500'">
            {{ step === 1 ? 'Notification' : step === 2 ? 'Evidence' : 'Review' }}
          </span>
        </div>
      </div>
    </div>

    <UCard class="flex-1 overflow-visible">
      <!-- STEP 1: Notification & Defect -->
      <div v-show="currentStep === 1">
        <UForm
          :schema="schemaStep1"
          :state="stateStep1"
          class="space-y-6"
          @submit="nextStep"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left Column: Notification -->
            <div class="space-y-4">
              <h3 class="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                1. Notification Details
              </h3>

              <!-- Notification Lookup -->
              <div class="space-y-2">
                <label class="text-sm font-medium">Search Notification</label>
                <div class="flex gap-2 w-full">
                  <UInput v-model="notificationSearch" placeholder="Type notification code..." class="flex-1" />
                  <UButton
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-search"
                    @click="lookupNotification"
                  >
                    Lookup
                  </UButton>
                </div>
              </div>

              <!-- Notification Results -->
              <div v-if="notificationResults.length > 0 && !selectedNotification" class="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
                <button
                  v-for="notif in notificationResults"
                  :key="notif.id"
                  type="button"
                  class="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                  @click="selectNotification(notif)"
                >
                  <div class="font-semibold">
                    {{ notif.notificationCode }}
                  </div>
                  <div class="text-gray-500 text-xs mt-0.5">
                    {{ notif.modelName || 'N/A' }} &middot; {{ notif.vendorName || 'N/A' }} &middot; {{ notif.branch || 'N/A' }}
                  </div>
                </button>
              </div>

              <!-- Selected Notification Display -->
              <div v-if="selectedNotification" class="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 text-sm">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-semibold text-primary-700 dark:text-primary-300">{{ selectedNotification.notificationCode }}</span>
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-x"
                    @click="selectedNotification = null; stateStep1.notificationId = undefined"
                  />
                </div>
                <div class="text-gray-600 dark:text-gray-400 text-xs space-y-0.5">
                  <div>Model: {{ selectedNotification.modelName || 'N/A' }}</div>
                  <div>Vendor: {{ selectedNotification.vendorName || 'N/A' }}</div>
                  <div>Branch: {{ selectedNotification.branch || 'N/A' }}</div>
                </div>
              </div>

              <UFormField name="modelId" label="Product Model">
                <USelect
                  v-model="stateStep1.modelId"
                  :items="modelSelectItems"
                  placeholder="Select model..."
                  :disabled="modelResults.length === 0"
                />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField name="inch" label="Inch">
                  <UInput v-model="stateStep1.inch" type="number" disabled />
                </UFormField>
                <UFormField name="branch" label="Branch">
                  <UInput v-model="stateStep1.branch" />
                </UFormField>
              </div>

              <UFormField name="vendorId" label="Vendor">
                <UInput v-if="vendorConfig" :model-value="vendorConfig.name" disabled />
                <UInput
                  v-else
                  model-value=""
                  placeholder="Select a notification first"
                  disabled
                />
              </UFormField>
            </div>

            <!-- Right Column: Defect Information -->
            <div class="space-y-4">
              <h3 class="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                2. Defect Information
              </h3>

              <UFormField name="panelSerialNo" label="Panel Serial Number">
                <UInput v-model="stateStep1.panelSerialNo" />
              </UFormField>

              <UFormField name="ocSerialNo" label="OC Serial Number">
                <UInput v-model="stateStep1.ocSerialNo" />
              </UFormField>

              <UFormField name="defectCode" label="Defect Type">
                <USelect
                  v-model="stateStep1.defectCode"
                  :items="defectSelectItems"
                  placeholder="Select defect..."
                />
              </UFormField>

              <template v-if="requiredFields.length > 0">
                <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 mt-4 space-y-4">
                  <div class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                    <UIcon name="i-lucide-info" class="w-4 h-4" />
                    Vendor Required Fields
                  </div>
                  <UFormField v-if="requiredFields.includes('odfNumber')" name="odfNumber" label="ODF Number">
                    <UInput v-model="stateStep1.odfNumber" />
                  </UFormField>

                  <UFormField v-if="requiredFields.includes('version')" name="version" label="Version">
                    <UInput v-model="stateStep1.version" />
                  </UFormField>

                  <UFormField v-if="requiredFields.includes('week')" name="week" label="Week">
                    <UInput v-model="stateStep1.week" />
                  </UFormField>
                </div>
              </template>
            </div>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            <UButton
              type="submit"
              trailing-icon="i-lucide-arrow-right"
              color="primary"
              :loading="isLoading"
            >
              Next Step
            </UButton>
          </div>
        </UForm>
      </div>

      <!-- STEP 2: Photo Evidence -->
      <div v-show="currentStep === 2" class="space-y-6">
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3 border border-blue-200 dark:border-blue-800">
          <UIcon name="i-lucide-camera" class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div class="text-sm text-blue-800 dark:text-blue-300">
            <p class="font-medium">
              Information
            </p>
            <p class="mt-1">
              Please ensure all uploaded photos are clear, well-lit, and show the text or barcode. Max file size: 5MB (JPG/PNG).
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Dynamic Photo Upload Zones -->
          <div v-for="photoType in requiredPhotos" :key="photoType" class="flex flex-col">
            <label class="text-sm font-medium mb-2">{{ photoLabels[photoType] || photoType }}<span class="text-red-500 ml-1">*</span></label>
            <div
              class="relative flex-1 group min-h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center p-4 transition-colors hover:border-primary peer-focus-within:border-primary overflow-hidden"
              :class="{ 'bg-gray-50 dark:bg-gray-800/50': !stateStep2[photoType], 'border-solid border-gray-200 dark:border-gray-700': stateStep2[photoType] }"
            >
              <input
                type="file"
                accept="image/png, image/jpeg"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                @change="e => handleFileUpload(e, photoType)"
              >

              <div v-if="!stateStep2[photoType]" class="text-center">
                <UIcon name="i-lucide-upload-cloud" class="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-primary transition-colors" />
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Click or drag image
                </p>
              </div>

              <div v-else class="w-full h-full flex flex-col items-center justify-center relative z-20">
                <UIcon name="i-lucide-check-circle-2" class="w-8 h-8 text-success mx-auto mb-2" />
                <p class="text-sm text-center font-medium truncate w-full px-2" :title="stateStep2[photoType]?.name">
                  {{ stateStep2[photoType]?.name }}
                </p>
                <UIcon name="i-lucide-trash-2" class="w-5 h-5 text-red-500 absolute top-2 right-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950 p-1 rounded transition-colors" @click.stop="removeFile(photoType)" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <UButton
            variant="outline"
            color="neutral"
            icon="i-lucide-arrow-left"
            @click="prevStep"
          >
            Back
          </UButton>
          <UButton
            trailing-icon="i-lucide-arrow-right"
            color="primary"
            :loading="isLoading"
            @click="nextStep()"
          >
            Next Step
          </UButton>
        </div>
      </div>

      <!-- STEP 3: Review -->
      <div v-show="currentStep === 3" class="space-y-6">
        <h3 class="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
          Review & Submit Report
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UPageCard title="Report Summary" icon="i-lucide-clipboard-list" class="flex-1">
            <ul class="space-y-3 mt-4">
              <li class="flex justify-between text-sm">
                <span class="text-gray-500">Notification Code</span>
                <span class="font-medium">{{ selectedNotification?.notificationCode || '-' }}</span>
              </li>
              <li class="flex justify-between text-sm">
                <span class="text-gray-500">Product Model</span>
                <span class="font-medium">{{ modelResults.find(m => m.id === stateStep1.modelId)?.name || '-' }} ({{ stateStep1.inch }}" / {{ vendorConfig?.name }})</span>
              </li>
              <li class="flex justify-between text-sm">
                <span class="text-gray-500">Branch</span>
                <span class="font-medium">{{ stateStep1.branch || '-' }}</span>
              </li>
            </ul>
          </UPageCard>

          <UPageCard title="Defect Summary" icon="i-lucide-alert-circle" class="flex-1">
            <ul class="space-y-3 mt-4">
              <li class="flex justify-between text-sm">
                <span class="text-gray-500">Panel S/N</span>
                <span class="font-mono">{{ stateStep1.panelSerialNo || '-' }}</span>
              </li>
              <li class="flex justify-between text-sm">
                <span class="text-gray-500">OC S/N</span>
                <span class="font-mono">{{ stateStep1.ocSerialNo || '-' }}</span>
              </li>
              <li class="flex justify-between text-sm">
                <span class="text-gray-500">Defect Info</span>
                <span class="font-medium">{{ defects.find(d => d.code === stateStep1.defectCode)?.name || 'N/A' }}</span>
              </li>
            </ul>
          </UPageCard>
        </div>

        <UPageCard title="Evidences Attached" icon="i-lucide-files" class="w-full mt-4">
          <div class="flex flex-wrap gap-2 mt-4">
            <UBadge
              v-for="photoType in requiredPhotos"
              :key="photoType"
              color="success"
              variant="subtle"
              icon="i-lucide-check"
            >
              {{ photoLabels[photoType] || photoType }}
            </UBadge>
          </div>
        </UPageCard>

        <div class="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <UButton
            variant="outline"
            color="neutral"
            icon="i-lucide-arrow-left"
            @click="prevStep"
          >
            Back
          </UButton>
          <div class="flex gap-2">
            <UButton
              variant="soft"
              color="neutral"
              icon="i-lucide-save"
              :loading="isLoading"
              @click="onSaveAsDraft"
            >
              Save as Draft
            </UButton>
            <UButton
              icon="i-lucide-send"
              color="primary"
              :loading="isLoading"
              @click="onSubmitClaim"
            >
              Submit to QRCC
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
