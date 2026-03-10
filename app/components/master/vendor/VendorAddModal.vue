<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { PHOTO_TYPES, FIELD_NAMES } from '~~/shared/utils/constants'

const schema = z.object({
  code: z.string().min(1, 'Vendor code is required'),
  name: z.string().min(2, 'Vendor name is required'),
  requiredPhotos: z.array(z.enum(PHOTO_TYPES)).default([]),
  requiredFields: z.array(z.enum(FIELD_NAMES)).default([]),
  isActive: z.boolean().default(true)
})

const open = ref(false)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  code: '',
  name: '',
  requiredPhotos: [],
  requiredFields: [],
  isActive: true
})

function resetState() {
  state.code = ''
  state.name = ''
  state.requiredPhotos = []
  state.requiredFields = []
  state.isActive = true
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
    await $fetch('/api/master/vendor', {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: 'Success', description: `Vendor ${event.data.name} created`, color: 'success' })
    emit('success')
    resetState()
    open.value = false
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to create vendor',
      color: 'error'
    })
  } finally {
    pending.value = false
  }
}

const photoOptions = [...PHOTO_TYPES]
const fieldOptions = [...FIELD_NAMES]
</script>

<template>
  <UModal
    v-model:open="open"
    title="New Vendor"
    description="Add a new vendor to the master data"
    :dismissible="false"
    @update:open="(val: boolean) => { if (!val) onClose() }"
  >
    <UButton
      label="New vendor"
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
        <UFormField label="Vendor Code" name="code">
          <UInput v-model="state.code" class="w-full" placeholder="e.g. V001" />
        </UFormField>

        <UFormField label="Vendor Name" name="name">
          <UInput v-model="state.name" class="w-full" placeholder="e.g. PT Vendor Name" />
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
            label="Create"
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
