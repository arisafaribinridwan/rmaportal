<script setup lang="ts">
import { z } from 'zod'
import type { TableColumn } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

// ── Types ───────────────────────────────────────────────────

interface VendorClaimItem {
  id: number
  vendorClaimId: number
  claimId: number
  claimNumber: string
  panelSerialNo: string
  ocSerialNo: string
  defectCode: string
  branch: string
  inch: number
  vendorDecision: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  compensation: number | null
  rejectReason: string | null
  vendorDecisionBy: number | null
  vendorDecisionAt: string | null
  createdAt: string
  updatedAt: string
}

interface VendorClaimDetail {
  id: number
  vendorClaimNo: string
  vendorId: number
  vendorName: string
  vendorCode: string
  status: string
  submittedAt: string
  reportSnapshot: string
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  items: VendorClaimItem[]
}

// ── Fetch Data ──────────────────────────────────────────────

const vendorClaimId = route.params.id as string

const { data: vendorClaim, status, refresh } = await useFetch<VendorClaimDetail>(`/api/vendor-claims/${vendorClaimId}`)

// ── UI Helpers ──────────────────────────────────────────────

const statusMap: Record<string, { label: string, color: 'success' | 'error' | 'warning' | 'info' | 'neutral' }> = {
  CREATED: { label: 'Created', color: 'info' },
  PROCESSING: { label: 'Processing', color: 'warning' },
  COMPLETED: { label: 'Completed', color: 'success' },
  DRAFT: { label: 'Draft', color: 'neutral' }
}

const decisionColorMap: Record<string, 'success' | 'error' | 'warning' | 'neutral'> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'error'
}

function formatDate(date: string | number | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Table Columns ───────────────────────────────────────────

const columns: TableColumn<VendorClaimItem>[] = [
  {
    accessorKey: 'claimNumber',
    header: 'Claim No',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.claimNumber)
  },
  {
    id: 'serialNumbers',
    header: 'Serial Numbers',
    cell: ({ row }) => h('div', { class: 'text-xs text-muted flex flex-col gap-0.5' }, [
      h('span', `Panel: ${row.original.panelSerialNo}`),
      h('span', `OC: ${row.original.ocSerialNo}`)
    ])
  },
  {
    accessorKey: 'defectCode',
    header: 'Defect'
  },
  {
    accessorKey: 'vendorDecision',
    header: 'Decision',
    cell: ({ row }) => h(UBadge, {
      color: decisionColorMap[row.original.vendorDecision] || 'neutral',
      variant: 'subtle',
      class: 'capitalize'
    }, () => row.original.vendorDecision.toLowerCase())
  },
  {
    id: 'details',
    header: 'Details',
    cell: ({ row }) => {
      if (row.original.vendorDecision === 'ACCEPTED') {
        return h('span', { class: 'text-success text-sm' }, `Compensation: Rp ${row.original.compensation?.toLocaleString()}`)
      } else if (row.original.vendorDecision === 'REJECTED') {
        return h('span', { class: 'text-error text-sm' }, `Reason: ${row.original.rejectReason}`)
      }
      return h('span', { class: 'text-muted text-sm' }, '-')
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'text-right' }, [
      h(UButton, {
        size: 'xs',
        color: 'primary',
        variant: 'solid',
        label: row.original.vendorDecision === 'PENDING' ? 'Decide' : 'Edit',
        onClick: () => openDecisionModal(row.original)
      })
    ])
  }
]

// ── Decision Modal State ────────────────────────────────────

const isModalOpen = ref(false)
const selectedItem = ref<VendorClaimItem | null>(null)
const isSubmitting = ref(false)

const decisionForm = reactive({
  vendorDecision: 'PENDING' as 'ACCEPTED' | 'REJECTED' | 'PENDING',
  compensation: undefined as number | undefined,
  rejectReason: ''
})

function openDecisionModal(item: VendorClaimItem) {
  selectedItem.value = item
  decisionForm.vendorDecision = item.vendorDecision === 'PENDING' ? 'ACCEPTED' : item.vendorDecision
  decisionForm.compensation = item.compensation ?? undefined
  decisionForm.rejectReason = item.rejectReason ?? ''
  isModalOpen.value = true
}

// Validation Schema mapping
const decisionSchema = z.object({
  vendorDecision: z.enum(['ACCEPTED', 'REJECTED']),
  compensation: z.number().int().nonnegative().optional(),
  rejectReason: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.vendorDecision === 'ACCEPTED' && (data.compensation === undefined || data.compensation === null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Compensation is required when accepted', path: ['compensation'] })
  }
  if (data.vendorDecision === 'REJECTED' && !data.rejectReason) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Reject reason is required when rejected', path: ['rejectReason'] })
  }
})

async function submitDecision() {
  if (!selectedItem.value || isSubmitting.value) return

  // Basic client validation
  const validation = decisionSchema.safeParse({
    vendorDecision: decisionForm.vendorDecision,
    compensation: decisionForm.compensation,
    rejectReason: decisionForm.rejectReason
  })

  if (!validation.success) {
    toast.add({
      title: 'Validation Error',
      description: validation.error.issues[0]?.message || 'Invalid input',
      color: 'error'
    })
    return
  }

  isSubmitting.value = true
  try {
    await $fetch(`/api/vendor-claims/${vendorClaimId}/items/${selectedItem.value.id}/decision`, {
      method: 'PATCH',
      body: validation.data
    })

    toast.add({
      title: 'Success',
      description: 'Vendor decision saved successfully',
      color: 'success'
    })

    isModalOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Failed to update decision',
      description: error.data?.message || error.message || 'An error occurred',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="vendor-claim-detail">
    <template #header>
      <UDashboardNavbar :title="`Vendor Claim ${vendorClaim?.vendorClaimNo ?? ''}`">
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
      <div v-if="status === 'pending'" class="flex items-center gap-2 text-muted py-8 justify-center">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin" />
        <span>Loading vendor claim details...</span>
      </div>

      <div v-else-if="!vendorClaim" class="text-center py-12">
        <UIcon name="i-lucide-inbox" class="w-12 h-12 text-muted mx-auto mb-3" />
        <p class="text-muted font-medium">
          Vendor claim not found
        </p>
      </div>

      <div v-else class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <UCard :ui="{ body: 'flex flex-col gap-1' }">
            <span class="text-sm text-muted">Vendor</span>
            <span class="font-semibold">{{ vendorClaim.vendorName }} ({{ vendorClaim.vendorCode }})</span>
          </UCard>
          <UCard :ui="{ body: 'flex flex-col gap-1' }">
            <span class="text-sm text-muted">Status</span>
            <div>
              <UBadge
                :color="statusMap[vendorClaim.status]?.color || 'neutral'"
                variant="subtle"
                class="capitalize"
              >
                {{ statusMap[vendorClaim.status]?.label || vendorClaim.status }}
              </UBadge>
            </div>
          </UCard>
          <UCard :ui="{ body: 'flex flex-col gap-1' }">
            <span class="text-sm text-muted">Submitted Date</span>
            <span class="font-medium">{{ formatDate(vendorClaim.submittedAt) }}</span>
          </UCard>
          <UCard :ui="{ body: 'flex flex-col gap-1' }">
            <span class="text-sm text-muted">Total Items</span>
            <span class="font-bold text-lg text-primary">{{ vendorClaim.items.length }}</span>
          </UCard>
        </div>

        <!-- Items Table -->
        <UCard :ui="{ body: '!p-0' }">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">
                Claim Items
              </h3>
            </div>
          </template>

          <UTable
            :data="vendorClaim.items"
            :columns="columns"
            class="w-full"
            :ui="{
              base: 'table-fixed border-separate border-spacing-0 leading-normal',
              th: 'bg-elevated/50 py-3 font-medium text-muted/80',
              td: 'py-3 border-b border-default'
            }"
          />
        </UCard>

        <!-- Decision Modal/Slideover equivalent -->
        <UModal v-model="isModalOpen" :ui="{ content: 'sm:max-w-md' }">
          <UCard :ui="{ header: 'p-4 sm:px-6', body: 'p-4 sm:px-6', footer: 'p-4 sm:px-6' }">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="font-semibold">
                  Input Vendor Decision
                </h3>
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  class="-my-1"
                  @click="isModalOpen = false"
                />
              </div>
            </template>

            <div
              v-if="selectedItem"
              class="space-y-4"
            >
              <div class="bg-elevated/50 p-3 rounded-md text-sm border border-default mb-4">
                <div class="mb-1">
                  <span class="text-muted">Claim No:</span> <span class="font-medium">{{ selectedItem.claimNumber }}</span>
                </div>
                <div>
                  <span class="text-muted">Defect:</span> {{ selectedItem.defectCode }}
                </div>
              </div>

              <UFormField label="Decision" required>
                <USelect
                  v-model="decisionForm.vendorDecision"
                  :items="[
                    { label: 'ACCEPTED', value: 'ACCEPTED' },
                    { label: 'REJECTED', value: 'REJECTED' }
                  ]"
                  class="w-full"
                />
              </UFormField>

              <UFormField v-if="decisionForm.vendorDecision === 'ACCEPTED'" label="Compensation (Rp)" required>
                <UInput
                  v-model.number="decisionForm.compensation"
                  type="number"
                  placeholder="0"
                  class="w-full"
                  :min="0"
                />
              </UFormField>

              <UFormField v-if="decisionForm.vendorDecision === 'REJECTED'" label="Reject Reason" required>
                <UTextarea
                  v-model="decisionForm.rejectReason"
                  placeholder="Reason for rejection..."
                  class="w-full"
                  :rows="3"
                />
              </UFormField>
            </div>

            <template #footer>
              <div class="flex items-center justify-end gap-2">
                <UButton
                  color="neutral"
                  variant="outline"
                  @click="isModalOpen = false"
                >
                  Cancel
                </UButton>
                <UButton
                  color="primary"
                  :loading="isSubmitting"
                  @click="submitDecision"
                >
                  Save Decision
                </UButton>
              </div>
            </template>
          </UCard>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
