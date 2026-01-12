/**
 * Tests for request-line.ts
 * Tests parsing of HTTP request line: METHOD URL [HTTP/VERSION]
 */

import { describe, it, expect } from 'vitest';
import { parseRequestLine } from '../request-line';

describe('parseRequestLine', () => {
  describe('Valid request lines', () => {
    it('should parse GET request with URL', () => {
      const result = parseRequestLine('GET https://api.example.com/users', 1);

      expect(result.success).toBe(true);
      expect(result.method).toBe('GET');
      expect(result.url).toBe('https://api.example.com/users');
      expect(result.version).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should parse POST request with URL and HTTP version', () => {
      const result = parseRequestLine('POST https://api.example.com/users HTTP/1.1', 1);

      expect(result.success).toBe(true);
      expect(result.method).toBe('POST');
      expect(result.url).toBe('https://api.example.com/users');
      expect(result.version).toBe('HTTP/1.1');
    });

    it('should parse all supported HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'];

      methods.forEach(method => {
        const result = parseRequestLine(`${method} https://example.com`, 1);
        expect(result.success).toBe(true);
        expect(result.method).toBe(method);
      });
    });

    it('should parse URL with query parameters', () => {
      const result = parseRequestLine('GET https://api.example.com/search?q=test&limit=10', 1);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://api.example.com/search?q=test&limit=10');
    });

    it('should parse URL with path parameters', () => {
      const result = parseRequestLine('GET https://api.example.com/users/123/posts/456', 1);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://api.example.com/users/123/posts/456');
    });

    it('should parse URL with fragment', () => {
      const result = parseRequestLine('GET https://example.com/page#section', 1);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/page#section');
    });

    it('should parse URL with port', () => {
      const result = parseRequestLine('GET http://localhost:3000/api/data', 1);

      expect(result.success).toBe(true);
      expect(result.url).toBe('http://localhost:3000/api/data');
    });

    it('should handle lowercase method names', () => {
      const result = parseRequestLine('get https://example.com', 1);

      expect(result.success).toBe(true);
      expect(result.method).toBe('GET');
    });

    it('should handle mixed case method names', () => {
      const result = parseRequestLine('GeT https://example.com', 1);

      expect(result.success).toBe(true);
      expect(result.method).toBe('GET');
    });
  });

  describe('Invalid request lines', () => {
    it('should fail on empty line', () => {
      const result = parseRequestLine('', 1);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('SYNTAX_ERROR');
    });

    it('should fail on invalid HTTP method', () => {
      const result = parseRequestLine('INVALID https://example.com', 1);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_METHOD');
      expect(result.errors[0].message).toContain('INVALID');
    });

    it('should fail on missing URL', () => {
      const result = parseRequestLine('GET', 1);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('SYNTAX_ERROR');
    });

    it('should fail on invalid URL (no protocol)', () => {
      const result = parseRequestLine('GET example.com/api', 1);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_URL');
    });

    it('should fail on malformed URL', () => {
      const result = parseRequestLine('GET ht!tp://invalid url.com', 1);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_URL');
    });
  });

  describe('Edge cases', () => {
    it('should handle extra whitespace between parts', () => {
      const result = parseRequestLine('GET    https://example.com    HTTP/1.1', 1);

      expect(result.success).toBe(true);
      expect(result.method).toBe('GET');
      expect(result.url).toBe('https://example.com');
      expect(result.version).toBe('HTTP/1.1');
    });

    it('should handle leading whitespace', () => {
      const result = parseRequestLine('   GET https://example.com', 1);

      expect(result.success).toBe(true);
      expect(result.method).toBe('GET');
    });

    it('should handle trailing whitespace', () => {
      const result = parseRequestLine('GET https://example.com   ', 1);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com');
    });

    it('should include line number in errors', () => {
      const result = parseRequestLine('INVALID https://example.com', 42);

      expect(result.success).toBe(false);
      expect(result.errors[0].line).toBe(42);
    });

    it('should handle HTTP/2 version', () => {
      const result = parseRequestLine('GET https://example.com HTTP/2', 1);

      expect(result.success).toBe(true);
      expect(result.version).toBe('HTTP/2');
    });

    it('should handle URLs with variables', () => {
      const result = parseRequestLine('GET https://{{baseUrl}}/users/{{userId}}', 1);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://{{baseUrl}}/users/{{userId}}');
    });
  });

  describe('Protocol variations', () => {
    it('should accept https URLs', () => {
      const result = parseRequestLine('GET https://example.com', 1);
      expect(result.success).toBe(true);
    });

    it('should accept http URLs', () => {
      const result = parseRequestLine('GET http://example.com', 1);
      expect(result.success).toBe(true);
    });

    it('should accept ws URLs', () => {
      const result = parseRequestLine('GET ws://example.com', 1);
      expect(result.success).toBe(true);
    });

    it('should accept wss URLs', () => {
      const result = parseRequestLine('GET wss://example.com', 1);
      expect(result.success).toBe(true);
    });
  });
});
