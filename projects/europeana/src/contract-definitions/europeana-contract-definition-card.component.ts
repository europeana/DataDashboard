import { Component } from '@angular/core';
import { ContractDefinitionCardComponent } from '@eclipse-edc/dashboard-core/contract-definitions';

@Component({
  selector: 'europeana-contract-definition-card',
  standalone: true,
  imports: [],
  templateUrl:
    '../../../dashboard-core/contract-definitions/src/contract-definition-card/contract-definition-card.component.html',
  styleUrl:
    '../../../dashboard-core/contract-definitions/src/contract-definition-card/contract-definition-card.component.css',
})
export class EuropeanaContractDefinitionCardComponent extends ContractDefinitionCardComponent {
  /**
   * Card title: `edc:name` on the definition when present;
   * otherwise the contract definition ID (core default).
   */
  override get cardTitle(): string {
    const fromDefinition = this.contractDefinition?.optionalValue<string>('edc', 'name');
    if (typeof fromDefinition === 'string' && fromDefinition.trim()) {
      return fromDefinition.trim();
    }

    return this.contractDefinition.id;
  }

  /** Card description: `edc:description` on the definition when present. */
  override get cardDescription(): string | undefined {
    const fromDefinition = this.contractDefinition?.optionalValue<string>('edc', 'description');
    return typeof fromDefinition === 'string' && fromDefinition.trim()
      ? fromDefinition.trim()
      : undefined;
  }
}
