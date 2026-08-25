import { Component } from '@angular/core';
import { CatalogCardComponent } from '@eclipse-edc/dashboard-core/catalog';

@Component({
  selector: 'europeana-catalog-card',
  standalone: true,
  imports: [],
  templateUrl: '../../../dashboard-core/catalog/src/catalog-card/catalog-card.component.html',
  styleUrl: '../../../dashboard-core/catalog/src/catalog-card/catalog-card.component.css',
})
export class EuropeanaCatalogCardComponent extends CatalogCardComponent {
  /**
   * Card title: `edc:name` on the dataset when present, otherwise the asset ID.
   */
  protected override resolveCardTitle(): string {
    const fromDataset = this.catalogDataset?.dataset?.optionalValue<string>('edc', 'name');
    if (typeof fromDataset === 'string' && fromDataset.trim()) {
      return fromDataset.trim();
    }
    return this.catalogDataset?.assetId ?? '';
  }
}
