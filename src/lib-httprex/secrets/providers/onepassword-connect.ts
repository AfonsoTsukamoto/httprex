/**
 * 1Password Connect Secret Provider
 * Integrates with self-hosted 1Password Connect Server via REST API
 * Works in any environment that can make HTTP requests
 */

import { SecretProvider, SecretReference, SecretProviderResult } from '../types';

export interface OnePasswordConnectConfig {
  /** 1Password Connect Server URL */
  serverUrl: string;
  /** Connect Server access token */
  token: string;
  /** Default vault ID to use when not specified in reference */
  defaultVaultId?: string;
}

interface OnePasswordItem {
  id: string;
  title: string;
  fields?: Array<{
    id: string;
    label: string;
    value: string;
    type: string;
    purpose?: string;
  }>;
}

interface OnePasswordVault {
  id: string;
  name: string;
}

export class OnePasswordConnectProvider implements SecretProvider {
  readonly name = '1password-connect';
  readonly description = '1Password Connect Server integration';

  private config: OnePasswordConnectConfig;
  private vaultCache: Map<string, string> = new Map(); // name -> id

  constructor(config: OnePasswordConnectConfig) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.serverUrl}/health`, {
        headers: this.getHeaders()
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getSecret(ref: SecretReference): Promise<SecretProviderResult> {
    try {
      // Parse 1Password reference: op://vault/item/field
      if (ref.type === 'onepassword' && ref.path) {
        return this.getByPath(ref.path);
      }

      // Fallback: search by name in default vault
      return this.getByName(ref.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        value: null,
        found: false,
        error: `1Password Connect error: ${message}`
      };
    }
  }

  /**
   * Get secret using 1Password path format: vault/item/field
   */
  private async getByPath(path: string): Promise<SecretProviderResult> {
    const parts = path.split('/');
    if (parts.length < 3) {
      return {
        value: null,
        found: false,
        error: `Invalid 1Password path: ${path}. Expected format: vault/item/field`
      };
    }

    const [vaultName, itemName, ...fieldPath] = parts;
    const fieldName = fieldPath.join('/');

    // Get vault ID by name
    const vaultId = await this.getVaultIdByName(vaultName);
    if (!vaultId) {
      return { value: null, found: false, error: `Vault "${vaultName}" not found` };
    }

    // Get item
    const item = await this.getItemByTitle(vaultId, itemName);
    if (!item) {
      return { value: null, found: false, error: `Item "${itemName}" not found in vault "${vaultName}"` };
    }

    // Find field
    const field = item.fields?.find(f =>
      f.label === fieldName || f.id === fieldName
    );

    if (!field) {
      return { value: null, found: false, error: `Field "${fieldName}" not found in item "${itemName}"` };
    }

    return {
      value: field.value,
      found: true
    };
  }

  /**
   * Get secret by item name from default vault
   */
  private async getByName(name: string): Promise<SecretProviderResult> {
    if (!this.config.defaultVaultId) {
      return {
        value: null,
        found: false,
        error: 'No default vault configured. Use op://vault/item/field format or set defaultVaultId.'
      };
    }

    const item = await this.getItemByTitle(this.config.defaultVaultId, name);
    if (!item) {
      return { value: null, found: false };
    }

    // Return password or first concealed field
    const secretField = item.fields?.find(f =>
      f.purpose === 'PASSWORD' || f.type === 'CONCEALED'
    );

    if (!secretField) {
      return { value: null, found: false, error: 'No secret field found in item' };
    }

    return {
      value: secretField.value,
      found: true
    };
  }

  async listSecrets(): Promise<string[]> {
    if (!this.config.defaultVaultId) return [];

    try {
      const items = await this.listItems(this.config.defaultVaultId);
      return items.map(item => item.title);
    } catch {
      return [];
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.token}`,
      'Content-Type': 'application/json'
    };
  }

  private async getVaultIdByName(name: string): Promise<string | null> {
    // Check cache first
    if (this.vaultCache.has(name)) {
      return this.vaultCache.get(name)!;
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/v1/vaults`, {
        headers: this.getHeaders()
      });

      if (!response.ok) return null;

      const vaults: OnePasswordVault[] = await response.json();
      const vault = vaults.find(v => v.name === name);

      if (vault) {
        this.vaultCache.set(name, vault.id);
        return vault.id;
      }

      return null;
    } catch {
      return null;
    }
  }

  private async getItemByTitle(vaultId: string, title: string): Promise<OnePasswordItem | null> {
    try {
      // Search for items by title
      const encodedTitle = encodeURIComponent(title);
      const response = await fetch(
        `${this.config.serverUrl}/v1/vaults/${vaultId}/items?filter=title eq "${encodedTitle}"`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return null;

      const items: OnePasswordItem[] = await response.json();
      if (items.length === 0) return null;

      // Get full item details (includes field values)
      return this.getItemById(vaultId, items[0].id);
    } catch {
      return null;
    }
  }

  private async getItemById(vaultId: string, itemId: string): Promise<OnePasswordItem | null> {
    try {
      const response = await fetch(
        `${this.config.serverUrl}/v1/vaults/${vaultId}/items/${itemId}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return null;

      return response.json();
    } catch {
      return null;
    }
  }

  private async listItems(vaultId: string): Promise<OnePasswordItem[]> {
    try {
      const response = await fetch(
        `${this.config.serverUrl}/v1/vaults/${vaultId}/items`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return [];

      return response.json();
    } catch {
      return [];
    }
  }

  /**
   * Clear the vault ID cache
   */
  clearCache(): void {
    this.vaultCache.clear();
  }
}
