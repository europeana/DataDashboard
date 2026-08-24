import { Component } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PolicyDefinition } from '@think-it-labs/edc-connector-client';
import { AlertComponent, MultiselectWithSearchComponent } from '@eclipse-edc/dashboard-core';
import { ContractDefinitionCreateComponent } from '@eclipse-edc/dashboard-core/contract-definitions';

@Component({
  selector: 'europeana-contract-definition-create',
  standalone: true,
  imports: [FormsModule, MultiselectWithSearchComponent, AlertComponent, ReactiveFormsModule, AsyncPipe, NgClass],
  templateUrl: './europeana-contract-definition-create.component.html',
  styleUrl: '../../../dashboard-core/contract-definitions/src/contract-definition-create/contract-definition-create.component.css',
})
export class EuropeanaContractDefinitionCreateComponent extends ContractDefinitionCreateComponent {
  /**
   * Label for a policy in the access/contract policy dropdowns.
   * Uses `edc:name` when present; otherwise falls back to the policy ID.
   */
  policyLabel(policy: PolicyDefinition): string {
    const name = policy.optionalValue<string>('edc', 'name');
    if (typeof name === 'string' && name.trim()) {
      return name.trim();
    }
    return policy.id;
  }
}
