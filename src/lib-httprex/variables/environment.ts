/**
 * Environment variable support
 * VSCode REST Client compatible http-client.env.json support
 */

export interface Environment {
  name: string;
  variables: Record<string, string>;
  /** Track which variables came from $shared */
  sharedVariables: string[];
}

export interface EnvironmentFile {
  $shared?: Record<string, string>;
  [environmentName: string]: Record<string, string> | undefined;
}

export interface EnvironmentManagerOptions {
  /** Callback when environment changes */
  onEnvironmentChange?: (envName: string | null) => void;
  /** Auto-select first environment if none set */
  autoSelectFirst?: boolean;
}

type EnvironmentChangeListener = (envName: string | null) => void;

export class EnvironmentManager {
  private environments: Map<string, Environment> = new Map();
  private currentEnvironment: string | null = null;
  private options: EnvironmentManagerOptions;
  private listeners: Set<EnvironmentChangeListener> = new Set();

  constructor(options: EnvironmentManagerOptions = {}) {
    this.options = options;
  }

  /**
   * Load environments from http-client.env.json format
   * Accepts either a JSON string or a parsed object
   */
  loadFromEnvFile(content: string | EnvironmentFile): void {
    const envFile = typeof content === 'string'
      ? this.parseEnvFile(content)
      : content;

    this.loadEnvironments(envFile);
  }

  /**
   * Parse JSON with error handling
   */
  private parseEnvFile(content: string): EnvironmentFile {
    try {
      return JSON.parse(content);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Invalid http-client.env.json format: ${message}`);
    }
  }

  /**
   * Load environments from a parsed environment file
   */
  loadEnvironments(envFile: EnvironmentFile): void {
    this.environments.clear();
    const shared = envFile.$shared || {};
    const sharedKeys = Object.keys(shared);

    for (const [name, vars] of Object.entries(envFile)) {
      if (name === '$shared' || !vars) continue;

      this.environments.set(name, {
        name,
        variables: { ...shared, ...vars },
        sharedVariables: sharedKeys
      });
    }

    // Auto-select first if configured and no current environment
    if (this.options.autoSelectFirst && this.environments.size > 0 && !this.currentEnvironment) {
      const firstName = this.listEnvironments()[0];
      this.setCurrentEnvironment(firstName);
    }
  }

  /**
   * Subscribe to environment changes
   * Returns unsubscribe function
   */
  onChange(listener: EnvironmentChangeListener): () => void {
    this.listeners.add(listener);

    // Also call the options callback if set
    if (this.options.onEnvironmentChange) {
      this.options.onEnvironmentChange(this.currentEnvironment);
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of environment change
   */
  private notifyListeners(): void {
    this.listeners.forEach(fn => fn(this.currentEnvironment));

    if (this.options.onEnvironmentChange) {
      this.options.onEnvironmentChange(this.currentEnvironment);
    }
  }

  /**
   * Set the current environment by name
   * Pass null to clear the current environment
   */
  setCurrentEnvironment(name: string | null): void {
    if (name !== null && !this.environments.has(name)) {
      throw new Error(`Environment "${name}" not found`);
    }

    const changed = this.currentEnvironment !== name;
    this.currentEnvironment = name;

    if (changed) {
      this.notifyListeners();
    }
  }

  /**
   * Get the current environment object
   */
  getCurrentEnvironment(): Environment | null {
    if (!this.currentEnvironment) return null;
    return this.environments.get(this.currentEnvironment) || null;
  }

  /**
   * Get the current environment name
   */
  getCurrentEnvironmentName(): string | null {
    return this.currentEnvironment;
  }

  /**
   * Get variables from the current environment
   */
  getEnvironmentVariables(): Record<string, string> {
    const env = this.getCurrentEnvironment();
    return env ? env.variables : {};
  }

  /**
   * List all available environment names
   */
  listEnvironments(): string[] {
    return Array.from(this.environments.keys());
  }

  /**
   * Check if an environment exists
   */
  hasEnvironment(name: string): boolean {
    return this.environments.has(name);
  }

  /**
   * Get a specific environment by name
   */
  getEnvironment(name: string): Environment | undefined {
    return this.environments.get(name);
  }

  /**
   * Clear all environments and reset state
   */
  clear(): void {
    this.environments.clear();
    this.currentEnvironment = null;
    this.notifyListeners();
  }
}

// Export singleton
export const environmentManager = new EnvironmentManager();
