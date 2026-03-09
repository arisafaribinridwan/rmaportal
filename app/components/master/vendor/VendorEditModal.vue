<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Vendor } from '~/types/master'

const props = defineProps<{
  vendor: Vendor
}>()

const schema = z.object({
  code: z.string().min(1, 'Vendor code is required'),
  name: z.string().min(2, 'Vendor name is required'),
  requiredPhotos: z.array(z.string()).default([]),
  requiredFields: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
})

const open = ref(false)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  code: props.vendor.code,
  name: props.vendor.name,
  requiredPhotos: props.vendor.requiredPhotos || [],
  requiredFields: props.vendor.requiredFields || [],
  isActive: props.vendor.isActive
})

watch(() => props.vendor, (newVal) => {
  if (newVal) {
    state.code = newVal.code
    state.name = newVal.name
    state.requiredPhotos = newVal.requiredPhotos || []
    state.requiredFields = newVal.requiredFields || []
    state.isActive = newVal.isActive
  }
}, { deep: true })

const toast = useToast()
async function onSubmit(event: FormSubmitEvent<Schema>) {
  // TODO: integrate with actual API
  toast.add({ title: 'Success', description: `Vendor ${event.data.name} updated`, color: 'success' })
  open.value = false
}

const photoOptions = ['CLAIM', 'ODF', 'UNIT', 'PACKAGING', 'ACCESSORY']
const fieldOptions = ['odfNumber', 'version', 'serialNumber', 'purchaseDate', 'storeName']
</script>

<template>
  <UModal v-model:open="open" title="Edit Vendor" description="Update vendor information">
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
            @click="open = false"
          />
          <UButton
            label="Save Changes"
            color="primary"
            variant="solid"
            type="submit"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
