/**
 * 1Password CLI Secret Provider
 * Integrates with 1Password via the `op` CLI tool
 * Only works in Node.js/Electron environments
 */

import { SecretProvider, SecretReference, SecretProviderResult } from '../types';

type ExecFunction = (
  command: string,
  callback: (error: Error | null, stdout: string, stderr: string) => void
) => void;

export interface OnePasswordCLIConfig {
  /** Service account token (optional - uses current session if not provided) */
  serviceAccountToken?: string;
}

export class OnePasswordCLIProvider implements SecretProvider {
  readonly name = '1password-cli';
  readonly description = '1Password CLI (op) integration';

  private exec: ExecFunction | null = null;
  private config: OnePasswordCLIConfig;

  constructor(config: OnePasswordCLIConfig = {}) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    // Only available in Node.js environments
    if (typeof process === 'undefined' || !process.versions?.node) {
      return false;
    }

    try {
      // Dynamic import for Node.js environments
      const childProcess = await import('child_process');
      this.exec = childProcess.exec as ExecFunction;

      // Check if op CLI is installed and authenticated
      const result = await this.execAsync('op whoami --format=json');
      return result.includes('account');
    } catch {
      return false;
    }
  }

  async getSecret(ref: SecretReference): Promise<SecretProviderResult> {
    if (!this.exec) {
      return {
        value: null,
        found: false,
        error: '1Password CLI not available'
      };
    }

    try {
      let command: string;

      if (ref.type === 'onepassword' && ref.path) {
        // Use op:// reference directly with op read
        command = `op read "op://${ref.path}"`;
      } else {
        // Search by item name - get the password field by default
        command = `op item get "${this.escapeShellArg(ref.name)}" --fields password --format=json`;
      }

      // Add service account token if configured
      if (this.config.serviceAccountToken) {
        command = `OP_SERVICE_ACCOUNT_TOKEN="${this.config.serviceAccountToken}" ${command}`;
      }

      const output = await this.execAsync(command);

      // For op read, output is the raw value
      if (ref.type === 'onepassword' && ref.path) {
        return {
          value: output.trim(),
          found: true
        };
      }

      // For op item get --format=json, parse the JSON
      try {
        const parsed = JSON.parse(output);
        // If it's an object with value property
        if (parsed && typeof parsed === 'object' && 'value' in parsed) {
          return {
            value: parsed.value,
            found: true
          };
        }
        // If it's a string directly
        if (typeof parsed === 'string') {
          return {
            value: parsed,
            found: true
          };
        }
      } catch {
        // If JSON parse fails, return the raw output
        return {
          value: output.trim(),
          found: true
        };
      }

      return {
        value: output.trim(),
        found: true
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // Check for common error patterns
      if (message.includes('not found') || message.includes('no item')) {
        return {
          value: null,
          found: false,
          error: `Item "${ref.name}" not found in 1Password`
        };
      }

      if (message.includes('not signed in')) {
        return {
          value: null,
          found: false,
          error: '1Password CLI not signed in. Run "op signin" first.'
        };
      }

      return {
        value: null,
        found: false,
        error: `1Password CLI error: ${message}`
      };
    }
  }

  async listSecrets(): Promise<string[]> {
    if (!this.exec) return [];

    try {
      let command = 'op item list --format=json';

      if (this.config.serviceAccountToken) {
        command = `OP_SERVICE_ACCOUNT_TOKEN="${this.config.serviceAccountToken}" ${command}`;
      }

      const output = await this.execAsync(command);
      const items = JSON.parse(output);

      return items.map((item: { title: string }) => item.title);
    } catch {
      return [];
    }
  }

  private execAsync(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.exec) {
        reject(new Error('exec not available'));
        return;
      }

      this.exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Escape a string for use in shell commands
   */
  private escapeShellArg(arg: string): string {
    // Escape single quotes by ending the string, adding an escaped quote, and starting again
    return arg.replace(/'/g, "'\\''");
  }
}
