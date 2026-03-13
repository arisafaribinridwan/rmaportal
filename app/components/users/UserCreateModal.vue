<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { USER_ROLES } from '~~/shared/utils/constants'
import type { CreateUserResponse } from '~/types/user-management'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Only letters, numbers, underscores, dots, and hyphens'),
  role: z.enum(USER_ROLES, { message: 'Please select a role' }),
  branch: z.string().optional()
}).refine(
  (data) => {
    if (data.role === 'CS') {
      return !!data.branch?.trim()
    }
    return true
  },
  {
    message: 'Branch is required when role is CS',
    path: ['branch']
  }
)

type Schema = z.output<typeof schema>

const open = ref(false)
const state = reactive({
  name: '',
  email: '',
  username: '',
  role: undefined as Schema['role'] | undefined,
  branch: ''
})

function resetState() {
  state.name = ''
  state.email = ''
  state.username = ''
  state.role = undefined
  state.branch = ''
  createdResult.value = null
}

function onClose() {
  resetState()
  open.value = false
}

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const pending = ref(false)
const createdResult = ref<CreateUserResponse | null>(null)

// Apakah branch field perlu ditampilkan
const showBranch = computed(() => state.role === 'CS')

const roleItems = USER_ROLES.map(r => ({ label: r, value: r }))

async function onSubmit(event: FormSubmitEvent<Schema>) {
  pending.value = true
  try {
    const result = await $fetch<CreateUserResponse>('/api/users', {
      method: 'POST',
      body: event.data
    })
    createdResult.value = result
    toast.add({
      title: 'User Created',
      description: `${event.data.name} has been created successfully`,
      color: 'success'
    })
    emit('success')
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: err.data?.message || err.message || 'Failed to create user',
      color: 'error'
    })
  } finally {
    pending.value = false
  }
}

function closeAfterCreated() {
  resetState()
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="New User"
    description="Create a new user account"
    :dismissible="false"
    @update:open="(val: boolean) => { if (!val) onClose() }"
  >
    <UButton
      label="New user"
      icon="i-lucide-plus"
      color="neutral"
      variant="outline"
    />

    <template #body>
      <!-- Success State — tampilkan info password default -->
      <div v-if="createdResult" class="space-y-4">
        <div class="rounded-lg border border-default bg-elevated/50 p-4 space-y-3">
          <div class="flex items-center gap-2 text-success">
            <UIcon name="i-lucide-check-circle" class="size-5" />
            <span class="font-semibold">User created successfully!</span>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted">Name:</span>
              <span class="font-medium">{{ createdResult.user.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Email:</span>
              <span class="font-medium">{{ createdResult.user.email }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Username:</span>
              <span class="font-medium">{{ createdResult.user.username }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Role:</span>
              <span class="font-medium">{{ createdResult.user.role }}</span>
            </div>
            <div v-if="createdResult.user.branch" class="flex justify-between">
              <span class="text-muted">Branch:</span>
              <span class="font-medium">{{ createdResult.user.branch }}</span>
            </div>
          </div>

          <div class="rounded-md border border-warning/30 bg-warning/10 p-3">
            <div class="flex items-center gap-2 text-warning mb-1">
              <UIcon name="i-lucide-key" class="size-4" />
              <span class="font-semibold text-sm">Default Password</span>
            </div>
            <code class="text-sm font-mono font-bold">{{ createdResult.defaultPassword }}</code>
            <p class="text-xs text-muted mt-1">
              Please share this password securely with the user. They should change it upon first login.
            </p>
          </div>
        </div>

        <div class="flex justify-end">
          <UButton
            label="Close"
            color="primary"
            @click="closeAfterCreated"
          />
        </div>
      </div>

      <!-- Create Form -->
      <UForm
        v-else
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" class="w-full" placeholder="e.g. John Doe" />
        </UFormField>

        <UFormField label="Email" name="email" required>
          <UInput
            v-model="state.email"
            class="w-full"
            type="email"
            placeholder="e.g. john@example.com"
          />
        </UFormField>

        <UFormField label="Username" name="username" required>
          <UInput v-model="state.username" class="w-full" placeholder="e.g. john.doe" />
        </UFormField>

        <UFormField label="Role" name="role" required>
          <USelect
            v-model="state.role"
            :items="roleItems"
            placeholder="Select role"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="showBranch"
          label="Branch"
          name="branch"
          required
        >
          <UInput v-model="state.branch" class="w-full" placeholder="e.g. Jakarta" />
        </UFormField>

        <div class="flex justify-end gap-2 mt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="onClose"
          />
          <UButton
            label="Create User"
            color="primary"
            variant="solid"
            type="submit"
            :loading="pending"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
