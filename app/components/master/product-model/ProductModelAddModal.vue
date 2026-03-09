<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Vendor } from '~/types/master'

const schema = z.object({
  name: z.string().min(2, 'Model name is required'),
  inch: z.number().min(1, 'Inch must be greater than 0'),
  vendorId: z.number().min(1, 'Vendor must be selected'),
  isActive: z.boolean().default(true)
})

const open = ref(false)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  inch: 0,
  vendorId: undefined,
  isActive: true
})

// Options for Vendors
const { data: vendors } = await useFetch<Vendor[]>('/api/master/vendors')

const vendorOptions = computed(() => {
  if (!vendors.value) return []
  return vendors.value.filter(v => v.isActive).map(v => ({
    label: v.name,
    value: v.id
  }))
})

const toast = useToast()
async function onSubmit(event: FormSubmitEvent<Schema>) {
  // TODO: integrate with actual API
  toast.add({ title: 'Success', description: `Product Model ${event.data.name} created`, color: 'success' })
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" title="New Product Model" description="Add a new product model to the master data">
    <UButton
      label="New model"
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
        <UFormField label="Model Name" name="name">
          <UInput v-model="state.name" class="w-full" placeholder="e.g. LED TV 32inch HD" />
        </UFormField>

        <UFormField label="Size (Inch)" name="inch">
          <UInput
            v-model.number="state.inch"
            type="number"
            class="w-full"
            placeholder="e.g. 32"
          />
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
            @click="open = false"
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
