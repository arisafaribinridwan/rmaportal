<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuth } from '~/composables/useAuth'

const open = ref(false)
const { role } = useAuth()

// Build navigation based on role
const links = computed<NavigationMenuItem[][]>(() => {
  const mainLinks: NavigationMenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'i-lucide-house',
      to: '/dashboard',
      exact: true,
      onSelect: () => { open.value = false }
    }
  ]

  // Claims & Vendor Claims — QRCC + ADMIN
  if (role.value === 'QRCC' || role.value === 'ADMIN') {
    mainLinks.push(
      {
        label: 'Claims',
        icon: 'i-lucide-clipboard-list',
        to: '/dashboard/claims',
        exact: true,
        onSelect: () => { open.value = false }
      },
      {
        label: 'Vendor Claims',
        icon: 'i-lucide-package',
        to: '/dashboard/vendor-claims',
        exact: true,
        onSelect: () => { open.value = false }
      },
      {
        label: 'Master Data',
        icon: 'i-lucide-database',
        type: 'trigger',
        children: [
          {
            label: 'Vendor',
            to: '/dashboard/master/vendor',
            exact: true,
            onSelect: () => { open.value = false }
          },
          {
            label: 'Product Model',
            to: '/dashboard/master/product-model',
            exact: true,
            onSelect: () => { open.value = false }
          },
          {
            label: 'Notification',
            to: '/dashboard/master/notification',
            exact: true,
            onSelect: () => { open.value = false }
          },
          {
            label: 'Defect Master',
            to: '/dashboard/master/defect',
            exact: true,
            onSelect: () => { open.value = false }
          }
        ]
      }
    )
  }

  // Reports — all dashboard roles
  mainLinks.push({
    label: 'Reports',
    icon: 'i-lucide-pie-chart',
    to: '/dashboard/reports',
    exact: true,
    onSelect: () => { open.value = false }
  })

  // Audit Trail — QRCC + ADMIN
  if (role.value === 'QRCC' || role.value === 'ADMIN') {
    mainLinks.push({
      label: 'Audit Trail',
      icon: 'i-lucide-history',
      to: '/dashboard/audit-trail',
      exact: true,
      onSelect: () => { open.value = false }
    })
  }

  // Settings — all dashboard roles
  const settingsChildren: NavigationMenuItem[] = [
    {
      label: 'General',
      to: '/dashboard/settings',
      exact: true,
      onSelect: () => { open.value = false }
    },
    {
      label: 'Security',
      to: '/dashboard/settings/security',
      exact: true,
      onSelect: () => { open.value = false }
    }
  ]

  // Users management — ADMIN only
  if (role.value === 'ADMIN') {
    settingsChildren.splice(1, 0, {
      label: 'Users',
      to: '/dashboard/settings/users',
      exact: true,
      onSelect: () => { open.value = false }
    })
  }

  mainLinks.push({
    label: 'Settings',
    to: '/dashboard/settings',
    icon: 'i-lucide-settings',
    type: 'trigger',
    children: settingsChildren
  })

  return [mainLinks]
})

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.value.flat().filter(item => item.to).map(item => ({
    id: item.to as string,
    label: item.label!,
    icon: item.icon,
    to: item.to,
    onSelect: item.onSelect
  }))
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <img
          v-if="collapsed"
          src="/icon.png"
          alt="Icon"
          class="h-5 w-auto mx-auto"
        >
        <AppLogo v-else />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
