<script setup lang="ts">
import type { NotificationMaster } from '~/types/master'

const props = defineProps<{
  notification: NotificationMaster | null
}>()

const open = ref(false)

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const pending = ref(false)

async function onSubmit() {
  if (!props.notification) return
  pending.value = true
  try {
    await $fetch(`/api/master/notification/${props.notification.id}`, {
      method: 'PATCH',
      body: { status: 'EXPIRED' }
    })
    toast.add({ title: 'Success', description: `Notification ${props.notification.notificationCode} has been expired`, color: 'success' })
    emit('success')
    open.value = false
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.message || err.message || 'Failed to expire notification',
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
    title="Expire Notification"
    :description="`Are you sure you want to expire notification ${notification?.notificationCode}? This action works as a soft delete.`"
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
          label="Expire"
          color="error"
          variant="solid"
          :loading="pending"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
