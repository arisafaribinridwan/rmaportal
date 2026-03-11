<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { authClient } from '~/utils/auth-client'
import { useAuth } from '~/composables/useAuth'

// Prevent hydration mismatch by defining refs before accessing auth state
const loading = ref(false)
const errorMessage = ref('')
const isHydrated = ref(false)

// Set hydrated state on mounted to prevent SSR/CSR mismatch
onMounted(() => {
  isHydrated.value = true
})

definePageMeta({
  layout: false
})

const { getHomePath } = useAuth()

const fields = ref<AuthFormField[]>([
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    size: 'xl',
    required: true
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    size: 'xl',
    required: true
  }
])

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string('Password is required').min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await authClient.signIn.email({
      email: event.data.email,
      password: event.data.password
    })

    if (error) {
      errorMessage.value = error.message ?? 'Login failed. Please check your credentials.'
      return
    }

    if (data) {
      // Redirect ke home sesuai role setelah login sukses
      await navigateTo(getHomePath(), { replace: true })
    }
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error
      ? err.message
      : 'An unexpected error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen relative flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-950 p-6">
    <div class="justify-end w-full max-w-6xl flex flex-none">
      <client-only>
        <UColorModeButton />
      </client-only>
    </div>
    <div class="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center grow">
      <!-- Left Section: Branding and Information -->
      <div class="space-y-8">
        <h1 class="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
          Official Portal for <br>
          <span class="text-indigo-500">RMA Panel System</span> <br>
          Management
        </h1>

        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-lg">
          Manage LCD Panel defect return, track claim status and access detailed rma system in real time.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
          <div class="flex items-start gap-3">
            <div class="mt-1">
              <UIcon name="i-lucide-check-circle" class="w-8 h-8 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">
                Real-time Tracking
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Instant status updates
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="mt-1">
              <UIcon name="i-lucide-shield-check" class="w-8 h-8 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">
                Detail Informations
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Complete data submission
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Section: AuthForm Area -->
      <div class="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
          <!-- Error Alert -->
          <div
            v-if="errorMessage"
            class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
          >
            <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
            {{ errorMessage }}
          </div>

          <ClientOnly>
            <UAuthForm
              :schema="schema"
              title="Welcome back"
              description="Enter your credentials to access your account."
              :fields="fields"
              :submit="{
                label: loading ? 'Signing in...' : 'Sign In',
                color: 'success',
                block: true,
                size: 'xl',
                class: 'mt-6 font-medium rounded-xl',
                disabled: loading,
                loading: loading
              }"
              @submit="onSubmit"
            />
            <template #fallback>
              <div class="p-8 flex justify-center items-center">
                <USkeleton class="h-12 w-full rounded-xl" />
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>
    </div>
  </div>
</template>
