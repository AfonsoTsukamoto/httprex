/**
 * Executor module
 * Handles HTTP request execution
 */

export { executeRequest, createRequestPreview, toCurl, type ExecuteOptions, DEFAULT_EXECUTE_OPTIONS } from './fetch-adapter';
export { formatResponse, formatError, isSuccessStatus, getStatusCategory } from './response';
export { applyCorsStrategy, needsCorsHandling, CORS_PROXIES, type CorsMode, type CorsOptions, DEFAULT_CORS_OPTIONS } from './cors-handler';
