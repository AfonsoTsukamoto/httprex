/**
 * httprex-block component
 * Main container that orchestrates request parsing, execution, and display
 */

import { ParsedRequest, ExecutedRequest } from '../lib-httprex/types';
import { httpParser } from '../lib-httprex/parser';
import { executeRequest } from '../lib-httprex/executor';
import { variableResolver } from '../lib-httprex/variables';
import { sharedStyles } from './styles';

// Import to ensure components are registered
import './request-editor';
import './response-viewer';
import './variable-panel';
import type { HttprexRequestElement } from './request-editor';
import type { HttprexResponseElement } from './response-viewer';
import type { HttprexVariablePanelElement } from './variable-panel';

export class HttprexBlockElement extends HTMLElement {
  private shadow: ShadowRoot;
  private request: ParsedRequest | null = null;
  private requestElement: HttprexRequestElement | null = null;
  private responseElement: HttprexResponseElement | null = null;
  private variablePanelElement: HttprexVariablePanelElement | null = null;
  private isExecuting: boolean = false;
  private sendButton: HTMLButtonElement | null = null;
  private fileVariables: Record<string, string> = {};

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Parse request from text content
    const text = this.textContent?.trim() || '';
    if (text) {
      this.parseAndRender(text);
    } else {
      this.renderError('No request content provided');
    }
  }

  private parseAndRender(text: string) {
    // Check if this is a multi-request file (has ### separator) or single request
    const hasSeparator = /^#{3,}\s*$/m.test(text);
    const hasFileVariables = /^@\w+\s*=\s*.+$/m.test(text);

    // Use parseFile if it has separators or file variables
    if (hasSeparator || hasFileVariables) {
      const fileResult = httpParser.parseFile(text);

      if (!fileResult.success || !fileResult.data || fileResult.data.requests.length === 0) {
        const errorMessage = fileResult.errors.length > 0
          ? fileResult.errors.map(e => e.message).join(', ')
          : 'Failed to parse HTTP request';
        console.error('Httprex parse error:', errorMessage, fileResult.errors);
        this.renderError(errorMessage);
        return;
      }

      // Use the first request from the file
      this.request = fileResult.data.requests[0];
      this.fileVariables = fileResult.data.fileVariables || {};
      console.log('Httprex parsed request:', this.request);
      this.render();
    } else {
      // Single request without file variables
      const result = httpParser.parse(text);

      if (!result.success || !result.data) {
        const errorMessage = result.errors.length > 0
          ? result.errors.map(e => e.message).join(', ')
          : 'Failed to parse HTTP request';
        console.error('Httprex parse error:', errorMessage, result.errors);
        this.renderError(errorMessage);
        return;
      }

      this.request = result.data;
      this.fileVariables = {};
      console.log('Httprex parsed request:', this.request);
      this.render();
    }
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        ${sharedStyles}

        .httprex-block-container {
          background: var(--httprex-bg);
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-md);
          padding: var(--httprex-spacing-md);
          margin: var(--httprex-spacing-md) 0;
        }

        .httprex-toolbar {
          display: flex;
          align-items: center;
          gap: var(--httprex-spacing-sm);
          margin-bottom: var(--httprex-spacing-md);
          padding-bottom: var(--httprex-spacing-md);
          border-bottom: 1px solid var(--httprex-border);
        }

        .httprex-send-button {
          background: var(--httprex-method-get);
          border: none;
          border-radius: var(--httprex-radius-sm);
          color: #fff;
          cursor: pointer;
          font-family: var(--httprex-font-family);
          font-size: var(--httprex-font-size);
          font-weight: 600;
          padding: var(--httprex-spacing-sm) var(--httprex-spacing-lg);
          transition: all 0.2s;
        }

        .httprex-send-button:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .httprex-send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .httprex-send-button.executing {
          background: var(--httprex-text-secondary);
        }

        .httprex-copy-curl-button {
          background: transparent;
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-sm);
          color: var(--httprex-text);
          cursor: pointer;
          font-size: var(--httprex-font-size-sm);
          padding: var(--httprex-spacing-sm) var(--httprex-spacing-md);
        }

        .httprex-copy-curl-button:hover {
          background: var(--httprex-bg-hover);
          border-color: var(--httprex-border-hover);
        }

        .httprex-info {
          color: var(--httprex-text-secondary);
          font-size: var(--httprex-font-size-sm);
          margin-left: auto;
        }

        .httprex-variable-warning {
          background: rgba(252, 161, 48, 0.1);
          border: 1px solid var(--httprex-method-put);
          border-radius: var(--httprex-radius-sm);
          color: var(--httprex-method-put);
          padding: var(--httprex-spacing-sm) var(--httprex-spacing-md);
          margin-bottom: var(--httprex-spacing-md);
          font-size: var(--httprex-font-size-sm);
        }
      </style>

      <div class="httprex-block-container">
        <div class="httprex-toolbar">
          <button
            class="httprex-send-button ${this.isExecuting ? 'executing' : ''}"
            onclick="this.getRootNode().host.executeRequest()"
            ${this.isExecuting ? 'disabled' : ''}
          >
            ${this.isExecuting ? 'Executing...' : 'Send'}
          </button>
          <button
            class="httprex-copy-curl-button"
            onclick="this.getRootNode().host.copyCurl()"
          >
            Copy as cURL
          </button>
          <span class="httprex-info">${this.request?.name || ''}</span>
        </div>

        ${this.renderVariableWarning()}

        <div id="variable-panel-container"></div>
        <div id="request-container"></div>
        <div id="response-container"></div>
      </div>
    `;

    // Get reference to send button
    this.sendButton = this.shadow.querySelector('.httprex-send-button') as HTMLButtonElement;

    // Create variable panel
    const variablePanelContainer = this.shadow.getElementById('variable-panel-container');
    if (variablePanelContainer) {
      this.variablePanelElement = document.createElement('httprex-variable-panel') as HttprexVariablePanelElement;
      this.variablePanelElement.setFileVariables(this.fileVariables);
      variablePanelContainer.appendChild(this.variablePanelElement);
    }

    // Create and attach request element
    const requestContainer = this.shadow.getElementById('request-container');
    if (requestContainer && this.request) {
      this.requestElement = document.createElement('httprex-request') as HttprexRequestElement;
      this.requestElement.setRequest(this.request);
      requestContainer.appendChild(this.requestElement);
    }

    // Create response element (empty initially)
    const responseContainer = this.shadow.getElementById('response-container');
    if (responseContainer) {
      this.responseElement = document.createElement('httprex-response') as HttprexResponseElement;
      responseContainer.appendChild(this.responseElement);
    }
  }

  private renderVariableWarning(): string {
    if (!this.request || this.request.variables.length === 0) {
      return '';
    }

    const varNames = this.request.variables.map(v => v.name).join(', ');
    return `
      <div class="httprex-variable-warning">
        ⚠️ Unresolved variables: ${varNames}
      </div>
    `;
  }

  private renderError(message: string) {
    this.shadow.innerHTML = `
      <style>${sharedStyles}</style>
      <div class="httprex-error">
        <strong>Parse Error:</strong> ${this.escapeHtml(message)}
      </div>
    `;
  }

  async executeRequest() {
    if (!this.request || this.isExecuting) return;

    this.isExecuting = true;
    this.updateButtonState();

    try {
      // Load global variables from storage before execution
      await variableResolver.loadGlobalVariables();

      // Resolve variables if any
      const resolvedRequest = this.request.variables.length > 0
        ? variableResolver.resolveRequest(this.request)
        : this.request;

      // Execute the request
      const response = await executeRequest(resolvedRequest);
      console.log('Httprex response:', response);

      // Display response
      if (this.responseElement) {
        this.responseElement.setResponse(response);
        console.log('Response set on element:', this.responseElement);
      } else {
        console.error('Response element not found!');
      }
    } catch (error) {
      console.error('Request execution failed:', error);

      // Show error in response
      if (this.responseElement) {
        this.responseElement.setResponse({
          status: 0,
          statusText: 'Error',
          headers: {},
          body: {
            error: error instanceof Error ? error.message : String(error)
          },
          timing: {
            start: Date.now(),
            end: Date.now(),
            duration: 0
          }
        });
      }
    } finally {
      this.isExecuting = false;
      this.updateButtonState();
    }
  }

  private updateButtonState() {
    if (this.sendButton) {
      if (this.isExecuting) {
        this.sendButton.textContent = 'Executing...';
        this.sendButton.disabled = true;
        this.sendButton.classList.add('executing');
      } else {
        this.sendButton.textContent = 'Send';
        this.sendButton.disabled = false;
        this.sendButton.classList.remove('executing');
      }
    }
  }

  copyCurl() {
    if (!this.request) return;

    // Import toCurl function
    import('../lib-httprex/executor').then(({ toCurl }) => {
      const curlCommand = toCurl(this.request!);
      navigator.clipboard.writeText(curlCommand).then(() => {
        console.log('cURL command copied to clipboard');
        // Could show a toast notification here
      });
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('httprex-block', HttprexBlockElement);
