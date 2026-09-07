import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  AlertComponent,
  DataAddressFormComponent,
  DataTypeInputComponent,
  JsonObjectInputComponent,
  JsonObjectTableComponent,
} from '@eclipse-edc/dashboard-core';
import { NgClass } from '@angular/common';
import { AssetCreateComponent } from '@eclipse-edc/dashboard-core/assets';
import {
  AssetInput,
  compact,
  DataAddress,
} from '@think-it-labs/edc-connector-client';
import { JsonValue } from '@angular-devkit/core';
import { EuropeanaAssetService } from './europeana-asset.service';
import { DCAT_FORM_FIELDS, dcatOwnedKeys, EuropeanaDcatResourcePropertiesComponent } from '../dcat';

type DataAddressWithProperties = DataAddress & {
  properties?: Record<string, JsonValue>;
};

@Component({
  selector: 'europeana-asset-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AlertComponent,
    JsonObjectTableComponent,
    NgClass,
    DataTypeInputComponent,
    JsonObjectInputComponent,
    DataAddressFormComponent,
    EuropeanaDcatResourcePropertiesComponent,
  ],
  templateUrl: './europeana-asset-create.component.html',
  styleUrl: '../../../dashboard-core/assets/src/asset-create/asset-create.component.css',
})
export class EuropeanaAssetCreateComponent extends AssetCreateComponent {
  private readonly europeanaAssetService = inject(EuropeanaAssetService);

  /** Fields for the Resource Common Fields–style form. */
  readonly resourceFormFields = DCAT_FORM_FIELDS;

  /** dataAddress.properties — same free-form UX as Properties. */
  dataAddressProperties: Record<string, JsonValue> = {};

  get propertiesExcludeKeys(): string[] {
    return ['@context', 'id', 'name', 'contenttype', ...dcatOwnedKeys(DCAT_FORM_FIELDS)];
  }

  override get formTitle(): string {
    if (!this.asset) {
      return 'Asset';
    }
    const name = this.getAssetName();
    return name || this.asset.id;
  }

  private getAssetName(): string | undefined {
    const fromProperties = this.asset?.properties?.optionalValue<string>('edc', 'name');
    if (typeof fromProperties === 'string' && fromProperties.trim()) {
      return fromProperties.trim();
    }
    const fromCompact = this.properties['name'];
    if (typeof fromCompact === 'string' && fromCompact.trim()) {
      return fromCompact.trim();
    }
    return undefined;
  }

  protected override async updateAssetAndSyncForm() {
    this.properties = await this.europeanaAssetService.compactForForm(this.asset!.properties);
    this.privateProperties = await this.europeanaAssetService.compactForForm(
      this.asset!.privateProperties,
    );
    const compactedAddress = (await compact(this.asset!.dataAddress)) as unknown as DataAddressWithProperties;

    // Load distributions before wiring dataAddress (type form may re-emit and clear them).
    this.dataAddressProperties = await this.loadDataAddressProperties(compactedAddress);
    this.dataAddress = this.withDataAddressProperties(compactedAddress, this.dataAddressProperties);

    this.assetForm.get('id')?.setValue(this.asset!.id);
    this.assetForm.get('name')?.setValue(this.properties['name']);
    this.assetForm.get('contenttype')?.setValue(this.properties['contenttype']);
  }

  onDataAddressChange(address: DataAddress): void {
    this.dataAddress = this.withDataAddressProperties(address, this.dataAddressProperties);
  }

  onDataAddressPropertiesChange(properties: Record<string, JsonValue>): void {
    this.dataAddressProperties = properties ?? {};
    if (this.dataAddress) {
      this.dataAddress = this.withDataAddressProperties(this.dataAddress, this.dataAddressProperties);
    }
  }

  protected override createAssetInput(): AssetInput {
    const asset = super.createAssetInput();
    asset.dataAddress = this.withDataAddressProperties(asset.dataAddress, this.dataAddressProperties);
    return asset;
  }

  private withDataAddressProperties(
    address: DataAddress,
    properties: Record<string, JsonValue>,
  ): DataAddressWithProperties {
    const next: DataAddressWithProperties = { ...address, properties };
    if (!properties || Object.keys(properties).length === 0) {
      delete next.properties;
    }
    return next;
  }

  /**
   * Collect dataAddress.properties for the Distributions box.
   * EDC may return them nested under `edc:properties`, nested after compact,
   * or flattened onto the address (e.g. `…/ns/distribution.1.title`).
   */
  private async loadDataAddressProperties(
    compactedAddress: DataAddressWithProperties,
  ): Promise<Record<string, JsonValue>> {
    const collected: Record<string, JsonValue> = {};

    // 1) Expanded asset: edc:properties
    const rawAddress = this.asset?.dataAddress;
    if (rawAddress) {
      try {
        const nested = rawAddress.nested('edc', 'properties');
        Object.assign(collected, await this.europeanaAssetService.compactForForm(nested));
      } catch {
        // no nested properties
      }
    }

    // 2) Compacted nested properties
    const nested = compactedAddress.properties;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      Object.assign(collected, await this.europeanaAssetService.compactForForm(nested as never));
    }

    // 3) Flat keys on the compacted address (distribution.* / format)
    for (const [key, value] of Object.entries(compactedAddress as Record<string, JsonValue>)) {
      const local = this.toLocalAddressKey(key);
      if (this.isStoredAddressPropertyKey(local) && value !== undefined && value !== null) {
        collected[local] = value;
      }
    }

    return Object.fromEntries(
      Object.entries(collected).map(([key, value]) => [this.toLocalAddressKey(key), value]),
    );
  }

  private toLocalAddressKey(key: string): string {
    const edcVocab = 'https://w3id.org/edc/v0.0.1/ns/';
    if (key.startsWith(edcVocab)) {
      return key.slice(edcVocab.length);
    }
    if (key.startsWith('edc:')) {
      return key.slice(4);
    }
    return key;
  }

  /** Keys that belong in the Distributions free-form box (not type / JSON-LD meta). */
  private isStoredAddressPropertyKey(key: string): boolean {
    const lower = key.toLowerCase();
    if (['@context', '@id', '@type', 'type', 'properties'].includes(lower)) {
      return false;
    }
    return lower.startsWith('distribution.') || lower === 'format';
  }
}
