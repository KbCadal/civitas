import { useTheme } from 'vuetify'
import { useConfigStore } from '@core/stores/config'

// composable function to return the image variant as per the current theme and skin
export const useGenerateColorVariant = (colorLight: string, colorDark: string, colorLightBordered?: string, colorDarkBordered?: string, bordered = false) => {
  const configStore = useConfigStore()
  const { global } = useTheme()

  return computed(() => {
    if (global.name.value === 'light') {
      if (configStore.skin === 'bordered' && bordered)
        return colorLightBordered

      else
        return colorLight
    }
    if (global.name.value === 'dark') {
      if (configStore.skin === 'bordered' && bordered)
        return colorDarkBordered

      else
        return colorDark
    }

    // Add a default return statement
    return colorLight
  })
}
