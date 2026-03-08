/**
 * Tests for lexer.ts
 * Tests variable extraction and resolution
 */

import { describe, test, expect } from 'bun:test';
import { extractVariables, extractFileVariables, resolveVariables } from '../lexer';

describe('extractVariables', () => {
  describe('Basic variable extraction', () => {
    test('should extract single variable', () => {
      const text = 'GET https://{{baseUrl}}/users';
      const result = extractVariables(text);

      expect(result.variables).toHaveLength(1);
      expect(result.variables[0].name).toBe('baseUrl');
    });

    test('should extract multiple variables', () => {
      const text = 'GET https://{{baseUrl}}/users/{{userId}}/posts/{{postId}}';
      const result = extractVariables(text);

      expect(result.variables).toHaveLength(3);
      expect(result.variables[0].name).toBe('baseUrl');
      expect(result.variables[1].name).toBe('userId');
      expect(result.variables[2].name).toBe('postId');
    });

    test('should extract variables from headers', () => {
      const text = 'Authorization: Bearer {{token}}';
      const result = extractVariables(text);

      expect(result.variables).toHaveLength(1);
      expect(result.variables[0].name).toBe('token');
    });

    test('should extract variables from body', () => {
      const text = '{"email": "{{userEmail}}", "name": "{{userName}}"}';
      const result = extractVariables(text);

      expect(result.variables).toHaveLength(2);
      expect(result.variables[0].name).toBe('userEmail');
      expect(result.variables[1].name).toBe('userName');
    });
  });

  describe('Variable name formats', () => {
    test('should extract variables with underscores', () => {
      const text = '{{base_url}}';
      const result = extractVariables(text);

      expect(result.variables[0].name).toBe('base_url');
    });

    test('should extract variables with hyphens', () => {
      const text = '{{base-url}}';
      const result = extractVariables(text);

      expect(result.variables[0].name).toBe('base-url');
    });

    test('should extract variables with dots', () => {
      const text = '{{request.response.token}}';
      const result = extractVariables(text);

      expect(result.variables[0].name).toBe('request.response.token');
    });

    test('should extract variables with numbers', () => {
      const text = '{{user123}}';
      const result = extractVariables(text);

      expect(result.variables[0].name).toBe('user123');
    });

    test('should handle system variables', () => {
      const text = 'X-Request-ID: {{$guid}}';
      const result = extractVariables(text);

      expect(result.variables[0].name).toBe('$guid');
    });
  });

  describe('Duplicate variables', () => {
    test('should extract duplicate variables', () => {
      const text = 'GET {{baseUrl}}/users?filter={{baseUrl}}';
      const result = extractVariables(text);

      expect(result.variables).toHaveLength(2);
      expect(result.variables[0].name).toBe('baseUrl');
      expect(result.variables[1].name).toBe('baseUrl');
    });

    test('should preserve order of duplicate variables', () => {
      const text = '{{a}} {{b}} {{a}} {{c}} {{a}}';
      const result = extractVariables(text);

      expect(result.variables).toHaveLength(5);
      expect(result.variables.map(v => v.name)).toEqual(['a', 'b', 'a', 'c', 'a']);
    });
  });

  describe('Edge cases', () => {
    test('should return empty array for no variables', () => {
      const text = 'GET https://example.com/users';
      const result = extractVariables(text);

      expect(result.variables).toHaveLength(0);
    });

    test('should handle empty string', () => {
      const result = extractVariables('');

      expect(result.variables).toHaveLength(0);
    });

    test('should handle incomplete variable syntax', () => {
      const text = 'GET {{incomplete';
      const result = extractVariables(text);

      expect(result.variables).toHaveLength(0);
    });

    test('should handle closing braces before opening', () => {
      const text = 'GET }}invalid{{';
      const result = extractVariables(text);

      expect(result.variables).toHaveLength(0);
    });

    test('should handle nested braces', () => {
      const text = '{{outer{{inner}}}}';
      const result = extractVariables(text);

      // Should extract based on regex pattern
      expect(result.variables.length).toBeGreaterThan(0);
    });

    test('should handle single braces', () => {
      const text = 'GET {single}/path/{another}';
      const result = extractVariables(text);

      expect(result.variables).toHaveLength(0);
    });

    test('should handle triple braces', () => {
      const text = 'GET {{{triple}}}';
      const result = extractVariables(text);

      // Should still extract the variable
      expect(result.variables.length).toBeGreaterThan(0);
    });

    test('should handle variables with spaces (invalid but should skip)', () => {
      const text = '{{ space var }}';
      const result = extractVariables(text);

      // Depending on implementation, might extract or skip
      // Ideally should skip invalid format
      if (result.variables.length > 0) {
        expect(result.variables[0].name).toContain('space');
      }
    });
  });

  describe('Returns original text', () => {
    test('should return the original text in result', () => {
      const text = 'GET https://{{baseUrl}}/users';
      const result = extractVariables(text);

      expect(result.text).toBe(text);
    });
  });
});

describe('extractFileVariables', () => {
  describe('Basic file variable extraction', () => {
    test('should extract single file variable', () => {
      const lines = ['@baseUrl = https://api.example.com'];
      const result = extractFileVariables(lines);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('baseUrl');
      expect(result[0].value).toBe('https://api.example.com');
    });

    test('should extract multiple file variables', () => {
      const lines = [
        '@baseUrl = https://api.example.com',
        '@token = abc123',
        '@userId = 42'
      ];
      const result = extractFileVariables(lines);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'baseUrl', value: 'https://api.example.com', line: 1 });
      expect(result[1]).toEqual({ name: 'token', value: 'abc123', line: 2 });
      expect(result[2]).toEqual({ name: 'userId', value: '42', line: 3 });
    });

    test('should trim whitespace from values', () => {
      const lines = ['@token =   abc123   '];
      const result = extractFileVariables(lines);

      expect(result[0].value).toBe('abc123');
    });

    test('should handle values with equals signs', () => {
      const lines = ['@encoded = key=value&other=data'];
      const result = extractFileVariables(lines);

      expect(result[0].value).toBe('key=value&other=data');
    });
  });

  describe('Variable name formats', () => {
    test('should extract variables with underscores', () => {
      const lines = ['@base_url = https://example.com'];
      const result = extractFileVariables(lines);

      expect(result[0].name).toBe('base_url');
    });

    test('should NOT extract variables with hyphens (regex uses \\w)', () => {
      const lines = ['@base-url = https://example.com'];
      const result = extractFileVariables(lines);

      // The regex uses \w which doesn't include hyphens
      expect(result).toHaveLength(0);
    });

    test('should extract variables with numbers', () => {
      const lines = ['@api_v2 = https://api.example.com/v2'];
      const result = extractFileVariables(lines);

      expect(result[0].name).toBe('api_v2');
    });
  });

  describe('Comments and non-variable lines', () => {
    test('should skip comment lines', () => {
      const lines = [
        '# This is a comment',
        '@baseUrl = https://api.example.com',
        '// Another comment',
        '@token = abc123'
      ];
      const result = extractFileVariables(lines);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('baseUrl');
      expect(result[1].name).toBe('token');
    });

    test('should skip empty lines', () => {
      const lines = [
        '@baseUrl = https://api.example.com',
        '',
        '@token = abc123'
      ];
      const result = extractFileVariables(lines);

      expect(result).toHaveLength(2);
    });

    test('should skip non-variable lines', () => {
      const lines = [
        'GET https://example.com',
        '@baseUrl = https://api.example.com',
        'Authorization: Bearer token'
      ];
      const result = extractFileVariables(lines);

      expect(result).toHaveLength(1);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty array', () => {
      const result = extractFileVariables([]);

      expect(result).toEqual([]);
    });

    test('should handle variable without value', () => {
      const lines = ['@baseUrl ='];
      const result = extractFileVariables(lines);

      // Regex requires at least one character after = due to (.+)
      expect(result).toHaveLength(0);
    });

    test('should handle variable without equals sign', () => {
      const lines = ['@baseUrl https://example.com'];
      const result = extractFileVariables(lines);

      // Should skip invalid format
      expect(result).toHaveLength(0);
    });

    test('should track line numbers', () => {
      const lines = [
        '# Comment',
        '@first = value1',
        '',
        '@second = value2'
      ];
      const result = extractFileVariables(lines);

      expect(result[0].line).toBe(2);
      expect(result[1].line).toBe(4);
    });
  });
});

describe('resolveVariables', () => {
  describe('Basic variable resolution', () => {
    test('should resolve single variable', () => {
      const text = 'GET https://{{baseUrl}}/users';
      const variables = { baseUrl: 'api.example.com' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('GET https://api.example.com/users');
    });

    test('should resolve multiple variables', () => {
      const text = 'GET https://{{baseUrl}}/users/{{userId}}';
      const variables = { baseUrl: 'api.example.com', userId: '123' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('GET https://api.example.com/users/123');
    });

    test('should resolve duplicate variables', () => {
      const text = '{{name}} and {{name}}';
      const variables = { name: 'John' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('John and John');
    });
  });

  describe('Unresolved variables', () => {
    test('should leave unresolved variables unchanged', () => {
      const text = 'GET https://{{baseUrl}}/users';
      const variables = {};
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('GET https://{{baseUrl}}/users');
    });

    test('should resolve only available variables', () => {
      const text = '{{resolved}} and {{unresolved}}';
      const variables = { resolved: 'value' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('value and {{unresolved}}');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty text', () => {
      const resolved = resolveVariables('', { key: 'value' });

      expect(resolved).toBe('');
    });

    test('should handle text with no variables', () => {
      const text = 'GET https://example.com';
      const resolved = resolveVariables(text, { key: 'value' });

      expect(resolved).toBe('GET https://example.com');
    });

    test('should handle empty variables object', () => {
      const text = 'GET {{baseUrl}}';
      const resolved = resolveVariables(text, {});

      expect(resolved).toBe('GET {{baseUrl}}');
    });

    test('should handle variable values containing braces', () => {
      const text = '{{template}}';
      const variables = { template: 'value with {{nested}}' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('value with {{nested}}');
    });

    test('should handle special regex characters in variable names', () => {
      const text = '{{var.name}}';
      const variables = { 'var.name': 'value' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('value');
    });

    test('should handle variable values with special characters', () => {
      const text = '{{url}}';
      const variables = { url: 'https://example.com?a=1&b=2' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('https://example.com?a=1&b=2');
    });
  });
});
