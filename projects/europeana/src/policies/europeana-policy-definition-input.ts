import {PolicyDefinitionInput} from '@think-it-labs/edc-connector-client';
import {JsonValue} from '@angular-devkit/core';

/**
 * Extend the interface 'PolicyDefinitionInput' [from library '@think-it-labs/edc-connector-client']
 *  to add the additional 'privateProperties' element.
 */
export interface EuropeanaPolicyDefinitionInput extends PolicyDefinitionInput {
  privateProperties?:Record<string, JsonValue>
}
