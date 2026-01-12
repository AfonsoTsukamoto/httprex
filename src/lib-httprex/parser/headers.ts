/**
 * Header parser
 * Parses HTTP headers with support for:
 * - Multi-line header values (RFC 822 continuation)
 * - Case-insensitive matching
 * - Duplicate header handling (cookie concatenation)
 */

import { ParserError, ParserErrorType } from '../types';

export interface ParsedHeaders {
  headers: Record<string, string>;
  errors: ParserError[];
}

const HEADER_REGEX = /^([^:]+):\s*(.*)$/;

export function parseHeaders(lines: string[], startLine: number = 2): ParsedHeaders {
  const headers: Record<string, string> = {};
  const errors: ParserError[] = [];

  let currentHeaderName: string | null = null;
  let currentHeaderValue: string = '';

  const finalizeHeader = () => {
    if (currentHeaderName && currentHeaderValue) {
      const normalizedName = currentHeaderName.toLowerCase();

      // Handle duplicate headers (concatenate with comma, except for Set-Cookie)
      if (headers[normalizedName]) {
        if (normalizedName === 'set-cookie') {
          headers[normalizedName] = headers[normalizedName] + '\n' + currentHeaderValue;
        } else {
          headers[normalizedName] = headers[normalizedName] + ', ' + currentHeaderValue;
        }
      } else {
        headers[normalizedName] = currentHeaderValue;
      }
    }
    currentHeaderName = null;
    currentHeaderValue = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = startLine + i;

    // Empty line indicates end of headers
    if (line.trim().length === 0) {
      finalizeHeader();
      break;
    }

    // Check for header continuation (line starting with whitespace)
    if (currentHeaderName && /^\s+/.test(line)) {
      // Continuation of previous header value (RFC 822)
      currentHeaderValue += ' ' + line.trim();
      continue;
    }

    // Finalize previous header if we're starting a new one
    if (currentHeaderName) {
      finalizeHeader();
    }

    // Parse new header
    const match = line.match(HEADER_REGEX);
    if (match) {
      currentHeaderName = match[1].trim();
      currentHeaderValue = match[2].trim();

      // Validate header name (must not be empty and contain valid characters)
      if (currentHeaderName.length === 0) {
        errors.push({
          type: ParserErrorType.INVALID_HEADER,
          message: 'Header name cannot be empty',
          line: lineNumber,
          context: line
        });
        currentHeaderName = null;
        currentHeaderValue = '';
      }
    } else {
      // Invalid header format
      errors.push({
        type: ParserErrorType.INVALID_HEADER,
        message: 'Invalid header format. Expected: "Header-Name: value"',
        line: lineNumber,
        context: line
      });
    }
  }

  // Finalize last header
  finalizeHeader();

  return { headers, errors };
}

export function getContentType(headers: Record<string, string>): string | null {
  // Case-insensitive search for content-type header
  const contentTypeKey = Object.keys(headers).find(
    key => key.toLowerCase() === 'content-type'
  );

  if (contentTypeKey) {
    const value = headers[contentTypeKey];
    // Extract just the media type, ignoring charset and other parameters
    const match = value.match(/^([^;]+)/);
    return match ? match[1].trim() : value.trim();
  }

  return null;
}

export function getHeaderValue(headers: Record<string, string>, headerName: string): string | null {
  // Case-insensitive header lookup
  const key = Object.keys(headers).find(
    k => k.toLowerCase() === headerName.toLowerCase()
  );

  return key ? headers[key] : null;
}
