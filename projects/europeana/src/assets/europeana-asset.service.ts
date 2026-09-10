import { inject, Injectable } from '@angular/core';
import { AssetService } from '@eclipse-edc/dashboard-core/assets';
import { AssetInput, compact, IdResponse } from '@think-it-labs/edc-connector-client';
import { firstValueFrom } from 'rxjs';
import { DashboardStateService, EdcConfig } from '@eclipse-edc/dashboard-core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JsonValue } from '@angular-devkit/core';

/** EDC default vocab — always attached on create/update. */
const EDC_VOCAB = 'https://w3id.org/edc/v0.0.1/ns/';

/**
 * Optional schema prefixes attached to `@context` only when a property key
 * uses that CURIE (e.g. `dcterms:description`, `dcat:mediaType`).
 * Plain keys like `description` stay under `@vocab` and do not pull these in.
 */
const SCHEMA_NAMESPACES: Readonly<Record<string, string>> = {
  dcat: 'https://www.w3.org/ns/dcat/',
  dct: 'https://purl.org/dc/terms/',
  dcterms: 'https://purl.org/dc/terms/',
  odrl: 'http://www.w3.org/ns/odrl/2/',
  dspace: 'https://w3id.org/dspace/v0.8/',
};

/**
 * Full catalog (EDC vocab + every known schema). Kept for callers that need
 * the complete map; create/update use {@link EuropeanaAssetService} dynamic context.
 */
export const ASSET_JSON_LD_CONTEXT = {
  '@vocab': EDC_VOCAB,
  ...SCHEMA_NAMESPACES,
} as const;

/**
 * Mapping for Known  'IRI prefixes → short CURIE' prefixes for form display.
 * (IRI-Internationalized Resource Identifier )
 * (CURIE-short Compact URI )
 * Includes common alternate spellings of DCAT (`#` vs `/`, http vs https).
 * See : https://www.w3.org/TR/vocab-dcat-1/ *
 *
 * Only full IRIs are rewritten. Plain keys (e.g. `description`) are left as-is.
 */
const DISPLAY_NAMESPACE_PREFIXES: readonly (readonly [string, string])[] = [
  ['dcat:', 'https://www.w3.org/ns/dcat/'],
  ['dcat:', 'http://www.w3.org/ns/dcat/'],
  ['dcat:', 'https://www.w3.org/ns/dcat#'],
  ['dcat:', 'http://www.w3.org/ns/dcat#'],
  ['dcterms:', 'https://purl.org/dc/terms/'],
  ['dcterms:', 'http://purl.org/dc/terms/'],
  ['dct:', 'https://purl.org/dc/terms/'],
  ['dct:', 'http://purl.org/dc/terms/'],
  ['odrl:', 'http://www.w3.org/ns/odrl/2/'],
  ['odrl:', 'https://www.w3.org/ns/odrl/2/'],
  ['dspace:', 'https://w3id.org/dspace/v0.8/'],
  ['dspace:', 'https://w3id.org/dspace/2025/1/'],
];

const JSON_LD_META_KEYS = new Set(['@context', '@id', '@type']);

/** Prefixed onto free-form distribution keys before they are sent to the management API. */
const DISTRIBUTION_KEY_PREFIX = 'distribution.';

@Injectable()
export class EuropeanaAssetService extends AssetService{
  private readonly state = inject(DashboardStateService);
  private readonly http = inject(HttpClient);


  public override async createAsset(assetInput: AssetInput): Promise<IdResponse> {
    const config = await this.requireCurrentConfig();
    try {
      return await firstValueFrom(
        this.http.post<IdResponse>(`${this.managementBase(config)}/v3/assets`, this.withContext(assetInput), {
          headers: this.headers(config),
        }),
      );
    } catch (err: unknown) {
      throw this.toError(err);
    }
  }
  public override async updateAsset(assetInput: AssetInput): Promise<void> {
    const config = await this.requireCurrentConfig();
    try {
      await firstValueFrom(
        this.http.put(`${this.managementBase(config)}/v3/assets`, this.withContext(assetInput), {
          headers: this.headers(config),
        }),
      );
    } catch (err: unknown) {
      throw this.toError(err);
    }
  }

  /**
   * Compacts JSON-LD for the asset form.
   * Full vocabulary IRIs become CURIEs (`dcat:mediaType`); plain keys
   * (`description`) are left unchanged — no schema conversion.
   */
  public async compactForForm(value: unknown): Promise<Record<string, JsonValue>> {
    const compacted = (await compact(value)) as Record<string, JsonValue>;
    return this.toPrefixedKeys(compacted);
  }

  /**
   * Rewrites full namespace IRIs to CURIE-style keys using
   * {@link DISPLAY_NAMESPACE_PREFIXES}. Plain / unprefixed keys are untouched.
   */
  public toPrefixedKeys(object: Record<string, JsonValue>): Record<string, JsonValue> {
    return Object.fromEntries(
      Object.entries(object)
      .filter(([key]) => !JSON_LD_META_KEYS.has(key))
      .map(([key, val]): [string,JsonValue] => [this.toPrefixedKey(key), val]),
    );
  }

  private toPrefixedKey(key: string): string {
    for (const [prefix, namespace] of DISPLAY_NAMESPACE_PREFIXES) {
      if (key.startsWith(namespace)) {
        return `${prefix}${key.slice(namespace.length)}`;
      }
    }
    return key;
  }

  /**
   * Attaches `@context` with EDC `@vocab` always, plus schema prefixes only
   * when a property key already uses that schema (e.g. `dcterms:description`).
   * Also normalizes dataAddress distribution keys (`3.title` → `distribution.3.title`).
   */
  private withContext(assetInput: AssetInput): AssetInput & { '@context': Record<string, string> } {
    const normalized = this.normalizeDataAddressProperties(assetInput);
    return {
      ...normalized,
      '@context': this.buildContext(normalized),
    };
  }

  /**
   * Collects distribution keys from nested `properties` and flat address fields,
   * forces the `distribution.` prefix, and writes them only under `dataAddress.properties`.
   */
  private normalizeDataAddressProperties(assetInput: AssetInput): AssetInput {
    const address = { ...(assetInput.dataAddress as Record<string, unknown>) };
    const collected: Record<string, JsonValue> = {};

    const nested = address['properties'];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      Object.assign(collected, nested as Record<string, JsonValue>);
    }
    delete address['properties'];

    for (const key of Object.keys(address)) {
      if (!this.isDistributionLikeKey(key)) {
        continue;
      }
      collected[key] = address[key] as JsonValue;
      delete address[key];
    }

    const properties = this.ensureDistributionPrefix(collected);
    if (Object.keys(properties).length > 0) {
      address['properties'] = properties;
    }

    return {
      ...assetInput,
      dataAddress: address as AssetInput['dataAddress'],
    };
  }

  /** `3.title` → `distribution.3.title`; leaves `format` and already-prefixed keys alone. */
  private ensureDistributionPrefix(properties: Record<string, JsonValue>): Record<string, JsonValue> {
    return Object.fromEntries(
      Object.entries(properties).map(([key, value]) => {
        const lower = key.toLowerCase();
        if (lower === 'format' || lower.startsWith(DISTRIBUTION_KEY_PREFIX)) {
          return [key, value];
        }
        return [`${DISTRIBUTION_KEY_PREFIX}${key}`, value];
      }),
    );
  }

  private isDistributionLikeKey(key: string): boolean {
    const lower = key.toLowerCase();
    if (['@context', '@id', '@type', 'type', 'properties'].includes(lower)) {
      return false;
    }
    return lower === 'format' || lower.startsWith(DISTRIBUTION_KEY_PREFIX) || /^\d+\./.test(key);
  }

  private buildContext(assetInput: AssetInput): Record<string, string> {
    const context: Record<string, string> = { '@vocab': EDC_VOCAB };
    for (const prefix of this.collectSchemaPrefixes(assetInput)) {
      const namespace = SCHEMA_NAMESPACES[prefix];
      if (namespace) {
        context[prefix] = namespace;
      }
    }
    return context;
  }

  /** Collect CURIE prefixes used in properties / privateProperties / dataAddress.properties. */
  private collectSchemaPrefixes(assetInput: AssetInput): Set<string> {
    const found = new Set<string>();
    const address = assetInput.dataAddress as { properties?: Record<string, unknown> } | undefined;
    const maps: unknown[] = [assetInput.properties, assetInput.privateProperties, address?.properties];

    for (const map of maps) {
      if (!map || typeof map !== 'object' || Array.isArray(map)) {
        continue;
      }
      for (const key of Object.keys(map)) {
        this.addSchemaPrefixesFromKey(key, found);
      }
    }
    return found;
  }

  private addSchemaPrefixesFromKey(key: string, found: Set<string>): void {
    for (const prefix of Object.keys(SCHEMA_NAMESPACES)) {
      // Matches `dcterms:description` and nested `distribution.1.dcterms:title`
      if (key === prefix || key.startsWith(`${prefix}:`) || key.includes(`.${prefix}:`)) {
        found.add(prefix);
      }
    }
  }

  private headers(config: EdcConfig): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (config.apiToken) {
      headers = headers.set('X-Api-Key', config.apiToken);
    }
    return headers;
  }

  private managementBase(config: EdcConfig): string {
    return config.managementUrl.replace(/\/$/, '');
  }

  private async requireCurrentConfig(): Promise<EdcConfig> {
    const config = await firstValueFrom(this.state.currentEdcConfig$);
    if (!config?.managementUrl) {
      throw new Error('No connector is selected or managementUrl is missing.');
    }
    return config;
  }

  private toError(err: unknown): Error {
    return err instanceof Error ? err : new Error('Asset request failed.');
  }

  // private toError(err: unknown): Error {
  //   if (err instanceof HttpErrorResponse) {
  //     const body = err.error;
  //     if (Array.isArray(body)) {
  //       const messages = body
  //         .map((item: { message?: string }) => item?.message)
  //         .filter((msg): msg is string => !!msg);
  //       if (messages.length) {
  //         return new Error(messages.join('; '));
  //       }
  //     }
  //     if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
  //       return new Error(body.message);
  //     }
  //     if (typeof body === 'string' && body.trim()) {
  //       return new Error(body);
  //     }
  //     return new Error(err.message || `HTTP ${err.status}`);
  //   }
  //   if (err instanceof Error) {
  //     return err;
  //   }
  //   return new Error('Asset request failed.');
  // }
}
