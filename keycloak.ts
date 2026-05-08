import Keycloak from 'keycloak-js'

const keycloakConfig = {
  url: 'https://login.ui.ac.id',
  realm: 'main',

  clientId: 'civitas', // harus minta ijin localhost dulu
  // clientId: 'vueplayground',
}

// Directly instantiate the Keycloak instance to avoid 'null' issues
const keycloakInstance = new Keycloak(keycloakConfig)

export default keycloakInstance
export { keycloakConfig }
