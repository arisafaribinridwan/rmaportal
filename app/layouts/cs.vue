<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { authClient } from '~/utils/auth-client'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()

const items = computed<NavigationMenuItem[]>(() => [{
  label: 'My Claims',
  icon: 'i-lucide-file-text',
  to: '/cs/claim'
}])

const dropdownItems = computed<DropdownMenuItem[][]>(() => [
  [{
    type: 'label',
    label: user.value?.name ?? 'User'
  }],
  [{
    label: 'Settings',
    icon: 'i-lucide-settings',
    onSelect: () => {
      navigateTo('/dashboard/settings')
    }
  }],
  [{
    label: 'Logout',
    icon: 'i-lucide-log-out',
    onSelect: async () => {
      await authClient.signOut()
      window.location.href = '/login'
    }
  }]
])
</script>

<template>
  <UApp class="h-screen flex flex-col">
    <UHeader>
      <template #title>
        <AppLogo />
      </template>

      <template #right>
        <div class="flex items-center gap-1.5 lg:flex-none">
          <UNavigationMenu :items="items" />

          <UColorModeButton />

          <UDropdownMenu
            :items="dropdownItems"
            :content="{
              align: 'end',
              side: 'bottom',
              sideOffset: 8
            }"
          >
            <UButton
              icon="i-lucide-user"
              color="neutral"
              variant="ghost"
              size="sm"
              square
            />
          </UDropdownMenu>
        </div>
      </template>
    </UHeader>

    <UMain class="max-w-7xl mx-auto lg:p-8 flex justify-center items-center">
      <slot />
    </UMain>
  </UApp>
</template>
