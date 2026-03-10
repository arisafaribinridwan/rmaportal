<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()
const toast = useToast()

const profileSchema = z.object({
  name: z.string().min(2, 'Too short'),
  email: z.email('Invalid email'),
  username: z.string().min(2, 'Too short')
})

type ProfileSchema = z.output<typeof profileSchema>

const profile = reactive<Partial<ProfileSchema>>({
  name: user.value?.name ?? '',
  email: user.value?.email ?? '',
  username: (user.value as Record<string, unknown>)?.username as string ?? ''
})

// Sync when session data loads/changes
watch(user, (u) => {
  if (u) {
    profile.name = u.name ?? ''
    profile.email = u.email ?? ''
    profile.username = (u as Record<string, unknown>)?.username as string ?? ''
  }
}, { immediate: true })

async function onSubmit(_event: FormSubmitEvent<ProfileSchema>) {
  toast.add({
    title: 'Info',
    description: 'Profile updates are managed by your administrator.',
    icon: 'i-lucide-info',
    color: 'info'
  })
}
</script>

<template>
  <UForm
    id="settings"
    :schema="profileSchema"
    :state="profile"
    @submit="onSubmit"
  >
    <UPageCard
      title="Profile"
      description="Your account information."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    />

    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Name"
        description="Your display name."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.name"
          autocomplete="off"
          disabled
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="email"
        label="Email"
        description="Your login email address."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.email"
          type="email"
          autocomplete="off"
          disabled
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="username"
        label="Username"
        description="Your unique username."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.username"
          autocomplete="off"
          disabled
        />
      </UFormField>
      <USeparator />
      <UFormField
        label="Role"
        description="Your assigned role in the system."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UBadge
          :label="(user as Record<string, unknown>)?.role as string ?? '-'"
          color="primary"
          variant="subtle"
          size="lg"
        />
      </UFormField>
      <USeparator />
      <UFormField
        label="Branch"
        description="Your assigned branch."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <span class="text-sm text-muted">
          {{ (user as Record<string, unknown>)?.branch ?? '-' }}
        </span>
      </UFormField>
    </UPageCard>
  </UForm>
</template>
