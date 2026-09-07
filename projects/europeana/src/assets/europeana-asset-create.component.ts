import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  AlertComponent, DataAddressFormComponent,
  DataTypeInputComponent, JsonObjectInputComponent,
  JsonObjectTableComponent
} from '@eclipse-edc/dashboard-core';
import { NgClass } from '@angular/common';
import {
  AssetCreateComponent
} from '@eclipse-edc/dashboard-core/assets';
import { BaseDataAddress, compact } from '@think-it-labs/edc-connector-client';
import { EuropeanaAssetService } from './europeana-asset.service';

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
  ],
  templateUrl: '../../../dashboard-core/assets/src/asset-create/asset-create.component.html',
  styleUrl: '../../../dashboard-core/assets/src/asset-create/asset-create.component.css',
})
export class EuropeanaAssetCreateComponent extends AssetCreateComponent{

  private readonly europeanaAssetService = inject(EuropeanaAssetService);
  override get formTitle(): string {
    if (!this.asset) {
      return 'Asset';
    }
    const name = this.getAssetName();
    return name || this.asset.id;
  }

  /**
   * Get the display name of the asset currently being edited.
   *
   * Looks up `edc:name` on the original JSON-LD properties first, then the compacted
   * `name` field after `compact()` has run. Empty or whitespace-only values are ignored.
   *
   * EDC APIs return properties with full namespace URLs.
   * Compaction shortens those URLs into normal keys so the
   * form can use properties['name'] instead of a long URI.
   *
   * @returns The trimmed name, or `undefined` when no usable name is present
   *  so callers can fall back to the asset ID.
   */
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
    this.privateProperties = await this.europeanaAssetService.compactForForm(this.asset!.privateProperties);
    this.dataAddress = (await compact(this.asset!.dataAddress)) as unknown as BaseDataAddress;
    this.assetForm.get('id')?.setValue(this.asset!.id);
    this.assetForm.get('name')?.setValue(this.properties['name']);
    this.assetForm.get('contenttype')?.setValue(this.properties['contenttype']);
  }
}
