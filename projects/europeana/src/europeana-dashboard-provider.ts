import { Provider } from '@angular/core';
import { EuropeanaAssetService } from './assets/europeana-asset.service';
import { AssetService } from '@eclipse-edc/dashboard-core/assets';

export function provideEuropeanaDashboard(): Provider[] {
  return [EuropeanaAssetService,{ provide: AssetService, useExisting:EuropeanaAssetService }]
}
