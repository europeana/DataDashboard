import { PolicyDefinitionInput } from '@think-it-labs/edc-connector-client';
import { JsonValue } from '@angular-devkit/core';

/**
 * Extend the interface 'PolicyDefinitionInput' [from library '@think-it-labs/edc-connector-client']
 *  to add public / private property maps.
 * Name / description are sent inside `properties`, not as top-level fields.
 */
export interface EuropeanaPolicyDefinitionInput extends PolicyDefinitionInput {
  properties?: Record<string, JsonValue>;
  privateProperties?: Record<string, JsonValue>;
}
