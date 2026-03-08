/**
 * Secret manager
 * Orchestrates multiple secret providers with priority-based resolution
 */

import {
  SecretProvider,
  SecretReference,
  SecretProviderResult,
  SecretProviderConfig
} from './types';

export class SecretManager {
  private providers: Map<string, SecretProviderConfig> = new Map();
  private cache: Map<string, SecretProviderResult> = new Map();
  private cacheEnabled: boolean = true;

  /**
   * Register a secret provider
   */
  registerProvider(config: SecretProviderConfig): void {
    this.providers.set(config.provider.name, {
      ...config,
      priority: config.priority ?? 0
    });
  }

  /**
   * Unregister a provider by name
   */
  unregisterProvider(name: string): void {
    this.providers.delete(name);
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): SecretProvider | undefined {
    return this.providers.get(name)?.provider;
  }

  /**
   * List all registered providers
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get sorted providers by priority (highest first)
   */
  private getSortedProviders(): SecretProviderConfig[] {
    return Array.from(this.providers.values())
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * Resolve a secret reference
   * Tries providers in priority order until one succeeds
   */
  async getSecret(ref: SecretReference): Promise<SecretProviderResult> {
    const cacheKey = this.getCacheKey(ref);

    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    for (const config of this.getSortedProviders()) {
      const provider = config.provider;

      // Check if provider is available
      try {
        const available = await provider.isAvailable();
        if (!available) continue;
      } catch {
        continue;
      }

      try {
        const result = await provider.getSecret(ref);
        if (result.found) {
          result.provider = provider.name;
          if (this.cacheEnabled) {
            this.cache.set(cacheKey, result);
          }
          return result;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Secret provider ${provider.name} failed:`, message);
        // Continue to next provider
      }
    }

    return {
      value: null,
      found: false,
      error: `Secret "${ref.name}" not found in any provider`
    };
  }

  /**
   * Parse a variable reference to determine if it's a secret
   * Returns null if it's not a secret reference
   */
  static parseSecretReference(varName: string): SecretReference | null {
    // {{secret:name}} format
    if (varName.startsWith('secret:')) {
      return {
        type: 'secret',
        name: varName.substring(7)
      };
    }

    // {{vault:name}} format (Postman compatibility)
    if (varName.startsWith('vault:')) {
      return {
        type: 'vault',
        name: varName.substring(6)
      };
    }

    // {{op://vault/item/field}} format (1Password)
    if (varName.startsWith('op://')) {
      return {
        type: 'onepassword',
        name: varName,
        path: varName.substring(5) // vault/item/field
      };
    }

    return null;
  }

  /**
   * Check if a variable name is a secret reference
   */
  static isSecretReference(varName: string): boolean {
    return SecretManager.parseSecretReference(varName) !== null;
  }

  /**
   * Generate cache key from reference
   */
  private getCacheKey(ref: SecretReference): string {
    return `${ref.type}:${ref.name}`;
  }

  /**
   * Clear the secret cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Enable or disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Check if caching is enabled
   */
  isCacheEnabled(): boolean {
    return this.cacheEnabled;
  }

  /**
   * Get all unresolved secret references from a list of variable names
   */
  async getUnresolvedSecrets(varNames: string[]): Promise<string[]> {
    const unresolved: string[] = [];

    for (const varName of varNames) {
      const ref = SecretManager.parseSecretReference(varName);
      if (ref) {
        const result = await this.getSecret(ref);
        if (!result.found) {
          unresolved.push(varName);
        }
      }
    }

    return unresolved;
  }
}

// Global singleton
export const secretManager = new SecretManager();
