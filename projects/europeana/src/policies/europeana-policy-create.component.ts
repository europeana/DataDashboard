import {
  PolicyCreateComponent
} from '@eclipse-edc/dashboard-core/policies';
import { JsonValue } from '@angular-devkit/core';
import { compact } from '@think-it-labs/edc-connector-client';
import { EuropeanaPolicyDefinitionInput } from './europeana-policy-definition-input';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertComponent, JsonObjectInputComponent } from '@eclipse-edc/dashboard-core';
import { NgClass } from '@angular/common';


@Component({
  selector: 'europeana-policy-create',
  standalone: true,
  imports: [ReactiveFormsModule, AlertComponent, NgClass, JsonObjectInputComponent],
  templateUrl: '../../../dashboard-core/policies/src/policy-create/policy-create.component.html',
  styleUrl: '../../../dashboard-core/policies/src/policy-create/policy-create.component.css',
})
export class EuropeanaPolicyCreateComponent extends PolicyCreateComponent{

  override  get formTitle(): string {
    if (!this.policyDefinition) {
      return 'Policy';
    }
    return this.getPolicyName() || this.policyDefinition.id;
  }

  /** Europeana label for the permissions / prohibitions / obligations block. */
  override get propertiesSectionTitle(): string {
    return 'Conditions';
  }

  /**
   * Resolves the display name of the policy currently being edited.
   *
   * Checks `edc:name` on the policy definition first, then a `Name`/`name` entry
   * in compacted private properties. Empty or whitespace-only values are ignored.
   *
   * @returns The trimmed name, or `undefined` so callers can fall back to the policy ID.
   */
  private getPolicyName(): string | undefined {
    const fromDefinition = this.policyDefinition?.optionalValue<string>('edc', 'name');
    if (typeof fromDefinition === 'string' && fromDefinition.trim()) {
      return fromDefinition.trim();
    }

    const fromPrivate = Object.entries(this.privateProperties ?? {}).find(
      ([key, value]) => key.toLowerCase() === 'name' && typeof value === 'string' && value.trim(),
    );
    if (fromPrivate && typeof fromPrivate[1] === 'string') {
      return fromPrivate[1].trim();
    }
    return undefined;
  }

  /**
   * Override the ngOnChanges method to load private properties.
   *
   */
  override async ngOnChanges(){
    await super.ngOnChanges();
    //Only when editing  , If change is due to 'create', it has no definition yet in 'policyDefinition'.
    if (this.policyDefinition){
      this.privateProperties = await this.loadPrivateProperties();
    }
  }

  /**
   * Override the 'createPolicyInput' to populate the 'privateProperties' element.
   * @protected
   */
    protected override createPolicyInput(): EuropeanaPolicyDefinitionInput {
      const input : EuropeanaPolicyDefinitionInput = super.createPolicyInput();
      input.privateProperties = this.toPrivatePropertiesPayload();
      return input;
    }

  /**
   * Loads private properties from the policy definition returned by the management API.
   *
   * `PolicyDefinition` has no `privateProperties` getter (unlike `Asset`), so the map lives
   * on the expanded JSON-LD object under the EDC namespace. `nested('edc', 'privateProperties')`
   * reads that field; `compact()` then shortens keys such as
   * `https://w3id.org/edc/v0.0.1/ns/abc` to `abc` for the form table.
   */
  private async loadPrivateProperties(): Promise<Record<string, JsonValue>> {
    const props = this.policyDefinition!.nested('edc', 'privateProperties');
    return (await compact(props)) as Record<string, JsonValue>;
  }

  /**
   * Builds the private-properties payload sent to the backend.
   * JSON-LD metadata added by `compact()`.
   * (`@context`, `@id`, `@type`) is omitted.
   */
  private toPrivatePropertiesPayload(): Record<string, JsonValue> {
    const jsonLdKeys = new Set(['@context', '@id', '@type']);
    return Object.fromEntries(Object.entries(this.privateProperties ?? {})
    .filter(([key]) => !jsonLdKeys.has(key)));
  }

}
