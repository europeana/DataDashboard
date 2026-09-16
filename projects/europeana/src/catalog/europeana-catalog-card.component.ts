import { Component, inject } from '@angular/core';
import { DashboardStateService } from '@eclipse-edc/dashboard-core';
import { CatalogCardComponent, CatalogCardField } from '@eclipse-edc/dashboard-core/catalog';
import { firstValueFrom } from 'rxjs';
import { optionalLocalValue } from '../jsonld/optional-local-value';

@Component({
  selector: 'europeana-catalog-card',
  standalone: true,
  imports: [],
  templateUrl: '../../../dashboard-core/catalog/src/catalog-card/catalog-card.component.html',
  styleUrl: '../../../dashboard-core/catalog/src/catalog-card/catalog-card.component.css',
})
export class EuropeanaCatalogCardComponent extends CatalogCardComponent {
  private readonly stateService = inject(DashboardStateService);

  override ngOnInit() {
    super.ngOnInit();
    this.participantId = undefined; // hide Provider on Europeana catalog cards
  }

  protected override resolveCardTitle(): string {
    return this.read('name') ?? this.read('title') ?? this.catalogDataset?.assetId ?? '';
  }

  override get cardDescription(): string | undefined {
    return this.read('description');
  }

   /* Define fields to display with {Display Label, Material icon, Property Key} */
  override get cardFields(): CatalogCardField[] {
    const fields: Array<CatalogCardField | undefined> = [
      this.field('Publisher', 'apartment', 'publisher'),
      this.field('Created', 'event', 'created', 'issued'),
      this.field('Type', 'category', 'type'),
      this.field('Content Category', 'topic', 'contentCategory'),
      this.field('Language', 'language', 'language'),
      this.field('License', 'license', 'license'),
    ];
    return fields.filter((f): f is CatalogCardField => !!f);
  }

  private field(label: string, icon: string, ...keys: string[]): CatalogCardField | undefined {
    const value = keys.map(k => this.read(k)).find(Boolean);
    return value ? { label, value, icon } : undefined;
  }

  /** Local-name lookup (strips IRI / `prefix:`); see {@link optionalLocalValue}. */
  private read(key: string): string | undefined {
    return optionalLocalValue(this.catalogDataset?.dataset as Record<string, unknown> | undefined, key);
  }

  
}
