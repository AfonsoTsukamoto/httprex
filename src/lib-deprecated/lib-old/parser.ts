export interface Request  {
  method: RequestMethod;
  body?: string;

  type?: RequestContentType;
  mode?: RequestMode;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  redirect?: RequestCredentials;
  referPolicy?: RequestReferrerPolicy;
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
