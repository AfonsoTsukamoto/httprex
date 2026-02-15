/**
 * Main HTTP parser
 * Combines all parsing modules into a cohesive parser
 * Compatible with VSCode REST Client format
 */

import {
  ParsedRequest,
  ParsedRequestFile,
  ParserResult,
  ParserError,
  ParserErrorType
} from '../types';

import { parseRequestLine } from './request-line';
import { parseHeaders, getContentType } from './headers';
import { parseBody } from './body';
import { extractVariables, extractFileVariables } from './lexer';
import { splitRequests, removeComments, extractRequestName } from './separators';

export class HttpParser {
  parse(text: string): ParserResult<ParsedRequest> {
    const errors: ParserError[] = [];

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        data: null,
        errors: [{
          type: ParserErrorType.PARSE_FAILED,
          message: 'Input text is empty',
          line: 1
        }]
      };
    }

    const lines = text.split('\n');

    // Extract variables
    const { variables } = extractVariables(text, 1);

    // Remove comments but keep track of request name
    const requestName = extractRequestName(lines);
    const cleanLines = removeComments(lines);

    if (cleanLines.length === 0) {
      return {
        success: false,
        data: null,
        errors: [{
          type: ParserErrorType.PARSE_FAILED,
          message: 'No content found after removing comments',
          line: 1
        }]
      };
    }

    // Parse request line
    const requestLineResult = parseRequestLine(cleanLines[0]);
    errors.push(...requestLineResult.errors);

    if (!requestLineResult.data) {
      return {
        success: false,
        data: null,
        errors
      };
    }

    const { method, url, httpVersion } = requestLineResult.data;

    // Parse headers (everything from line 2 until empty line or end)
    let headerEndIndex = cleanLines.length; // Default to end of file
    for (let i = 1; i < cleanLines.length; i++) {
      if (cleanLines[i].trim().length === 0) {
        headerEndIndex = i;
        break;
      }
    }

    const headerLines = cleanLines.slice(1, headerEndIndex);
    const headersResult = parseHeaders(headerLines, 2);
    errors.push(...headersResult.errors);

    // Parse body (everything after first empty line)
    const bodyStartIndex = headerEndIndex + 1;
    const bodyLines = bodyStartIndex < cleanLines.length
      ? cleanLines.slice(bodyStartIndex)
      : [];

    const contentType = getContentType(headersResult.headers);
    const bodyResult = parseBody(bodyLines, contentType, bodyStartIndex + 1);
    errors.push(...bodyResult.errors);

    const request: ParsedRequest = {
      method,
      url,
      headers: headersResult.headers,
      body: bodyResult.body,
      variables,
      name: requestName,
      raw: {
        requestLine: cleanLines[0],
        headerLines,
        bodyLines
      }
    };

    // Check for critical errors (INVALID_METHOD, INVALID_URL, PARSE_FAILED)
    const hasCriticalError = errors.some(e =>
      e.type === ParserErrorType.PARSE_FAILED ||
      e.type === ParserErrorType.INVALID_METHOD ||
      e.type === ParserErrorType.INVALID_URL
    );

    if (hasCriticalError) {
      return {
        success: false as const,
        data: null,
        errors
      };
    }

    return {
      success: true as const,
      data: request,
      errors
    };
  }

  parseFile(text: string): ParserResult<ParsedRequestFile> {
    const allErrors: ParserError[] = [];

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        data: null,
        errors: [{
          type: ParserErrorType.PARSE_FAILED,
          message: 'Input text is empty',
          line: 1
        }]
      };
    }

    // Extract file-level variables (@varName = value)
    const lines = text.split('\n');
    const fileVars = extractFileVariables(lines);
    const fileVariables: Record<string, string> = {};
    fileVars.forEach(v => {
      fileVariables[v.name] = v.value;
    });

    // Split into multiple requests by ### separator
    const blocks = splitRequests(text);

    if (blocks.length === 0) {
      return {
        success: false,
        data: null,
        errors: [{
          type: ParserErrorType.PARSE_FAILED,
          message: 'No requests found in file',
          line: 1
        }]
      };
    }

    // Parse each request block
    const requests: ParsedRequest[] = [];
    for (const block of blocks) {
      const result = this.parse(block.content);
      if (result.data) {
        // Override name if block has one
        if (block.name) {
          result.data.name = block.name;
        }
        requests.push(result.data);
      }
      allErrors.push(...result.errors);
    }

    if (requests.length === 0) {
      return {
        success: false as const,
        data: null,
        errors: allErrors
      };
    }

    return {
      success: true as const,
      data: {
        requests,
        fileVariables,
        errors: allErrors
      },
      errors: allErrors
    };
  }
}

// Export a singleton instance
export const httpParser = new HttpParser();
