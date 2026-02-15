/**
 * Body parser
 * Handles content-type aware body parsing
 * Fixes: double-encoding bug in form-urlencoded, missing XML support, no error handling for JSON
 */

import { ContentType, ParserError, ParserErrorType } from '../types';

export interface ParsedBody {
  body: string | Record<string, any> | null;
  errors: ParserError[];
}

export function parseBody(lines: string[], contentType: string | null, startLine: number): ParsedBody {
  const errors: ParserError[] = [];

  if (!lines || lines.length === 0) {
    return { body: null, errors };
  }

  // Join lines based on content type
  let rawBody: string;

  if (contentType === 'application/x-www-form-urlencoded') {
    // For form data, join with & unless line already starts with &
    rawBody = lines.map((line, index) => {
      const trimmed = line.trim();
      if (index === 0) return trimmed;
      return trimmed.startsWith('&') ? trimmed : trimmed;
    }).join('\n');
  } else {
    // For JSON, XML, plain text, join with newlines
    rawBody = lines.join('\n');
  }

  // Parse based on content type
  if (!contentType) {
    // No content type specified, return raw body
    return { body: rawBody, errors };
  }

  try {
    if (contentType.includes('application/json')) {
      return parseJSON(rawBody, startLine);
    } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      return parseXML(rawBody, startLine);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      return parseFormUrlEncoded(rawBody, startLine);
    } else {
      // Unknown content type, return raw body
      return { body: rawBody, errors };
    }
  } catch (error) {
    errors.push({
      type: ParserErrorType.PARSE_FAILED,
      message: `Failed to parse body: ${error instanceof Error ? error.message : String(error)}`,
      line: startLine,
      context: rawBody.substring(0, 100)
    });
    return { body: rawBody, errors };
  }
}

function parseJSON(content: string, startLine: number): ParsedBody {
  const errors: ParserError[] = [];

  try {
    // Remove extra whitespace but preserve JSON structure
    const trimmed = content.trim();

    if (!trimmed) {
      return { body: null, errors };
    }

    // Parse JSON and return object
    const parsed = JSON.parse(trimmed);
    return { body: parsed, errors };
  } catch (error) {
    errors.push({
      type: ParserErrorType.PARSE_FAILED,
      message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      line: startLine,
      context: content.substring(0, 100)
    });
    // Return raw content on parse error
    return { body: content, errors };
  }
}

function parseXML(content: string, startLine: number): ParsedBody {
  const errors: ParserError[] = [];
  const trimmed = content.trim();

  if (!trimmed) {
    return { body: null, errors };
  }

  // Basic XML validation
  if (!trimmed.startsWith('<') || !trimmed.endsWith('>')) {
    errors.push({
      type: ParserErrorType.PARSE_FAILED,
      message: 'Invalid XML: Must start with < and end with >',
      line: startLine,
      context: trimmed.substring(0, 100)
    });
  }

  // For now, return XML as string
  // Future: Could use DOMParser to validate/parse XML
  return { body: trimmed, errors };
}

function parseFormUrlEncoded(content: string, startLine: number): ParsedBody {
  const errors: ParserError[] = [];
  const trimmed = content.trim();

  if (!trimmed) {
    return { body: null, errors };
  }

  try {
    // Parse form data without double-encoding
    const lines = trimmed.split('\n').filter(line => line.trim().length > 0);
    const params: Array<[string, string]> = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip lines that are just separators
      if (trimmedLine === '&') continue;

      // Remove leading & if present
      const cleanLine = trimmedLine.startsWith('&') ? trimmedLine.substring(1) : trimmedLine;

      // Split by & for multiple params on one line
      const pairs = cleanLine.split('&');

      for (const pair of pairs) {
        if (!pair.trim()) continue;

        const equalsIndex = pair.indexOf('=');
        if (equalsIndex === -1) {
          // No = sign, treat whole thing as key with empty value
          params.push([pair.trim(), '']);
        } else {
          const key = pair.substring(0, equalsIndex).trim();
          const value = pair.substring(equalsIndex + 1).trim();

          // Don't pre-encode - URLSearchParams will handle encoding
          params.push([key, value]);
        }
      }
    }

    // Create URLSearchParams and return as string
    // URLSearchParams handles the encoding automatically
    const urlParams = new URLSearchParams(params);
    return { body: urlParams.toString(), errors };
  } catch (error) {
    errors.push({
      type: ParserErrorType.PARSE_FAILED,
      message: `Failed to parse form data: ${error instanceof Error ? error.message : String(error)}`,
      line: startLine,
      context: trimmed.substring(0, 100)
    });
    return { body: trimmed, errors };
  }
}
