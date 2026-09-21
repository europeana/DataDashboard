/**
 * Field catalog for dcat:Resource properties (DCAT 3).
 *
 * Keys are local names only (no dcat: / dcterms: / … prefix).
 * Prefixed forms are listed as aliases for load / exclude matching.
 *
 * @see https://www.w3.org/TR/vocab-dcat-3/#Class:Resource
 */

export interface DcatField {
  key: string;
  label: string;
  tip?: string;
  icon?: string;
  type?: 'text' | 'textarea' | 'tags' | 'url' | 'date';
  /** Extra property keys accepted when loading from a response. */
  aliases?: string[];
  /** Optional value-input placeholder when adding this property. */
  placeholder?: string;
}

/**
 * All properties listed for Class: Cataloged Resource (dcat:Resource) in DCAT 3.
 * Order follows the W3C vocabulary section.
 */
export const DCAT_FIELDS: readonly DcatField[] = [
  {
    key: 'accessRights',
    label: 'Access rights',
    tip: 'Who can access the resource / security status (dcterms:accessRights)',
    aliases: ['dct:accessRights', 'dcterms:accessRights'],
  },
  {
    key: 'conformsTo',
    label: 'Conforms to',
    tip: 'Standard the resource conforms to (dcterms:conformsTo)',
    aliases: ['dct:conformsTo', 'dcterms:conformsTo'],
  },
  {
    key: 'contactPoint',
    label: 'Contact point',
    tip: 'Relevant contact information (dcat:contactPoint)',
    aliases: ['dcat:contactPoint'],
  },
  {
    key: 'creator',
    label: 'Creator',
    tip: 'Entity responsible for producing the resource (dcterms:creator)',
    aliases: ['dct:creator', 'dcterms:creator'],
  },
  {
    key: 'description',
    label: 'Description',
    icon: 'notes',
    type: 'textarea',
    tip: 'Free-text account of the resource (dcterms:description)',
    aliases: ['dct:description', 'dcterms:description'],
  },
  {
    key: 'title',
    label: 'Title',
    icon: 'title',
    tip: 'A name given to the resource (dcterms:title)',
    aliases: ['name', 'dct:title', 'dcterms:title'],
  },
  {
    key: 'issued',
    label: 'Release date',
    type: 'date',
    tip: 'Date of formal issuance / publication (dcterms:issued)',
    aliases: ['dct:issued', 'dcterms:issued'],
  },
  {
    key: 'modified',
    label: 'Update / modification date',
    type: 'date',
    tip: 'Most recent change date (dcterms:modified)',
    aliases: ['dct:modified', 'dcterms:modified'],
  },
  {
    key: 'language',
    label: 'Language',
    tip: 'Language of the resource (dcterms:language)',
    aliases: ['dct:language', 'dcterms:language'],
  },
  {
    key: 'publisher',
    label: 'Publisher',
    tip: 'Entity responsible for making the resource available (dcterms:publisher)',
    aliases: ['dct:publisher', 'dcterms:publisher'],
  },
  {
    key: 'identifier',
    label: 'Identifier',
    tip: 'Unique identifier of the resource (dcterms:identifier)',
    aliases: ['dct:identifier', 'dcterms:identifier'],
  },
  {
    key: 'theme',
    label: 'Theme / category',
    tip: 'Main category of the resource (dcat:theme)',
    aliases: ['dcat:theme'],
  },
  {
    key: 'type',
    label: 'Type / genre',
    tip: 'Nature or genre of the resource (dcterms:type)',
    aliases: ['dct:type', 'dcterms:type'],
  },
  {
    key: 'relation',
    label: 'Relation',
    tip: 'Related resource with unspecified relationship (dcterms:relation)',
    aliases: ['dct:relation', 'dcterms:relation'],
  },
  {
    key: 'qualifiedRelation',
    label: 'Qualified relation',
    tip: 'Link to a described relationship with another resource (dcat:qualifiedRelation)',
    aliases: ['dcat:qualifiedRelation'],
  },
  {
    key: 'keyword',
    label: 'Keyword / tag',
    type: 'tags',
    tip: 'Keyword or tag describing the resource (dcat:keyword)',
    aliases: ['dcat:keyword'],
  },
  {
    key: 'landingPage',
    label: 'Landing page',
    type: 'url',
    tip: 'Web page for the cataloged resource (dcat:landingPage)',
    aliases: ['dcat:landingPage'],
  },
  {
    key: 'qualifiedAttribution',
    label: 'Qualified attribution',
    tip: 'Link to an Agent with responsibility for the resource (prov:qualifiedAttribution)',
    aliases: ['prov:qualifiedAttribution'],
  },
  {
    key: 'license',
    label: 'License',
    tip: 'Legal document under which the resource is made available (dcterms:license)',
    aliases: ['dct:license', 'dcterms:license'],
  },
  {
    key: 'rights',
    label: 'Rights',
    tip: 'Rights statement not covered by license / accessRights (dcterms:rights)',
    aliases: ['dct:rights', 'dcterms:rights'],
  },
  {
    key: 'hasPart',
    label: 'Has part',
    tip: 'Related resource included in this resource (dcterms:hasPart)',
    aliases: ['dct:hasPart', 'dcterms:hasPart'],
  },
  {
    key: 'hasPolicy',
    label: 'Has policy',
    tip: 'ODRL policy expressing rights associated with the resource (odrl:hasPolicy)',
    aliases: ['odrl:hasPolicy'],
  },
  {
    key: 'isReferencedBy',
    label: 'Is referenced by',
    tip: 'Related resource that references or cites this resource (dcterms:isReferencedBy)',
    aliases: ['dct:isReferencedBy', 'dcterms:isReferencedBy'],
  },
  {
    key: 'previousVersion',
    label: 'Previous version',
    tip: 'Previous version in a lineage (dcat:previousVersion)',
    aliases: ['dcat:previousVersion'],
  },
  {
    key: 'hasVersion',
    label: 'Has version',
    tip: 'More specific versioned resource (dcat:hasVersion)',
    aliases: ['dcat:hasVersion', 'dct:hasVersion', 'dcterms:hasVersion'],
  },
  {
    key: 'hasCurrentVersion',
    label: 'Current version',
    tip: 'Current versioned snapshot (dcat:hasCurrentVersion)',
    aliases: ['dcat:hasCurrentVersion'],
  },
  {
    key: 'replaces',
    label: 'Replaces',
    tip: 'Resource this one supplants (dcterms:replaces)',
    aliases: ['dct:replaces', 'dcterms:replaces'],
  },
  {
    key: 'version',
    label: 'Version',
    tip: 'Version indicator of the resource (dcat:version)',
    aliases: ['dcat:version'],
  },
  {
    key: 'versionNotes',
    label: 'Version notes',
    type: 'textarea',
    tip: 'Description of changes vs previous version (adms:versionNotes)',
    aliases: ['adms:versionNotes'],
  },
  {
    key: 'status',
    label: 'Status',
    tip: 'Status in a workflow process (adms:status)',
    aliases: ['adms:status'],
  },
  {
    key: 'first',
    label: 'First',
    tip: 'First resource in an ordered series (dcat:first)',
    aliases: ['dcat:first'],
  },
  {
    key: 'last',
    label: 'Last',
    tip: 'Last resource in an ordered series (dcat:last)',
    aliases: ['dcat:last'],
  },
  {
    key: 'prev',
    label: 'Previous',
    tip: 'Previous resource in an ordered series (dcat:prev)',
    aliases: ['dcat:prev', 'previous'],
  },
];

/**
 * Extra form-only fields (e.g. EDC `name`) not listed on DCAT Resource class.
 * Combined with {@link DCAT_FIELDS} when resolving {@link dcatFormFields}.
 */
const EXTRA_FORM_FIELDS: readonly DcatField[] = [
  {
    key: 'name',
    label: 'Name',
    tip: 'Can be filtered by and could be used as e.g. display name',
    icon: 'assignment_ind',
    aliases: ['Name'],
  },
];

/**
 * Picks labeled form fields by key from the shared catalog ({@link DCAT_FIELDS} + extras).
 * Use from asset/policy templates to choose different subsets, e.g.
 * `dcatFormFields('title', 'description', 'publisher')` vs `dcatFormFields('name', 'description')`.
 */
export function dcatFormFields(...keys: string[]): readonly DcatField[] {
  return keys.map(key => {
    const field =
      EXTRA_FORM_FIELDS.find(f => f.key === key) ?? DCAT_FIELDS.find(f => f.key === key);
    if (!field) {
      throw new Error(`dcatFormFields: unknown field '${key}'`);
    }
    return field;
  });
}

/**
 * Default asset Resource form fields (Common Fields style).
 * Prefer {@link dcatFormFields} / `[fieldKeys]` when a screen needs a different subset.
 */
export const DCAT_FORM_FIELDS: readonly DcatField[] = dcatFormFields(
  'title',
  'description',
  'publisher',
);

/** Primary keys — use to exclude from free-form property editors. */
export function dcatPropertyKeys(fields: readonly DcatField[] = DCAT_FIELDS): string[] {
  return fields.map(f => f.key);
}

/** Primary keys + aliases (e.g. `dcterms:description`) for exclude / owned-key checks. */
export function dcatOwnedKeys(fields: readonly DcatField[] = DCAT_FIELDS): string[] {
  return fields.flatMap(f => [f.key, ...(f.aliases ?? [])]);
}
