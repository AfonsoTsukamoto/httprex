/**
 * CORS handling strategies
 * Provides options for dealing with CORS restrictions
 */

export type CorsMode = 'cors' | 'no-cors' | 'proxy';

export interface CorsOptions {
  mode: CorsMode;
  proxyUrl?: string;
}

export const DEFAULT_CORS_OPTIONS: CorsOptions = {
  mode: 'cors'
};

/**
 * Determines if a request URL needs CORS handling
 */
export function needsCorsHandling(url: string): boolean {
  try {
    const requestUrl = new URL(url);
    const currentOrigin = window.location.origin;
    const requestOrigin = requestUrl.origin;

    // Same origin doesn't need CORS handling
    return currentOrigin !== requestOrigin;
  } catch {
    // Invalid URL, let it fail naturally
    return false;
  }
}

/**
 * Applies CORS strategy to request options
 */
export function applyCorsStrategy(
  url: string,
  options: RequestInit,
  corsOptions: CorsOptions
): { url: string; options: RequestInit } {
  // If not cross-origin, return as-is
  if (!needsCorsHandling(url)) {
    return { url, options };
  }

  switch (corsOptions.mode) {
    case 'proxy':
      // Use CORS proxy if provided
      if (corsOptions.proxyUrl) {
        return {
          url: `${corsOptions.proxyUrl}${url}`,
          options: {
            ...options,
            mode: 'cors'
          }
        };
      }
      // Fall through to cors mode if no proxy URL
      return {
        url,
        options: {
          ...options,
          mode: 'cors'
        }
      };

    case 'no-cors':
      // Use no-cors mode (limited - can't read response)
      return {
        url,
        options: {
          ...options,
          mode: 'no-cors'
        }
      };

    case 'cors':
    default:
      // Standard CORS request
      return {
        url,
        options: {
          ...options,
          mode: 'cors'
        }
      };
  }
}

/**
 * Common CORS proxy services (for reference)
 * Users should provide their own proxy URL
 */
export const CORS_PROXIES = {
  corsAnywhere: 'https://cors-anywhere.herokuapp.com/',
  allOrigins: 'https://api.allorigins.win/raw?url=',
  corsBridged: 'https://corsbridged.com/'
};
