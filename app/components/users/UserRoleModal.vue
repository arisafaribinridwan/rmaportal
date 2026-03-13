<script setup lang="ts">
import { USER_ROLES } from '~~/shared/utils/constants'
import type { UserRole } from '~~/shared/utils/constants'
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
const selectedRole = ref<UserRole>((props.user.role as UserRole) || 'CS')

watch(() => props.user, (newUser) => {
  if (newUser) {
    selectedRole.value = (newUser.role as UserRole) || 'CS'
  }
})

const roleItems = USER_ROLES.map(r => ({ label: r, value: r }))

async function onSubmit() {
  if (selectedRole.value === props.user.role) {
    toast.add({
      title: 'No Change',
      description: 'The role is the same as current role',
      color: 'warning'
    })
    return
  }

  pending.value = true
  try {
    await $fetch(`/api/users/${props.user.id}`, {
      method: 'PATCH',
      body: { role: selectedRole.value }
    })
    toast.add({
      title: 'Role Updated',
      description: `${props.user.name}'s role changed to ${selectedRole.value}`,
      color: 'success'
    })
    emit('success')
    open.value = false
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: err.data?.message || err.message || 'Failed to update role',
      color: 'error'
    })
  } finally {
    pending.value = false
  }
}

function onCancel() {
  selectedRole.value = (props.user.role as UserRole) || 'CS'
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Change User Role"
    :description="`Update role for ${user.name}`"
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
            <span class="text-muted">Current Role:</span>
            <span class="font-medium">{{ user.role }}</span>
          </div>
          <div v-if="user.branch" class="flex justify-between">
            <span class="text-muted">Branch:</span>
            <span class="font-medium">{{ user.branch }}</span>
          </div>
        </div>

        <div v-if="!user.branch" class="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">
          <div class="flex items-center gap-2 text-warning">
            <UIcon name="i-lucide-alert-triangle" class="size-4" />
            <span>This user has no branch assigned. Changing role to CS will be rejected.</span>
          </div>
        </div>

        <div>
          <label class="text-sm font-medium mb-1.5 block">New Role</label>
          <USelect
            v-model="selectedRole"
            :items="roleItems"
            placeholder="Select role"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="onCancel"
          />
          <UButton
            label="Update Role"
            color="primary"
            variant="solid"
            :loading="pending"
            @click="onSubmit"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
