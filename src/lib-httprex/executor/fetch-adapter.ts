/**
 * Fetch adapter
 * Wraps the Fetch API with timeout, error handling, and CORS support
 */

import { ParsedRequest, HttpResponse } from '../types';
import { formatResponse, formatError } from './response';
import { applyCorsStrategy, CorsOptions, DEFAULT_CORS_OPTIONS } from './cors-handler';

export interface ExecuteOptions {
  timeout?: number;
  cors?: CorsOptions;
}

export const DEFAULT_EXECUTE_OPTIONS: ExecuteOptions = {
  timeout: 30000, // 30 seconds
  cors: DEFAULT_CORS_OPTIONS
};

export async function executeRequest(
  request: ParsedRequest,
  options: ExecuteOptions = DEFAULT_EXECUTE_OPTIONS
): Promise<HttpResponse> {
  const startTime = Date.now();

  try {
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: request.headers
    };

    // Add body if present and method supports it
    if (request.body && !['GET', 'HEAD'].includes(request.method)) {
      if (typeof request.body === 'string') {
        fetchOptions.body = request.body;
      } else {
        // If body is an object, stringify it
        fetchOptions.body = JSON.stringify(request.body);
      }
    }

    // Apply CORS strategy
    const { url, options: corsOptions } = applyCorsStrategy(
      request.url,
      fetchOptions,
      options.cors || DEFAULT_CORS_OPTIONS
    );

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || DEFAULT_EXECUTE_OPTIONS.timeout
    );

    try {
      // Execute fetch
      const response = await fetch(url, {
        ...corsOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const endTime = Date.now();
      return await formatResponse(response, startTime, endTime);
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        const endTime = Date.now();
        return {
          status: 0,
          statusText: 'Request Timeout',
          headers: {},
          body: {
            error: `Request timed out after ${options.timeout}ms`,
            type: 'TimeoutError'
          },
          timing: {
            start: startTime,
            end: endTime,
            duration: endTime - startTime
          }
        };
      }

      throw error;
    }
  } catch (error) {
    const endTime = Date.now();

    if (error instanceof Error) {
      return formatError(error, startTime, endTime);
    }

    return {
      status: 0,
      statusText: 'Unknown Error',
      headers: {},
      body: {
        error: String(error),
        type: 'UnknownError'
      },
      timing: {
        start: startTime,
        end: endTime,
        duration: endTime - startTime
      }
    };
  }
}

export function createRequestPreview(request: ParsedRequest): string {
  const lines: string[] = [];

  // Request line
  lines.push(`${request.method} ${request.url}`);
  lines.push('');

  // Headers
  for (const [key, value] of Object.entries(request.headers)) {
    lines.push(`${key}: ${value}`);
  }

  // Body
  if (request.body) {
    lines.push('');
    if (typeof request.body === 'string') {
      lines.push(request.body);
    } else {
      lines.push(JSON.stringify(request.body, null, 2));
    }
  }

  return lines.join('\n');
}

export function toCurl(request: ParsedRequest): string {
  const parts: string[] = ['curl'];

  // Method
  if (request.method !== 'GET') {
    parts.push(`-X ${request.method}`);
  }

  // Headers
  for (const [key, value] of Object.entries(request.headers)) {
    parts.push(`-H "${key}: ${value}"`);
  }

  // Body
  if (request.body) {
    const bodyStr = typeof request.body === 'string'
      ? request.body
      : JSON.stringify(request.body);
    parts.push(`-d '${bodyStr.replace(/'/g, "\\'")}'`);
  }

  // URL (last)
  parts.push(`"${request.url}"`);

  return parts.join(' \\\n  ');
}
