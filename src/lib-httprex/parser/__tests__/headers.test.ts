/**
 * Tests for headers.ts
 * Tests parsing of HTTP headers with multi-line support
 */

import { describe, it, expect } from 'vitest';
import { parseHeaders } from '../headers';

describe('parseHeaders', () => {
  describe('Single headers', () => {
    it('should parse simple header', () => {
      const lines = ['Content-Type: application/json'];
      const result = parseHeaders(lines, 2);

      expect(result.headers).toEqual({
        'content-type': 'application/json'
      });
      expect(result.errors).toHaveLength(0);
    });

    it('should parse multiple headers', () => {
      const lines = [
        'Content-Type: application/json',
        'Authorization: Bearer token123',
        'Accept: application/json'
      ];
      const result = parseHeaders(lines, 2);

      expect(result.headers).toEqual({
        'content-type': 'application/json',
        'authorization': 'Bearer token123',
        'accept': 'application/json'
      });
    });

    it('should handle empty header value', () => {
      const lines = ['X-Custom-Header:'];
      const result = parseHeaders(lines, 2);

      expect(result.headers['x-custom-header']).toBe('');
    });
  });

  describe('Multi-line headers (RFC 822 continuation)', () => {
    it('should parse multi-line header with leading space', () => {
      const lines = [
        'Accept: application/json,',
        '  application/xml,',
        '  text/plain'
      ];
      const result = parseHeaders(lines, 2);

      expect(result.headers['accept']).toContain('application/json');
      expect(result.headers['accept']).toContain('application/xml');
      expect(result.headers['accept']).toContain('text/plain');
    });
  });

  describe('Duplicate headers', () => {
    it('should concatenate duplicate headers with comma', () => {
      const lines = [
        'Accept: application/json',
        'Accept: text/plain'
      ];
      const result = parseHeaders(lines, 2);

      expect(result.headers['accept']).toBe('application/json, text/plain');
    });

    it('should concatenate set-cookie headers with newline', () => {
      const lines = [
        'Set-Cookie: session=abc123',
        'Set-Cookie: user=john'
      ];
      const result = parseHeaders(lines, 2);

      expect(result.headers['set-cookie']).toContain('session=abc123');
      expect(result.headers['set-cookie']).toContain('user=john');
    });
  });

  describe('Header parsing termination', () => {
    it('should stop at empty line', () => {
      const lines = [
        'Content-Type: application/json',
        '',
        'This is body content'
      ];
      const result = parseHeaders(lines, 2);

      expect(Object.keys(result.headers)).toHaveLength(1);
    });
  });

  describe('Invalid headers', () => {
    it('should generate error for empty header name', () => {
      const lines = [': value'];
      const result = parseHeaders(lines, 2);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_HEADER');
    });

    it('should generate error for header without colon', () => {
      const lines = ['InvalidHeaderWithoutColon'];
      const result = parseHeaders(lines, 2);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_HEADER');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty lines array', () => {
      const result = parseHeaders([], 2);

      expect(Object.keys(result.headers)).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle headers with variables', () => {
      const lines = ['Authorization: Bearer {{token}}'];
      const result = parseHeaders(lines, 2);

      expect(result.headers['authorization']).toBe('Bearer {{token}}');
    });
  });
});
