<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()
const notificationCode = route.query.notification as string | undefined

const currentStep = ref(1)

// Validation Schema for Step 1
const schemaStep1 = z.object({
  notificationCode: z.string().min(1, 'Notification code is required'),
  modelName: z.string().min(1, 'Model name is required'),
  inch: z.number().min(1, 'Inch is required'),
  vendorId: z.number().min(1, 'Vendor is required'),
  branch: z.string().min(1, 'Branch is required'),
  panelSerialNo: z.string().min(1, 'Panel Serial No. is required'),
  ocSerialNo: z.string().min(1, 'OC Serial No. is required'),
  defectId: z.number().min(1, 'Defect is required'),
  odfNumber: z.string().optional(),
  version: z.string().optional(),
  week: z.string().optional()
})
type SchemaStep1 = z.output<typeof schemaStep1>

// State for Step 1
const stateStep1 = reactive<Partial<SchemaStep1>>({
  notificationCode: notificationCode || undefined,
  modelName: undefined,
  inch: undefined,
  vendorId: undefined,
  branch: undefined,
  panelSerialNo: undefined,
  ocSerialNo: undefined,
  defectId: undefined,
  odfNumber: undefined,
  version: undefined,
  week: undefined
})

// Validation Schema for Step 2
// (Dynamically checked during submit, simple object for now)
const stateStep2 = reactive<Record<string, File | null>>({
  CLAIM: null,
  CLAIM_ZOOM: null,
  ODF: null,
  PANEL_SN: null,
  WO_PANEL: null,
  WO_PANEL_SN: null
})

// Vendors for dropdowns
const vendors = ref([
  { id: 1, name: 'MOKA', code: 'MOKA', requiredFields: ['odfNumber', 'version', 'week'], requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'ODF', 'PANEL_SN', 'WO_PANEL', 'WO_PANEL_SN'] },
  { id: 2, name: 'MTC', code: 'MTC', requiredFields: [], requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'ODF', 'PANEL_SN'] },
  { id: 3, name: 'SDP', code: 'SDP', requiredFields: [], requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'ODF', 'PANEL_SN'] }
])

const defects = ref([
  { id: 1, name: 'Panel Blank' },
  { id: 2, name: 'Line Defect' },
  { id: 3, name: 'Physical Damage' }
])

// Computed for Vendor Rules
const selectedVendor = computed(() => {
  return vendors.value.find(v => v.id === stateStep1.vendorId)
})

const requiredFields = computed(() => {
  return selectedVendor.value?.requiredFields || []
})

const requiredPhotos = computed(() => {
  return selectedVendor.value?.requiredPhotos || []
})

// Auto Lookup Simulation
const isNotificationFound = ref(false)

async function lookupNotification() {
  if (!stateStep1.notificationCode) return

  // Mock logic: If code starts with NOT, it's found
  if (stateStep1.notificationCode.startsWith('NOT')) {
    isNotificationFound.value = true
    stateStep1.modelName = 'Mock TV 50"'
    stateStep1.inch = 50
    stateStep1.vendorId = 1 // MOKA
    stateStep1.branch = 'HQ'
    toast.add({ title: 'Notification found', color: 'success' })
  } else {
    isNotificationFound.value = false
    toast.add({ title: 'Notification not found, please fill manually', color: 'info' })
  }
}

// Auto run lookup
onMounted(() => {
  if (stateStep1.notificationCode) {
    lookupNotification()
  }
})

// Form Actions
function nextStep(_event?: FormSubmitEvent<SchemaStep1>) {
  // Basic validation handler
  if (currentStep.value === 1) {
    // Assume schema is valid if this is called from @submit
    currentStep.value = 2
    toast.add({ title: 'Draft auto-saved', description: 'Progress saved successfully', color: 'success' })
  } else if (currentStep.value === 2) {
    // validate photos
    const missing = requiredPhotos.value.filter(p => !stateStep2[p])
    if (missing.length > 0) {
      toast.add({ title: 'Missing Photos', description: `Please upload: ${missing.join(', ')}`, color: 'error' })
      return
    }
    currentStep.value = 3
    toast.add({ title: 'Draft auto-saved', description: 'Progress saved successfully', color: 'success' })
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

async function onSubmitClaim() {
  toast.add({ title: 'Submitting Claim...', icon: 'i-lucide-loader-2' })
  // Simulate delay
  await new Promise(r => setTimeout(r, 1000))
  toast.add({ title: 'Claim Submitted Successfully', color: 'success' })
  navigateTo('/cs/claim')
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
          v-if="currentStep > 1"
          color="neutral"
          variant="soft"
          icon="i-lucide-check-circle"
          size="sm"
        >
          Auto-saved Draft
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

              <UFormField name="notificationCode" label="Notification Code">
                <div class="flex gap-2 w-full">
                  <UInput v-model="stateStep1.notificationCode" class="flex-1" />
                  <UButton
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-search"
                    @click="lookupNotification"
                  >
                    Lookup
                  </UButton>
                </div>
              </UFormField>

              <UFormField name="modelName" label="Product Model">
                <UInput v-model="stateStep1.modelName" :disabled="isNotificationFound" />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField name="inch" label="Inch">
                  <UInput v-model="stateStep1.inch" type="number" :disabled="isNotificationFound" />
                </UFormField>
                <UFormField name="branch" label="Branch">
                  <UInput v-model="stateStep1.branch" :disabled="isNotificationFound" />
                </UFormField>
              </div>

              <UFormField name="vendorId" label="Vendor">
                <USelect
                  v-model="stateStep1.vendorId"
                  :items="vendors"
                  option-attribute="name"
                  value-attribute="id"
                  :disabled="isNotificationFound"
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

              <UFormField name="defectId" label="Defect Type">
                <USelect
                  v-model="stateStep1.defectId"
                  :items="defects"
                  option-attribute="name"
                  value-attribute="id"
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
            <UButton type="submit" trailing-icon="i-lucide-arrow-right" color="primary">
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
              class="relative flex-1 group min-h-[160px] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center p-4 transition-colors hover:border-primary peer-focus-within:border-primary overflow-hidden"
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
          <UButton trailing-icon="i-lucide-arrow-right" color="primary" @click="nextStep()">
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
                <span class="font-medium">{{ stateStep1.notificationCode || '-' }}</span>
              </li>
              <li class="flex justify-between text-sm">
                <span class="text-gray-500">Product Model</span>
                <span class="font-medium">{{ stateStep1.modelName || '-' }} ({{ stateStep1.inch }}" / {{ selectedVendor?.name }})</span>
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
                <span class="font-medium">{{ defects.find(d => d.id === stateStep1.defectId)?.name || 'N/A' }}</span>
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
            <UButton variant="soft" color="neutral" icon="i-lucide-save">
              Save as Draft
            </UButton>
            <UButton icon="i-lucide-send" color="primary" @click="onSubmitClaim">
              Submit to QRCC
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
