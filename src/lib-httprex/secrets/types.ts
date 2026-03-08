/**
 * Secret provider types
 * Defines the interface for pluggable secret backends
 */

/**
 * Secret reference syntax:
 * - {{secret:myApiKey}} - simple secret reference
 * - {{vault:myApiKey}} - Postman-compatible alias
 * - {{op://vault/item/field}} - 1Password reference format
 */
export interface SecretReference {
  /** Type of secret reference */
  type: 'secret' | 'vault' | 'onepassword';
  /** Secret name or identifier */
  name: string;
  /** For 1Password: vault/item/field path */
  path?: string;
}

export interface SecretProviderResult {
  /** The resolved secret value, or null if not found */
  value: string | null;
  /** Error message if resolution failed */
  error?: string;
  /** True if the secret was found (even if value is empty string) */
  found: boolean;
  /** Provider that resolved this secret */
  provider?: string;
}

/**
 * Interface for secret providers
 * Implementations must be async to support network-based providers
 */
export interface SecretProvider {
  /** Unique identifier for this provider */
  readonly name: string;

  /** Human-readable description */
  readonly description: string;

  /** Check if provider is available in current environment */
  isAvailable(): Promise<boolean> | boolean;

  /** Retrieve a secret by reference */
  getSecret(ref: SecretReference): Promise<SecretProviderResult>;

  /** List available secrets (for UI autocomplete) - optional */
  listSecrets?(): Promise<string[]>;

  /** Store a secret - only for vault-like providers */
  setSecret?(name: string, value: string): Promise<void>;

  /** Delete a secret - only for vault-like providers */
  deleteSecret?(name: string): Promise<void>;
}

/**
 * Configuration for registering a secret provider
 */
export interface SecretProviderConfig {
  /** Provider instance */
  provider: SecretProvider;
  /** Priority (higher = checked first). Default: 0 */
  priority?: number;
  /** Only use for specific environments (by name) */
  environments?: string[];
}
