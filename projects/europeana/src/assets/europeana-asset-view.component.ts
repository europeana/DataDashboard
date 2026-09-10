import {
  AssetViewComponent
} from '@eclipse-edc/dashboard-core/assets';
import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  FilterInputComponent,
  ItemCountSelectorComponent,
  PaginationComponent
} from '@eclipse-edc/dashboard-core';
import { Asset, IdResponse } from '@think-it-labs/edc-connector-client';
import { EuropeanaAssetCreateComponent } from './europeana-asset-create.component';
import { EuropeanaAssetCardComponent } from './europeana-asset-card.component';


@Component({
  selector: 'europeana-asset-view',
  standalone: true,
  imports: [
    AsyncPipe,
    FilterInputComponent,
    PaginationComponent,
    EuropeanaAssetCardComponent,
    ItemCountSelectorComponent,
  ],
  templateUrl: './europeana-asset-view.component.html',
  styleUrl: '../../../dashboard-core/assets/src/asset-view/asset-view.component.css',
})
export class EuropeanaAssetViewComponent extends AssetViewComponent{

  /**
   * 'createAsset' should  open  the 'EuropeanaAssetCreateComponent'
   */
  override createAsset() {
    const callbacks = {
      created: (id: IdResponse) => {
        this.modalAndAlertService.closeModal();
        this.modalAndAlertService.showAlert(`Asset with ID '${id.id}'`, 'created successfully', 'success', 5);
        this.fetchAssets();
      },
    };
    this.modalAndAlertService.openModal(EuropeanaAssetCreateComponent, undefined, callbacks);
  }

  /**
   * Edit asset should  open  the 'EuropeanaAssetCreateComponent'
   */
  override editAsset(asset: Asset) {
    const callbacks = {
      updated: () => {
        this.modalAndAlertService.closeModal();
        this.modalAndAlertService.showAlert(`Asset with ID '${asset.id}'`, 'updated successfully', 'success', 5);
        this.fetchAssets();
      },
    };
    this.modalAndAlertService.openModal(EuropeanaAssetCreateComponent, { asset: asset }, callbacks);
  }
}
