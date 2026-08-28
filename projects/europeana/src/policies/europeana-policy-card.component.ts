import { Component } from '@angular/core';
import { PolicyCardComponent } from '@eclipse-edc/dashboard-core/policies';

@Component({
  selector: 'europeana-policy-card',
  standalone: true,
  imports: [],
  templateUrl: '../../../dashboard-core/policies/src/policy-card/policy-card.component.html',
  styleUrl: '../../../dashboard-core/policies/src/policy-card/policy-card.component.css',
})
export class EuropeanaPolicyCardComponent extends PolicyCardComponent {
  /**
   * Card title: `edc:name` on the definition when present;
   * otherwise the policy ID (core default).
   */
  override get cardTitle(): string {
    const fromDefinition = this.policyDefinition?.optionalValue<string>('edc', 'name');
    if (typeof fromDefinition === 'string' && fromDefinition.trim()) {
      return fromDefinition.trim();
    }

    return this.policyDefinition?.['@id'] ?? this.policyDefinition?.id ?? '';
  }
}
