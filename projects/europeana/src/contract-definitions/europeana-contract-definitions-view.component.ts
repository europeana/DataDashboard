import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ContractDefinition, IdResponse } from '@think-it-labs/edc-connector-client';
import {
  FilterInputComponent,
  ItemCountSelectorComponent,
  PaginationComponent,
} from '@eclipse-edc/dashboard-core';
import {
  ContractDefinitionCardComponent,
  ContractDefinitionsViewComponent,
} from '@eclipse-edc/dashboard-core/contract-definitions';
import { EuropeanaContractDefinitionCreateComponent } from './europeana-contract-definition-create.component';

@Component({
  selector: 'europeana-contract-definitions-view',
  standalone: true,
  imports: [
    AsyncPipe,
    PaginationComponent,
    FilterInputComponent,
    ContractDefinitionCardComponent,
    ItemCountSelectorComponent,
  ],
  templateUrl:
    '../../../dashboard-core/contract-definitions/src/contract-definitions-view/contract-definitions-view.component.html',
  styleUrl:
    '../../../dashboard-core/contract-definitions/src/contract-definitions-view/contract-definitions-view.component.css',
})
export class EuropeanaContractDefinitionsViewComponent extends ContractDefinitionsViewComponent {
  /**
   * Open Europeana create form so policy dropdowns can show name instead of ID.
   */
  override createContractDefinition() {
    const callbacks = {
      createdEvent: (id: IdResponse) => {
        this.modalAndAlertService.closeModal();
        this.modalAndAlertService.showAlert(
          `Contract Definition with ID '${id.id}'`,
          'Created Successfully',
          'success',
          5,
        );
        this.fetchContractDefinitions();
      },
    };
    this.modalAndAlertService.openModal(EuropeanaContractDefinitionCreateComponent, undefined, callbacks);
  }

  /**
   * Open Europeana edit form so policy dropdowns can show name instead of ID.
   */
  override editContractDefinition(contractDefinition: ContractDefinition) {
    const callbacks = {
      editedEvent: () => {
        this.modalAndAlertService.closeModal();
        this.modalAndAlertService.showAlert(
          `Contract Definition with ID '${contractDefinition.id}'`,
          'Updated Successfully',
          'success',
          5,
        );
        this.fetchContractDefinitions();
      },
    };
    this.modalAndAlertService.openModal(
      EuropeanaContractDefinitionCreateComponent,
      { contractDefinitionInput: contractDefinition },
      callbacks,
    );
  }
}
