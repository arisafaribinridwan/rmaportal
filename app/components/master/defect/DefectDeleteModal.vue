<script setup lang="ts">
import type { DefectMaster } from '~/types/master'

const props = defineProps<{
  defect: DefectMaster | null
}>()

const open = ref(false)

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const pending = ref(false)

async function onSubmit() {
  if (!props.defect) return
  pending.value = true
  try {
    await $fetch(`/api/master/defect/${props.defect.id}`, {
      method: 'PATCH',
      body: { isActive: !props.defect.isActive }
    })
    toast.add({ title: 'Success', description: `Defect ${props.defect.name} has been ${props.defect.isActive ? 'deactivated' : 'activated'}`, color: 'success' })
    emit('success')
    open.value = false
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Failed to update defect status',
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
    :title="defect?.isActive ? 'Deactivate Defect' : 'Activate Defect'"
    :description="defect?.isActive ? `Are you sure you want to deactivate ${defect?.name}? This action works as a soft delete.` : `Are you sure you want to activate ${defect?.name}?`"
    :dismissible="false"
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
          :loading="pending"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
