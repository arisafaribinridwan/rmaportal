<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Vendor } from '~/types/master'
import { PHOTO_TYPES, FIELD_NAMES } from '~~/shared/utils/constants'

const props = defineProps<{
  vendor: Vendor
}>()

const schema = z.object({
  code: z.string().min(1, 'Vendor code is required'),
  name: z.string().min(2, 'Vendor name is required'),
  requiredPhotos: z.array(z.enum(PHOTO_TYPES)).default([]),
  requiredFields: z.array(z.enum(FIELD_NAMES)).default([]),
  isActive: z.boolean().default(true)
})

const open = ref(false)

type Schema = z.output<typeof schema>

const state = reactive<{
  code: string
  name: string
  requiredPhotos: Schema['requiredPhotos']
  requiredFields: Schema['requiredFields']
  isActive: boolean
}>({
  code: props.vendor.code,
  name: props.vendor.name,
  requiredPhotos: (props.vendor.requiredPhotos as Schema['requiredPhotos']) || [],
  requiredFields: (props.vendor.requiredFields as Schema['requiredFields']) || [],
  isActive: props.vendor.isActive
})

watch(() => props.vendor, (newVal) => {
  if (newVal) {
    state.code = newVal.code
    state.name = newVal.name
    state.requiredPhotos = (newVal.requiredPhotos as Schema['requiredPhotos']) || []
    state.requiredFields = (newVal.requiredFields as Schema['requiredFields']) || []
    state.isActive = newVal.isActive
  }
}, { deep: true })

function resetState() {
  state.code = props.vendor.code
  state.name = props.vendor.name
  state.requiredPhotos = (props.vendor.requiredPhotos as Schema['requiredPhotos']) || []
  state.requiredFields = (props.vendor.requiredFields as Schema['requiredFields']) || []
  state.isActive = props.vendor.isActive
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
    await $fetch(`/api/master/vendor/${props.vendor.id}`, {
      method: 'PUT',
      body: event.data
    })
    toast.add({ title: 'Success', description: `Vendor ${event.data.name} updated`, color: 'success' })
    emit('success')
    open.value = false
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Failed to update vendor',
      color: 'error'
    })
  } finally {
    pending.value = false
  }
}

const photoOptions = [...PHOTO_TYPES] as Schema['requiredPhotos']
const fieldOptions = [...FIELD_NAMES] as Schema['requiredFields']
</script>

<template>
  <UModal
    v-model:open="open"
    title="Edit Vendor"
    description="Update vendor information"
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
        <UFormField label="Vendor Code" name="code">
          <UInput v-model="state.code" class="w-full" disabled />
        </UFormField>

        <UFormField label="Vendor Name" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField label="Required Photos" name="requiredPhotos">
          <USelectMenu
            v-model="state.requiredPhotos"
            :items="photoOptions"
            multiple
            placeholder="Select required photos"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Required Fields" name="requiredFields">
          <USelectMenu
            v-model="state.requiredFields"
            :items="fieldOptions"
            multiple
            placeholder="Select required fields"
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
