<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { NotificationMaster, ProductModel, Vendor } from '~/types/master'

const props = defineProps<{
  notification: NotificationMaster
}>()

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
  notificationCode: props.notification.notificationCode,
  notificationDate: props.notification.notificationDate ? new Date(props.notification.notificationDate).toISOString().split('T')[0] : '',
  modelId: props.notification.modelId,
  branch: props.notification.branch,
  vendorId: props.notification.vendorId,
  status: props.notification.status
})

watch(() => props.notification, (newVal) => {
  if (newVal) {
    state.notificationCode = newVal.notificationCode
    state.notificationDate = newVal.notificationDate ? new Date(newVal.notificationDate).toISOString().split('T')[0] : ''
    state.modelId = newVal.modelId
    state.branch = newVal.branch
    state.vendorId = newVal.vendorId
    state.status = newVal.status
  }
}, { deep: true })

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
  state.notificationCode = props.notification.notificationCode
  state.notificationDate = props.notification.notificationDate ? new Date(props.notification.notificationDate).toISOString().split('T')[0] : ''
  state.modelId = props.notification.modelId
  state.branch = props.notification.branch
  state.vendorId = props.notification.vendorId
  state.status = props.notification.status
}

function onClose() {
  resetState()
  open.value = false
}

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const pending = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  pending.value = true
  try {
    const dataToSend = {
      ...event.data,
      notificationDate: new Date(event.data.notificationDate).toISOString()
    }
    await $fetch(`/api/master/notification/${props.notification.id}`, {
      method: 'PUT',
      body: dataToSend
    })
    toast.add({ title: 'Success', description: `Notification ${event.data.notificationCode} updated`, color: 'success' })
    emit('success')
    open.value = false
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Failed to update notification',
      color: 'error'
    })
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Edit Notification"
    description="Update notification information"
    :dismissible="false"
    @update:open="(val: boolean) => { if (!val) onClose() }"
  >
    <slot />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Notification Code" name="notificationCode">
          <UInput v-model="state.notificationCode" class="w-full" disabled />
        </UFormField>

        <UFormField label="Date" name="notificationDate">
          <UInput
            v-model="state.notificationDate"
            type="date"
            class="w-full"
            disabled
          />
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
          <UInput v-model="state.branch" class="w-full" />
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
            label="Save Changes"
            color="primary"
            variant="solid"
            type="submit"
            :loading="pending"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
