/**
 * Tests for SecretManager
 * Tests secret provider orchestration and resolution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecretManager } from '../manager';
import { SecretProvider, SecretReference, SecretProviderResult } from '../types';

// Mock provider that returns predefined values
function createMockProvider(
  name: string,
  secrets: Record<string, string> = {},
  isAvailable: boolean = true
): SecretProvider {
  return {
    name,
    description: `Mock provider ${name}`,
    isAvailable: () => isAvailable,
    getSecret: async (ref: SecretReference): Promise<SecretProviderResult> => {
      const value = secrets[ref.name];
      if (value !== undefined) {
        return { value, found: true };
      }
      return { value: null, found: false };
    }
  };
}

describe('SecretManager', () => {
  let manager: SecretManager;

  beforeEach(() => {
    manager = new SecretManager();
  });

  describe('registerProvider', () => {
    it('should register a provider', () => {
      const provider = createMockProvider('test');
      manager.registerProvider({ provider });

      expect(manager.listProviders()).toContain('test');
    });

    it('should register multiple providers', () => {
      manager.registerProvider({ provider: createMockProvider('first') });
      manager.registerProvider({ provider: createMockProvider('second') });

      expect(manager.listProviders()).toHaveLength(2);
    });
  });

  describe('unregisterProvider', () => {
    it('should remove a provider', () => {
      manager.registerProvider({ provider: createMockProvider('test') });
      manager.unregisterProvider('test');

      expect(manager.listProviders()).not.toContain('test');
    });
  });

  describe('getProvider', () => {
    it('should return registered provider', () => {
      const provider = createMockProvider('test');
      manager.registerProvider({ provider });

      expect(manager.getProvider('test')).toBe(provider);
    });

    it('should return undefined for non-existent provider', () => {
      expect(manager.getProvider('unknown')).toBeUndefined();
    });
  });

  describe('getSecret', () => {
    it('should resolve secret from provider', async () => {
      const provider = createMockProvider('test', { 'api-token': 'secret123' });
      manager.registerProvider({ provider });

      const result = await manager.getSecret({ type: 'secret', name: 'api-token' });

      expect(result.found).toBe(true);
      expect(result.value).toBe('secret123');
      expect(result.provider).toBe('test');
    });

    it('should return not found for missing secret', async () => {
      const provider = createMockProvider('test', {});
      manager.registerProvider({ provider });

      const result = await manager.getSecret({ type: 'secret', name: 'missing' });

      expect(result.found).toBe(false);
      expect(result.value).toBeNull();
    });

    it('should try providers in priority order', async () => {
      const lowPriority = createMockProvider('low', { token: 'low-value' });
      const highPriority = createMockProvider('high', { token: 'high-value' });

      manager.registerProvider({ provider: lowPriority, priority: 1 });
      manager.registerProvider({ provider: highPriority, priority: 10 });

      const result = await manager.getSecret({ type: 'secret', name: 'token' });

      expect(result.value).toBe('high-value');
      expect(result.provider).toBe('high');
    });

    it('should skip unavailable providers', async () => {
      const unavailable = createMockProvider('unavailable', { token: 'nope' }, false);
      const available = createMockProvider('available', { token: 'yes' });

      manager.registerProvider({ provider: unavailable, priority: 10 });
      manager.registerProvider({ provider: available, priority: 1 });

      const result = await manager.getSecret({ type: 'secret', name: 'token' });

      expect(result.value).toBe('yes');
      expect(result.provider).toBe('available');
    });

    it('should fallback to next provider when secret not found', async () => {
      const empty = createMockProvider('empty', {});
      const hasSecret = createMockProvider('has-secret', { token: 'found' });

      manager.registerProvider({ provider: empty, priority: 10 });
      manager.registerProvider({ provider: hasSecret, priority: 1 });

      const result = await manager.getSecret({ type: 'secret', name: 'token' });

      expect(result.value).toBe('found');
      expect(result.provider).toBe('has-secret');
    });

    it('should handle provider errors gracefully', async () => {
      const errorProvider: SecretProvider = {
        name: 'error-provider',
        description: 'Provider that throws',
        isAvailable: () => true,
        getSecret: async () => { throw new Error('Provider error'); }
      };
      const workingProvider = createMockProvider('working', { token: 'ok' });

      manager.registerProvider({ provider: errorProvider, priority: 10 });
      manager.registerProvider({ provider: workingProvider, priority: 1 });

      const result = await manager.getSecret({ type: 'secret', name: 'token' });

      expect(result.value).toBe('ok');
    });
  });

  describe('caching', () => {
    it('should cache results by default', async () => {
      let callCount = 0;
      const provider: SecretProvider = {
        name: 'counting',
        description: 'Counts calls',
        isAvailable: () => true,
        getSecret: async () => {
          callCount++;
          return { value: 'cached', found: true };
        }
      };

      manager.registerProvider({ provider });

      await manager.getSecret({ type: 'secret', name: 'token' });
      await manager.getSecret({ type: 'secret', name: 'token' });

      expect(callCount).toBe(1);
    });

    it('should not cache when disabled', async () => {
      let callCount = 0;
      const provider: SecretProvider = {
        name: 'counting',
        description: 'Counts calls',
        isAvailable: () => true,
        getSecret: async () => {
          callCount++;
          return { value: 'not-cached', found: true };
        }
      };

      manager.registerProvider({ provider });
      manager.setCacheEnabled(false);

      await manager.getSecret({ type: 'secret', name: 'token' });
      await manager.getSecret({ type: 'secret', name: 'token' });

      expect(callCount).toBe(2);
    });

    it('should clear cache', async () => {
      let callCount = 0;
      const provider: SecretProvider = {
        name: 'counting',
        description: 'Counts calls',
        isAvailable: () => true,
        getSecret: async () => {
          callCount++;
          return { value: 'test', found: true };
        }
      };

      manager.registerProvider({ provider });

      await manager.getSecret({ type: 'secret', name: 'token' });
      manager.clearCache();
      await manager.getSecret({ type: 'secret', name: 'token' });

      expect(callCount).toBe(2);
    });
  });

  describe('parseSecretReference', () => {
    it('should parse secret: prefix', () => {
      const ref = SecretManager.parseSecretReference('secret:api-token');

      expect(ref).toEqual({
        type: 'secret',
        name: 'api-token'
      });
    });

    it('should parse vault: prefix (Postman compatibility)', () => {
      const ref = SecretManager.parseSecretReference('vault:my-secret');

      expect(ref).toEqual({
        type: 'vault',
        name: 'my-secret'
      });
    });

    it('should parse op:// prefix (1Password)', () => {
      const ref = SecretManager.parseSecretReference('op://Engineering/API Keys/production');

      expect(ref).toEqual({
        type: 'onepassword',
        name: 'op://Engineering/API Keys/production',
        path: 'Engineering/API Keys/production'
      });
    });

    it('should return null for regular variable', () => {
      expect(SecretManager.parseSecretReference('baseUrl')).toBeNull();
      expect(SecretManager.parseSecretReference('$timestamp')).toBeNull();
    });
  });

  describe('isSecretReference', () => {
    it('should return true for secret references', () => {
      expect(SecretManager.isSecretReference('secret:token')).toBe(true);
      expect(SecretManager.isSecretReference('vault:token')).toBe(true);
      expect(SecretManager.isSecretReference('op://vault/item/field')).toBe(true);
    });

    it('should return false for regular variables', () => {
      expect(SecretManager.isSecretReference('baseUrl')).toBe(false);
      expect(SecretManager.isSecretReference('token')).toBe(false);
    });
  });

  describe('getUnresolvedSecrets', () => {
    it('should return unresolved secret references', async () => {
      const provider = createMockProvider('test', { 'api-token': 'value' });
      manager.registerProvider({ provider });

      const unresolved = await manager.getUnresolvedSecrets([
        'baseUrl',
        'secret:api-token',
        'secret:missing-secret',
        'vault:also-missing'
      ]);

      expect(unresolved).toHaveLength(2);
      expect(unresolved).toContain('secret:missing-secret');
      expect(unresolved).toContain('vault:also-missing');
    });

    it('should return empty array when all secrets resolved', async () => {
      const provider = createMockProvider('test', { token: 'value' });
      manager.registerProvider({ provider });

      const unresolved = await manager.getUnresolvedSecrets([
        'baseUrl',
        'secret:token'
      ]);

      expect(unresolved).toHaveLength(0);
    });
  });
});
