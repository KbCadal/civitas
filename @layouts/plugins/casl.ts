import type { NavGroup } from '@layouts/types'
import type { RouteLocationNormalized } from 'vue-router'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'

/**
 * Returns ability result if ACL is configured or else just return true
 * If no action or subject is provided, return true (open access)
 *
 * @param {string} action CASL Actions
 * @param {string} subject CASL Subject
 */
export const can = (action: string | undefined, subject: string | undefined) => {
  const keycloakStore = useKeycloakStore()
  const userRoles = keycloakStore.userRoles || []

  if (!action || !subject)
    return true // ✅ Open access if action/subject is missing

  return userRoles.includes(subject) // ✅ Check if user has the required role
}

/**
 * Check if user can view a navigation menu group
 * Based on item's action and subject & hide group if all children are hidden
 *
 * @param {object} item - Navigation object item
 */
export const canViewNavMenuGroup = (item: NavGroup) => {
  const hasAnyVisibleChild = item.children.some(i => can(i.action, i.subject))

  if (!(item.action && item.subject))
    return hasAnyVisibleChild

  return can(item.action, item.subject) && hasAnyVisibleChild
}

/**
 * Determines if a user can navigate to a route based on Keycloak roles
 *
 * @param {RouteLocationNormalized} to - Target route
 */
export const canNavigate = (to: RouteLocationNormalized) => {
  const keycloakStore = useKeycloakStore()
  const userRoles = keycloakStore.userRoles || []

  if (!to.meta.requiresRole)
    return true // ✅ Allow access if no role is required

  return userRoles.includes(to.meta.requiresRole) // ✅ Allow if user has the required role
}
