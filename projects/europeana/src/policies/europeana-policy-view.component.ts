import {
  PolicyCardComponent,
  PolicyViewComponent
} from '@eclipse-edc/dashboard-core/policies';
import { IdResponse, PolicyDefinition } from '@think-it-labs/edc-connector-client';
import { EuropeanaPolicyCreateComponent } from './europeana-policy-create.component';
import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  FilterInputComponent,
  ItemCountSelectorComponent,
  PaginationComponent
} from '@eclipse-edc/dashboard-core';


@Component({
  selector: 'europeana-policy-view',
  standalone: true,
  imports: [AsyncPipe, FilterInputComponent, PaginationComponent, PolicyCardComponent, ItemCountSelectorComponent],
  templateUrl: '../../../dashboard-core/policies/src/policy-view/policy-view.component.html',
  styleUrl: '../../../dashboard-core/policies/src/policy-view/policy-view.component.css',
})
export class EuropeanaPolicyViewComponent extends PolicyViewComponent{
  /**
   * Override the parent method 'createPolicy'
   * to open the model of 'EuropeanaPolicyCreateComponent' instead of 'PolicyCreateComponent'.
   */
  override createPolicy() {
    const callbacks = {
      created: (id: IdResponse) => {
        this.modalAndAlertService.closeModal();
        this.modalAndAlertService.showAlert(`Policy with ID '${id['@id']}'`, 'Created Successfully', 'success', 5);
        this.fetchPolicies();
      },
    };
    this.modalAndAlertService.openModal(EuropeanaPolicyCreateComponent, undefined, callbacks);
  }

  /**
   * Override the parent method 'editPolicy' so that it
   * opens the model of 'EuropeanaPolicyCreateComponent' instead of 'PolicyCreateComponent'
   * @param policyDefinition
   */
  override async editPolicy(policyDefinition: PolicyDefinition) {
    const callbacks = {
      updated: () => {
        this.modalAndAlertService.closeModal();
        this.modalAndAlertService.showAlert(
          `Policy with ID '${policyDefinition.id}'`,
          'updated successfully',
          'success',
          5,
        );
        this.fetchPolicies();
      },
    };
    this.modalAndAlertService.openModal(EuropeanaPolicyCreateComponent, { policyDefinition: policyDefinition }, callbacks);
  }

}
