/**
 * Variable resolver
 * Resolves {{varName}} references from multiple sources
 */

import { ParsedRequest, VariableContext } from '../types';
import { resolveVariables as lexerResolve } from '../parser/lexer';
import { resolveSystemVariable, isSystemVariable } from './system-vars';
import { getGlobalVariableStorage } from './storage';
import { environmentManager } from './environment';
import { SecretManager, secretManager } from '../secrets';

export class VariableResolver {
  private context: VariableContext;
  private globalVariables: Record<string, string> = {};

  constructor(context: VariableContext = {}) {
    this.context = context;
  }

  setContext(context: VariableContext) {
    this.context = context;
  }

  updateContext(partial: Partial<VariableContext>) {
    this.context = {
      ...this.context,
      ...partial
    };
  }

  /**
   * Load global variables from storage
   */
  async loadGlobalVariables(): Promise<void> {
    const storage = getGlobalVariableStorage();
    const result = storage.getAll();
    this.globalVariables = result instanceof Promise ? await result : result;
  }

  /**
   * Resolve all variables in a request (sync version - no secrets support)
   */
  resolveRequest(request: ParsedRequest): ParsedRequest {
    const allVariables = this.buildVariableMap();

    return {
      ...request,
      url: lexerResolve(request.url, allVariables),
      headers: this.resolveHeaders(request.headers, allVariables),
      body: this.resolveBody(request.body, allVariables)
    };
  }

  /**
   * Resolve all variables in a request (async version - with secrets support)
   */
  async resolveRequestAsync(request: ParsedRequest): Promise<ParsedRequest> {
    const allVariables = this.buildVariableMap();

    return {
      ...request,
      url: await this.resolveStringAsync(request.url, allVariables),
      headers: await this.resolveHeadersAsync(request.headers, allVariables),
      body: await this.resolveBodyAsync(request.body, allVariables)
    };
  }

  /**
   * Build a complete variable map from all sources
   * Priority: secrets > system vars > global storage > file vars > environment vars
   */
  private buildVariableMap(): Record<string, string> {
    const map: Record<string, string> = {};

    // 1. Environment variables from EnvironmentManager (lowest priority)
    const envVars = environmentManager.getEnvironmentVariables();
    Object.assign(map, envVars);

    // 2. Context-provided environment variables
    if (this.context.fromEnvironment) {
      Object.assign(map, this.context.fromEnvironment);
    }

    // 3. File variables
    if (this.context.fromFile) {
      Object.assign(map, this.context.fromFile);
    }

    // 4. Global variables from storage
    Object.assign(map, this.globalVariables);

    // 5. System variables (highest non-secret priority - will be resolved on-demand)
    if (this.context.fromSystem) {
      Object.assign(map, this.context.fromSystem);
    }

    // Note: Secrets are resolved separately in resolveStringAsync

    return map;
  }

  private resolveHeaders(
    headers: Record<string, string>,
    variables: Record<string, string>
  ): Record<string, string> {
    const resolved: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      resolved[key] = this.resolveString(value, variables);
    }

    return resolved;
  }

  private resolveBody(
    body: string | Record<string, any> | null | undefined,
    variables: Record<string, string>
  ): string | Record<string, any> | null | undefined {
    if (!body) return body;

    if (typeof body === 'string') {
      return this.resolveString(body, variables);
    }

    // For objects, recursively resolve
    return this.resolveObject(body, variables);
  }

  private resolveObject(
    obj: Record<string, any>,
    variables: Record<string, string>
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        resolved[key] = this.resolveString(value, variables);
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          resolved[key] = value.map(item =>
            typeof item === 'string'
              ? this.resolveString(item, variables)
              : item
          );
        } else {
          resolved[key] = this.resolveObject(value, variables);
        }
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private resolveString(
    str: string,
    variables: Record<string, string>
  ): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedName = varName.trim();

      // Check if it's a system variable
      if (isSystemVariable(trimmedName)) {
        const systemValue = resolveSystemVariable(trimmedName);
        if (systemValue !== null) {
          return systemValue;
        }
      }

      // Check in provided variables
      if (variables[trimmedName] !== undefined) {
        return variables[trimmedName];
      }

      // Variable not found, return original
      return match;
    });
  }

  // =============== Async methods for secrets support ===============

  private async resolveHeadersAsync(
    headers: Record<string, string>,
    variables: Record<string, string>
  ): Promise<Record<string, string>> {
    const resolved: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      resolved[key] = await this.resolveStringAsync(value, variables);
    }

    return resolved;
  }

  private async resolveBodyAsync(
    body: string | Record<string, unknown> | null | undefined,
    variables: Record<string, string>
  ): Promise<string | Record<string, unknown> | null | undefined> {
    if (!body) return body;

    if (typeof body === 'string') {
      return this.resolveStringAsync(body, variables);
    }

    // For objects, recursively resolve
    return this.resolveObjectAsync(body, variables);
  }

  private async resolveObjectAsync(
    obj: Record<string, unknown>,
    variables: Record<string, string>
  ): Promise<Record<string, unknown>> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        resolved[key] = await this.resolveStringAsync(value, variables);
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          resolved[key] = await Promise.all(
            value.map(async item =>
              typeof item === 'string'
                ? this.resolveStringAsync(item, variables)
                : item
            )
          );
        } else {
          resolved[key] = await this.resolveObjectAsync(value as Record<string, unknown>, variables);
        }
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Resolve a string with secrets support (async)
   */
  private async resolveStringAsync(
    str: string,
    variables: Record<string, string>
  ): Promise<string> {
    // Find all variable references
    const matches = [...str.matchAll(/\{\{([^}]+)\}\}/g)];

    let result = str;
    for (const match of matches) {
      const varName = match[1].trim();
      let value: string | null = null;

      // Check if it's a secret reference (highest priority)
      const secretRef = SecretManager.parseSecretReference(varName);
      if (secretRef) {
        const secretResult = await secretManager.getSecret(secretRef);
        if (secretResult.found && secretResult.value !== null) {
          value = secretResult.value;
        }
      }
      // Check system variables
      else if (isSystemVariable(varName)) {
        value = resolveSystemVariable(varName);
      }
      // Check regular variables
      else if (variables[varName] !== undefined) {
        value = variables[varName];
      }

      if (value !== null) {
        result = result.replace(match[0], value);
      }
    }

    return result;
  }

  /**
   * Get list of unresolved variables in a request
   */
  getUnresolvedVariables(request: ParsedRequest): string[] {
    const unresolved = new Set<string>();
    const allVariables = this.buildVariableMap();

    // Check URL
    this.findUnresolvedInString(request.url, allVariables, unresolved);

    // Check headers
    for (const value of Object.values(request.headers)) {
      this.findUnresolvedInString(value, allVariables, unresolved);
    }

    // Check body
    if (typeof request.body === 'string') {
      this.findUnresolvedInString(request.body, allVariables, unresolved);
    } else if (request.body && typeof request.body === 'object') {
      this.findUnresolvedInObject(request.body, allVariables, unresolved);
    }

    return Array.from(unresolved);
  }

  private findUnresolvedInString(
    str: string,
    variables: Record<string, string>,
    unresolved: Set<string>
  ) {
    const matches = str.matchAll(/\{\{([^}]+)\}\}/g);
    for (const match of matches) {
      const varName = match[1].trim();
      // Skip system variables (always resolvable)
      if (isSystemVariable(varName)) continue;
      // Skip secret references (resolved asynchronously via SecretManager)
      if (SecretManager.isSecretReference(varName)) continue;
      // Check if variable is defined
      if (variables[varName] === undefined) {
        unresolved.add(varName);
      }
    }
  }

  private findUnresolvedInObject(
    obj: Record<string, any>,
    variables: Record<string, string>,
    unresolved: Set<string>
  ) {
    for (const value of Object.values(obj)) {
      if (typeof value === 'string') {
        this.findUnresolvedInString(value, variables, unresolved);
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'string') {
              this.findUnresolvedInString(item, variables, unresolved);
            }
          });
        } else {
          this.findUnresolvedInObject(value, variables, unresolved);
        }
      }
    }
  }
}

// Export singleton instance
export const variableResolver = new VariableResolver();
