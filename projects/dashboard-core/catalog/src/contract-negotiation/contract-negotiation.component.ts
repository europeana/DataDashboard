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

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { compact, EdcConnectorClientError, IdResponse } from '@think-it-labs/edc-connector-client';
import { AsyncPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertComponent, JsonObjectTableComponent } from '@eclipse-edc/dashboard-core';
import { CatalogService } from '../catalog.service';
import { ContractNegotiationRequest } from '@think-it-labs/edc-connector-client/dist/src/entities';
import { CatalogDataset } from '../catalog-dataset';
import { BehaviorSubject } from 'rxjs';
import { JsonValue } from '@angular-devkit/core';

@Component({
  selector: 'lib-catalog-negotiation',
  standalone: true,
  imports: [FormsModule, AlertComponent, JsonObjectTableComponent, NgClass, AsyncPipe],
  templateUrl: './contract-negotiation.component.html',
})
export class ContractNegotiationComponent implements OnChanges {
  private readonly catalogService = inject(CatalogService);

  @Input() catalogDataset!: CatalogDataset;
  /** When false, hides the Catalog Details table (Europeana negotiate modal). */
  @Input() showCatalogDetailsSection = true;
  @Output() negotiationRequested = new EventEmitter<IdResponse>();

  dataset: Record<string, JsonValue> = {};
  distributions: Record<string, JsonValue>[] = [];
  catalog: Record<string, JsonValue> = {};
  readonly distributionExcludeKeys = ['@context', '@type'];
  errorMsg = '';
  offerId = '';
  selectedOffer = new BehaviorSubject<string[]>(['']);

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['catalogDataset']) {
      await this.loadDataset();
    }
  }

  /* CORE HACK : protected for Europeana subclasses */
  protected async loadDataset() {
    if (this.catalogDataset) {
      try {
        this.dataset = await compact(this.catalogDataset.dataset);
        this.distributions = await this.loadDistributions(this.dataset);
        this.catalog = this.getCatalogAsRecord();
      } catch (error) {
        console.error('Error compacting dataset:', error);
      }
    }
  }

  startNegotiation() {
    const policy = this.catalogDataset.offers.get(this.offerId);
    if (policy != undefined) {
      const request: ContractNegotiationRequest = {
        counterPartyId: this.catalogDataset.participantId,
        counterPartyAddress: this.catalogDataset.originator,
        policy: policy,
      };

      this.catalogService
        .initiateNegotiation(request)
        .then(async (idResponse: IdResponse) => {
          this.negotiationRequested.emit(idResponse);
        })
        .catch((error: EdcConnectorClientError) => {
          this.errorMsg = error.message;
        });
    } else {
      this.errorMsg = 'No offer selected!';
    }
  }

  async showOfferDetails(selectedOfferId: string) {
    const policy = this.catalogDataset.offers.get(selectedOfferId);

    if (policy !== undefined) {
      const excludedProperties = ['@context', 'assigner', '@type', 'target'];

      const offer = JSON.stringify(
        policy,
        (key, value) => {
          if (excludedProperties.includes(key)) {
            return undefined;
          }
          return value;
        },
        2,
      ).split('\n');

      this.selectedOffer.next(offer);
    }
  }

  private async loadDistributions(dataset: Record<string, JsonValue>): Promise<Record<string, JsonValue>[]> {
    const raw = dataset['distribution'] ?? dataset['http://www.w3.org/ns/dcat#distribution'];
    if (!raw) {
      return [];
    }
    const items = Array.isArray(raw) ? raw : [raw];
    return Promise.all(
      items
        .filter(
          (item): item is Record<string, JsonValue> => item != null && typeof item === 'object' && !Array.isArray(item),
        )
        .map(item => compact(item).then(compacted => compacted as Record<string, JsonValue>)),
    );
  }

  private getCatalogAsRecord(): Record<string, JsonValue> {
    return {
      id: this.catalogDataset.id,
      participantId: this.catalogDataset.participantId,
      originator: this.catalogDataset.originator,
    };
  }

  get offerKeys() {
    return Array.from(this.catalogDataset.offers.keys());
  }
}
