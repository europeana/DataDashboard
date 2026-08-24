import { inject, Injectable } from '@angular/core';
import { AssetService } from '@eclipse-edc/dashboard-core/assets';
import { AssetInput, compact, IdResponse } from '@think-it-labs/edc-connector-client';
import { firstValueFrom } from 'rxjs';
import { DashboardStateService, EdcConfig } from '@eclipse-edc/dashboard-core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JsonValue } from '@angular-devkit/core';

/**
 * JSON-LD context used for asset create/update.
 * Extends the EDC default `@vocab` with common dataspace vocabularies so prefixed
 * properties (e.g. `dct:title`, `dcat:keyword`) resolve correctly on the Management API.
 */
export const ASSET_JSON_LD_CONTEXT = {
  '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
  dcat: 'https://www.w3.org/ns/dcat/',
  dct: 'https://purl.org/dc/terms/',
  odrl: 'http://www.w3.org/ns/odrl/2/',
  dspace: 'https://w3id.org/dspace/v0.8/',
} as const;

/**
 * Mapping for Known  'IRI prefixes → short CURIE' prefixes for form display.
 * (IRI-Internationalized Resource Identifier )
 * (CURIE-short Compact URI )
 * Includes common alternate spellings of DCAT (`#` vs `/`, http vs https).
 * See : https://www.w3.org/TR/vocab-dcat-1/ *
 */
const DISPLAY_NAMESPACE_PREFIXES: readonly (readonly [string, string])[] = [
  ['dcat:', 'https://www.w3.org/ns/dcat/'],
  ['dcat:', 'http://www.w3.org/ns/dcat/'],
  ['dcat:', 'https://www.w3.org/ns/dcat#'],
  ['dcat:', 'http://www.w3.org/ns/dcat#'],
  ['dct:', 'https://purl.org/dc/terms/'],
  ['dct:', 'http://purl.org/dc/terms/'],
  ['odrl:', 'http://www.w3.org/ns/odrl/2/'],
  ['odrl:', 'https://www.w3.org/ns/odrl/2/'],
  ['dspace:', 'https://w3id.org/dspace/v0.8/'],
  ['dspace:', 'https://w3id.org/dspace/2025/1/'],
];

const JSON_LD_META_KEYS = new Set(['@context', '@id', '@type']);

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
   * Compacts JSON-LD for the asset form and rewrites known vocabulary IRIs
   * to short prefixes (`dcat:mediaType` instead of the full URL).
   */
  public async compactForForm(value: unknown): Promise<Record<string, JsonValue>> {
    const compacted = (await compact(value)) as Record<string, JsonValue>;
    return this.toPrefixedKeys(compacted);
  }

  /**
   * Rewrites full namespace IRIs to CURIE-style keys using
   * {@link DISPLAY_NAMESPACE_PREFIXES}.
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

  private withContext(assetInput: AssetInput): AssetInput & { '@context': typeof ASSET_JSON_LD_CONTEXT } {
    return {
      ...assetInput,
      '@context': ASSET_JSON_LD_CONTEXT,
    };
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
