/*
 *  Copyright (c) 2025 Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 *
 *  This program and the accompanying materials are made available under the
 *  terms of the Apache License, Version 2.0 which is available at
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 *  SPDX-License-Identifier: Apache-2.0
 *
 *  Contributors:
 *       Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V. - initial API and implementation
 *
 */

import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PolicyService } from '../policy.service';
import { AlertComponent, JsonObjectInputComponent } from '@eclipse-edc/dashboard-core';
import { PolicyType } from '@think-it-labs/edc-connector-client/dist/src/entities/policy/policy';
import {
  compact,
  EdcConnectorClientError,
  IdResponse,
  PolicyBuilder,
  PolicyDefinition,
  PolicyDefinitionInput,
  PolicyInput,
} from '@think-it-labs/edc-connector-client';
import { JsonValue } from '@angular-devkit/core';

@Component({
  selector: 'lib-policy-create',
  standalone: true,
  imports: [ReactiveFormsModule, AlertComponent, NgClass, JsonObjectInputComponent],
  templateUrl: './policy-create.component.html',
  styleUrl: './policy-create.component.css',
})
export class PolicyCreateComponent implements OnChanges {
  private readonly policyService = inject(PolicyService);
  private readonly formBuilder = inject(FormBuilder);

  @Input() policyDefinition?: PolicyDefinition;

  @Output() created = new EventEmitter<IdResponse>();
  @Output() updated = new EventEmitter<void>();
  mode: 'create' | 'update' = 'create';

  errorMsg = '';

  privateProperties: Record<string, JsonValue> = {};

  policyForm: FormGroup;

  constructor() {
    this.policyForm = this.formBuilder.group({
      id: [''],
      policyType: new FormControl<PolicyType | undefined>(undefined, {
        validators: [Validators.required],
      }),
      permissionsJson: [''],
      prohibitionsJson: [''],
      obligationsJson: [''],
    });
  }

  async ngOnChanges() {
    if (!this.policyDefinition) {
      return;
    }
    this.mode = 'update';

    const { policy } = this.policyDefinition;
    const compactPolicy = await compact(policy);
    const typeSegments = compactPolicy['@type'].split('/');

    this.privateProperties = await this.loadPrivateProperties();

    this.policyForm.patchValue({
      id: this.policyDefinition['@id'],
      policyType: typeSegments[typeSegments.length - 1] as PolicyType,
      permissionsJson: await this.rulesToJson(policy.permissions),
      prohibitionsJson: await this.rulesToJson(policy.prohibitions),
      obligationsJson: await this.rulesToJson(policy.obligations),
    });
  }

  get formTitle(): string {
    if (!this.policyDefinition) {
      return 'Policy';
    }
    return this.getPolicyName() || this.policyDefinition.id;
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

  createPolicyDefinition(): void {
    this.submit(input => this.policyService.createPolicyDefinition(input).then(res => this.created.emit(res)));
  }

  editPolicyDefinition(): void {
    this.submit(input => this.policyService.updatePolicy(input.id!, input).then(() => this.updated.emit()));
  }

  /** Validates the form, builds the input and runs the given action, funnelling all errors to `errorMsg`. */
  private submit(action: (input: PolicyDefinitionInput) => Promise<unknown>): void {
    if (!this.policyForm.valid) {
      console.error('Policy form submitted while invalid');
      return;
    }

    let policyInput: PolicyDefinitionInput;
    try {
      policyInput = this.createPolicyInput();
    } catch (err: unknown) {
      this.errorMsg = this.toErrorMessage(err, 'An unknown error occurred.');
      return;
    }

    action(policyInput).catch((err: EdcConnectorClientError) => {
      this.errorMsg = err.message;
    });
  }

  private createPolicyInput(): PolicyDefinitionInput {
    const { id, policyType, permissionsJson, prohibitionsJson, obligationsJson } = this.policyForm.value;

    const policyInput: PolicyInput = { '@type': policyType };
    this.assignJsonRule(policyInput, 'permission', permissionsJson, 'Permissions');
    this.assignJsonRule(policyInput, 'prohibition', prohibitionsJson, 'Prohibitions');
    this.assignJsonRule(policyInput, 'obligation', obligationsJson, 'Obligations');

    const policy = new PolicyBuilder()
      .type(policyType ?? ('Set' as PolicyType))
      .raw(policyInput)
      .build();

    const policyDefinitionInput: PolicyDefinitionInput & { privateProperties: Record<string, JsonValue> } = {
      policy,
      privateProperties: this.toPrivatePropertiesPayload(),
    };
    if (id) {
      policyDefinitionInput.id = id;
      policyDefinitionInput['@id'] = id;
    }

    return policyDefinitionInput;
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
    return Object.fromEntries(Object.entries(this.privateProperties ?? {}).filter(([key]) => !jsonLdKeys.has(key)));
  }

  /** Compacts a list of rules to a JSON string, or returns an empty string when there are none. */
  private async rulesToJson(rules: unknown[]): Promise<string> {
    return rules.length > 0 ? JSON.stringify(await compact(rules)) : '';
  }

  /** Parses a JSON rule field and assigns it to the policy input, throwing a labelled error on failure. */
  private assignJsonRule(
    target: PolicyInput,
    key: 'permission' | 'prohibition' | 'obligation',
    value: string,
    label: string,
  ): void {
    if (!value) {
      return;
    }
    try {
      target[key] = JSON.parse(value);
    } catch (err: unknown) {
      throw new Error(`Invalid JSON for ${label}: ${this.toErrorMessage(err, 'parsing failed')}`, { cause: err });
    }
  }

  private toErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error ? err.message : fallback;
  }
}
