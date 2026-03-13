<script setup lang="ts">
import type { ManagedUser } from '~/types/user-management'

const props = defineProps<{
  user: ManagedUser
}>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const pending = ref(false)

const actionLabel = computed(() => props.user.isActive ? 'Deactivate' : 'Activate')
const actionColor = computed(() => props.user.isActive ? 'error' : 'success')
const newStatus = computed(() => !props.user.isActive)

async function onConfirm() {
  pending.value = true
  try {
    await $fetch(`/api/users/${props.user.id}`, {
      method: 'PATCH',
      body: { isActive: newStatus.value }
    })
    toast.add({
      title: `User ${newStatus.value ? 'Activated' : 'Deactivated'}`,
      description: `${props.user.name} has been ${newStatus.value ? 'activated' : 'deactivated'}`,
      color: newStatus.value ? 'success' : 'warning'
    })
    emit('success')
    open.value = false
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: err.data?.message || err.message || 'Failed to update user status',
      color: 'error'
    })
  } finally {
    pending.value = false
  }
}

function onCancel() {
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`${actionLabel} User`"
    :description="`Are you sure you want to ${actionLabel.toLowerCase()} this user?`"
    :dismissible="false"
  >
    <template #body>
      <div class="space-y-4">
        <div class="rounded-lg border border-default bg-elevated/50 p-3 space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">User:</span>
            <span class="font-medium">{{ user.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Email:</span>
            <span class="font-medium">{{ user.email }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Current Status:</span>
            <UBadge
              :color="user.isActive ? 'success' : 'error'"
              variant="subtle"
            >
              {{ user.isActive ? 'Active' : 'Inactive' }}
            </UBadge>
          </div>
        </div>

        <div v-if="user.isActive" class="rounded-md border border-error/30 bg-error/10 p-3 text-sm">
          <div class="flex items-start gap-2 text-error">
            <UIcon name="i-lucide-alert-triangle" class="size-4 mt-0.5 shrink-0" />
            <div>
              <p class="font-semibold">
                Warning
              </p>
              <p class="text-muted mt-0.5">
                Deactivating this user will immediately revoke their access. They will be logged out and unable to sign in until reactivated.
              </p>
            </div>
          </div>
        </div>

        <div v-else class="rounded-md border border-success/30 bg-success/10 p-3 text-sm">
          <div class="flex items-start gap-2 text-success">
            <UIcon name="i-lucide-info" class="size-4 mt-0.5 shrink-0" />
            <p>Activating this user will restore their access. They will be able to sign in again.</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="onCancel"
          />
          <UButton
            :label="actionLabel"
            :color="actionColor"
            variant="solid"
            :loading="pending"
            @click="onConfirm"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
