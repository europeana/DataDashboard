import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  FilterInputComponent,
  ItemCountSelectorComponent,
  PaginationComponent,
} from '@eclipse-edc/dashboard-core';
import {
  CatalogRequestComponent,
  CatalogViewComponent,
} from '@eclipse-edc/dashboard-core/catalog';
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
export class EuropeanaCatalogViewComponent extends CatalogViewComponent {}
