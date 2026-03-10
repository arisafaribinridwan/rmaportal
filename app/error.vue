<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const title = computed(() => {
  if (props.error.statusCode === 404) return 'Page not found'
  if (props.error.statusCode === 403) return 'Access denied'
  if (props.error.statusCode === 401) return 'Authentication required'
  return 'Something went wrong'
})

const description = computed(() => {
  if (props.error.statusCode === 404) return 'The page you are looking for does not exist or has been moved.'
  if (props.error.statusCode === 403) return 'You do not have permission to access this page.'
  if (props.error.statusCode === 401) return 'Please log in to access this page.'
  return props.error.message || 'An unexpected error occurred.'
})

useSeoMeta({
  title: title.value,
  description: description.value
})

useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

function handleError() {
  clearError({ redirect: '/login' })
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex flex-col items-center justify-center p-6">
      <div class="text-center max-w-md">
        <p class="text-6xl font-bold text-primary mb-4">
          {{ error.statusCode }}
        </p>
        <h1 class="text-2xl font-semibold mb-2">
          {{ title }}
        </h1>
        <p class="text-muted mb-8">
          {{ description }}
        </p>
        <UButton
          label="Back to Login"
          color="primary"
          size="lg"
          @click="handleError"
        />
      </div>
    </div>
  </UApp>
</template>
