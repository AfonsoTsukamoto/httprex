/**
 * Tests for Secret Providers
 * Tests PromptSecretProvider and static parsing
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { PromptSecretProvider } from '../providers/prompt';

describe('PromptSecretProvider', () => {
  describe('isAvailable', () => {
    test('should be available when promptFn is provided', () => {
      const provider = new PromptSecretProvider({
        promptFn: async () => 'value'
      });

      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('getSecret', () => {
    test('should resolve secret from custom prompt function', async () => {
      const provider = new PromptSecretProvider({
        promptFn: async () => 'secret-value'
      });

      const result = await provider.getSecret({
        type: 'secret',
        name: 'api-token'
      });

      expect(result.found).toBe(true);
      expect(result.value).toBe('secret-value');
    });

    test.skip("should include secret name in prompt message", async () => {
      const promptFn = mock(() => Promise.resolve('value'));
      const provider = new PromptSecretProvider({ promptFn });

      await provider.getSecret({
        type: 'secret',
        name: 'my-api-key'
      });

      expect(promptFn).toHaveBeenCalledWith(
        expect.stringContaining('my-api-key')
      );
    });

    test('should use path for 1Password references in prompt', async () => {
      const promptFn = mock(() => Promise.resolve('value'));
      const provider = new PromptSecretProvider({ promptFn });

      await provider.getSecret({
        type: 'onepassword',
        name: 'op://vault/item/field',
        path: 'vault/item/field'
      });

      expect(promptFn).toHaveBeenCalledWith(
        expect.stringContaining('vault/item/field')
      );
    });

    test('should return not found when user cancels', async () => {
      const provider = new PromptSecretProvider({
        promptFn: async () => null
      });

      const result = await provider.getSecret({
        type: 'secret',
        name: 'token'
      });

      expect(result.found).toBe(false);
      expect(result.error).toContain('cancelled');
    });

    test('should return not found when user provides empty value', async () => {
      const provider = new PromptSecretProvider({
        promptFn: async () => ''
      });

      const result = await provider.getSecret({
        type: 'secret',
        name: 'token'
      });

      expect(result.found).toBe(false);
    });
  });

  describe('caching', () => {
    test('should cache prompted values by default', async () => {
      const promptFn = mock(() => Promise.resolve('cached-value'));
      const provider = new PromptSecretProvider({ promptFn });

      await provider.getSecret({ type: 'secret', name: 'token' });
      await provider.getSecret({ type: 'secret', name: 'token' });

      expect(promptFn).toHaveBeenCalledTimes(1);
    });

    test('should not cache when disabled', async () => {
      const promptFn = mock(() => Promise.resolve('value'));
      const provider = new PromptSecretProvider({
        promptFn,
        cachePrompts: false
      });

      await provider.getSecret({ type: 'secret', name: 'token' });
      await provider.getSecret({ type: 'secret', name: 'token' });

      expect(promptFn).toHaveBeenCalledTimes(2);
    });

    test('should use different cache keys for different types', async () => {
      const promptFn = mock(() => Promise.resolve('value'));
      const provider = new PromptSecretProvider({ promptFn });

      await provider.getSecret({ type: 'secret', name: 'token' });
      await provider.getSecret({ type: 'vault', name: 'token' });

      expect(promptFn).toHaveBeenCalledTimes(2);
    });

    test('should clear cache', async () => {
      const promptFn = mock(() => Promise.resolve('value'));
      const provider = new PromptSecretProvider({ promptFn });

      await provider.getSecret({ type: 'secret', name: 'token' });
      provider.clearCache();
      await provider.getSecret({ type: 'secret', name: 'token' });

      expect(promptFn).toHaveBeenCalledTimes(2);
    });

    test('should remove specific secret from cache', async () => {
      const promptFn = mock(() => Promise.resolve('value'));
      const provider = new PromptSecretProvider({ promptFn });

      await provider.getSecret({ type: 'secret', name: 'token1' });
      await provider.getSecret({ type: 'secret', name: 'token2' });

      provider.removeFromCache('token1');

      await provider.getSecret({ type: 'secret', name: 'token1' });
      await provider.getSecret({ type: 'secret', name: 'token2' });

      // token1 should be re-prompted, token2 should be cached
      expect(promptFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('provider metadata', () => {
    test('should have correct name', () => {
      const provider = new PromptSecretProvider();
      expect(provider.name).toBe('prompt');
    });

    test('should have description', () => {
      const provider = new PromptSecretProvider();
      expect(provider.description).toBeTruthy();
    });
  });
});
