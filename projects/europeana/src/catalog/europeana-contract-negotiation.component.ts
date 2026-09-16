import { Component } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertComponent, JsonObjectTableComponent } from '@eclipse-edc/dashboard-core';
import { ContractNegotiationComponent } from '@eclipse-edc/dashboard-core/catalog';

@Component({
  selector: 'europeana-catalog-negotiation',
  standalone: true,
  imports: [FormsModule, AlertComponent, JsonObjectTableComponent, NgClass, AsyncPipe],
  templateUrl: './europeana-contract-negotiation.component.html',
})
export class EuropeanaContractNegotiationComponent extends ContractNegotiationComponent {
  /** Europeana: offer selection is only enabled when the dataset has distributions. */
  get hasDistributions(): boolean {
    return this.distributions.length > 0;
  }

  protected override async loadDataset() {
    await super.loadDataset();
    if (!this.hasDistributions) {
      this.offerId = '';
      this.selectedOffer.next(['']);
    }
  }

  override startNegotiation() {
    if (!this.hasDistributions) {
      this.errorMsg = 'No distribution available for this dataset.';
      return;
    }
    super.startNegotiation();
  }
}
