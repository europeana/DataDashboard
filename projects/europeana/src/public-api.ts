/*
 * Public API Surface of europeana
 *
 * It is the entry point for @europeana/dashboard Angular library.
 * Main purpose is to explicitly define which components, services, directives, and types from
 * library are accessible to the outside world (i.e., applications that consume the library).
 *
 */

//export * from './lib/europeana';

/*Customized 'asset' related classes,constants*/
export { EuropeanaAssetViewComponent } from './assets/europeana-asset-view.component';
export { EuropeanaAssetCreateComponent } from './assets/europeana-asset-create.component';
export { EuropeanaAssetService } from './assets/europeana-asset.service';

/*Customized 'policy' related classes*/
export type { EuropeanaPolicyDefinitionInput } from './policies/europeana-policy-definition-input';
export { EuropeanaPolicyCreateComponent } from './policies/europeana-policy-create.component';
export { EuropeanaPolicyViewComponent } from './policies/europeana-policy-view.component';

export { provideEuropeanaDashboard } from './provide-europeana-dashboard';

/* Customized contract-definition related classes */
export { EuropeanaContractDefinitionCreateComponent } from './contract-definitions/europeana-contract-definition-create.component';
export { EuropeanaContractDefinitionsViewComponent } from './contract-definitions/europeana-contract-definitions-view.component';
