/**
 * Request line parser
 * Parses: METHOD URL [HTTP/VERSION]
 */

import { RequestMethod, ParserError, ParserErrorType } from '../types';

export interface ParsedRequestLine {
  method: RequestMethod;
  url: string;
  httpVersion?: string;
}

const VALID_METHODS: RequestMethod[] = [
  'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'
];

const HTTP_VERSION_REGEX = /HTTP\/\d\.\d$/;

export function parseRequestLine(line: string): { data: ParsedRequestLine | null; errors: ParserError[] } {
  const errors: ParserError[] = [];

  if (!line || line.trim().length === 0) {
    errors.push({
      type: ParserErrorType.SYNTAX_ERROR,
      message: 'Request line is empty',
      line: 1,
      context: line
    });
    return { data: null, errors };
  }

  const trimmedLine = line.trim();
  const parts = trimmedLine.split(/\s+/);

  // Check if we have at least a URL (method is optional, defaults to GET)
  if (parts.length === 0) {
    errors.push({
      type: ParserErrorType.SYNTAX_ERROR,
      message: 'Invalid request line format',
      line: 1,
      context: line
    });
    return { data: null, errors };
  }

  let method: RequestMethod;
  let url: string;
  let httpVersion: string | undefined;

  // Case 1: Just URL (e.g., "https://example.com/api")
  if (parts.length === 1) {
    method = 'GET';
    url = parts[0];
  }
  // Case 2: METHOD URL or URL HTTP/VERSION
  else if (parts.length === 2) {
    // Check if first part is a valid HTTP method
    if (VALID_METHODS.includes(parts[0].toUpperCase() as RequestMethod)) {
      method = parts[0].toUpperCase() as RequestMethod;
      url = parts[1];
    }
    // Check if second part is HTTP version
    else if (HTTP_VERSION_REGEX.test(parts[1])) {
      method = 'GET';
      url = parts[0];
      httpVersion = parts[1];
    }
    // Otherwise, treat first as method, second as URL
    else {
      const potentialMethod = parts[0].toUpperCase();
      if (VALID_METHODS.includes(potentialMethod as RequestMethod)) {
        method = potentialMethod as RequestMethod;
      } else {
        errors.push({
          type: ParserErrorType.INVALID_METHOD,
          message: `Invalid HTTP method: ${parts[0]}. Valid methods are: ${VALID_METHODS.join(', ')}`,
          line: 1,
          column: 0,
          context: line
        });
        method = 'GET'; // Default fallback
      }
      url = parts[1];
    }
  }
  // Case 3: METHOD URL HTTP/VERSION
  else if (parts.length >= 3) {
    const potentialMethod = parts[0].toUpperCase();
    if (VALID_METHODS.includes(potentialMethod as RequestMethod)) {
      method = potentialMethod as RequestMethod;
    } else {
      errors.push({
        type: ParserErrorType.INVALID_METHOD,
        message: `Invalid HTTP method: ${parts[0]}. Valid methods are: ${VALID_METHODS.join(', ')}`,
        line: 1,
        column: 0,
        context: line
      });
      method = 'GET'; // Default fallback
    }
    url = parts[1];

    // Check if last part is HTTP version
    if (HTTP_VERSION_REGEX.test(parts[parts.length - 1])) {
      httpVersion = parts[parts.length - 1];
    }
  }
  else {
    method = 'GET';
    url = parts[0];
  }

  // Validate URL format (basic check)
  if (!url || url.length === 0) {
    errors.push({
      type: ParserErrorType.INVALID_URL,
      message: 'URL is empty',
      line: 1,
      context: line
    });
    return { data: null, errors };
  }

  // Check for valid URL format (http://, https://, absolute path, or contains variables)
  const hasVariable = /\{\{.+?\}\}/.test(url);
  const isValidUrl = /^https?:\/\/.+/.test(url) || url.startsWith('/') || hasVariable;
  if (!isValidUrl) {
    errors.push({
      type: ParserErrorType.INVALID_URL,
      message: `Invalid URL format: ${url}. URL must start with http://, https://, /, or contain variables {{...}}`,
      line: 1,
      context: line
    });
  }

  return {
    data: {
      method,
      url,
      httpVersion
    },
    errors
  };
}
