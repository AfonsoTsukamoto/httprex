/**
 * Core type definitions for the httprex library
 * Compatible with VSCode REST Client format
 */

export type RequestMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH';

export type ContentType =
  | 'application/json'
  | 'application/xml'
  | 'application/x-www-form-urlencoded'
  | 'text/plain'
  | string;

export interface VariableReference {
  name: string;
  line: number;
  column: number;
}

export interface ParsedRequest {
  method: RequestMethod;
  url: string;
  headers: Record<string, string>;
  body?: string | Record<string, any> | null;
  variables: VariableReference[];  // Unresolved {{varName}} references
  name?: string;  // Optional request name from # @name
  raw: {
    requestLine: string;
    headerLines: string[];
    bodyLines: string[];
  };
}

export interface ParsedRequestFile {
  requests: ParsedRequest[];
  fileVariables: Record<string, string>;  // @varName = value
  errors: ParserError[];
}

export interface ExecutedRequest extends ParsedRequest {
  response?: HttpResponse;
  executionTime?: number;
  error?: string;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string | Record<string, any>;
  timing: {
    start: number;
    end: number;
    duration: number;
  };
}

export enum ParserErrorType {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  INVALID_METHOD = 'INVALID_METHOD',
  INVALID_URL = 'INVALID_URL',
  INVALID_HEADER = 'INVALID_HEADER',
  PARSE_FAILED = 'PARSE_FAILED'
}

export interface ParserError {
  type: ParserErrorType;
  message: string;
  line?: number;
  column?: number;
  context?: string;
}

export type ParserResult<T> =
  | { success: true; data: T; errors: ParserError[] }
  | { success: false; data: null; errors: ParserError[] };

export interface HttprexOptions {
  selector?: string;
  cors?: {
    proxyUrl?: string;
    mode: 'proxy' | 'no-cors' | 'cors';
  };
  timeout?: number;
  variableStorage?: any; // VariableStorage interface from storage.ts
}

export interface VariableContext {
  fromFile?: Record<string, string>;
  fromEnvironment?: Record<string, string>;
  fromSystem?: Record<string, string>;
}
