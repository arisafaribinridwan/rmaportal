<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { authClient } from '~/utils/auth-client'
import { useAuth } from '~/composables/useAuth'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const { user } = useAuth()

const displayName = computed(() => user.value?.name ?? 'User')

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: displayName.value
}], [{
  label: 'Profile',
  icon: 'i-lucide-user',
  to: '/dashboard/settings'
}, {
  label: 'Security',
  icon: 'i-lucide-shield',
  to: '/dashboard/settings/security'
}], [{
  label: 'Appearance',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Light',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'light'
    }
  }, {
    label: 'Dark',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'dark'
    }
  }]
}], [{
  label: 'Log out',
  icon: 'i-lucide-log-out',
  onSelect: async () => {
    await authClient.signOut()
    await navigateTo('/login', { replace: true })
  }
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        label: collapsed ? undefined : displayName,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      icon="i-lucide-user"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />
  </UDropdownMenu>
</template>
