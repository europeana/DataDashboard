import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs';
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
  NegotiationProgressComponent,
} from '@eclipse-edc/dashboard-core/catalog';
import {
  IdResponse,
  Dataset
} from '@think-it-labs/edc-connector-client';
import { EuropeanaCatalogCardComponent } from './europeana-catalog-card.component';
import { EuropeanaContractNegotiationComponent } from './europeana-contract-negotiation.component';
import { ConsoleLogger } from '@angular/compiler-cli';

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

  private readonly excludedProperties = [
    '@id',
    '@type',
    'http://www.w3.org/ns/odrl/2/hasPolicy',
    'http://www.w3.org/ns/dcat#distribution',
  ];

  override negotiateContract(catalogDataset: CatalogDataset) {
    const callbacks = {
      negotiationRequested: (id: IdResponse) => {
        this.modal.openModal(NegotiationProgressComponent, { negotiationId: id }, undefined, true);
      },
    };
    this.modal.openModal(
      EuropeanaContractNegotiationComponent,
      { catalogDataset, showCatalogDetailsSection: false },
      callbacks,
    );
  }

  /**
   * Filters catalog datasets based on the provided search text.
   *
   * @param {string} searchText - The text to filter catalog datasets.
   *                              Performs a case-insensitive search on `assetId`, `participantId`,
   *                              and dataset properties.
   * @return {void} This method does not return a value but updates the
   *                `filteredCatalogDatasets$` observable with the filtered results.
   */
  override filter(searchText: string) {
    if (searchText) {
      const lower = searchText.toLowerCase();

      this.filteredCatalogDatasets$ = this.catalogDatasets$.pipe(
        map(catalogDatasets =>
          catalogDatasets.filter(
            catalogDataset =>
              catalogDataset.assetId.toLowerCase().includes(lower) ||
              catalogDataset.participantId.toLowerCase().includes(lower) ||
              this.matchesDatasetProperties(catalogDataset.dataset, lower),
          ),
        ),
      );
    } else {
      this.filteredCatalogDatasets$ = this.catalogDatasets$;
    }
  }

  /**
   * Checks whether the given dataset has any property keys or values
   * that match the provided search text.
   *
   * @param {Dataset} dataset - The dataset to be checked for matching properties.
   * @param {string} searchText - The text to search for within the dataset's properties.
   * @return {boolean} Returns true if the dataset contains any matching property keys or values,
   *                   excluding keys named '@id'; otherwise, false.
   */
  private matchesDatasetProperties(dataset: Dataset, searchText: string): boolean {
    return Object.entries(dataset).some(([key, value]) => {
      if (this.excludedProperties.includes(key)) {
        return false;
      }

      return key.toLowerCase().includes(searchText) || this.matchesValue(value, searchText);
    });
  }

  /**
   * Checks if the given value matches the provided search text.
   *
   * @param {unknown} value - The value to be checked. It can be of any type.
   * @param {string} searchText - The search text to look for in the value.
   * @return {boolean} Returns true if the search text is found in the value, otherwise false.
   */
  private matchesValue(value: unknown, searchText: string): boolean {
    if (value == null) {
      return false;
    }

    if (typeof value === 'string') {
      return value.toLowerCase().includes(searchText);
    }

    if (Array.isArray(value)) {
      return value.some(item => this.matchesValue(item, searchText));
    }

    if (typeof value === 'object') {
      return Object.values(value).some(item => this.matchesValue(item, searchText));
    }

    return String(value).toLowerCase().includes(searchText);
  }
}
