<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Dashboard',
  icon: 'i-lucide-house',
  to: '/dashboard',
  exact: true,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Claims',
  icon: 'i-lucide-clipboard-list',
  to: '/dashboard/claims',
  exact: true,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Vendor Claims',
  icon: 'i-lucide-package',
  to: '/dashboard/vendor-claims',
  exact: true,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Master Data',
  icon: 'i-lucide-database',
  type: 'trigger',
  children: [{
    label: 'Vendor',
    to: '/dashboard/master/vendor',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Product Model',
    to: '/dashboard/master/product-model',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Notification',
    to: '/dashboard/master/notification',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Defect Master',
    to: '/dashboard/master/defect',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'Reports',
  icon: 'i-lucide-pie-chart',
  to: '/dashboard/reports',
  exact: true,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Audit Trail',
  icon: 'i-lucide-history',
  to: '/dashboard/audit-trail',
  exact: true,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Setting',
  to: '/dashboard/setting',
  icon: 'i-lucide-settings',
  type: 'trigger',
  children: [{
    label: 'General',
    to: '/dashboard/settings',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Users',
    to: '/dashboard/settings/users',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Security',
    to: '/dashboard/settings/security',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }]
}], [{
  label: 'Feedback',
  icon: 'i-lucide-message-circle',
  to: 'https://github.com/nuxt-ui-templates/dashboard',
  target: '_blank'
}, {
  label: 'Help & Support',
  icon: 'i-lucide-info',
  to: 'https://github.com/nuxt-ui-templates/dashboard',
  target: '_blank'
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
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

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
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
