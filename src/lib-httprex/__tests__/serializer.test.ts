/**
 * Tests for serializer.ts
 * Verifies that serializeRequest() produces valid HTTP text
 */

import { describe, test, expect } from 'bun:test';
import { serializeRequest } from '../serializer';
import { httpParser } from '../parser/index';

describe('serializeRequest', () => {
  describe('basic serialization', () => {
    test('should serialize simple GET with just URL', () => {
      const result = serializeRequest({
        method: 'GET',
        url: 'https://api.example.com/users',
      });

      expect(result).toBe('GET https://api.example.com/users');
    });

    test('should serialize GET with headers', () => {
      const result = serializeRequest({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [
          { key: 'Accept', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer token123' },
        ],
      });

      expect(result).toBe(
        'GET https://api.example.com/users\n' +
          'Accept: application/json\n' +
          'Authorization: Bearer token123'
      );
    });

    test('should serialize POST with headers and JSON body', () => {
      const result = serializeRequest({
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
        body: '{"name": "John"}',
      });

      expect(result).toBe(
        'POST https://api.example.com/users\n' +
          'Content-Type: application/json\n' +
          '\n' +
          '{"name": "John"}'
      );
    });

    test('should serialize request with body but no headers', () => {
      const result = serializeRequest({
        method: 'POST',
        url: 'https://api.example.com/users',
        body: '{"name": "John"}',
      });

      expect(result).toBe(
        'POST https://api.example.com/users\n' +
          '\n' +
          '{"name": "John"}'
      );
    });

    test('should handle headers as Record<string, string>', () => {
      const result = serializeRequest({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {
          Accept: 'application/json',
          'X-Custom': 'value',
        },
      });

      expect(result).toContain('Accept: application/json');
      expect(result).toContain('X-Custom: value');
      expect(result).toStartWith('GET https://api.example.com/users\n');
    });

    test('should handle empty headers array', () => {
      const result = serializeRequest({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [],
      });

      expect(result).toBe('GET https://api.example.com/users');
    });

    test('should handle empty headers object', () => {
      const result = serializeRequest({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
      });

      expect(result).toBe('GET https://api.example.com/users');
    });

    test('should handle undefined headers and body', () => {
      const result = serializeRequest({
        method: 'DELETE',
        url: 'https://api.example.com/users/1',
      });

      expect(result).toBe('DELETE https://api.example.com/users/1');
    });
  });

  describe('variable preservation', () => {
    test('should preserve {{variables}} in URL', () => {
      const result = serializeRequest({
        method: 'GET',
        url: 'https://api.example.com/users/{{userId}}',
      });

      expect(result).toContain('{{userId}}');
    });

    test('should preserve {{variables}} in headers', () => {
      const result = serializeRequest({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
      });

      expect(result).toContain('Bearer {{token}}');
    });

    test('should preserve {{variables}} in body', () => {
      const result = serializeRequest({
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
        body: '{"name": "{{userName}}", "role": "{{userRole}}"}',
      });

      expect(result).toContain('{{userName}}');
      expect(result).toContain('{{userRole}}');
    });

    test('should preserve {{variables}} in URL, headers, and body simultaneously', () => {
      const result = serializeRequest({
        method: 'POST',
        url: 'https://{{host}}/api/v{{version}}/users',
        headers: [
          { key: 'Authorization', value: 'Bearer {{token}}' },
          { key: 'Content-Type', value: 'application/json' },
        ],
        body: '{"name": "{{userName}}"}',
      });

      expect(result).toContain('{{host}}');
      expect(result).toContain('{{version}}');
      expect(result).toContain('{{token}}');
      expect(result).toContain('{{userName}}');
    });
  });

  describe('round-trip: serializeRequest -> parse', () => {
    test('should round-trip a simple GET request', () => {
      const parts = {
        method: 'GET',
        url: 'https://api.example.com/users?limit=10',
      };

      const serialized = serializeRequest(parts);
      const parsed = httpParser.parse(serialized);

      expect(parsed.success).toBe(true);
      expect(parsed.data?.method).toBe('GET');
      expect(parsed.data?.url).toBe('https://api.example.com/users?limit=10');
    });

    test('should round-trip a GET request with headers', () => {
      const parts = {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [
          { key: 'Accept', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer token123' },
        ],
      };

      const serialized = serializeRequest(parts);
      const parsed = httpParser.parse(serialized);

      expect(parsed.success).toBe(true);
      expect(parsed.data?.method).toBe('GET');
      expect(parsed.data?.url).toBe('https://api.example.com/users');
      // Parser lowercases header keys
      expect(parsed.data?.headers['accept']).toBe('application/json');
      expect(parsed.data?.headers['authorization']).toBe('Bearer token123');
    });

    test('should round-trip a POST request with headers and body', () => {
      const parts = {
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
        body: '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
      };

      const serialized = serializeRequest(parts);
      const parsed = httpParser.parse(serialized);

      expect(parsed.success).toBe(true);
      expect(parsed.data?.method).toBe('POST');
      expect(parsed.data?.headers['content-type']).toBe('application/json');
      expect(parsed.data?.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    test('should round-trip a request with {{variables}} preserved', () => {
      const parts = {
        method: 'GET',
        url: 'https://api.example.com/users/{{userId}}',
        headers: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
      };

      const serialized = serializeRequest(parts);
      const parsed = httpParser.parse(serialized);

      expect(parsed.success).toBe(true);
      expect(parsed.data?.url).toBe('https://api.example.com/users/{{userId}}');
      expect(parsed.data?.headers['authorization']).toBe('Bearer {{token}}');
      // Variables should be detected
      expect(parsed.data?.variables).toBeDefined();
      expect(parsed.data!.variables.length).toBeGreaterThan(0);
    });
  });
});
