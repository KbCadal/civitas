import Keycloak from 'keycloak-js'

const keycloakConfig = {
  realm: 'main',
  clientId: 'civitas',
}

let keycloakInstance: Keycloak | null = null

export function createKeycloakInstance(url: string): Keycloak {
  keycloakInstance = new Keycloak({ url, ...keycloakConfig })

  return keycloakInstance
}

export function getKeycloakInstance(): Keycloak {
  if (!keycloakInstance)
    throw new Error('Keycloak not initialized. Call createKeycloakInstance(url) first.')

  return keycloakInstance
}

export { keycloakConfig }

export default new Proxy({} as Keycloak, {
  get(_, prop) {
    const inst = getKeycloakInstance()

    return (inst as any)[prop]
  },
})
