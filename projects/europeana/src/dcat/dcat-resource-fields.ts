/**
 * DCAT Resource fields shown as a separate group on forms.
 * @see https://www.w3.org/TR/vocab-dcat-3/#Class:Resource
 *
 * `key` is the property written on save (e.g. `dct:description`).
 * `aliases` are extra keys accepted when loading — important because assets often
 * store the same concept under the EDC vocab (`description`) instead of `dct:`.
 */

export interface DcatField {
  key: string;
  label: string;
  tip?: string;
  icon?: string;
  type?: 'text' | 'textarea' | 'tags' | 'url' | 'date';
  /** Extra property keys accepted when loading from a response. */
  aliases?: string[];
}

export const DCAT_RESOURCE_FIELDS: readonly DcatField[] = [
  {
    key: 'dct:title',
    label: 'Title',
    icon: 'title',
    tip: 'DCAT/DCT title (also reads EDC name / title)',
    aliases: ['title', 'name', 'dcterms:title'],
  },
  {
    key: 'dct:description',
    label: 'Description',
    icon: 'notes',
    type: 'textarea',
    tip: 'DCAT/DCT description (also reads EDC description)',
    // Asset properties usually use EDC @vocab → compact key "description"
    aliases: ['description', 'dcterms:description'],
  },
];

/** Primary DCAT keys only (not aliases) — use to exclude from free-form editors. */
export function dcatPropertyKeys(fields: readonly DcatField[] = DCAT_RESOURCE_FIELDS): string[] {
  return fields.map(f => f.key);
}
