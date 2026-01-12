/**
 * Httprex - HTTP request library for markdown
 * Main entry point
 */

import { HttpParser, httpParser } from './parser';
import { executeRequest, ExecuteOptions } from './executor';
import { VariableResolver, variableResolver } from './variables';
import { ParsedRequest, ParsedRequestFile, ParserResult, HttprexOptions, VariableContext } from './types';
import { setGlobalVariableStorage } from './variables/storage';

export class Httprex {
  private static parser: HttpParser = httpParser;
  private static resolver: VariableResolver = variableResolver;
  private static options: HttprexOptions = {};

  /**
   * Initialize httprex with options
   */
  static init(options: HttprexOptions = {}) {
    this.options = options;

    // Set variable storage if provided
    if (options.variableStorage) {
      setGlobalVariableStorage(options.variableStorage);
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

    // Create httprex-block custom element
    const block = document.createElement('httprex-block');
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
}

// Export types
export type {
  ParsedRequest,
  ParsedRequestFile,
  ParserResult,
  HttpResponse,
  ExecutedRequest,
  ParserError,
  HttprexOptions,
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

// Default export
export default Httprex;
