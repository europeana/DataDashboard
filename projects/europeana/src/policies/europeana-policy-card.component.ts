import { Component } from '@angular/core';
import { PolicyCardComponent } from '@eclipse-edc/dashboard-core/policies';
import { optionalLocalValue } from '../jsonld/optional-local-value';

@Component({
  selector: 'europeana-policy-card',
  standalone: true,
  imports: [],
  templateUrl: '../../../dashboard-core/policies/src/policy-card/policy-card.component.html',
  styleUrl: '../../../dashboard-core/policies/src/policy-card/policy-card.component.css',
})
export class EuropeanaPolicyCardComponent extends PolicyCardComponent {
  /** Card title: name → title → policy id (same order as asset card). */
  override get cardTitle(): string {
    return (
      this.readString('name') ??
      this.readString('title') ??
      this.policyDefinition?.['@id'] ??
      this.policyDefinition?.id ??
      ''
    );
  }

  /**
   * Card description from the definition (top-level or properties).
   * Truncated to 2 lines in the shared card template via `line-clamp-2`.
   */
  override get cardDescription(): string | undefined {
    return this.readString('description');
  }

  /**
   * Reads a string from the policy definition:
   * 1) top-level `edc:<key>` / local name
   * 2) nested `edc:properties` → `edc:<key>` / local name (e.g. title, dct:description)
   */
  private readString(key: string): string | undefined {
    const definition = this.policyDefinition as Record<string, unknown> | undefined;
    if (!definition) {
      return undefined;
    }

    const fromDefinition = this.policyDefinition?.optionalValue<string>('edc', key);
    if (typeof fromDefinition === 'string' && fromDefinition.trim()) {
      return fromDefinition.trim();
    }
    const fromDefinitionLocal = optionalLocalValue(definition, key);
    if (fromDefinitionLocal) {
      return fromDefinitionLocal;
    }

    const nested = this.policyDefinition?.nested('edc', 'properties');
    const fromProperties = nested?.optionalValue<string>('edc', key);
    if (typeof fromProperties === 'string' && fromProperties.trim()) {
      return fromProperties.trim();
    }
    return optionalLocalValue(nested as unknown as Record<string, unknown> | undefined, key);
  }
}
