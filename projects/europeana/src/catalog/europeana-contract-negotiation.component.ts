import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertComponent, JsonObjectTableComponent } from '@eclipse-edc/dashboard-core';
import { ContractNegotiationComponent } from '@eclipse-edc/dashboard-core/catalog';
import { JsonValue } from '@angular-devkit/core';
import { Policy } from '@think-it-labs/edc-connector-client/dist/src/entities/policy';
import { optionalLocalValue, withLocalKeys } from '../jsonld/optional-local-value';

@Component({
  selector: 'europeana-catalog-negotiation',
  standalone: true,
  imports: [FormsModule, AlertComponent, JsonObjectTableComponent, NgClass],
  templateUrl: './europeana-contract-negotiation.component.html',
})
export class EuropeanaContractNegotiationComponent extends ContractNegotiationComponent {
  /** Europeana: offer selection is only enabled when the dataset has distributions. */
  get hasDistributions(): boolean {
    return this.distributions.length > 0;
  }

  /** Description shown in Selected Offer (instead of policy JSON). */
  selectedOfferDescription = '';

  /** Label for an offer: name → title → `Offer N`. */
  offerLabel(offerKey: string): string {
    const policy = this.catalogDataset?.offers.get(offerKey);
    if (!policy) {
      return `Offer ${offerKey}`;
    }
    const name = this.readPolicyString(policy, 'name')?.trim();
    if (name) {
      return name;
    }
    const title = this.readPolicyString(policy, 'title')?.trim();
    if (title) {
      return title;
    }
    return `Offer ${offerKey}`;
  }

  /** Show hasPolicy description in Selected Offer. */
  override async showOfferDetails(selectedOfferId: string) {
    const policy = this.catalogDataset.offers.get(selectedOfferId);
    this.selectedOfferDescription = policy
      ? this.readPolicyString(policy, 'description') ?? ''
      : '';
  }

  protected override async loadDataset() {
    await super.loadDataset();
    // Display keys as local names (e.g. dct:description / full IRI → description)
    this.dataset = withLocalKeys(this.dataset) as Record<string, JsonValue>;
    this.distributions = this.distributions.map(
      d => withLocalKeys(d) as Record<string, JsonValue>,
    );
    if (!this.hasDistributions) {
      this.offerId = '';
      this.selectedOfferDescription = '';
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

  /** Reads name/title/description on hasPolicy. Offers are plain objects (no optionalValue). */
  private readPolicyString(policy: Policy, key: string): string | undefined {
    return optionalLocalValue(policy as unknown as Record<string, unknown>, key) || undefined;
  }
}
