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
      const accessToken = this.token;

      const applyAuth = (headers: Headers, method: string, hasBody: boolean) => {
        if (accessToken) {
          headers.set('Authorization', `Bearer ${accessToken}`);
        }
        // EDC management POSTs JSON; keep Content-Type when the fetch bridge rewrites headers.
        if (hasBody && !['GET', 'HEAD'].includes(method.toUpperCase()) && !headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
      };

      if (input instanceof Request) {
        const headers = new Headers(input.headers);
        new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
        applyAuth(headers, input.method, input.body != null);
        // Rebuild the Request so body + headers stay together (fetch(request, {headers}) can drop Content-Type).
        return nativeFetch(new Request(input, { headers }));
      }

      const headers = new Headers(init?.headers);
      const method = init?.method ?? 'GET';
      applyAuth(headers, method, init?.body != null);
      return nativeFetch(input, { ...init, headers });
    };

    this.fetchBridgeInstalled = true;
  }
}
