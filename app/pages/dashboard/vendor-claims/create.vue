<script setup lang="ts">
import { z } from 'zod'

// ── Types ───────────────────────────────────────────────────

interface VendorOption {
  id: number
  code: string
  name: string
  isActive: boolean
}

interface VendorsResponse {
  data: VendorOption[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ApprovedClaim {
  id: number
  claimNumber: string
  notificationId: number | null
  modelId: number
  vendorId: number
  inch: number
  branch: string
  odfNumber: string | null
  panelSerialNo: string
  ocSerialNo: string
  defectCode: string
  version: string | null
  week: string | null
  claimStatus: string
  createdAt: string | number
}

interface GenerateResponse {
  id: number
  vendorClaimNo: string
  vendorId: number
  vendorCode: string
  vendorName: string
  status: string
  submittedAt: string
  itemCount: number
  items: Array<{
    id: number
    claimId: number
    vendorDecision: string
  }>
}

// ── Zod Schemas ─────────────────────────────────────────────

const stepOneSchema = z.object({
  vendorId: z.number({ error: 'Vendor wajib dipilih' }).int().positive('Vendor wajib dipilih')
})

const stepTwoSchema = z.object({
  claimIds: z
    .array(z.number().int().positive())
    .min(1, 'Minimal 1 klaim harus dipilih')
})

const generatePayloadSchema = z.object({
  vendorId: z.number().int().positive('Invalid vendor ID'),
  claimIds: z
    .array(z.number().int().positive('Invalid claim ID'))
    .min(1, 'At least one claim must be selected')
})

type GeneratePayload = z.infer<typeof generatePayloadSchema>

// ── Wizard State ────────────────────────────────────────────

const currentStep = ref<1 | 2 | 3>(1)
const isSubmitting = ref(false)
const toast = useToast()

// Step 1 state
const selectedVendorId = ref<number | undefined>(undefined)
const stepOneError = ref<string | undefined>(undefined)

// Step 2 state
const selectedClaimIds = ref<Set<number>>(new Set())
const stepTwoError = ref<string | null>(null)

// ── API: Fetch Vendors ──────────────────────────────────────

const { data: vendorsData, status: vendorsStatus } = await useFetch<VendorsResponse>('/api/master/vendors', {
  query: { isActive: 'true', limit: 200 },
  lazy: true
})

const vendors = computed<VendorOption[]>(() => vendorsData.value?.data ?? [])

const selectedVendor = computed<VendorOption | null>(() => {
  if (!selectedVendorId.value) return null
  return vendors.value.find(v => v.id === selectedVendorId.value) ?? null
})

// ── API: Fetch Approved Claims (triggered when vendor changes) ──

const approvedClaimsQuery = computed(() => {
  if (!selectedVendorId.value) return null
  return { vendorId: selectedVendorId.value }
})

const {
  data: approvedClaims,
  status: approvedClaimsStatus,
  refresh: refreshApprovedClaims
} = await useFetch<ApprovedClaim[]>('/api/vendor-claims/approved-claims', {
  query: approvedClaimsQuery,
  lazy: true,
  immediate: false,
  watch: false
})

const approvedClaimsList = computed<ApprovedClaim[]>(() => approvedClaims.value ?? [])

// ── Step Navigation ─────────────────────────────────────────

function goToStep2() {
  stepOneError.value = undefined

  const result = stepOneSchema.safeParse({ vendorId: selectedVendorId.value })
  if (!result.success) {
    stepOneError.value = result.error.issues[0]?.message ?? 'Validasi gagal'
    return
  }

  // Reset step 2 state when vendor changes
  selectedClaimIds.value = new Set()
  stepTwoError.value = null

  // Fetch approved claims for selected vendor
  refreshApprovedClaims()

  currentStep.value = 2
}

function goBackToStep1() {
  currentStep.value = 1
  stepTwoError.value = null
}

function goToStep3() {
  stepTwoError.value = null

  const result = stepTwoSchema.safeParse({ claimIds: Array.from(selectedClaimIds.value) })
  if (!result.success) {
    stepTwoError.value = result.error.issues[0]?.message ?? 'Validasi gagal'
    return
  }

  currentStep.value = 3
}

function goBackToStep2() {
  currentStep.value = 2
}

// ── Claim Selection Helpers ─────────────────────────────────

function toggleClaim(claimId: number) {
  const newSet = new Set(selectedClaimIds.value)
  if (newSet.has(claimId)) {
    newSet.delete(claimId)
  } else {
    newSet.add(claimId)
  }
  selectedClaimIds.value = newSet
}

function toggleSelectAll() {
  if (selectedClaimIds.value.size === approvedClaimsList.value.length) {
    selectedClaimIds.value = new Set()
  } else {
    selectedClaimIds.value = new Set(approvedClaimsList.value.map(c => c.id))
  }
}

const isAllSelected = computed(() =>
  approvedClaimsList.value.length > 0 && selectedClaimIds.value.size === approvedClaimsList.value.length
)

const selectedClaims = computed<ApprovedClaim[]>(() =>
  approvedClaimsList.value.filter(c => selectedClaimIds.value.has(c.id))
)

// ── Generate Vendor Claim ───────────────────────────────────

async function generateVendorClaim() {
  if (isSubmitting.value) return

  const payload: GeneratePayload = {
    vendorId: selectedVendorId.value!,
    claimIds: Array.from(selectedClaimIds.value)
  }

  // Final validation
  const result = generatePayloadSchema.safeParse(payload)
  if (!result.success) {
    toast.add({
      title: 'Validasi Gagal',
      description: result.error.issues[0]?.message ?? 'Data tidak valid',
      color: 'error'
    })
    return
  }

  isSubmitting.value = true

  try {
    const response = await $fetch<GenerateResponse>('/api/vendor-claims', {
      method: 'POST',
      body: result.data
    })

    toast.add({
      title: 'Vendor Claim Berhasil Dibuat',
      description: `${response.vendorClaimNo} — ${response.itemCount} klaim`,
      color: 'success'
    })

    // Redirect to vendor claim detail
    await navigateTo(`/dashboard/vendor-claims/${response.id}`)
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Gagal Generate Vendor Claim',
      description: error.data?.message || error.message || 'Terjadi kesalahan',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

// ── Helpers ─────────────────────────────────────────────────

function formatDate(value: string | number): string {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const steps = [
  { label: 'Pilih Vendor', icon: 'i-lucide-building-2' },
  { label: 'Pilih Klaim', icon: 'i-lucide-clipboard-check' },
  { label: 'Review & Generate', icon: 'i-lucide-rocket' }
] as const
</script>

<template>
  <UDashboardPanel id="vendor-claim-create">
    <template #header>
      <UDashboardNavbar title="Create Vendor Claim">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            to="/dashboard/vendor-claims"
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
      <div class="max-w-4xl mx-auto w-full flex flex-col gap-6">
        <!-- Step Indicator -->
        <div class="flex items-center justify-center gap-2 py-4">
          <template v-for="(step, idx) in steps" :key="idx">
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="[
                currentStep === idx + 1
                  ? 'bg-primary/10 text-primary'
                  : currentStep > idx + 1
                    ? 'text-success'
                    : 'text-muted'
              ]"
            >
              <UIcon
                :name="currentStep > idx + 1 ? 'i-lucide-check-circle-2' : step.icon"
                class="w-5 h-5"
              />
              <span class="hidden sm:inline">{{ step.label }}</span>
              <span class="sm:hidden">{{ idx + 1 }}</span>
            </div>
            <UIcon
              v-if="idx < steps.length - 1"
              name="i-lucide-chevron-right"
              class="w-4 h-4 text-muted"
            />
          </template>
        </div>

        <!-- ═══════════════════════════════════════════════════ -->
        <!-- STEP 1 — Pilih Vendor                              -->
        <!-- ═══════════════════════════════════════════════════ -->
        <UCard v-if="currentStep === 1">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold">
                Step 1 — Pilih Vendor
              </h2>
            </div>
            <p class="text-sm text-muted mt-1">
              Pilih vendor yang akan dibuatkan batch vendor claim.
            </p>
          </template>

          <div class="space-y-4">
            <div v-if="vendorsStatus === 'pending'" class="flex items-center gap-2 text-muted py-4">
              <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin" />
              <span>Memuat daftar vendor...</span>
            </div>

            <template v-else>
              <UFormField label="Vendor" required :error="stepOneError ?? undefined">
                <USelect
                  v-model="selectedVendorId"
                  :items="vendors.map(v => ({ label: `${v.code} — ${v.name}`, value: v.id }))"
                  placeholder="Pilih vendor..."
                  class="w-full"
                  value-key="value"
                  @update:model-value="stepOneError = undefined"
                />
              </UFormField>

              <div v-if="vendors.length === 0" class="text-sm text-muted py-2">
                Tidak ada vendor aktif ditemukan.
              </div>
            </template>
          </div>

          <template #footer>
            <div class="flex justify-end">
              <UButton
                icon="i-lucide-arrow-right"
                trailing
                :disabled="!selectedVendorId"
                @click="goToStep2"
              >
                Lanjut ke Pilih Klaim
              </UButton>
            </div>
          </template>
        </UCard>

        <!-- ═══════════════════════════════════════════════════ -->
        <!-- STEP 2 — Checklist Klaim APPROVED                  -->
        <!-- ═══════════════════════════════════════════════════ -->
        <UCard v-if="currentStep === 2">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-clipboard-check" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold">
                Step 2 — Pilih Klaim
              </h2>
            </div>
            <p class="text-sm text-muted mt-1">
              Centang klaim APPROVED yang akan dimasukkan ke batch vendor claim
              <span v-if="selectedVendor" class="font-medium text-foreground">{{ selectedVendor.code }} — {{ selectedVendor.name }}</span>.
            </p>
          </template>

          <div class="space-y-4">
            <!-- Loading -->
            <div v-if="approvedClaimsStatus === 'pending'" class="flex items-center gap-2 text-muted py-8 justify-center">
              <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin" />
              <span>Memuat klaim approved...</span>
            </div>

            <!-- Empty State -->
            <div v-else-if="approvedClaimsList.length === 0" class="text-center py-8">
              <UIcon name="i-lucide-inbox" class="w-12 h-12 text-muted mx-auto mb-3" />
              <p class="text-muted font-medium">
                Tidak ada klaim APPROVED
              </p>
              <p class="text-sm text-muted mt-1">
                Semua klaim vendor ini sudah masuk batch atau belum ada yang APPROVED.
              </p>
            </div>

            <!-- Claims List -->
            <template v-else>
              <!-- Select All + Counter -->
              <div class="flex items-center justify-between pb-2 border-b border-default">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <UCheckbox
                    :model-value="isAllSelected"
                    @update:model-value="toggleSelectAll"
                  />
                  <span class="text-sm font-medium">
                    Pilih Semua ({{ approvedClaimsList.length }})
                  </span>
                </label>
                <UBadge v-if="selectedClaimIds.size > 0" color="primary" variant="subtle">
                  {{ selectedClaimIds.size }} dipilih
                </UBadge>
              </div>

              <!-- Error -->
              <div v-if="stepTwoError" class="text-sm text-error bg-error/10 p-3 rounded-md border border-error/20">
                <UIcon name="i-lucide-alert-circle" class="inline-block mr-1 w-4 h-4" />
                {{ stepTwoError }}
              </div>

              <!-- Scrollable list -->
              <div class="max-h-100 overflow-y-auto space-y-2">
                <div
                  v-for="claim in approvedClaimsList"
                  :key="claim.id"
                  class="flex items-start gap-3 p-3 rounded-lg border border-default hover:bg-elevated/50 cursor-pointer transition-colors"
                  :class="{ 'border-primary/50 bg-primary/5': selectedClaimIds.has(claim.id) }"
                  @click="toggleClaim(claim.id)"
                >
                  <UCheckbox
                    :model-value="selectedClaimIds.has(claim.id)"
                    class="mt-0.5"
                    @click.stop
                    @update:model-value="toggleClaim(claim.id)"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-sm">{{ claim.claimNumber }}</span>
                      <UBadge color="success" variant="subtle" size="xs">
                        APPROVED
                      </UBadge>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-1.5 text-xs text-muted">
                      <span>Panel: <span class="font-mono text-foreground">{{ claim.panelSerialNo }}</span></span>
                      <span>OC: <span class="font-mono text-foreground">{{ claim.ocSerialNo }}</span></span>
                      <span>Branch: <span class="text-foreground">{{ claim.branch }}</span></span>
                      <span>Defect: <span class="text-foreground">{{ claim.defectCode }}</span></span>
                    </div>
                    <div class="flex gap-x-4 mt-1 text-xs text-muted">
                      <span>Inch: <span class="text-foreground">{{ claim.inch }}"</span></span>
                      <span v-if="claim.odfNumber">ODF: <span class="text-foreground">{{ claim.odfNumber }}</span></span>
                      <span v-if="claim.version">Ver: <span class="text-foreground">{{ claim.version }}</span></span>
                      <span v-if="claim.week">Week: <span class="text-foreground">{{ claim.week }}</span></span>
                      <span>Tanggal: <span class="text-foreground">{{ formatDate(claim.createdAt) }}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <template #footer>
            <div class="flex items-center justify-between">
              <UButton
                icon="i-lucide-arrow-left"
                variant="outline"
                color="neutral"
                @click="goBackToStep1"
              >
                Kembali
              </UButton>
              <UButton
                icon="i-lucide-arrow-right"
                trailing
                :disabled="selectedClaimIds.size === 0"
                @click="goToStep3"
              >
                Lanjut ke Review
              </UButton>
            </div>
          </template>
        </UCard>

        <!-- ═══════════════════════════════════════════════════ -->
        <!-- STEP 3 — Preview & Generate                        -->
        <!-- ═══════════════════════════════════════════════════ -->
        <UCard v-if="currentStep === 3">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-rocket" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold">
                Step 3 — Review & Generate
              </h2>
            </div>
            <p class="text-sm text-muted mt-1">
              Periksa data berikut sebelum membuat vendor claim batch.
            </p>
          </template>

          <div class="space-y-6">
            <!-- Vendor Info -->
            <div class="bg-elevated/50 rounded-lg p-4 border border-default">
              <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                Vendor
              </h3>
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-building-2" class="w-8 h-8 text-primary" />
                <div>
                  <p class="font-semibold text-lg">
                    {{ selectedVendor?.name }}
                  </p>
                  <p class="text-sm text-muted">
                    Kode: {{ selectedVendor?.code }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Summary -->
            <div class="bg-elevated/50 rounded-lg p-4 border border-default">
              <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                Ringkasan
              </h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p class="text-2xl font-bold text-primary">
                    {{ selectedClaims.length }}
                  </p>
                  <p class="text-sm text-muted">
                    Total Klaim
                  </p>
                </div>
                <div>
                  <p class="text-2xl font-bold">
                    {{ new Set(selectedClaims.map(c => c.branch)).size }}
                  </p>
                  <p class="text-sm text-muted">
                    Branch
                  </p>
                </div>
                <div>
                  <p class="text-2xl font-bold">
                    {{ new Set(selectedClaims.map(c => c.defectCode)).size }}
                  </p>
                  <p class="text-sm text-muted">
                    Jenis Defect
                  </p>
                </div>
              </div>
            </div>

            <!-- Selected Claims Table -->
            <div>
              <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                Daftar Klaim Terpilih
              </h3>
              <div class="border border-default rounded-lg overflow-hidden">
                <div class="max-h-75 overflow-y-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-elevated/50 sticky top-0 z-10">
                      <tr class="border-b border-default">
                        <th class="text-left px-3 py-2 font-medium">
                          #
                        </th>
                        <th class="text-left px-3 py-2 font-medium">
                          Claim No
                        </th>
                        <th class="text-left px-3 py-2 font-medium">
                          Panel SN
                        </th>
                        <th class="text-left px-3 py-2 font-medium">
                          OC SN
                        </th>
                        <th class="text-left px-3 py-2 font-medium">
                          Branch
                        </th>
                        <th class="text-left px-3 py-2 font-medium">
                          Defect
                        </th>
                        <th class="text-left px-3 py-2 font-medium">
                          Inch
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(claim, idx) in selectedClaims"
                        :key="claim.id"
                        class="border-b border-default last:border-b-0 hover:bg-elevated/30"
                      >
                        <td class="px-3 py-2 text-muted">
                          {{ idx + 1 }}
                        </td>
                        <td class="px-3 py-2 font-medium">
                          {{ claim.claimNumber }}
                        </td>
                        <td class="px-3 py-2 font-mono">
                          {{ claim.panelSerialNo }}
                        </td>
                        <td class="px-3 py-2 font-mono">
                          {{ claim.ocSerialNo }}
                        </td>
                        <td class="px-3 py-2">
                          {{ claim.branch }}
                        </td>
                        <td class="px-3 py-2">
                          {{ claim.defectCode }}
                        </td>
                        <td class="px-3 py-2">
                          {{ claim.inch }}"
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Info box -->
            <div class="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <UIcon name="i-lucide-info" class="inline-block mr-1 w-4 h-4" />
              Setelah generate, file Excel akan otomatis tersedia dan Anda akan diarahkan ke halaman detail vendor claim.
            </div>
          </div>

          <template #footer>
            <div class="flex items-center justify-between">
              <UButton
                icon="i-lucide-arrow-left"
                variant="outline"
                color="neutral"
                :disabled="isSubmitting"
                @click="goBackToStep2"
              >
                Kembali
              </UButton>
              <UButton
                icon="i-lucide-rocket"
                color="primary"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                @click="generateVendorClaim"
              >
                Generate Vendor Claim
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
