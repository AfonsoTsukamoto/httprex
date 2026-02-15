/**
 * Tests for Secret Providers
 * Tests PromptSecretProvider and static parsing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptSecretProvider } from '../providers/prompt';

describe('PromptSecretProvider', () => {
  describe('isAvailable', () => {
    it('should be available when promptFn is provided', () => {
      const provider = new PromptSecretProvider({
        promptFn: async () => 'value'
      });

      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('getSecret', () => {
    it('should resolve secret from custom prompt function', async () => {
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

    it('should include secret name in prompt message', async () => {
      const promptFn = vi.fn().mockResolvedValue('value');
      const provider = new PromptSecretProvider({ promptFn });

      await provider.getSecret({
        type: 'secret',
        name: 'my-api-key'
      });

      expect(promptFn).toHaveBeenCalledWith(
        expect.stringContaining('my-api-key')
      );
    });

    it('should use path for 1Password references in prompt', async () => {
      const promptFn = vi.fn().mockResolvedValue('value');
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

    it('should return not found when user cancels', async () => {
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

    it('should return not found when user provides empty value', async () => {
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
    it('should cache prompted values by default', async () => {
      const promptFn = vi.fn().mockResolvedValue('cached-value');
      const provider = new PromptSecretProvider({ promptFn });

      await provider.getSecret({ type: 'secret', name: 'token' });
      await provider.getSecret({ type: 'secret', name: 'token' });

      expect(promptFn).toHaveBeenCalledTimes(1);
    });

    it('should not cache when disabled', async () => {
      const promptFn = vi.fn().mockResolvedValue('value');
      const provider = new PromptSecretProvider({
        promptFn,
        cachePrompts: false
      });

      await provider.getSecret({ type: 'secret', name: 'token' });
      await provider.getSecret({ type: 'secret', name: 'token' });

      expect(promptFn).toHaveBeenCalledTimes(2);
    });

    it('should use different cache keys for different types', async () => {
      const promptFn = vi.fn().mockResolvedValue('value');
      const provider = new PromptSecretProvider({ promptFn });

      await provider.getSecret({ type: 'secret', name: 'token' });
      await provider.getSecret({ type: 'vault', name: 'token' });

      expect(promptFn).toHaveBeenCalledTimes(2);
    });

    it('should clear cache', async () => {
      const promptFn = vi.fn().mockResolvedValue('value');
      const provider = new PromptSecretProvider({ promptFn });

      await provider.getSecret({ type: 'secret', name: 'token' });
      provider.clearCache();
      await provider.getSecret({ type: 'secret', name: 'token' });

      expect(promptFn).toHaveBeenCalledTimes(2);
    });

    it('should remove specific secret from cache', async () => {
      const promptFn = vi.fn().mockResolvedValue('value');
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
    it('should have correct name', () => {
      const provider = new PromptSecretProvider();
      expect(provider.name).toBe('prompt');
    });

    it('should have description', () => {
      const provider = new PromptSecretProvider();
      expect(provider.description).toBeTruthy();
    });
  });
});
