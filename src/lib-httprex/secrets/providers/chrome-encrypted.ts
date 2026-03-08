/**
 * Chrome Encrypted Secret Provider
 * Stores secrets encrypted in chrome.storage using AES-256-GCM
 * Similar to Postman's Vault approach but for browser extensions
 */

import { SecretProvider, SecretReference, SecretProviderResult } from '../types';

interface EncryptedSecret {
  ciphertext: number[];
  iv: number[];
}

export class ChromeEncryptedSecretProvider implements SecretProvider {
  readonly name = 'chrome-vault';
  readonly description = 'Chrome extension encrypted secret storage';

  private prefix = 'httprex-secrets';
  private encryptionKey: CryptoKey | null = null;

  isAvailable(): boolean {
    return typeof chrome !== 'undefined'
      && !!chrome.storage
      && typeof crypto !== 'undefined'
      && !!crypto.subtle;
  }

  /**
   * Initialize the vault with a password
   * Must be called before getSecret/setSecret/deleteSecret
   */
  async initialize(password: string): Promise<void> {
    const encoder = new TextEncoder();

    // Import password as key material for PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Use a fixed salt - in production, you might want to store a unique salt per user
    // but for a local browser extension, this is acceptable
    const salt = encoder.encode('httprex-vault-salt-v1');

    // Derive AES-256-GCM key using PBKDF2
    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Check if the vault is unlocked
   */
  isUnlocked(): boolean {
    return this.encryptionKey !== null;
  }

  async getSecret(ref: SecretReference): Promise<SecretProviderResult> {
    if (!this.encryptionKey) {
      return {
        value: null,
        found: false,
        error: 'Vault not unlocked. Call initialize() with password first.'
      };
    }

    try {
      const storageKey = `${this.prefix}:${ref.name}`;
      const result = await this.chromeStorageGet(storageKey);

      if (!result || !result[storageKey]) {
        return { value: null, found: false };
      }

      const encrypted: EncryptedSecret = result[storageKey];
      const decrypted = await this.decrypt(
        new Uint8Array(encrypted.ciphertext),
        new Uint8Array(encrypted.iv)
      );

      return {
        value: decrypted,
        found: true
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        value: null,
        found: false,
        error: `Decryption failed: ${message}`
      };
    }
  }

  async setSecret(name: string, value: string): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('Vault not unlocked. Call initialize() with password first.');
    }

    const { ciphertext, iv } = await this.encrypt(value);
    const storageKey = `${this.prefix}:${name}`;

    await this.chromeStorageSet({
      [storageKey]: {
        ciphertext: Array.from(ciphertext),
        iv: Array.from(iv)
      }
    });
  }

  async deleteSecret(name: string): Promise<void> {
    const storageKey = `${this.prefix}:${name}`;
    await this.chromeStorageRemove(storageKey);
  }

  async listSecrets(): Promise<string[]> {
    const result = await this.chromeStorageGet(null);
    if (!result) return [];

    return Object.keys(result)
      .filter(key => key.startsWith(`${this.prefix}:`))
      .map(key => key.substring(this.prefix.length + 1));
  }

  /**
   * Lock the vault (clear encryption key from memory)
   */
  lock(): void {
    this.encryptionKey = null;
  }

  /**
   * Clear all secrets from storage
   */
  async clearAll(): Promise<void> {
    const secrets = await this.listSecrets();
    for (const name of secrets) {
      await this.deleteSecret(name);
    }
  }

  private async encrypt(plaintext: string): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey!,
      encoder.encode(plaintext)
    );

    return {
      ciphertext: new Uint8Array(ciphertext),
      iv
    };
  }

  private async decrypt(ciphertext: Uint8Array, iv: Uint8Array): Promise<string> {
    // Create new ArrayBuffer copies to ensure compatibility with crypto.subtle
    const ivBuffer = new Uint8Array(iv).buffer;
    const ciphertextBuffer = new Uint8Array(ciphertext).buffer;

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
      this.encryptionKey!,
      ciphertextBuffer
    );

    return new TextDecoder().decode(decrypted);
  }

  // Chrome storage wrappers with Promise support
  private chromeStorageGet(keys: string | string[] | null): Promise<Record<string, EncryptedSecret>> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result as Record<string, EncryptedSecret>);
        }
      });
    });
  }

  private chromeStorageSet(items: Record<string, EncryptedSecret>): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  private chromeStorageRemove(keys: string | string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
}
