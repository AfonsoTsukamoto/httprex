/**
 * Environment variable support
 * Placeholder for future http-client.env.json support
 */

export interface Environment {
  name: string;
  variables: Record<string, string>;
}

export interface EnvironmentFile {
  $shared?: Record<string, string>;
  [environmentName: string]: Record<string, string> | undefined;
}

export class EnvironmentManager {
  private environments: Map<string, Environment> = new Map();
  private currentEnvironment: string | null = null;

  loadEnvironments(envFile: EnvironmentFile) {
    // Load shared variables
    const shared = envFile.$shared || {};

    // Load each environment
    for (const [name, vars] of Object.entries(envFile)) {
      if (name === '$shared' || !vars) continue;

      // Merge shared variables with environment-specific ones
      this.environments.set(name, {
        name,
        variables: { ...shared, ...vars }
      });
    }
  }

  setCurrentEnvironment(name: string) {
    if (!this.environments.has(name)) {
      throw new Error(`Environment "${name}" not found`);
    }
    this.currentEnvironment = name;
  }

  getCurrentEnvironment(): Environment | null {
    if (!this.currentEnvironment) return null;
    return this.environments.get(this.currentEnvironment) || null;
  }

  getEnvironmentVariables(): Record<string, string> {
    const env = this.getCurrentEnvironment();
    return env ? env.variables : {};
  }

  listEnvironments(): string[] {
    return Array.from(this.environments.keys());
  }
}

// Export singleton
export const environmentManager = new EnvironmentManager();
