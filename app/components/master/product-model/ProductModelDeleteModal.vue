<script setup lang="ts">
import type { ProductModel } from '~/types/master'

const props = defineProps<{
  productModel: ProductModel | null
}>()

const open = ref(false)

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const pending = ref(false)

async function onSubmit() {
  if (!props.productModel) return
  pending.value = true
  try {
    await $fetch(`/api/master/product-model/${props.productModel.id}`, {
      method: 'PATCH',
      body: { isActive: !props.productModel.isActive }
    })
    toast.add({ title: 'Success', description: `Product Model ${props.productModel.name} has been ${props.productModel.isActive ? 'deactivated' : 'activated'}`, color: 'success' })
    emit('success')
    open.value = false
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Failed to update product model status',
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
          :loading="pending"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
