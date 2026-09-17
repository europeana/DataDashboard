/**
 * Display helpers for expanded JSON-LD objects.
 * Unlike connector `optionalValue(prefix, name)`, this ignores namespaces:
 * any key is matched by its local name (segment after the last `/`, `#`, or `:`).
 */

/** `https://purl.org/dc/terms/publisher` / `edc:publisher` → `publisher` */
export function localName(key: string): string {
  const hash = key.lastIndexOf('#');
  const slash = key.lastIndexOf('/');
  const colon = key.lastIndexOf(':');
  const cut = Math.max(hash, slash, colon);
  return (cut >= 0 ? key.slice(cut + 1) : key).trim();
}

/** Unwrap JSON-LD node / array / plain scalar to a display string. */
export function jsonLdString(raw: unknown): string | undefined {
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  if (typeof raw === 'number' || typeof raw === 'boolean') {
    return String(raw);
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const node = raw as Record<string, unknown>;
    return jsonLdString(node['@value'] ?? node['@id']);
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    return undefined;
  }
  return jsonLdString(raw[0]);
}

/**
 * Like `optionalValue`, but matches by local name only (prefix / IRI stripped).
 * First matching property wins.
 */
export function optionalLocalValue(object: Record<string, unknown> | undefined | null, name: string): string | undefined {
  if (!object) {
    return undefined;
  }
  for (const [key, raw] of Object.entries(object)) {
    if (key.startsWith('@') || typeof raw === 'function') {
      continue;
    }
    if (localName(key) === name) {
      const value = jsonLdString(raw);
      if (value) {
        return value;
      }
    }
  }
  return undefined;
}

/** Rebuilds an object with IRI/prefix keys reduced to local names (first wins). */
export function withLocalKeys<T extends Record<string, unknown>>(object: T): Record<string, T[keyof T]> {
  const out: Record<string, T[keyof T]> = {};
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'function') {
      continue;
    }
    const local = localName(key) || key;
    if (!(local in out)) {
      out[local] = value as T[keyof T];
    }
  }
  return out;
}
