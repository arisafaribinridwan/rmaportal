<script setup lang="ts">
import type { ProductModel } from '~/types/master'

const props = defineProps<{
  productModel: ProductModel | null
}>()

const open = ref(false)

const toast = useToast()
async function onSubmit() {
  if (!props.productModel) return
  // TODO: integrate with actual API to perform soft delete (set isActive to false)
  toast.add({ title: 'Success', description: `Product Model ${props.productModel.name} has been ${props.productModel.isActive ? 'deactivated' : 'activated'}`, color: 'success' })
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="productModel?.isActive ? 'Deactivate Product Model' : 'Activate Product Model'"
    :description="productModel?.isActive ? `Are you sure you want to deactivate ${productModel?.name}? This action works as a soft delete.` : `Are you sure you want to activate ${productModel?.name}?`"
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
          :label="productModel?.isActive ? 'Deactivate' : 'Activate'"
          :color="productModel?.isActive ? 'error' : 'success'"
          variant="solid"
          loading-auto
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
