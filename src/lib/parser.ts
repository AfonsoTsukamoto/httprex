export enum Method {
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

export enum ContentType {
  XML = 'XML',
  JSON = 'JSON',
  X_WWW_FORM_URL_ENCODED = 'X_WWW_FORM_URL_ENCODED',
}

export enum Mode {
  CORS = 'cors',
  NO_CORS = 'no-cors',
  SAME_ORIGIN = 'same-origin'
}

export enum Cache {
  NO_CACHE = 'no-cache',
  RELOAD = 'reload',
  FORCE_CACHE = 'force-cache',
  ONLY_IF_CACHED = 'only-if-cached',
}

export enum Credentials {
  SAME_ORIGIN = 'same-origin',
  INCLUDE = 'include',
  OMIT = 'omit'
}

export enum Redirect {
  FOLLOW =  'follow',
  MANUAL = 'manual',
  ERROR = 'error',
}

export enum ReferrerPolicy {
  NO_REFERRER = 'no-referrer',
  NO_REFERRER_WHEN_DOWNGRADE = 'no-referrer-when-downgrade',
  ORIGIN = 'origin',
  ORIGIN_WHEN_CROSS_ORIGIN = 'origin-when-cross-origin',
  SAME_ORIGIN = 'same-origin',
  STRICT_ORIGIN = 'strict-origin',
  STRICT_ORIGIN_WHEN_CROSS_ORIGIN = 'strict-origin-when-cross-origin',
  UNSAFE_URL = 'unsafe-url',
}

export interface Request  {
  method: Method;
  // XXX revisit
  body?: string;

  type?: ContentType;
  mode?: Mode;
  cache?: Cache;
  credentials?: Credentials;
  redirect?: Credentials;
  referPolicy?: ReferrerPolicy;
}

export enum ParserErrorType {
  FAILED_TO_PARSE = 'FAILED_TO_PARSE'
}

export interface ParserError {
  errorType: ParserErrorType;
  message: string;
  explain?: string;
}

export interface ParserRequest {
  request?: Request;
  error?: ParserError;
}

export interface Parser {
  parse: (text: string) => any; //ParserRequest;
}
