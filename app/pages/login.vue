<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

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
  },
  // In Nuxt UI v3/v4 this will render as text hint next to the label.
  // We can also potentially use slots if supported, but this is the simplest built-in way.
  // description: 'Forget Password?' },
  {
    name: 'remember',
    type: 'checkbox',
    label: 'Remember me'
  }
])

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string('Password is required').min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

const onSubmit = async (data: FormSubmitEvent<Schema>) => {
  console.log('Login Submitted', data)
}
</script>

<template>
  <div class="min-h-screen relative flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-950 p-6">
    <div class="justify-end w-full max-w-6xl flex flex-none">
      <UColorModeButton />
    </div>
    <div class="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center grow">
      <!-- Left Section: Branding and Information -->
      <div class="space-y-8">
        <h1 class="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
          Official Portal for <br>
          <!-- The text color matches the primary brand color from the image -->
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
        <!-- Flex container to align the button top-right relative to the form area -->
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
          <UAuthForm
            :schema="schema"
            title="Welcome back"
            description="Enter your credentials to access your account."
            :fields="fields"
            :submit="{ label: 'Sign In', color: 'success', block: true, size: 'xl', class: 'mt-6 font-medium rounded-xl' }"
            @submit="onSubmit"
          >
            <!-- Custom Slot approach if needed -->
            <template #password-hint>
              <NuxtLink to="/forgot-password" class="text-sm font-medium text-indigo-500 hover:text-indigo-600">
                Forget Password?
              </NuxtLink>
            </template>
          </UAuthForm>
        </div>
      </div>
    </div>
  </div>
</template>
