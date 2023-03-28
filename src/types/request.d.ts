// Types SUPPORTED by the lib
// NOT ALL OF THEM

enum RequestMethod {
  GET = 'GET',
  HEAD = 'HEAD',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  CONNECT = 'CONNECT',
  OPTIONS = 'OPTIONS',
  TRACE = 'TRACE',
  PATCH = 'PATCH',
}

enum RequestContentType {
  XML = 'XML',
  JSON = 'JSON',
  X_WWW_FORM_URL_ENCODED = 'X_WWW_FORM_URL_ENCODED',
}

enum RequestMode {
  CORS = 'cors',
  NO_CORS = 'no-cors',
  SAME_ORIGIN = 'same-origin'
}

enum RequestCache {
  NO_CACHE = 'no-cache',
  RELOAD = 'reload',
  FORCE_CACHE = 'force-cache',
  ONLY_IF_CACHED = 'only-if-cached',
}

enum RequestCredentials {
  SAME_ORIGIN = 'same-origin',
  INCLUDE = 'include',
  OMIT = 'omit'
}

enum RequestRedirect {
  FOLLOW =  'follow',
  MANUAL = 'manual',
  ERROR = 'error',
}

enum RequestReferrerPolicy {
  NO_REFERRER = 'no-referrer',
  NO_REFERRER_WHEN_DOWNGRADE = 'no-referrer-when-downgrade',
  ORIGIN = 'origin',
  ORIGIN_WHEN_CROSS_ORIGIN = 'origin-when-cross-origin',
  SAME_ORIGIN = 'same-origin',
  STRICT_ORIGIN = 'strict-origin',
  STRICT_ORIGIN_WHEN_CROSS_ORIGIN = 'strict-origin-when-cross-origin',
  UNSAFE_URL = 'unsafe-url',
}

