/**
 * Response formatting utilities
 * Handles HTTP response parsing and formatting
 */

import { HttpResponse } from '../types';

export async function formatResponse(
  response: Response,
  startTime: number,
  endTime: number
): Promise<HttpResponse> {
  // Extract headers
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Determine content type
  const contentType = response.headers.get('content-type') || '';

  // Parse body based on content type
  let body: string | Record<string, any>;

  try {
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else if (contentType.includes('text/')) {
      body = await response.text();
    } else {
      // For binary or unknown content types, get as text
      body = await response.text();
    }
  } catch (error) {
    // If parsing fails, try to get as text
    try {
      body = await response.text();
    } catch {
      body = `[Failed to parse response body: ${error instanceof Error ? error.message : String(error)}]`;
    }
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    body,
    timing: {
      start: startTime,
      end: endTime,
      duration: endTime - startTime
    }
  };
}

export function formatError(error: Error, startTime: number, endTime: number): HttpResponse {
  return {
    status: 0,
    statusText: 'Network Error',
    headers: {},
    body: {
      error: error.message,
      type: error.name,
      details: error.stack
    },
    timing: {
      start: startTime,
      end: endTime,
      duration: endTime - startTime
    }
  };
}

export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

export function getStatusCategory(status: number): string {
  if (status >= 100 && status < 200) return 'Informational';
  if (status >= 200 && status < 300) return 'Success';
  if (status >= 300 && status < 400) return 'Redirection';
  if (status >= 400 && status < 500) return 'Client Error';
  if (status >= 500 && status < 600) return 'Server Error';
  return 'Unknown';
}
