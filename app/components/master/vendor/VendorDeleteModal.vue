<script setup lang="ts">
import type { Vendor } from '~/types/master'

const props = defineProps<{
  vendor: Vendor | null
}>()

const open = ref(false)

const toast = useToast()
async function onSubmit() {
  if (!props.vendor) return
  // TODO: integrate with actual API to perform soft delete (set isActive to false)
  toast.add({ title: 'Success', description: `Vendor ${props.vendor.name} has been ${props.vendor.isActive ? 'deactivated' : 'activated'}`, color: 'success' })
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="vendor?.isActive ? 'Deactivate Vendor' : 'Activate Vendor'"
    :description="vendor?.isActive ? `Are you sure you want to deactivate ${vendor?.name}? This action works as a soft delete.` : `Are you sure you want to activate ${vendor?.name}?`"
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
          loading-auto
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
