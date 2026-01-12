/**
 * Variable Storage Interface
 * Abstract interface for storing and retrieving variables across requests
 * Allows different storage backends: localStorage, SQLite, API, etc.
 */

export interface VariableStorage {
  /**
   * Get a variable value by key
   * @param key Variable name
   * @returns Variable value or null if not found
   */
  get(key: string): string | null | Promise<string | null>;

  /**
   * Set a variable value
   * @param key Variable name
   * @param value Variable value
   */
  set(key: string, value: string): void | Promise<void>;

  /**
   * Get all variables as a key-value object
   * @returns All variables
   */
  getAll(): Record<string, string> | Promise<Record<string, string>>;

  /**
   * Delete a variable
   * @param key Variable name
   */
  delete(key: string): void | Promise<void>;

  /**
   * Clear all variables
   */
  clear(): void | Promise<void>;
}

/**
 * In-Memory Variable Storage (default)
 * Variables are lost when the page refreshes
 * Good for: Testing, temporary sessions, serverless environments
 */
export class InMemoryVariableStorage implements VariableStorage {
  private variables: Record<string, string> = {};

  get(key: string): string | null {
    return this.variables[key] ?? null;
  }

  set(key: string, value: string): void {
    this.variables[key] = value;
  }

  getAll(): Record<string, string> {
    return { ...this.variables };
  }

  delete(key: string): void {
    delete this.variables[key];
  }

  clear(): void {
    this.variables = {};
  }
}

/**
 * LocalStorage Variable Storage
 * Variables persist across page refreshes
 * Good for: Browser extensions, web apps, progressive web apps
 */
export class LocalStorageVariableStorage implements VariableStorage {
  private prefix: string;

  constructor(prefix: string = 'httprex-vars') {
    this.prefix = prefix;
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is not available in this environment');
    }
  }

  private getStorageKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  get(key: string): string | null {
    try {
      return localStorage.getItem(this.getStorageKey(key));
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(this.getStorageKey(key), value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  getAll(): Record<string, string> {
    const variables: Record<string, string> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith(`${this.prefix}:`)) {
          const key = storageKey.substring(this.prefix.length + 1);
          const value = localStorage.getItem(storageKey);
          if (value !== null) {
            variables[key] = value;
          }
        }
      }
    } catch (error) {
      console.error('Error reading all from localStorage:', error);
    }
    return variables;
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(key));
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith(`${this.prefix}:`)) {
          keysToRemove.push(storageKey);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

/**
 * Chrome Storage Variable Storage (for Chrome extensions)
 * Uses chrome.storage.local API for persistent storage
 * Good for: Chrome extensions, browser extensions
 */
export class ChromeStorageVariableStorage implements VariableStorage {
  private prefix: string;

  constructor(prefix: string = 'httprex-vars') {
    this.prefix = prefix;
    if (typeof chrome === 'undefined' || !chrome.storage) {
      throw new Error('chrome.storage is not available in this environment');
    }
  }

  private getStorageKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get(key: string): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get(this.getStorageKey(key));
      return result[this.getStorageKey(key)] ?? null;
    } catch (error) {
      console.error('Error reading from chrome.storage:', error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.getStorageKey(key)]: value });
    } catch (error) {
      console.error('Error writing to chrome.storage:', error);
    }
  }

  async getAll(): Promise<Record<string, string>> {
    const variables: Record<string, string> = {};
    try {
      const result = await chrome.storage.local.get(null);
      for (const [storageKey, value] of Object.entries(result)) {
        if (storageKey.startsWith(`${this.prefix}:`)) {
          const key = storageKey.substring(this.prefix.length + 1);
          variables[key] = value as string;
        }
      }
    } catch (error) {
      console.error('Error reading all from chrome.storage:', error);
    }
    return variables;
  }

  async delete(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(this.getStorageKey(key));
    } catch (error) {
      console.error('Error deleting from chrome.storage:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(null);
      const keysToRemove = Object.keys(result).filter(key => key.startsWith(`${this.prefix}:`));
      await chrome.storage.local.remove(keysToRemove);
    } catch (error) {
      console.error('Error clearing chrome.storage:', error);
    }
  }
}

/**
 * Global variable storage instance
 * Can be configured via Httprex.init()
 */
let globalStorage: VariableStorage = new InMemoryVariableStorage();

export function setGlobalVariableStorage(storage: VariableStorage): void {
  globalStorage = storage;
}

export function getGlobalVariableStorage(): VariableStorage {
  return globalStorage;
}
