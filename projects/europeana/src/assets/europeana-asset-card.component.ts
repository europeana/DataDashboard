import { Component } from '@angular/core';
import { AssetCardComponent } from '@eclipse-edc/dashboard-core/assets';
import { optionalLocalValue } from '../jsonld/optional-local-value';

@Component({
  selector: 'europeana-asset-card',
  standalone: true,
  imports: [],
  templateUrl: '../../../dashboard-core/assets/src/asset-card/asset-card.component.html',
  styleUrl: '../../../dashboard-core/assets/src/asset-card/asset-card.component.css',
})
export class EuropeanaAssetCardComponent extends AssetCardComponent {
  /** Card title: name → title → asset id. */
  override get cardTitle(): string {
    return this.read('name') ?? this.read('title') ?? this.asset?.id ?? '';
  }

  private read(key: string): string | undefined {
    const fromEdc = this.asset?.properties?.optionalValue<string>('edc', key);
    if (typeof fromEdc === 'string' && fromEdc.trim()) {
      return fromEdc.trim();
    }
    return optionalLocalValue(this.asset?.properties as Record<string, unknown> | undefined, key);
  }
}
