<script setup lang="ts">
import type { Vendor } from '~/types/master'

const props = defineProps<{
  vendor: Vendor | null
}>()

const open = ref(false)

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const pending = ref(false)

async function onSubmit() {
  if (!props.vendor) return
  pending.value = true
  try {
    await $fetch(`/api/master/vendor/${props.vendor.id}`, {
      method: 'PATCH',
      body: { isActive: !props.vendor.isActive }
    })
    toast.add({ title: 'Success', description: `Vendor ${props.vendor.name} has been ${props.vendor.isActive ? 'deactivated' : 'activated'}`, color: 'success' })
    emit('success')
    open.value = false
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Failed to update vendor status',
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
    :title="vendor?.isActive ? 'Deactivate Vendor' : 'Activate Vendor'"
    :description="vendor?.isActive ? `Are you sure you want to deactivate ${vendor?.name}? This action works as a soft delete.` : `Are you sure you want to activate ${vendor?.name}?`"
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
          :label="vendor?.isActive ? 'Deactivate' : 'Activate'"
          :color="vendor?.isActive ? 'error' : 'success'"
          variant="solid"
          :loading="pending"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
