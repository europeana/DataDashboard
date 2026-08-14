import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://keycloak.test.eanadev.org/auth',
  realm: 'europeana',
  clientId: 'edc-dashboard',
});

export default keycloak;
