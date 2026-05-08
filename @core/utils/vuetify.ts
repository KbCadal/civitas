import { cookieRef } from '@layouts/stores/config'
import { usePreferredDark } from '@vueuse/core'
import type { LiteralUnion } from 'type-fest'

export const resolveVuetifyTheme = (defaultTheme: LiteralUnion<'light' | 'dark' | 'system', string>): 'light' | 'dark' => {
  const cookieColorScheme = cookieRef<'light' | 'dark'>('color-scheme', usePreferredDark().value ? 'dark' : 'light')
  const storedTheme = cookieRef('theme', defaultTheme).value

  return storedTheme === 'system'
    ? cookieColorScheme.value === 'dark'
      ? 'dark'
      : 'light'
    : storedTheme as 'light' | 'dark'
}
