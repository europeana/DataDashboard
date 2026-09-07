import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonValue } from '@angular-devkit/core';
import { JsonObjectTableComponent } from '@eclipse-edc/dashboard-core';
import { Subject, takeUntil } from 'rxjs';
import { DCAT_FIELDS, DcatField, dcatOwnedKeys } from './dcat-resource-fields';

/** UI layout for the same pluggable component. */
export type DcatPropertiesLayout = 'fields' | 'properties';

/**
 * Pluggable DCAT properties editor (asset Resource + dataAddress Distributions).
 *
 * - `layout="fields"` — Common Fields style (labeled inputs)
 * - `layout="properties"` — Properties style (table + key/value add)
 *
 * Optional {@link DcatField.placeholder} only when set on a field.
 * Free-form keys are not strictly validated.
 */
@Component({
  selector: 'europeana-dcat-resource-properties',
  standalone: true,
  imports: [ReactiveFormsModule, JsonObjectTableComponent],
  templateUrl: './dcat-resource-properties.component.html',
})
export class EuropeanaDcatResourcePropertiesComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  @Input() properties: Record<string, JsonValue> = {};
  /** `fields` = Common Fields look; `properties` = normal Properties look. */
  @Input() layout: DcatPropertiesLayout = 'properties';
  @Input() title = 'DCAT Resource';
  /** Optional help text under the title (e.g. key naming examples). */
  @Input() hint = '';
  @Input() fields: readonly DcatField[] = DCAT_FIELDS;
  @Output() propertiesChange = new EventEmitter<Record<string, JsonValue>>();

  fieldsForm!: FormGroup;

  addForm = new FormGroup({
    key: new FormControl('', Validators.required),
    value: new FormControl('', Validators.required),
  });

  /** Keys owned by the configured field catalog (used to hide them from free-form tables). */
  get dcatExcludeKeys(): string[] {
    return dcatOwnedKeys(this.fields);
  }

  /** Whether the current properties map has any entries. */
  get hasProperties(): boolean {
    return Object.keys(this.properties ?? {}).length > 0;
  }

  /** True when the add-form key already exists in properties (case-insensitive). */
  get duplicateKey(): boolean {
    const key = this.addForm.value.key?.trim();
    return !!key && this.hasKey(key);
  }

  /** Placeholder for the free-form value input; uses the field catalog when the key matches. */
  get valuePlaceholder(): string {
    const raw = this.addForm.value.key?.trim();
    if (!raw) {
      return 'Value';
    }
    const field = this.findField(raw);
    return field?.placeholder?.trim() || 'Value';
  }

  /** Builds the fields form and emits property updates when layout is `fields`. */
  ngOnInit(): void {
    this.fieldsForm = this.fb.group(Object.fromEntries(this.fields.map(f => [f.key, ['']])));
    this.loadFieldsForm(this.properties);

    this.fieldsForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.layout === 'fields') {
        this.propertiesChange.emit(this.fieldsToProperties());
      }
    });
  }

  /** Reloads labeled inputs when the parent updates `properties` after first change. */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['properties'] && this.fieldsForm && !changes['properties'].firstChange) {
      this.loadFieldsForm(this.properties);
    }
  }

  /** Tears down valueChanges subscription. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Returns a field's optional placeholder, or empty string. */
  fieldPlaceholder(field: DcatField): string {
    return field.placeholder?.trim() || '';
  }

  /** Adds a free-form key/value pair and clears the add form. */
  addProperty(): void {
    if (!this.addForm.valid || this.duplicateKey) {
      return;
    }
    const key = this.addForm.value.key!.trim();
    const value = this.parseValue(this.addForm.value.value!);
    this.propertiesChange.emit({ ...this.properties, [key]: value });
    this.addForm.reset();
  }

  /** Removes one property by key and emits the updated map. */
  deleteProperty(key: string): void {
    const { [key]: _, ...rest } = this.properties ?? {};
    this.propertiesChange.emit(rest);
  }

  /**
   * Merges labeled field values into the properties map.
   * Preserves non-owned keys and reuses existing alias keys when present.
   */
  private fieldsToProperties(): Record<string, JsonValue> {
    const owned = new Set(dcatOwnedKeys(this.fields).map(k => k.toLowerCase()));
    const rest = Object.fromEntries(
      Object.entries(this.properties ?? {}).filter(([k]) => !owned.has(k.toLowerCase())),
    );

    for (const field of this.fields) {
      const raw = this.fieldsForm.get(field.key)?.value;
      if (typeof raw !== 'string' || !raw.trim()) {
        continue;
      }
      const writeKey = this.findPropertyEntry(this.properties ?? {}, field)?.key ?? field.key;
      rest[writeKey] = field.type === 'tags' ? this.parseTags(raw) : raw.trim();
    }
    return rest;
  }

  /** Patches the fields form from a properties map without emitting valueChanges. */
  private loadFieldsForm(properties: Record<string, JsonValue> | undefined): void {
    if (!this.fieldsForm) {
      return;
    }
    const source = properties ?? {};
    const patch: Record<string, string> = {};
    for (const field of this.fields) {
      const match = this.findPropertyEntry(source, field);
      patch[field.key] = match ? this.toInputString(match.value, field) : '';
    }
    this.fieldsForm.patchValue(patch, { emitEvent: false });
  }

  /**
   * Finds a property entry for a catalog field by key or alias (case-insensitive).
   * Returns the actual source key so writes can preserve the original spelling.
   */
  private findPropertyEntry(
    source: Record<string, JsonValue>,
    field: DcatField,
  ): { key: string; value: JsonValue } | undefined {
    for (const key of [field.key, ...(field.aliases ?? [])]) {
      const direct = source[key];
      if (direct !== undefined && direct !== null && direct !== '') {
        return { key, value: direct };
      }
      const found = Object.entries(source).find(([k]) => k.toLowerCase() === key.toLowerCase());
      if (found && found[1] !== undefined && found[1] !== null && found[1] !== '') {
        return { key: found[0], value: found[1] };
      }
    }
    return undefined;
  }

  /** Resolves a free-form key name to a catalog field via key or aliases. */
  private findField(name: string): DcatField | undefined {
    const lower = name.toLowerCase();
    return this.fields.find(
      f => f.key.toLowerCase() === lower || f.aliases?.some(a => a.toLowerCase() === lower),
    );
  }

  /** Case-insensitive check that a key already exists in properties. */
  private hasKey(key: string): boolean {
    const lower = key.toLowerCase();
    return Object.keys(this.properties ?? {}).some(k => k.toLowerCase() === lower);
  }

  /** Converts a stored JsonValue into a string for a labeled input. */
  private toInputString(value: JsonValue, field: DcatField): string {
    if (field.type === 'tags' && Array.isArray(value)) {
      return value.map(String).join(', ');
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }

  /** Parses a comma-separated tags string into a single string or string array. */
  private parseTags(value: string): JsonValue {
    const tags = value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    return tags.length <= 1 ? (tags[0] ?? value.trim()) : tags;
  }

  /** Coerces free-form input into boolean, number, JSON, or plain string. */
  private parseValue(input: string): JsonValue {
    if (input === 'true' || input === 'false') {
      return input === 'true';
    }
    if (!isNaN(Number(input)) && input.trim() !== '') {
      return Number(input);
    }
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }
}
