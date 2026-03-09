<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ProductModel, Vendor } from '~/types/master'

const schema = z.object({
  notificationCode: z.string().min(1, 'Notification code is required'),
  notificationDate: z.string().min(1, 'Date is required'),
  modelId: z.number().min(1, 'Model must be selected'),
  branch: z.string().min(2, 'Branch code is required'),
  vendorId: z.number().min(1, 'Vendor must be selected'),
  status: z.enum(['NEW', 'USED', 'EXPIRED']).default('NEW')
})

const open = ref(false)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  notificationCode: '',
  notificationDate: new Date().toISOString().split('T')[0],
  modelId: undefined,
  branch: '',
  vendorId: undefined,
  status: 'NEW'
})

// Options
const { data: vendors } = await useFetch<Vendor[]>('/api/master/vendors')
const { data: models } = await useFetch<ProductModel[]>('/api/master/product-models')

const vendorOptions = computed(() => {
  if (!vendors.value) return []
  return vendors.value.filter(v => v.isActive).map(v => ({
    label: v.name,
    value: v.id
  }))
})

const modelOptions = computed(() => {
  if (!models.value) return []
  return models.value.filter(m => m.isActive).map(m => ({
    label: m.name,
    value: m.id
  }))
})

const statusOptions = ['NEW', 'USED', 'EXPIRED']

function resetState() {
  state.notificationCode = ''
  state.notificationDate = new Date().toISOString().split('T')[0]
  state.modelId = undefined
  state.branch = ''
  state.vendorId = undefined
  state.status = 'NEW'
}

function onClose() {
  resetState()
  open.value = false
}

const toast = useToast()
async function onSubmit(event: FormSubmitEvent<Schema>) {
  // TODO: integrate with actual API
  toast.add({ title: 'Success', description: `Notification ${event.data.notificationCode} created`, color: 'success' })
  resetState()
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="New Notification"
    description="Add a new notification to the master data"
    :dismissible="false"
    @update:open="(val: boolean) => { if (!val) onClose() }"
  >
    <UButton
      label="New notification"
      icon="i-lucide-plus"
      color="neutral"
      variant="outline"
    />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Notification Code" name="notificationCode">
          <UInput v-model="state.notificationCode" class="w-full" placeholder="e.g. NTF-2023-001" />
        </UFormField>

        <UFormField label="Date" name="notificationDate">
          <UInput v-model="state.notificationDate" type="date" class="w-full" />
        </UFormField>

        <UFormField label="Product Model" name="modelId">
          <USelect
            v-model="state.modelId"
            :items="modelOptions"
            placeholder="Select a model"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Branch" name="branch">
          <UInput v-model="state.branch" class="w-full" placeholder="e.g. BDO" />
        </UFormField>

        <UFormField label="Vendor" name="vendorId">
          <USelect
            v-model="state.vendorId"
            :items="vendorOptions"
            placeholder="Select a vendor"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Status" name="status">
          <USelect
            v-model="state.status"
            :items="statusOptions"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2 mt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="onClose"
          />
          <UButton
            label="Create"
            color="primary"
            variant="solid"
            type="submit"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
