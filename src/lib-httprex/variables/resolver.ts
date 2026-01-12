/**
 * Variable resolver
 * Resolves {{varName}} references from multiple sources
 */

import { ParsedRequest, VariableContext } from '../types';
import { resolveVariables as lexerResolve } from '../parser/lexer';
import { resolveSystemVariable, isSystemVariable } from './system-vars';
import { getGlobalVariableStorage } from './storage';

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
   * Resolve all variables in a request
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
   * Build a complete variable map from all sources
   * Priority: system vars > global storage > file vars > environment vars
   */
  private buildVariableMap(): Record<string, string> {
    const map: Record<string, string> = {};

    // 1. Environment variables (lowest priority)
    if (this.context.fromEnvironment) {
      Object.assign(map, this.context.fromEnvironment);
    }

    // 2. File variables
    if (this.context.fromFile) {
      Object.assign(map, this.context.fromFile);
    }

    // 3. Global variables from storage
    Object.assign(map, this.globalVariables);

    // 4. System variables (highest priority - will be resolved on-demand)
    if (this.context.fromSystem) {
      Object.assign(map, this.context.fromSystem);
    }

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
      if (!isSystemVariable(varName) && variables[varName] === undefined) {
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
