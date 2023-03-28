export const EOL_R = /\r?\n/;

// Because isolatedModules

export const RequestMethod: Record<string, RequestMethod> = {
  GET: 'GET' as RequestMethod,
  HEAD: 'HEAD' as RequestMethod,
  POST: 'POST' as RequestMethod,
  PUT: 'PUT' as RequestMethod,
  DELETE: 'DELETE' as RequestMethod,
  CONNECT: 'CONNECT' as RequestMethod,
  OPTIONS: 'OPTIONS' as RequestMethod,
  TRACE: 'TRACE' as RequestMethod,
  PATCH: 'PATCH' as RequestMethod,
}

export const RequestContentType: Record<string, RequestContentType> = {
  XML: 'XML' as RequestContentType,
  JSON: 'JSON' as RequestContentType,
  X_WWW_FORM_URL_ENCODED: 'X_WWW_FORM_URL_ENCODED' as RequestContentType
}

export const RequestMode: Record<string, RequestMode> = {
  CORS: 'cors' as RequestMode,
  NO_CORS: 'no-cors' as RequestMode,
  SAME_ORIGIN: 'same-origin' as RequestMode
}

export const RequestCache: Record<string, RequestCache> = {
  NO_CACHE: 'no-cache' as RequestCache,
  RELOAD: 'reload' as RequestCache,
  FORCE_CACHE: 'force-cache' as RequestCache,
  ONLY_IF_CACHED: 'only-if-cached' as RequestCache,
}

export const RequestCredentials: Record<string, RequestCredentials> = {
  SAME_ORIGIN: 'same-origin' as RequestCredentials,
  INCLUDE: 'include' as RequestCredentials,
  OMIT: 'omit' as RequestCredentials
}

export const RequestRedirect: Record<string, RequestRedirect> = {
  FOLLOW:  'follow' as RequestRedirect,
  MANUAL: 'manual' as RequestRedirect,
  ERROR: 'error' as RequestRedirect,
}

export const RequestReferrerPolicy: Record<string, RequestReferrerPolicy> = {
  NO_REFERRER: 'no-referrer' as RequestReferrerPolicy,
  NO_REFERRER_WHEN_DOWNGRADE: 'no-referrer-when-downgrade' as RequestReferrerPolicy,
  ORIGIN: 'origin' as RequestReferrerPolicy,
  ORIGIN_WHEN_CROSS_ORIGIN: 'origin-when-cross-origin' as RequestReferrerPolicy,
  SAME_ORIGIN: 'same-origin' as RequestReferrerPolicy,
  STRICT_ORIGIN: 'strict-origin' as RequestReferrerPolicy,
  STRICT_ORIGIN_WHEN_CROSS_ORIGIN: 'strict-origin-when-cross-origin' as RequestReferrerPolicy,
  UNSAFE_URL: 'unsafe-url' as RequestReferrerPolicy,
}

