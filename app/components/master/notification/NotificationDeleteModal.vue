<script setup lang="ts">
import type { NotificationMaster } from '~/types/master'

const props = defineProps<{
  notification: NotificationMaster | null
}>()

const open = ref(false)

const toast = useToast()
async function onSubmit() {
  if (!props.notification) return
  // TODO: integrate with actual API to perform soft delete (set status to EXPIRED)
  toast.add({ title: 'Success', description: `Notification ${props.notification.notificationCode} has been expired`, color: 'success' })
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Expire Notification"
    :description="`Are you sure you want to expire notification ${notification?.notificationCode}? This action works as a soft delete.`"
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
          loading-auto
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
