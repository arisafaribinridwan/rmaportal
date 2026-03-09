<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  code: z.string().min(1, 'Defect code is required'),
  name: z.string().min(2, 'Defect name is required'),
  isActive: z.boolean().default(true)
})

const open = ref(false)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  code: '',
  name: '',
  isActive: true
})

function resetState() {
  state.code = ''
  state.name = ''
  state.isActive = true
}

function onClose() {
  resetState()
  open.value = false
}

const toast = useToast()
async function onSubmit(event: FormSubmitEvent<Schema>) {
  // TODO: integrate with actual API
  toast.add({ title: 'Success', description: `Defect ${event.data.name} created`, color: 'success' })
  resetState()
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="New Defect"
    description="Add a new defect to the master data"
    :dismissible="false"
    @update:open="(val: boolean) => { if (!val) onClose() }"
  >
    <UButton
      label="New defect"
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
        <UFormField label="Defect Code" name="code">
          <UInput v-model="state.code" class="w-full" placeholder="e.g. D01" />
        </UFormField>

        <UFormField label="Defect Name" name="name">
          <UInput v-model="state.name" class="w-full" placeholder="e.g. Layar Pecah/Retak" />
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
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
