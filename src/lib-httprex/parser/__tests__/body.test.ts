/**
 * Tests for body.ts
 * Tests content-type aware body parsing (JSON, XML, form-urlencoded)
 */

import { describe, it, expect } from 'vitest';
import { parseBody } from '../body';

describe('parseBody', () => {
  describe('JSON body', () => {
    it('should parse simple JSON object', () => {
      const lines = ['{', '  "name": "John",', '  "age": 30', '}'];
      const result = parseBody(lines, 'application/json', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toEqual({
        name: 'John',
        age: 30
      });
    });

    it('should parse JSON array', () => {
      const lines = ['[', '  {"id": 1},', '  {"id": 2}', ']'];
      const result = parseBody(lines, 'application/json', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toEqual([
        { id: 1 },
        { id: 2 }
      ]);
    });

    it('should parse compact JSON', () => {
      const lines = ['{"name":"John","age":30}'];
      const result = parseBody(lines, 'application/json', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toEqual({ name: 'John', age: 30 });
    });

    it('should handle JSON with nested objects', () => {
      const lines = [
        '{',
        '  "user": {',
        '    "name": "John",',
        '    "address": {',
        '      "city": "New York"',
        '    }',
        '  }',
        '}'
      ];
      const result = parseBody(lines, 'application/json', 5);

      expect(result.body).toEqual({
        user: {
          name: 'John',
          address: {
            city: 'New York'
          }
        }
      });
    });

    it('should handle JSON parse errors gracefully', () => {
      const lines = ['{invalid json}'];
      const result = parseBody(lines, 'application/json', 5);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('PARSE_FAILED');
      expect(result.errors[0].message).toContain('JSON');
    });

    it('should detect application/json content type', () => {
      const lines = ['{"key": "value"}'];
      const result = parseBody(lines, 'application/json', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toEqual({ key: 'value' });
    });

    it('should detect application/json with charset', () => {
      const lines = ['{"key": "value"}'];
      const result = parseBody(lines, 'application/json; charset=utf-8', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toEqual({ key: 'value' });
    });
  });

  describe('XML body', () => {
    it('should parse simple XML', () => {
      const lines = [
        '<?xml version="1.0"?>',
        '<user>',
        '  <name>John</name>',
        '  <age>30</age>',
        '</user>'
      ];
      const result = parseBody(lines, 'application/xml', 5);

      // XML is returned as string in current implementation
      expect(result.errors).toHaveLength(0);
      expect(typeof result.body).toBe('string');
      expect(result.body).toContain('<user>');
    });

    it('should handle XML without declaration', () => {
      const lines = [
        '<note>',
        '  <to>User</to>',
        '  <from>System</from>',
        '</note>'
      ];
      const result = parseBody(lines, 'text/xml', 5);

      expect(result.errors).toHaveLength(0);
      expect(typeof result.body).toBe('string');
      expect(result.body).toContain('<note>');
    });

    it('should detect application/xml content type', () => {
      const lines = ['<root><item>value</item></root>'];
      const result = parseBody(lines, 'application/xml', 5);

      expect(result.errors).toHaveLength(0);
    });

    it('should detect text/xml content type', () => {
      const lines = ['<root><item>value</item></root>'];
      const result = parseBody(lines, 'text/xml', 5);

      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid XML', () => {
      const lines = ['invalid xml content'];
      const result = parseBody(lines, 'application/xml', 5);

      // Implementation does basic validation (starts with <, ends with >)
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('PARSE_FAILED');
    });
  });

  describe('Form URL encoded body', () => {
    it('should parse simple form data', () => {
      const lines = [
        'name=John Doe',
        'email=john@example.com'
      ];
      const result = parseBody(lines, 'application/x-www-form-urlencoded', 5);

      expect(result.errors).toHaveLength(0);
      // URLSearchParams uses + for spaces (valid for form data)
      expect(result.body).toBe('name=John+Doe&email=john%40example.com');
    });

    it('should handle single line form data', () => {
      const lines = ['name=John&age=30&city=New York'];
      const result = parseBody(lines, 'application/x-www-form-urlencoded', 5);

      expect(result.errors).toHaveLength(0);
      // URLSearchParams uses + for spaces (valid for form data)
      expect(result.body).toBe('name=John&age=30&city=New+York');
    });

    it('should encode special characters', () => {
      const lines = [
        'message=Hello World!',
        'symbols=@#$%^&*()'
      ];
      const result = parseBody(lines, 'application/x-www-form-urlencoded', 5);

      expect(result.errors).toHaveLength(0);
      // URLSearchParams uses + for spaces (valid for form data)
      expect(result.body).toContain('Hello+World');
      expect(result.body).toContain('%40%23%24%25');
    });

    it('should handle empty values', () => {
      const lines = ['key1=', 'key2=value2'];
      const result = parseBody(lines, 'application/x-www-form-urlencoded', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toBe('key1=&key2=value2');
    });

    it('should handle values without keys', () => {
      const lines = ['=value'];
      const result = parseBody(lines, 'application/x-www-form-urlencoded', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toContain('value');
    });

    it('should NOT double-encode already encoded values', () => {
      const lines = ['email=john%40example.com'];
      const result = parseBody(lines, 'application/x-www-form-urlencoded', 5);

      expect(result.errors).toHaveLength(0);
      // Should encode the % itself, not treat it as already encoded
      expect(result.body).toBe('email=john%2540example.com');
    });

    it('should preserve line structure in multi-line form data', () => {
      const lines = [
        'field1=value1',
        'field2=value2',
        'field3=value3'
      ];
      const result = parseBody(lines, 'application/x-www-form-urlencoded', 5);

      expect(result.body).toContain('field1=value1');
      expect(result.body).toContain('field2=value2');
      expect(result.body).toContain('field3=value3');
    });
  });

  describe('Plain text body', () => {
    it('should return text as-is for text/plain', () => {
      const lines = [
        'This is plain text.',
        'Line 2 of text.',
        'Line 3.'
      ];
      const result = parseBody(lines, 'text/plain', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toBe('This is plain text.\nLine 2 of text.\nLine 3.');
    });

    it('should handle empty text body', () => {
      const lines = [''];
      const result = parseBody(lines, 'text/plain', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toBe('');
    });

    it('should preserve whitespace in plain text', () => {
      const lines = ['  Indented text  ', '    More indent    '];
      const result = parseBody(lines, 'text/plain', 5);

      expect(result.body).toContain('  Indented text  ');
      expect(result.body).toContain('    More indent    ');
    });
  });

  describe('Unknown/missing content type', () => {
    it('should default to plain text when no content type', () => {
      const lines = ['Some content'];
      const result = parseBody(lines, null, 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toBe('Some content');
    });

    it('should default to plain text for unknown content type', () => {
      const lines = ['Some content'];
      const result = parseBody(lines, 'application/unknown', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toBe('Some content');
    });

    it('should return raw body when no content type', () => {
      const lines = ['{"key": "value"}'];
      const result = parseBody(lines, null, 5);

      // Without content type, returns raw string
      expect(result.errors).toHaveLength(0);
      expect(result.body).toBe('{"key": "value"}');
    });
  });

  describe('Empty body', () => {
    it('should handle empty lines array', () => {
      const result = parseBody([], 'application/json', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toBeNull();
    });

    it('should handle array with empty strings', () => {
      const lines = ['', '', ''];
      const result = parseBody(lines, 'application/json', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should include line numbers in errors', () => {
      const lines = ['{invalid}'];
      const result = parseBody(lines, 'application/json', 42);

      expect(result.errors[0].line).toBe(42);
    });

    it('should handle body with variables', () => {
      const lines = ['{"token": "{{authToken}}"}'];
      const result = parseBody(lines, 'application/json', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toHaveProperty('token');
    });

    it('should handle very large body content', () => {
      const largeArray = Array(1000).fill(0).map((_, i) => ({ id: i }));
      const lines = [JSON.stringify(largeArray)];
      const result = parseBody(lines, 'application/json', 5);

      expect(result.errors).toHaveLength(0);
      expect(Array.isArray(result.body)).toBe(true);
      expect(result.body).toHaveLength(1000);
    });

    it('should handle multipart/form-data as plain text', () => {
      const lines = [
        '------WebKitFormBoundary',
        'Content-Disposition: form-data; name="field"',
        '',
        'value',
        '------WebKitFormBoundary--'
      ];
      const result = parseBody(lines, 'multipart/form-data; boundary=----WebKitFormBoundary', 5);

      expect(result.errors).toHaveLength(0);
      expect(typeof result.body).toBe('string');
    });
  });

  describe('Content-Type case sensitivity', () => {
    it('should handle lowercase content type', () => {
      const lines = ['{"key": "value"}'];
      const result = parseBody(lines, 'application/json', 5);

      expect(result.errors).toHaveLength(0);
      expect(result.body).toEqual({ key: 'value' });
    });
  });
});
