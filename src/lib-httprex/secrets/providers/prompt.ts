/**
 * Prompt Secret Provider
 * Fallback provider that prompts the user for secret values
 * Works in any environment with user interaction
 */

import { SecretProvider, SecretReference, SecretProviderResult } from '../types';

export interface PromptSecretProviderOptions {
  /** Custom prompt function (for non-browser environments) */
  promptFn?: (message: string) => Promise<string | null>;
  /** Cache prompted values for session */
  cachePrompts?: boolean;
}

export class PromptSecretProvider implements SecretProvider {
  readonly name = 'prompt';
  readonly description = 'Prompts user to enter secret values';

  private promptCache: Map<string, string> = new Map();
  private options: PromptSecretProviderOptions;

  constructor(options: PromptSecretProviderOptions = {}) {
    this.options = {
      cachePrompts: true,
      ...options
    };
  }

  isAvailable(): boolean {
    // Available if we have a custom prompt function or browser prompt
    return !!this.options.promptFn || typeof window !== 'undefined';
  }

  async getSecret(ref: SecretReference): Promise<SecretProviderResult> {
    const cacheKey = `${ref.type}:${ref.name}`;

    // Check cache first
    if (this.options.cachePrompts && this.promptCache.has(cacheKey)) {
      return {
        value: this.promptCache.get(cacheKey)!,
        found: true
      };
    }

    // Prompt user
    const displayName = ref.type === 'onepassword' ? ref.path || ref.name : ref.name;
    const value = await this.prompt(
      `Enter value for secret "${displayName}":`
    );

    if (value === null || value === '') {
      return {
        value: null,
        found: false,
        error: 'User cancelled or provided empty value'
      };
    }

    // Cache if enabled
    if (this.options.cachePrompts) {
      this.promptCache.set(cacheKey, value);
    }

    return {
      value,
      found: true
    };
  }

  private async prompt(message: string): Promise<string | null> {
    if (this.options.promptFn) {
      return this.options.promptFn(message);
    }

    if (typeof window !== 'undefined' && window.prompt) {
      return window.prompt(message);
    }

    return null;
  }

  /**
   * Clear the prompt cache
   */
  clearCache(): void {
    this.promptCache.clear();
  }

  /**
   * Remove a specific secret from cache
   */
  removeFromCache(name: string): void {
    // Try all possible cache keys
    this.promptCache.delete(`secret:${name}`);
    this.promptCache.delete(`vault:${name}`);
    this.promptCache.delete(`onepassword:${name}`);
  }
}
