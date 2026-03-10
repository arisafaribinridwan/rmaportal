<script setup lang="ts">
import * as z from 'zod'
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { authClient } from '~/utils/auth-client'

const toast = useToast()

const passwordSchema = z.object({
  current: z.string().min(8, 'Must be at least 8 characters'),
  new: z.string().min(8, 'Must be at least 8 characters'),
  confirm: z.string().min(8, 'Must be at least 8 characters')
})

type PasswordSchema = z.output<typeof passwordSchema>

const password = reactive<Partial<PasswordSchema>>({
  current: '',
  new: '',
  confirm: ''
})

const loading = ref(false)
const errorMessage = ref('')

const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = []
  if (state.current && state.new && state.current === state.new) {
    errors.push({ name: 'new', message: 'New password must be different from current' })
  }
  if (state.new && state.confirm && state.new !== state.confirm) {
    errors.push({ name: 'confirm', message: 'Passwords do not match' })
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<PasswordSchema>) {
  loading.value = true
  errorMessage.value = ''

  try {
    const { error } = await authClient.changePassword({
      currentPassword: event.data.current,
      newPassword: event.data.new,
      revokeOtherSessions: false
    })

    if (error) {
      errorMessage.value = error.message ?? 'Failed to change password.'
      return
    }

    toast.add({
      title: 'Success',
      description: 'Your password has been updated.',
      icon: 'i-lucide-check',
      color: 'success'
    })

    // Reset form
    password.current = ''
    password.new = ''
    password.confirm = ''
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error
      ? err.message
      : 'An unexpected error occurred.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Change Password"
    description="Confirm your current password before setting a new one."
    variant="subtle"
  >
    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
    >
      <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
      {{ errorMessage }}
    </div>

    <UForm
      :schema="passwordSchema"
      :state="password"
      :validate="validate"
      class="flex flex-col gap-4 max-w-xs"
      @submit="onSubmit"
    >
      <UFormField name="current" label="Current Password">
        <UInput
          v-model="password.current"
          type="password"
          placeholder="Current password"
          class="w-full"
        />
      </UFormField>

      <UFormField name="new" label="New Password">
        <UInput
          v-model="password.new"
          type="password"
          placeholder="New password"
          class="w-full"
        />
      </UFormField>

      <UFormField name="confirm" label="Confirm New Password">
        <UInput
          v-model="password.confirm"
          type="password"
          placeholder="Confirm new password"
          class="w-full"
        />
      </UFormField>

      <UButton
        label="Update Password"
        class="w-fit"
        type="submit"
        :loading="loading"
        :disabled="loading"
      />
    </UForm>
  </UPageCard>
</template>
