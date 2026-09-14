import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  FilterInputComponent,
  ItemCountSelectorComponent,
  ModalAndAlertService,
  PaginationComponent,
} from '@eclipse-edc/dashboard-core';
import {
  CatalogDataset,
  CatalogRequestComponent,
  CatalogViewComponent,
  ContractNegotiationComponent,
  NegotiationProgressComponent,
} from '@eclipse-edc/dashboard-core/catalog';
import { IdResponse } from '@think-it-labs/edc-connector-client';
import { EuropeanaCatalogCardComponent } from './europeana-catalog-card.component';

@Component({
  selector: 'europeana-catalog-view',
  standalone: true,
  imports: [
    AsyncPipe,
    FilterInputComponent,
    PaginationComponent,
    EuropeanaCatalogCardComponent,
    CatalogRequestComponent,
    ItemCountSelectorComponent,
  ],
  templateUrl: './europeana-catalog-view.component.html',
  styleUrl: '../../../dashboard-core/catalog/src/catalog-view/catalog-view.component.css',
})
export class EuropeanaCatalogViewComponent extends CatalogViewComponent {
  private readonly modal = inject(ModalAndAlertService);

  override negotiateContract(catalogDataset: CatalogDataset) {
    const callbacks = {
      negotiationRequested: (id: IdResponse) => {
        this.modal.openModal(NegotiationProgressComponent, { negotiationId: id }, undefined, true);
      },
    };
    this.modal.openModal(
      ContractNegotiationComponent,
      { catalogDataset, showCatalogDetailsSection: false },
      callbacks,
    );
  }
}
