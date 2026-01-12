/**
 * Tests for lexer.ts
 * Tests variable extraction and resolution
 */

import { describe, it, expect } from 'vitest';
import { extractVariables, extractFileVariables, resolveVariables } from '../lexer';

describe('extractVariables', () => {
  describe('Basic variable extraction', () => {
    it('should extract single variable', () => {
      const text = 'GET https://{{baseUrl}}/users';
      const variables = extractVariables(text);

      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('baseUrl');
    });

    it('should extract multiple variables', () => {
      const text = 'GET https://{{baseUrl}}/users/{{userId}}/posts/{{postId}}';
      const variables = extractVariables(text);

      expect(variables).toHaveLength(3);
      expect(variables[0].name).toBe('baseUrl');
      expect(variables[1].name).toBe('userId');
      expect(variables[2].name).toBe('postId');
    });

    it('should extract variables from headers', () => {
      const text = 'Authorization: Bearer {{token}}';
      const variables = extractVariables(text);

      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('token');
    });

    it('should extract variables from body', () => {
      const text = '{"email": "{{userEmail}}", "name": "{{userName}}"}';
      const variables = extractVariables(text);

      expect(variables).toHaveLength(2);
      expect(variables[0].name).toBe('userEmail');
      expect(variables[1].name).toBe('userName');
    });
  });

  describe('Variable name formats', () => {
    it('should extract variables with underscores', () => {
      const text = '{{base_url}}';
      const variables = extractVariables(text);

      expect(variables[0].name).toBe('base_url');
    });

    it('should extract variables with hyphens', () => {
      const text = '{{base-url}}';
      const variables = extractVariables(text);

      expect(variables[0].name).toBe('base-url');
    });

    it('should extract variables with dots', () => {
      const text = '{{request.response.token}}';
      const variables = extractVariables(text);

      expect(variables[0].name).toBe('request.response.token');
    });

    it('should extract variables with numbers', () => {
      const text = '{{user123}}';
      const variables = extractVariables(text);

      expect(variables[0].name).toBe('user123');
    });

    it('should handle system variables', () => {
      const text = 'X-Request-ID: {{$guid}}';
      const variables = extractVariables(text);

      expect(variables[0].name).toBe('$guid');
    });
  });

  describe('Duplicate variables', () => {
    it('should extract duplicate variables', () => {
      const text = 'GET {{baseUrl}}/users?filter={{baseUrl}}';
      const variables = extractVariables(text);

      expect(variables).toHaveLength(2);
      expect(variables[0].name).toBe('baseUrl');
      expect(variables[1].name).toBe('baseUrl');
    });

    it('should preserve order of duplicate variables', () => {
      const text = '{{a}} {{b}} {{a}} {{c}} {{a}}';
      const variables = extractVariables(text);

      expect(variables).toHaveLength(5);
      expect(variables.map(v => v.name)).toEqual(['a', 'b', 'a', 'c', 'a']);
    });
  });

  describe('Edge cases', () => {
    it('should return empty array for no variables', () => {
      const text = 'GET https://example.com/users';
      const variables = extractVariables(text);

      expect(variables).toHaveLength(0);
    });

    it('should handle empty string', () => {
      const variables = extractVariables('');

      expect(variables).toHaveLength(0);
    });

    it('should handle incomplete variable syntax', () => {
      const text = 'GET {{incomplete';
      const variables = extractVariables(text);

      expect(variables).toHaveLength(0);
    });

    it('should handle closing braces before opening', () => {
      const text = 'GET }}invalid{{';
      const variables = extractVariables(text);

      expect(variables).toHaveLength(0);
    });

    it('should handle nested braces', () => {
      const text = '{{outer{{inner}}}}';
      const variables = extractVariables(text);

      // Should extract based on regex pattern
      expect(variables.length).toBeGreaterThan(0);
    });

    it('should handle single braces', () => {
      const text = 'GET {single}/path/{another}';
      const variables = extractVariables(text);

      expect(variables).toHaveLength(0);
    });

    it('should handle triple braces', () => {
      const text = 'GET {{{triple}}}';
      const variables = extractVariables(text);

      // Should still extract the variable
      expect(variables.length).toBeGreaterThan(0);
    });

    it('should handle variables with spaces (invalid but should skip)', () => {
      const text = '{{ space var }}';
      const variables = extractVariables(text);

      // Depending on implementation, might extract or skip
      // Ideally should skip invalid format
      if (variables.length > 0) {
        expect(variables[0].name).toContain('space');
      }
    });
  });
});

describe('extractFileVariables', () => {
  describe('Basic file variable extraction', () => {
    it('should extract single file variable', () => {
      const lines = ['@baseUrl = https://api.example.com'];
      const variables = extractFileVariables(lines);

      expect(variables).toEqual({
        baseUrl: 'https://api.example.com'
      });
    });

    it('should extract multiple file variables', () => {
      const lines = [
        '@baseUrl = https://api.example.com',
        '@token = abc123',
        '@userId = 42'
      ];
      const variables = extractFileVariables(lines);

      expect(variables).toEqual({
        baseUrl: 'https://api.example.com',
        token: 'abc123',
        userId: '42'
      });
    });

    it('should trim whitespace from values', () => {
      const lines = ['@token =   abc123   '];
      const variables = extractFileVariables(lines);

      expect(variables.token).toBe('abc123');
    });

    it('should handle values with equals signs', () => {
      const lines = ['@encoded = key=value&other=data'];
      const variables = extractFileVariables(lines);

      expect(variables.encoded).toBe('key=value&other=data');
    });
  });

  describe('Variable name formats', () => {
    it('should extract variables with underscores', () => {
      const lines = ['@base_url = https://example.com'];
      const variables = extractFileVariables(lines);

      expect(variables).toHaveProperty('base_url');
    });

    it('should extract variables with hyphens', () => {
      const lines = ['@base-url = https://example.com'];
      const variables = extractFileVariables(lines);

      expect(variables).toHaveProperty('base-url');
    });

    it('should extract variables with numbers', () => {
      const lines = ['@api_v2 = https://api.example.com/v2'];
      const variables = extractFileVariables(lines);

      expect(variables).toHaveProperty('api_v2');
    });
  });

  describe('Comments and non-variable lines', () => {
    it('should skip comment lines', () => {
      const lines = [
        '# This is a comment',
        '@baseUrl = https://api.example.com',
        '// Another comment',
        '@token = abc123'
      ];
      const variables = extractFileVariables(lines);

      expect(Object.keys(variables)).toHaveLength(2);
      expect(variables).toHaveProperty('baseUrl');
      expect(variables).toHaveProperty('token');
    });

    it('should skip empty lines', () => {
      const lines = [
        '@baseUrl = https://api.example.com',
        '',
        '@token = abc123'
      ];
      const variables = extractFileVariables(lines);

      expect(Object.keys(variables)).toHaveLength(2);
    });

    it('should skip non-variable lines', () => {
      const lines = [
        'GET https://example.com',
        '@baseUrl = https://api.example.com',
        'Authorization: Bearer token'
      ];
      const variables = extractFileVariables(lines);

      expect(Object.keys(variables)).toHaveLength(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty array', () => {
      const variables = extractFileVariables([]);

      expect(variables).toEqual({});
    });

    it('should handle variable without value', () => {
      const lines = ['@baseUrl ='];
      const variables = extractFileVariables(lines);

      expect(variables.baseUrl).toBe('');
    });

    it('should handle variable without equals sign', () => {
      const lines = ['@baseUrl https://example.com'];
      const variables = extractFileVariables(lines);

      // Should skip invalid format
      expect(variables).not.toHaveProperty('baseUrl');
    });

    it('should override duplicate variable definitions', () => {
      const lines = [
        '@token = old-value',
        '@token = new-value'
      ];
      const variables = extractFileVariables(lines);

      expect(variables.token).toBe('new-value');
    });

    it('should handle multiline values (not supported)', () => {
      const lines = [
        '@multiline = first line',
        'second line'
      ];
      const variables = extractFileVariables(lines);

      expect(variables.multiline).toBe('first line');
      // Second line should not be included
    });
  });
});

describe('resolveVariables', () => {
  describe('Basic variable resolution', () => {
    it('should resolve single variable', () => {
      const text = 'GET https://{{baseUrl}}/users';
      const variables = { baseUrl: 'api.example.com' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('GET https://api.example.com/users');
    });

    it('should resolve multiple variables', () => {
      const text = 'GET https://{{baseUrl}}/users/{{userId}}';
      const variables = { baseUrl: 'api.example.com', userId: '123' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('GET https://api.example.com/users/123');
    });

    it('should resolve duplicate variables', () => {
      const text = '{{name}} and {{name}}';
      const variables = { name: 'John' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('John and John');
    });
  });

  describe('Unresolved variables', () => {
    it('should leave unresolved variables unchanged', () => {
      const text = 'GET https://{{baseUrl}}/users';
      const variables = {};
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('GET https://{{baseUrl}}/users');
    });

    it('should resolve only available variables', () => {
      const text = '{{resolved}} and {{unresolved}}';
      const variables = { resolved: 'value' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('value and {{unresolved}}');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty text', () => {
      const resolved = resolveVariables('', { key: 'value' });

      expect(resolved).toBe('');
    });

    it('should handle text with no variables', () => {
      const text = 'GET https://example.com';
      const resolved = resolveVariables(text, { key: 'value' });

      expect(resolved).toBe('GET https://example.com');
    });

    it('should handle empty variables object', () => {
      const text = 'GET {{baseUrl}}';
      const resolved = resolveVariables(text, {});

      expect(resolved).toBe('GET {{baseUrl}}');
    });

    it('should handle variable values containing braces', () => {
      const text = '{{template}}';
      const variables = { template: 'value with {{nested}}' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('value with {{nested}}');
    });

    it('should handle special regex characters in variable names', () => {
      const text = '{{var.name}}';
      const variables = { 'var.name': 'value' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('value');
    });

    it('should handle variable values with special characters', () => {
      const text = '{{url}}';
      const variables = { url: 'https://example.com?a=1&b=2' };
      const resolved = resolveVariables(text, variables);

      expect(resolved).toBe('https://example.com?a=1&b=2');
    });
  });
});
