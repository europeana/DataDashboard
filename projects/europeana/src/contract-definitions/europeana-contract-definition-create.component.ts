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
  /** Show Name and Description under Common Fields. */
  override get showAdditionalCommonFields(): boolean {
    return true;
  }

  override get formTitle(): string {
    if (!this.contractDefinitionInput) {
      return 'Contract Definition';
    }
    return this.getContractName() || this.contractDefinitionInput.id;
  }

  /**
   * Resolves the display name of the contract definition currently being edited.
   *
   * Uses `edc:name` on the definition, then the Common Fields Name control.
   * Empty or whitespace-only values are ignored.
   */
  private getContractName(): string | undefined {
    const fromDefinition = this.contractDefinitionInput?.optionalValue<string>('edc', 'name');
    if (typeof fromDefinition === 'string' && fromDefinition.trim()) {
      return fromDefinition.trim();
    }

    const fromForm = this.contractDefinitionForm?.get('name')?.value;
    if (typeof fromForm === 'string' && fromForm.trim()) {
      return fromForm.trim();
    }
    return undefined;
  }

  /**
   * Prefills Name / Description from the definition (`edc:name` / `edc:description`).
   */
  protected override syncNameDescriptionFromDefinition() {
    this.contractDefinitionForm.patchValue({
      name: this.readDefinitionString('name') ?? '',
      description: this.readDefinitionString('description') ?? '',
    });
  }

  private readDefinitionString(key: string): string | undefined {
    const value = this.contractDefinitionInput?.optionalValue<string>('edc', key);
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  /**
   * Label for a policy in the access/contract policy dropdowns.
   * Same lookup as the Europeana policy form: `edc:name` on the definition;
   * otherwise the policy ID.
   */
  policyLabel(policy: PolicyDefinition): string {
    const fromDefinition = policy.optionalValue<string>('edc', 'name');
    if (typeof fromDefinition === 'string' && fromDefinition.trim()) {
      return fromDefinition.trim();
    }

    return policy.id;
  }
}
