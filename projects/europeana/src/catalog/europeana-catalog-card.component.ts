import { Component } from '@angular/core';
import { CatalogCardComponent, CatalogCardField } from '@eclipse-edc/dashboard-core/catalog';
import { jsonLdString, optionalLocalValue } from '../jsonld/optional-local-value';

const BYTE_SIZE_PLACEHOLDER = '—';

@Component({
  selector: 'europeana-catalog-card',
  standalone: true,
  imports: [],
  templateUrl: '../../../dashboard-core/catalog/src/catalog-card/catalog-card.component.html',
  styleUrl: '../../../dashboard-core/catalog/src/catalog-card/catalog-card.component.css',
})
export class EuropeanaCatalogCardComponent extends CatalogCardComponent {
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

  /** Define fields to display with {Display Label, Material icon, Property Key}. */
  override get cardFields(): CatalogCardField[] {
    const fields: Array<CatalogCardField | undefined> = [
      this.field('Publisher', 'apartment', 'publisher'),
      this.field('Created', 'event', 'created', 'issued'),
      this.field('Type', 'category', 'type'),
      this.field('Content Category', 'topic', 'contentCategory'),
      this.field('Language', 'language', 'language'),
      this.field('License', 'license', 'license'),
      {
        label: 'Size',
        icon: 'hard_drive',
        value: this.formatByteSize(this.readByteSize()) ?? BYTE_SIZE_PLACEHOLDER,
      },
    ];
    return fields.filter((f): f is CatalogCardField => !!f);
  }

  private field(label: string, icon: string, ...keys: string[]): CatalogCardField | undefined {
    const value = keys.map(k => this.read(k)).find(Boolean);
    return value ? { label, value, icon } : undefined;
  }

  /** Local-name lookup on the dataset (strips IRI / `prefix:`). */
  private read(key: string): string | undefined {
    return optionalLocalValue(this.catalogDataset?.dataset as Record<string, unknown> | undefined, key);
  }

  /** byteSize from the first distribution that has it. */
  private readByteSize(): number | undefined {
    const dataset = this.catalogDataset?.dataset as Record<string, unknown> | undefined;
    if (!dataset) {
      return undefined;
    }
    const raw =
      dataset['http://www.w3.org/ns/dcat#distribution'] ??
      dataset['https://www.w3.org/ns/dcat#distribution'] ??
      dataset['distribution'];
    const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const item of items) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const bytes = this.parseBytes(
        optionalLocalValue(item as Record<string, unknown>, 'byteSize') ??
          jsonLdString((item as Record<string, unknown>)['https://www.w3.org/ns/dcat/byteSize']),
      );
      if (bytes != null) {
        return bytes;
      }
    }
    return undefined;
  }

  private parseBytes(raw: string | undefined): number | undefined {
    if (raw == null || !String(raw).trim()) {
      return undefined;
    }
    const n = Number(String(raw).trim());
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }

  /** Converts bytes to B / KB / MB / GB / TB. */
  private formatByteSize(bytes: number | undefined): string | undefined {
    if (bytes == null || !Number.isFinite(bytes) || bytes < 0) {
      return undefined;
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    const text =
      unit === 0 ? String(Math.round(value)) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
    return `${text.replace(/\.0+$/, '')} ${units[unit]}`;
  }
}
