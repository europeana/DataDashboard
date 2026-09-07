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
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { JsonValue } from '@angular-devkit/core';
import { Subject, takeUntil } from 'rxjs';
import { DCAT_RESOURCE_FIELDS, DcatField, dcatPropertyKeys } from './dcat-resource-fields';

/**
 * Pluggable field group for DCAT Resource properties.
 *
 * Drop into any form that has a `properties` map:
 *
 * ```html
 * <europeana-dcat-resource-properties
 *   [properties]="properties"
 *   (propertiesChange)="properties = $event"
 * />
 * ```
 *
 * Loads known DCAT keys from `properties` into inputs; on change, writes them
 * back while keeping any other (custom) keys untouched.
 */
@Component({
  selector: 'europeana-dcat-resource-properties',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './dcat-resource-properties.component.html',
})
export class EuropeanaDcatResourcePropertiesComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  /** `properties` map from the API / parent form. */
  @Input() properties: Record<string, JsonValue> = {};

  /** Fieldset title. */
  @Input() title = 'DCAT Resource';

  /** Emits the full properties map (custom keys kept + DCAT fields applied). */
  @Output() propertiesChange = new EventEmitter<Record<string, JsonValue>>();

  readonly fields = DCAT_RESOURCE_FIELDS;
  form!: FormGroup;

  /**
   * Keys owned by this DCAT group (e.g. `dct:title`, `dct:description`).
   * Pass to a free-form properties editor as `excludeKeys` so those fields
   * are not edited twice.
   */
  get dcatExcludeKeys(): string[] {
    return dcatPropertyKeys(this.fields);
  }

  /**
   * Runs once when the component is created.
   * Builds one FormControl per DCAT field, fills them from the current
   * `properties` input, then listens for user edits and emits the updated map.
   */
  ngOnInit(): void {
    this.form = this.fb.group(
      Object.fromEntries(this.fields.map(f => [f.key, ['']])),
    );
    this.loadFromProperties(this.properties);

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.propertiesChange.emit(this.toProperties());
    });
  }

  /**
   * Runs when parent inputs change.
   * If `properties` is updated after init (e.g. asset loaded for edit),
   * reloads the form fields from that new map without re-emitting.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['properties'] && this.form && !changes['properties'].firstChange) {
      this.loadFromProperties(this.properties);
    }
  }

  /**
   * Runs when the component is destroyed.
   * Completes the destroy$ subject so the valueChanges subscription stops
   * and does not leak after the form is closed.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Form → properties map (for save / parent binding).
   * - Keeps every non-DCAT key from the current `properties` input, then
   * overlays non-empty values from the form under each field's primary key
   * (e.g. `dct:description`). 
   * - Empty form fields are skipped.
   */
  toProperties(): Record<string, JsonValue> {
    const owned = new Set(dcatPropertyKeys(this.fields).map(k => k.toLowerCase()));
    const rest = Object.fromEntries(
      Object.entries(this.properties ?? {}).filter(([k]) => !owned.has(k.toLowerCase())),
    );

    for (const field of this.fields) {
      const raw = this.form.get(field.key)?.value;
      if (typeof raw !== 'string' || !raw.trim()) {
        continue;
      }
      rest[field.key] = field.type === 'tags' ? this.parseTags(raw) : raw.trim();
    }
    return rest;
  }

  /**
   * Properties map → form (for display / edit).
   * For each DCAT field, finds a value in the map (primary key or alias)
   * and patches the matching FormControl. Uses emitEvent: false so this
   * load does not trigger propertiesChange.
   */
  private loadFromProperties(properties: Record<string, JsonValue> | undefined): void {
    const source = properties ?? {};
    const patch: Record<string, string> = {};
   
    for (const field of this.fields) {
      const value = this.readValue(source, field);
      patch[field.key] = value === undefined ? '' : this.toInputString(value, field);
    }
    // emitEvent: false so this load does not trigger propertiesChange
    this.form.patchValue(patch, { emitEvent: false });
  }

  /**
   * Looks up one field's value in a properties map.
   * Tries the primary key first (e.g. `dct:description`), then aliases
   * (e.g. EDC `description`). Matching is case-insensitive.
   */
  private readValue(source: Record<string, JsonValue>, field: DcatField): JsonValue | undefined {
    for (const key of [field.key, ...(field.aliases ?? [])]) {
      const direct = source[key];
      if (direct !== undefined && direct !== null && direct !== '') {
        return direct;
      }
      const found = Object.entries(source).find(([k]) => k.toLowerCase() === key.toLowerCase());
      if (found && found[1] !== undefined && found[1] !== null && found[1] !== '') {
        return found[1];
      }
    }
    return undefined;
  }

  /**
   * Converts a JSON-LD / API property value into a string for the input.
   * - Tag fields that arrive as arrays become a comma-separated string.
   * - primitives are stringified. 
   * -anything else becomes ''.
   */
  private toInputString(value: JsonValue, field: DcatField): string {
    if (field.type === 'tags' && Array.isArray(value)) {
      return value.map(String).join(', ');
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }

  /**
   * Parses a comma-separated keywords string back into a property value.
   * One tag → a single string; several tags → a string array.
   */
  private parseTags(value: string): JsonValue {
    const tags = value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    return tags.length <= 1 ? (tags[0] ?? value.trim()) : tags;
  }
}
