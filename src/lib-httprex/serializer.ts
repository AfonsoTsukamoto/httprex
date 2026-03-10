/**
 * Request serializer
 * Builds raw HTTP text from individual components (method, URL, headers, body).
 * This is the reverse of parse() — it takes structured data and produces
 * a valid HTTP request string that can be fed back into parse().
 *
 * Unlike createRequestPreview(), this function preserves {{variables}} as-is
 * and does not require a ParsedRequest — it works with raw components.
 */

export interface SerializeRequestParts {
  method: string;
  url: string;
  headers?: Array<{ key: string; value: string }> | Record<string, string>;
  body?: string;
}

/**
 * Serialize request components into a valid HTTP request string.
 *
 * Format follows VSCode REST Client / httprex conventions:
 * - Request line (METHOD URL)
 * - Headers immediately after request line (no blank line)
 * - Blank line before body
 * - {{variables}} are preserved as-is
 */
export function serializeRequest(parts: SerializeRequestParts): string {
  const lines: string[] = [];

  // Request line
  lines.push(`${parts.method} ${parts.url}`);

  // Headers
  const headerEntries = normalizeHeaders(parts.headers);
  for (const { key, value } of headerEntries) {
    lines.push(`${key}: ${value}`);
  }

  // Body — separated by blank line from headers (or request line if no headers)
  if (parts.body) {
    lines.push('');
    lines.push(parts.body);
  }

  return lines.join('\n');
}

function normalizeHeaders(
  headers?: Array<{ key: string; value: string }> | Record<string, string>
): Array<{ key: string; value: string }> {
  if (!headers) return [];

  if (Array.isArray(headers)) {
    return headers;
  }

  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}
