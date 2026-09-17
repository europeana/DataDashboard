import { Component } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertComponent, JsonObjectTableComponent } from '@eclipse-edc/dashboard-core';
import { ContractNegotiationComponent } from '@eclipse-edc/dashboard-core/catalog';
import { Policy } from '@think-it-labs/edc-connector-client/dist/src/entities/policy';
import { optionalLocalValue } from '../jsonld/optional-local-value';

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

  /** Label for an offer: properties.name → properties.title → `Offer N`. */
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

  /** Reads hasPolicy → properties → name/title (also top-level edc: if present). */
  private readPolicyString(policy: Policy, key: string): string | undefined {
    const fromTop = policy.optionalValue<string>('edc', key);
    if (typeof fromTop === 'string' && fromTop.trim()) {
      return fromTop.trim();
    }

    const nested = policy.nested('edc', 'properties');
    const fromProps = nested?.optionalValue<string>('edc', key);
    if (typeof fromProps === 'string' && fromProps.trim()) {
      return fromProps.trim();
    }

    const local =
      optionalLocalValue(nested as unknown as Record<string, unknown>, key) ??
      optionalLocalValue(policy as unknown as Record<string, unknown>, key);
    const trimmed = local?.trim();
    return trimmed || undefined;
  }
}
