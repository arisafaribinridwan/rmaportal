<script setup lang="ts">
import type { DefectMaster } from '~/types/master'

const props = defineProps<{
  defect: DefectMaster | null
}>()

const open = ref(false)

const toast = useToast()
async function onSubmit() {
  if (!props.defect) return
  // TODO: integrate with actual API to perform soft delete (set isActive to false)
  toast.add({ title: 'Success', description: `Defect ${props.defect.name} has been ${props.defect.isActive ? 'deactivated' : 'activated'}`, color: 'success' })
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="defect?.isActive ? 'Deactivate Defect' : 'Activate Defect'"
    :description="defect?.isActive ? `Are you sure you want to deactivate ${defect?.name}? This action works as a soft delete.` : `Are you sure you want to activate ${defect?.name}?`"
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          :label="defect?.isActive ? 'Deactivate' : 'Activate'"
          :color="defect?.isActive ? 'error' : 'success'"
          variant="solid"
          loading-auto
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
