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

  /** Show Name and Description under Common Fields. */
  override get showAdditionalCommonFields(): boolean {
    return true;
  }

  /** Show editable public Properties (same pattern as assets). */
  override get showPublicPropertiesSection(): boolean {
    return true;
  }

  override get publicPropertiesExcludeKeys(): string[] {
    return ['@context', '@id', '@type', 'name', 'Name', 'description', 'Description'];
  }

  /**
   * Resolves the display name of the policy currently being edited.
   *
   * Uses `edc:name` on the policy definition, then the Common Fields Name control.
   * Empty or whitespace-only values are ignored.
   *
   * @returns The trimmed name, or `undefined` so callers can fall back to the policy ID.
   */
  private getPolicyName(): string | undefined {
    const fromDefinition = this.policyDefinition?.optionalValue<string>('edc', 'name');
    if (typeof fromDefinition === 'string' && fromDefinition.trim()) {
      return fromDefinition.trim();
    }

    const fromForm = this.policyForm?.get('name')?.value;
    if (typeof fromForm === 'string' && fromForm.trim()) {
      return fromForm.trim();
    }
    return undefined;
  }

  /**
   * Override the ngOnChanges method to load private properties and sync Name / Description.
   */
  override async ngOnChanges(){
    await super.ngOnChanges();
    // Only when editing — create has no definition yet in 'policyDefinition'.
    if (this.policyDefinition){
      this.properties = await this.loadPublicProperties();
      this.privateProperties = await this.loadPrivateProperties();
      this.syncNameDescriptionFromDefinition();
    }
  }

  /**
   * Override createPolicyInput to attach public / private property maps.
   * Name / Description are merged into `properties` (asset pattern) and sent as top-level fields by core.
   * @protected
   */
  protected override createPolicyInput(): EuropeanaPolicyDefinitionInput {
    const properties = this.toPublicPropertiesPayload();
    const { name, description } = this.policyForm.value;
    if (typeof name === 'string' && name.trim()) {
      properties['name'] = name.trim();
    }
    if (typeof description === 'string' && description.trim()) {
      properties['description'] = description.trim();
    }

    const input: EuropeanaPolicyDefinitionInput = {
      ...super.createPolicyInput(),
      properties,
      privateProperties: this.toPrivatePropertiesPayload(),
    };
    return input;
  }

  /**
   * Prefills Name / Description from the definition (`edc:name` / `edc:description`).
   */
  private syncNameDescriptionFromDefinition() {
    this.policyForm.patchValue({
      name: this.readDefinitionString('name') ?? this.readPropertyString('name') ?? '',
      description: this.readDefinitionString('description') ?? this.readPropertyString('description') ?? '',
    });
  }

  private readPropertyString(key: string): string | undefined {
    const value = this.properties?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private readDefinitionString(key: string): string | undefined {
    const value = this.policyDefinition?.optionalValue<string>('edc', key);
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  /**
   * Loads public properties from the policy definition returned by the management API.
   */
  private async loadPublicProperties(): Promise<Record<string, JsonValue>> {
    const props = this.policyDefinition!.nested('edc', 'properties');
    return (await compact(props)) as Record<string, JsonValue>;
  }

  /**
   * Builds the public-properties payload sent to the backend.
   * JSON-LD metadata and common-field keys are omitted from the editor and re-applied on save.
   */
  private toPublicPropertiesPayload(): Record<string, JsonValue> {
    const omit = new Set(['@context', '@id', '@type', 'name', 'Name', 'description', 'Description']);
    return Object.fromEntries(Object.entries(this.properties ?? {}).filter(([key]) => !omit.has(key)));
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
   * JSON-LD metadata added by `compact()` (`@context`, `@id`, `@type`) is omitted.
   * Name / Description are common fields and are never stored here.
   */
  private toPrivatePropertiesPayload(): Record<string, JsonValue> {
    const omit = new Set(['@context', '@id', '@type', 'name', 'Name', 'description', 'Description']);
    return Object.fromEntries(
      Object.entries(this.privateProperties ?? {}).filter(([key]) => !omit.has(key)),
    );
  }

}
