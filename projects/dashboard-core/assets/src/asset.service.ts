/*
 *  Copyright (c) 2025 Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 *
 *  This program and the accompanying materials are made available under the
 *  terms of the Apache License, Version 2.0 which is available at
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 *  SPDX-License-Identifier: Apache-2.0
 *
 *  Contributors:
 *       Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V. - initial API and implementation
 *
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JsonValue } from '@angular-devkit/core';
import { DashboardStateService, EdcClientService, EdcConfig } from '@eclipse-edc/dashboard-core';
import { Asset, AssetInput, compact, IdResponse } from '@think-it-labs/edc-connector-client';
import { firstValueFrom } from 'rxjs';

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
 * Mapping for
 * Known (Internationalized Resource Identifier )IRI prefixes → short CURIE(short Compact URI )
 *  prefixes for form display.
 * Includes common alternate spellings of DCAT (`#` vs `/`, http vs https).
 * See : https://www.w3.org/TR/vocab-dcat-1/
 *
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

/**
 * Service to manage and retrieve assets.
 *
 * List/delete use the EDC connector client. Create/update call the Management API
 * directly so a custom `@context` can be sent (the client always overwrites it).
 */
@Injectable({
  providedIn: 'root',
})
export class AssetService {
  private readonly edc = inject(EdcClientService);
  private readonly state = inject(DashboardStateService);
  private readonly http = inject(HttpClient);

  /**
   * Retrieves all assets from the management API.
   * @returns A promise that resolves to an array of assets.
   */
  public async getAllAssets(): Promise<Asset[]> {
    return (await this.edc.getClient()).management.assets.queryAll();
  }

  /**
   * Creates a new asset using the provided asset input.
   * @param assetInput - The input data required to create a new asset.
   * @returns A promise that resolves to the ID response of the created asset.
   */
  public async createAsset(assetInput: AssetInput): Promise<IdResponse> {
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

  /**
   * Updates an existing asset with the provided asset input.
   * @param assetInput - The input data required to update the asset.
   * @returns A promise that resolves when the asset is successfully updated.
   */
  public async updateAsset(assetInput: AssetInput): Promise<void> {
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
   * Deletes an asset based on the provided ID.
   * @param id - The unique identifier of the asset to be deleted.
   * @returns A promise that resolves when the asset is successfully deleted.
   */
  public async deleteAsset(id: string): Promise<void> {
    return (await this.edc.getClient()).management.assets.delete(id);
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
        .map(([key, val]) => [this.toPrefixedKey(key), val]),
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
