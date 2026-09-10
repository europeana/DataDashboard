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
   * Card title: name from the definition (top-level or properties), else policy ID.
   */
  override get cardTitle(): string {
    return this.readString('name')
      ?? this.policyDefinition?.['@id']
      ?? this.policyDefinition?.id
      ?? '';
  }

  /**
   * Card description from the definition (top-level or properties).
   * Truncated to 2 lines in the shared card template via `line-clamp-2`.
   */
  override get cardDescription(): string | undefined {
    return this.readString('description');
  }

  /**
   * Reads a string field the same way the policy form does:
   * 1) top-level `edc:<key>`
   * 2) nested `edc:properties` → `edc:<key>`
   */
  private readString(key: string): string | undefined {
    const fromDefinition = this.policyDefinition?.optionalValue<string>('edc', key);
    if (typeof fromDefinition === 'string' && fromDefinition.trim()) {
      return fromDefinition.trim();
    }

    const fromProperties = this.policyDefinition
      ?.nested('edc', 'properties')
      ?.optionalValue<string>('edc', key);
    if (typeof fromProperties === 'string' && fromProperties.trim()) {
      return fromProperties.trim();
    }

    return undefined;
  }
}
