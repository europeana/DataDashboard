import { Component } from '@angular/core';
import { AssetCardComponent } from '@eclipse-edc/dashboard-core/assets';

@Component({
  selector: 'europeana-asset-card',
  standalone: true,
  imports: [],
  templateUrl: '../../../dashboard-core/assets/src/asset-card/asset-card.component.html',
  styleUrl: '../../../dashboard-core/assets/src/asset-card/asset-card.component.css',
})
export class EuropeanaAssetCardComponent extends AssetCardComponent {
  /**
   * Card title: `edc:name` when present, otherwise the asset ID.
   */
  override get cardTitle(): string {
    const name = this.asset?.properties?.optionalValue<string>('edc', 'name');
    if (typeof name === 'string' && name.trim()) {
      return name.trim();
    }
    return this.asset?.id ?? '';
  }
}
