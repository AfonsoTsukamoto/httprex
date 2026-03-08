/**
 * Secrets module
 * Provides pluggable secret management for httprex
 */

export type {
  SecretReference,
  SecretProviderResult,
  SecretProvider,
  SecretProviderConfig
} from './types';

export { SecretManager, secretManager } from './manager';

// Built-in providers
export {
  PromptSecretProvider,
  ChromeEncryptedSecretProvider,
  OnePasswordConnectProvider,
  OnePasswordCLIProvider
} from './providers';

export type {
  PromptSecretProviderOptions,
  OnePasswordConnectConfig,
  OnePasswordCLIConfig
} from './providers';
