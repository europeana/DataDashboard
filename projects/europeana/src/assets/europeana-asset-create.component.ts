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
/* NEW: DCAT Resource field group + keys to exclude from free-form Properties */
import {
  dcatPropertyKeys,
  EuropeanaDcatResourcePropertiesComponent,
} from '../dcat';

/* NEW: DataAddress may carry a nested properties map for DCAT metadata */
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
    /* NEW: pluggable DCAT Resource properties UI */
    EuropeanaDcatResourcePropertiesComponent,
  ],
  /* EDITED: uses Europeana template (DCAT sections) instead of core HTML */
  templateUrl: './europeana-asset-create.component.html',
  styleUrl: '../../../dashboard-core/assets/src/asset-create/asset-create.component.css',
})
export class EuropeanaAssetCreateComponent extends AssetCreateComponent {
  /* NEW: Europeana asset API (JSON-LD context + compactForForm) */
  private readonly europeanaAssetService = inject(EuropeanaAssetService);

  /* NEW: DCAT / custom properties for the current data address */
  dataAddressProperties: Record<string, JsonValue> = {};

  /* NEW: free-form Properties excludeKeys — common fields + DCAT keys */
  get propertiesExcludeKeys(): string[] {
    return ['@context', 'id', 'name', 'contenttype', ...dcatPropertyKeys()];
  }

  /* EDITED: show asset name in the form title when editing (core always shows "Asset") */
  override get formTitle(): string {
    if (!this.asset) {
      return 'Asset';
    }
    const name = this.getAssetName();
    return name || this.asset.id;
  }

  /* NEW: resolve display name from edc:name / compacted properties.name */
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

  /* EDITED: compact via EuropeanaAssetService + load dataAddress.properties into DCAT form */
  protected override async updateAssetAndSyncForm() {
    this.properties = await this.europeanaAssetService.compactForForm(this.asset!.properties);
    this.privateProperties = await this.europeanaAssetService.compactForForm(
      this.asset!.privateProperties,
    );
    const compactedAddress = (await compact(this.asset!.dataAddress)) as unknown as DataAddressWithProperties;
    this.dataAddress = compactedAddress;
    /* NEW: prefill Data Address DCAT section */
    this.dataAddressProperties = await this.extractDataAddressProperties(compactedAddress);
    this.assetForm.get('id')?.setValue(this.asset!.id);
    this.assetForm.get('name')?.setValue(this.properties['name']);
    this.assetForm.get('contenttype')?.setValue(this.properties['contenttype']);
  }

  /* NEW: keep dataAddress.properties when the type form re-emits the address */
  onDataAddressChange(address: DataAddress): void {
    this.dataAddress = this.withDataAddressProperties(address, this.dataAddressProperties);
  }

  /* NEW: Data Address DCAT section changed — merge into dataAddress.properties */
  onDataAddressPropertiesChange(properties: Record<string, JsonValue>): void {
    this.dataAddressProperties = properties;
    if (this.dataAddress) {
      this.dataAddress = this.withDataAddressProperties(this.dataAddress, properties);
    }
  }

  /* EDITED: attach nested dataAddress.properties before create/update */
  protected override createAssetInput(): AssetInput {
    const asset = super.createAssetInput();
    asset.dataAddress = this.withDataAddressProperties(
      asset.dataAddress,
      this.dataAddressProperties,
    );
    return asset;
  }

  /* NEW: merge (or omit empty) properties onto a DataAddress payload */
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

  /* NEW: read nested dataAddress.properties from the API for the DCAT form */
  private async extractDataAddressProperties(
    address: DataAddressWithProperties,
  ): Promise<Record<string, JsonValue>> {
    const raw = address.properties;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {};
    }
    return this.europeanaAssetService.compactForForm(raw as never);
  }
}
