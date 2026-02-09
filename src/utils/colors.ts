/**
 * Method and status color helpers using design tokens.
 * Migrated from the legacy web-components/styles.ts.
 */

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'var(--rex-method-get)',
    POST: 'var(--rex-method-post)',
    PUT: 'var(--rex-method-put)',
    DELETE: 'var(--rex-method-delete)',
    PATCH: 'var(--rex-method-patch)',
  };
  return colors[method.toUpperCase()] || 'var(--rex-color-text-3)';
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'var(--rex-status-ok)';
  if (status >= 300 && status < 400) return 'var(--rex-status-warn)';
  if (status >= 400) return 'var(--rex-status-error)';
  return 'var(--rex-color-text-3)';
}
