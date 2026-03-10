<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ProductModel, Vendor } from '~/types/master'

const props = defineProps<{
  productModel: ProductModel
}>()

const schema = z.object({
  name: z.string().min(2, 'Model name is required'),
  inch: z.number().min(1, 'Inch must be greater than 0'),
  vendorId: z.number().min(1, 'Vendor must be selected'),
  isActive: z.boolean().default(true)
})

const open = ref(false)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: props.productModel.name,
  inch: props.productModel.inch,
  vendorId: props.productModel.vendorId,
  isActive: props.productModel.isActive
})

watch(() => props.productModel, (newVal) => {
  if (newVal) {
    state.name = newVal.name
    state.inch = newVal.inch
    state.vendorId = newVal.vendorId
    state.isActive = newVal.isActive
  }
}, { deep: true })

// Options for Vendors
const { data: vendors } = await useFetch<Vendor[]>('/api/master/vendors')

const vendorOptions = computed(() => {
  if (!vendors.value) return []
  return vendors.value.filter(v => v.isActive).map(v => ({
    label: v.name,
    value: v.id
  }))
})

function resetState() {
  state.name = props.productModel.name
  state.inch = props.productModel.inch
  state.vendorId = props.productModel.vendorId
  state.isActive = props.productModel.isActive
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
    await $fetch(`/api/master/product-model/${props.productModel.id}`, {
      method: 'PUT',
      body: event.data
    })
    toast.add({ title: 'Success', description: `Product Model ${event.data.name} updated`, color: 'success' })
    emit('success')
    open.value = false
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Failed to update product model',
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
    title="Edit Product Model"
    description="Update product model information"
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
        <UFormField label="Model Name" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField label="Size (Inch)" name="inch">
          <UInput v-model.number="state.inch" type="number" class="w-full" />
        </UFormField>

        <UFormField label="Vendor" name="vendorId">
          <USelect
            v-model="state.vendorId"
            :items="vendorOptions"
            placeholder="Select a vendor"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Active Status" name="isActive">
          <USwitch v-model="state.isActive" label="Active" />
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
