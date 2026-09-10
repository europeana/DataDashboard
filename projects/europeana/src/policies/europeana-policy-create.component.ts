import { PolicyCreateComponent } from '@eclipse-edc/dashboard-core/policies';
import { JsonValue } from '@angular-devkit/core';
import { compact } from '@think-it-labs/edc-connector-client';
import { EuropeanaPolicyDefinitionInput } from './europeana-policy-definition-input';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertComponent, JsonObjectInputComponent } from '@eclipse-edc/dashboard-core';
import { NgClass } from '@angular/common';
import { dcatFormFields, dcatOwnedKeys, EuropeanaDcatResourcePropertiesComponent } from '../dcat';

@Component({
  selector: 'europeana-policy-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AlertComponent,
    NgClass,
    JsonObjectInputComponent,
    EuropeanaDcatResourcePropertiesComponent,
  ],
  templateUrl: './europeana-policy-create.component.html',
  styleUrl: '../../../dashboard-core/policies/src/policy-create/policy-create.component.css',
})
export class EuropeanaPolicyCreateComponent extends PolicyCreateComponent {
  /** Keys for Name / Description — resolved from shared DCAT form catalog in the template. */
  readonly policyFieldKeys = ['name', 'description'] as const;

  override get formTitle(): string {
    if (!this.policyDefinition) {
      return 'Policy';
    }
    return this.getPolicyName() || this.policyDefinition.id;
  }

  /** Europeana label for the permissions / prohibitions / obligations block. */
  override get propertiesSectionTitle(): string {
    return 'Conditions';
  }

  /** Name / Description are edited via the pluggable component, not core common fields. */
  override get showAdditionalCommonFields(): boolean {
    return false;
  }

  /** Show editable public Properties (same pattern as assets). */
  override get showPublicPropertiesSection(): boolean {
    return true;
  }

  override get publicPropertiesExcludeKeys(): string[] {
    return ['@context', '@id', '@type', ...dcatOwnedKeys(dcatFormFields(...this.policyFieldKeys))];
  }

  /**
   * Display name: properties map (form), then top-level `edc:name` on older definitions.
   */
  private getPolicyName(): string | undefined {
    const fromProperties = this.properties?.['name'];
    if (typeof fromProperties === 'string' && fromProperties.trim()) {
      return fromProperties.trim();
    }

    const fromDefinition = this.policyDefinition?.optionalValue<string>('edc', 'name');
    if (typeof fromDefinition === 'string' && fromDefinition.trim()) {
      return fromDefinition.trim();
    }
    return undefined;
  }

  override async ngOnChanges() {
    await super.ngOnChanges();
    if (this.policyDefinition) {
      this.properties = await this.loadPublicProperties();
      this.privateProperties = await this.loadPrivateProperties();
      this.mergeTopLevelNameDescriptionIntoProperties();
    }
  }

  /**
   * Public / private property maps only. Name & description live inside `properties`
   * (edited by europeana-dcat-resource-properties).
   */
  protected override createPolicyInput(): EuropeanaPolicyDefinitionInput {
    return {
      ...super.createPolicyInput(),
      properties: this.toPublicPropertiesPayload(),
      privateProperties: this.toPrivatePropertiesPayload(),
    };
  }

  /**
   * Older policies may still have top-level `edc:name` / `edc:description`.
   * Copy them into the properties map so the pluggable fields form can show them.
   */
  private mergeTopLevelNameDescriptionIntoProperties(): void {
    const next = { ...this.properties };
    for (const key of ['name', 'description'] as const) {
      if (this.readPropertyString(key)) {
        continue;
      }
      const fromDefinition = this.readDefinitionString(key);
      if (fromDefinition) {
        next[key] = fromDefinition;
      }
    }
    this.properties = next;
  }

  private readPropertyString(key: string): string | undefined {
    const value = this.properties?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private readDefinitionString(key: string): string | undefined {
    const value = this.policyDefinition?.optionalValue<string>('edc', key);
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private async loadPublicProperties(): Promise<Record<string, JsonValue>> {
    const props = this.policyDefinition!.nested('edc', 'properties');
    return (await compact(props)) as Record<string, JsonValue>;
  }

  /** Omits JSON-LD metadata; keeps name / description from the fields component. */
  private toPublicPropertiesPayload(): Record<string, JsonValue> {
    const omit = new Set(['@context', '@id', '@type']);
    return Object.fromEntries(
      Object.entries(this.properties ?? {}).filter(([key, value]) => {
        if (omit.has(key)) {
          return false;
        }
        if (typeof value === 'string' && !value.trim()) {
          return false;
        }
        return value !== undefined && value !== null && value !== '';
      }),
    );
  }

  private async loadPrivateProperties(): Promise<Record<string, JsonValue>> {
    const props = this.policyDefinition!.nested('edc', 'privateProperties');
    return (await compact(props)) as Record<string, JsonValue>;
  }

  private toPrivatePropertiesPayload(): Record<string, JsonValue> {
    const omit = new Set(['@context', '@id', '@type', 'name', 'Name', 'description', 'Description']);
    return Object.fromEntries(
      Object.entries(this.privateProperties ?? {}).filter(([key]) => !omit.has(key)),
    );
  }
}
