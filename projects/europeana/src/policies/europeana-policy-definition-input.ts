import { PolicyDefinitionInput } from '@think-it-labs/edc-connector-client';
import { JsonValue } from '@angular-devkit/core';

/**
 * Extend the interface 'PolicyDefinitionInput' [from library '@think-it-labs/edc-connector-client']
 *  to add public / private property maps and optional name / description metadata.
 */
export interface EuropeanaPolicyDefinitionInput extends PolicyDefinitionInput {
  properties?: Record<string, JsonValue>;
  privateProperties?: Record<string, JsonValue>;
  /** Display name (serialized as edc:name on the policy definition). */
  name?: string;
  /** Free-text description (serialized as edc:description on the policy definition). */
  description?: string;
}
