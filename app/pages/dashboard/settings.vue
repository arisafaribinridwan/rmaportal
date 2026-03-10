<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuth } from '~/composables/useAuth'

const { role } = useAuth()

const links = computed<NavigationMenuItem[][]>(() => {
  const items: NavigationMenuItem[] = [
    {
      label: 'General',
      icon: 'i-lucide-user',
      to: '/dashboard/settings',
      exact: true
    },
    {
      label: 'Security',
      icon: 'i-lucide-shield',
      to: '/dashboard/settings/security'
    }
  ]

  // Users management tab — ADMIN only
  if (role.value === 'ADMIN') {
    items.splice(1, 0, {
      label: 'Users',
      icon: 'i-lucide-users',
      to: '/dashboard/settings/users'
    })
  }

  return [items]
})
</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
