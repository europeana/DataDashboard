import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Keycloak from 'keycloak-js';
import { AppConfig } from '../../../projects/dashboard-core/src/lib/models/app-config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private keycloak?: Keycloak;
  private fetchBridgeInstalled = false;

  private readonly defaultKeycloakConfig = {
    url: 'https://<default-keycloak-host>/auth',
    realm: '<default-realm>',
    clientId: '<client-id>',
  };

  async init() {
    let runtimeKeycloakConfig: { url?: string; realm?: string; clientId?: string } = {};

    try {
      const appConfig = await firstValueFrom(this.http.get<AppConfig>('config/app-config.json'));
      runtimeKeycloakConfig = appConfig.keycloak ?? {};
    } catch (error) {
      console.warn('[AuthService] Unable to load runtime app-config.json; using Keycloak placeholder defaults.', error);
    }

    const keycloak = new Keycloak({
      url: runtimeKeycloakConfig.url ?? this.defaultKeycloakConfig.url,
      realm: runtimeKeycloakConfig.realm ?? this.defaultKeycloakConfig.realm,
      clientId: runtimeKeycloakConfig.clientId ?? this.defaultKeycloakConfig.clientId,
    });

    const authenticated = await keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    console.log('Keycloak authenticated:', authenticated);
    console.log('Access token:', keycloak.token);
    console.log('Parsed token:', keycloak.tokenParsed);

    if (!authenticated) {
      await keycloak.login();
    }

    this.keycloak = keycloak;
    this.installFetchBridge();
  }

  get token(): string {
    return this.keycloak?.token ?? '';
  }

  get user() {
    return this.keycloak?.tokenParsed;
  }

  logout() {
    this.keycloak?.logout();
  }

  async refreshToken() {
    await this.keycloak?.updateToken(60);
  }

  private installFetchBridge() {
    if (this.fetchBridgeInstalled || typeof window === 'undefined') {
      return;
    }

    const nativeFetch = window.fetch.bind(window);

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      // Start from headers already on the Request. The EDC client calls
      // `fetch(request)` with no second argument; replacing that with only
      // Authorization would drop Content-Type and cause 415s on catalog POST.
      const headers = new Headers(input instanceof Request ? input.headers : undefined);
      new Headers(init?.headers).forEach((value, key) => headers.set(key, value));

      const accessToken = this.token;
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      return nativeFetch(input, { ...init, headers });
    };

    this.fetchBridgeInstalled = true;
  }
}
