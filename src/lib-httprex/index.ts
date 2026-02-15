/**
 * HttpRex - HTTP request library for markdown
 * Main entry point
 */

import { HttpParser, httpParser } from './parser';
import { executeRequest, ExecuteOptions } from './executor';
import { VariableResolver, variableResolver } from './variables';
import { ParsedRequest, ParsedRequestFile, ParserResult, HttpRexOptions, VariableContext } from './types';
import { setGlobalVariableStorage } from './variables/storage';
import { EnvironmentManager, environmentManager, EnvironmentFile } from './variables/environment';
import { SecretManager, secretManager, SecretProvider, SecretProviderConfig } from './secrets';

/**
 * Extended options for HttpRex initialization
 */
export interface HttpRexInitOptions extends HttpRexOptions {
  environments?: {
    /** Environment file content (JSON string or object) */
    file?: string | EnvironmentFile;
    /** Auto-select first environment if none set */
    autoSelect?: boolean;
  };
  /** Secrets configuration */
  secrets?: {
    /** Secret providers to register */
    providers?: SecretProvider[];
  };
}

export class HttpRex {
  private static parser: HttpParser = httpParser;
  private static resolver: VariableResolver = variableResolver;
  private static options: HttpRexInitOptions = {};

  /**
   * Initialize httprex with options
   */
  static init(options: HttpRexInitOptions = {}) {
    this.options = options;

    // Set variable storage if provided
    if (options.variableStorage) {
      setGlobalVariableStorage(options.variableStorage);
    }

    // Load environments if provided
    if (options.environments?.file) {
      environmentManager.loadFromEnvFile(options.environments.file);
    }

    // Register secret providers if provided
    if (options.secrets?.providers) {
      options.secrets.providers.forEach((provider, index) => {
        secretManager.registerProvider({
          provider,
          // Higher index = lower priority, so first provider has highest priority
          priority: options.secrets!.providers!.length - index
        });
      });
    }

    // Auto-discover and render httprex blocks if selector provided
    if (options.selector || typeof document !== 'undefined') {
      this.discoverAndRender(options.selector || '.language-httprex');
    }
  }

  /**
   * Parse a single HTTP request from text
   */
  static parse(text: string): ParserResult<ParsedRequest> {
    return this.parser.parse(text);
  }

  /**
   * Parse multiple HTTP requests from a file
   */
  static parseFile(text: string): ParserResult<ParsedRequestFile> {
    return this.parser.parseFile(text);
  }

  /**
   * Execute a parsed HTTP request
   */
  static async execute(
    request: ParsedRequest,
    variables?: Record<string, string>,
    options?: ExecuteOptions
  ): Promise<import('./types').ExecutedRequest> {
    // Resolve variables if provided
    let resolvedRequest = request;
    if (variables) {
      this.resolver.setContext({ fromFile: variables });
      resolvedRequest = this.resolver.resolveRequest(request);
    }

    // Execute the request
    const executeOptions: ExecuteOptions = {
      ...options
    };
    if (options?.cors) {
      executeOptions.cors = options.cors;
    } else if (this.options.cors) {
      executeOptions.cors = this.options.cors;
    }

    const response = await executeRequest(resolvedRequest, executeOptions);

    return {
      ...resolvedRequest,
      response,
      executionTime: response.timing.duration
    };
  }

  /**
   * Render httprex content into an HTML element
   */
  static render(element: HTMLElement, text: string) {
    // Parse the request
    const result = this.parse(text);

    if (!result.success || !result.data) {
      element.innerHTML = `<div class="httprex-error">Failed to parse request</div>`;
      return;
    }

    // Create rex-request-block custom element
    const block = document.createElement('rex-request-block');
    block.textContent = text;
    element.appendChild(block);
  }

  /**
   * Discover and render all httprex blocks in the document
   */
  static discoverAndRender(selector: string = '.language-httprex') {
    if (typeof document === 'undefined') return;

    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const text = el.textContent || '';
      if (text.trim()) {
        this.render(el as HTMLElement, text);
      }
    });
  }

  /**
   * Set variable context for resolution
   */
  static setVariables(context: VariableContext) {
    this.resolver.setContext(context);
  }

  /**
   * Get the parser instance
   */
  static getParser(): HttpParser {
    return this.parser;
  }

  /**
   * Get the variable resolver instance
   */
  static getResolver(): VariableResolver {
    return this.resolver;
  }

  /**
   * Get the environment manager instance
   */
  static getEnvironmentManager(): EnvironmentManager {
    return environmentManager;
  }

  /**
   * Get the secret manager instance
   */
  static getSecretManager(): SecretManager {
    return secretManager;
  }

  /**
   * Execute a parsed HTTP request with async variable resolution (supports secrets)
   */
  static async executeAsync(
    request: ParsedRequest,
    variables?: Record<string, string>,
    options?: ExecuteOptions
  ): Promise<import('./types').ExecutedRequest> {
    // Set variables in resolver context if provided
    if (variables) {
      this.resolver.setContext({ fromFile: variables });
    }

    // Load global variables
    await this.resolver.loadGlobalVariables();

    // Use async resolution (supports secrets)
    const resolvedRequest = await this.resolver.resolveRequestAsync(request);

    // Execute the request
    const executeOptions: ExecuteOptions = {
      ...options
    };
    if (options?.cors) {
      executeOptions.cors = options.cors;
    } else if (this.options.cors) {
      executeOptions.cors = this.options.cors;
    }

    const response = await executeRequest(resolvedRequest, executeOptions);

    return {
      ...resolvedRequest,
      response,
      executionTime: response.timing.duration
    };
  }
}

// Export types
export type {
  ParsedRequest,
  ParsedRequestFile,
  ParserResult,
  HttpResponse,
  ExecutedRequest,
  ParserError,
  HttpRexOptions,
  VariableContext,
  RequestMethod,
  ContentType
} from './types';

// Export submodules
export { HttpParser, httpParser } from './parser';
export { executeRequest, toCurl, createRequestPreview } from './executor';
export { VariableResolver, variableResolver } from './variables';
export type { VariableStorage } from './variables/storage';
export {
  InMemoryVariableStorage,
  LocalStorageVariableStorage,
  ChromeStorageVariableStorage,
  setGlobalVariableStorage,
  getGlobalVariableStorage
} from './variables/storage';

// Environment exports
export { EnvironmentManager, environmentManager } from './variables/environment';
export type { Environment, EnvironmentFile, EnvironmentManagerOptions } from './variables/environment';

// Secrets exports
export { SecretManager, secretManager } from './secrets';
export type {
  SecretProvider,
  SecretReference,
  SecretProviderResult,
  SecretProviderConfig
} from './secrets';

// Built-in secret providers
export {
  PromptSecretProvider,
  ChromeEncryptedSecretProvider,
  OnePasswordConnectProvider,
  OnePasswordCLIProvider
} from './secrets';

export type {
  PromptSecretProviderOptions,
  OnePasswordConnectConfig,
  OnePasswordCLIConfig
} from './secrets';

// Default export
export default HttpRex;
