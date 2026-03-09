<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { DefectMaster } from '~/types/master'

const props = defineProps<{
  defect: DefectMaster
}>()

const schema = z.object({
  code: z.string().min(1, 'Defect code is required'),
  name: z.string().min(2, 'Defect name is required'),
  isActive: z.boolean().default(true)
})

const open = ref(false)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  code: props.defect.code,
  name: props.defect.name,
  isActive: props.defect.isActive
})

watch(() => props.defect, (newVal) => {
  if (newVal) {
    state.code = newVal.code
    state.name = newVal.name
    state.isActive = newVal.isActive
  }
}, { deep: true })

const toast = useToast()
async function onSubmit(event: FormSubmitEvent<Schema>) {
  // TODO: integrate with actual API
  toast.add({ title: 'Success', description: `Defect ${event.data.name} updated`, color: 'success' })
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" title="Edit Defect" description="Update defect information">
    <slot />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Defect Code" name="code">
          <UInput v-model="state.code" class="w-full" disabled />
        </UFormField>

        <UFormField label="Defect Name" name="name">
          <UInput v-model="state.name" class="w-full" />
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
