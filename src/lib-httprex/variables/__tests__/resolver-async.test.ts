/**
 * Tests for VariableResolver async methods
 * Tests secret resolution integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VariableResolver } from '../resolver';
import { secretManager, SecretManager } from '../../secrets';
import { environmentManager } from '../environment';
import { SecretProvider, SecretReference, SecretProviderResult } from '../../secrets/types';
import { ParsedRequest } from '../../types';

// Mock provider for testing
function createMockProvider(
  name: string,
  secrets: Record<string, string> = {}
): SecretProvider {
  return {
    name,
    description: `Mock provider ${name}`,
    isAvailable: () => true,
    getSecret: async (ref: SecretReference): Promise<SecretProviderResult> => {
      const value = secrets[ref.name];
      if (value !== undefined) {
        return { value, found: true };
      }
      return { value: null, found: false };
    }
  };
}

describe('VariableResolver async methods', () => {
  let resolver: VariableResolver;

  beforeEach(() => {
    resolver = new VariableResolver();
    // Clear any existing providers
    secretManager.listProviders().forEach(name => {
      secretManager.unregisterProvider(name);
    });
    secretManager.clearCache();
    environmentManager.clear();
  });

  afterEach(() => {
    // Clean up
    secretManager.listProviders().forEach(name => {
      secretManager.unregisterProvider(name);
    });
    environmentManager.clear();
  });

  describe('resolveRequestAsync', () => {
    it('should resolve regular variables', async () => {
      resolver.setContext({
        fromFile: { baseUrl: 'https://api.example.com' }
      });

      const request: ParsedRequest = {
        method: 'GET',
        url: 'https://{{baseUrl}}/users',
        headers: {},
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const resolved = await resolver.resolveRequestAsync(request);

      expect(resolved.url).toBe('https://https://api.example.com/users');
    });

    it('should resolve secret references', async () => {
      const provider = createMockProvider('test', { 'api-token': 'secret123' });
      secretManager.registerProvider({ provider });

      const request: ParsedRequest = {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: { authorization: 'Bearer {{secret:api-token}}' },
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const resolved = await resolver.resolveRequestAsync(request);

      expect(resolved.headers.authorization).toBe('Bearer secret123');
    });

    it('should resolve vault references', async () => {
      const provider = createMockProvider('test', { 'my-secret': 'vault-value' });
      secretManager.registerProvider({ provider });

      const request: ParsedRequest = {
        method: 'GET',
        url: 'https://api.example.com',
        headers: { 'x-api-key': '{{vault:my-secret}}' },
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const resolved = await resolver.resolveRequestAsync(request);

      expect(resolved.headers['x-api-key']).toBe('vault-value');
    });

    it('should resolve system variables', async () => {
      const request: ParsedRequest = {
        method: 'GET',
        url: 'https://api.example.com',
        headers: { 'x-request-id': '{{$guid}}' },
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const resolved = await resolver.resolveRequestAsync(request);

      // $guid generates a UUID format
      expect(resolved.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should resolve secrets in URL', async () => {
      const provider = createMockProvider('test', { 'api-host': 'secret-api.example.com' });
      secretManager.registerProvider({ provider });

      const request: ParsedRequest = {
        method: 'GET',
        url: 'https://{{secret:api-host}}/users',
        headers: {},
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const resolved = await resolver.resolveRequestAsync(request);

      expect(resolved.url).toBe('https://secret-api.example.com/users');
    });

    it('should resolve secrets in string body', async () => {
      const provider = createMockProvider('test', { 'db-password': 'secret-pass' });
      secretManager.registerProvider({ provider });

      const request: ParsedRequest = {
        method: 'POST',
        url: 'https://api.example.com/connect',
        headers: {},
        body: 'password={{secret:db-password}}&user=admin',
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const resolved = await resolver.resolveRequestAsync(request);

      expect(resolved.body).toBe('password=secret-pass&user=admin');
    });

    it('should resolve secrets in object body', async () => {
      const provider = createMockProvider('test', { 'api-key': 'key123' });
      secretManager.registerProvider({ provider });

      const request: ParsedRequest = {
        method: 'POST',
        url: 'https://api.example.com',
        headers: {},
        body: {
          apiKey: '{{secret:api-key}}',
          nested: {
            secret: '{{secret:api-key}}'
          }
        },
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const resolved = await resolver.resolveRequestAsync(request);

      expect((resolved.body as any).apiKey).toBe('key123');
      expect((resolved.body as any).nested.secret).toBe('key123');
    });

    it('should leave unresolved secrets unchanged', async () => {
      // No provider registered
      const request: ParsedRequest = {
        method: 'GET',
        url: 'https://api.example.com',
        headers: { authorization: 'Bearer {{secret:missing}}' },
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const resolved = await resolver.resolveRequestAsync(request);

      expect(resolved.headers.authorization).toBe('Bearer {{secret:missing}}');
    });

    it('should prioritize secrets over regular variables', async () => {
      const provider = createMockProvider('test', { 'token': 'from-secret' });
      secretManager.registerProvider({ provider });

      resolver.setContext({
        fromFile: { 'secret:token': 'from-file' }
      });

      const request: ParsedRequest = {
        method: 'GET',
        url: 'https://api.example.com',
        headers: { authorization: '{{secret:token}}' },
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const resolved = await resolver.resolveRequestAsync(request);

      expect(resolved.headers.authorization).toBe('from-secret');
    });
  });

  describe('getUnresolvedVariables', () => {
    it('should return unresolved variables', () => {
      const request: ParsedRequest = {
        method: 'GET',
        url: 'https://{{baseUrl}}/users/{{userId}}',
        headers: { authorization: '{{token}}' },
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const unresolved = resolver.getUnresolvedVariables(request);

      expect(unresolved).toContain('baseUrl');
      expect(unresolved).toContain('userId');
      expect(unresolved).toContain('token');
    });

    it('should not include resolved variables', () => {
      resolver.setContext({
        fromFile: { baseUrl: 'https://api.example.com' }
      });

      const request: ParsedRequest = {
        method: 'GET',
        url: 'https://{{baseUrl}}/users/{{userId}}',
        headers: {},
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const unresolved = resolver.getUnresolvedVariables(request);

      expect(unresolved).not.toContain('baseUrl');
      expect(unresolved).toContain('userId');
    });

    it('should not include system variables', () => {
      const request: ParsedRequest = {
        method: 'GET',
        url: 'https://api.example.com',
        headers: { 'x-request-id': '{{$guid}}' },
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const unresolved = resolver.getUnresolvedVariables(request);

      expect(unresolved).not.toContain('$guid');
    });

    it('should not include secret references', () => {
      const request: ParsedRequest = {
        method: 'GET',
        url: 'https://api.example.com',
        headers: {
          authorization: '{{secret:token}}',
          'x-api-key': '{{vault:api-key}}'
        },
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const unresolved = resolver.getUnresolvedVariables(request);

      expect(unresolved).not.toContain('secret:token');
      expect(unresolved).not.toContain('vault:api-key');
    });
  });

  describe('environment integration', () => {
    it('should resolve variables from environment manager', async () => {
      environmentManager.loadFromEnvFile({
        staging: { baseUrl: 'https://staging.example.com' }
      });
      environmentManager.setCurrentEnvironment('staging');

      const request: ParsedRequest = {
        method: 'GET',
        url: '{{baseUrl}}/users',
        headers: {},
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const resolved = await resolver.resolveRequestAsync(request);

      expect(resolved.url).toBe('https://staging.example.com/users');
    });

    it('should allow file variables to override environment variables', async () => {
      environmentManager.loadFromEnvFile({
        staging: { baseUrl: 'https://staging.example.com' }
      });
      environmentManager.setCurrentEnvironment('staging');

      resolver.setContext({
        fromFile: { baseUrl: 'https://override.example.com' }
      });

      const request: ParsedRequest = {
        method: 'GET',
        url: '{{baseUrl}}/users',
        headers: {},
        body: null,
        variables: [],
        raw: { requestLine: '', headerLines: [], bodyLines: [] }
      };

      const resolved = await resolver.resolveRequestAsync(request);

      expect(resolved.url).toBe('https://override.example.com/users');
    });
  });
});
