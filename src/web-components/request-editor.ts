/**
 * httprex-request component
 * Displays and allows editing of HTTP request
 */

import { ParsedRequest } from '../lib-httprex/types';
import { sharedStyles, getMethodColor } from './styles';

export class HttprexRequestElement extends HTMLElement {
  private shadow: ShadowRoot;
  private request: ParsedRequest | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    // Parse request from text content if provided
    const text = this.textContent;
    if (text && text.trim()) {
      // Will be set by parent component
    }
  }

  setRequest(request: ParsedRequest) {
    this.request = request;
    this.render();
  }

  getRequest(): ParsedRequest | null {
    return this.request;
  }

  private render() {
    if (!this.request) {
      this.shadow.innerHTML = `
        <style>${sharedStyles}</style>
        <div class="httprex-request-empty">
          <p style="color: var(--httprex-text-secondary);">No request to display</p>
        </div>
      `;
      return;
    }

    const methodColor = getMethodColor(this.request.method);

    this.shadow.innerHTML = `
      <style>
        ${sharedStyles}

        .httprex-request-container {
          background: var(--httprex-bg);
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-md);
          overflow: hidden;
        }

        .httprex-request-line {
          display: flex;
          align-items: center;
          gap: var(--httprex-spacing-sm);
          padding: var(--httprex-spacing-md);
          background: var(--httprex-bg-secondary);
          border-bottom: 1px solid var(--httprex-border);
        }

        .httprex-method-select {
          background: ${methodColor};
          border: none;
          border-radius: var(--httprex-radius-sm);
          color: #fff;
          font-family: var(--httprex-font-family-mono);
          font-size: var(--httprex-font-size-sm);
          font-weight: 600;
          padding: var(--httprex-spacing-sm) var(--httprex-spacing-md);
          min-width: 80px;
          cursor: pointer;
        }

        .httprex-url-input {
          flex: 1;
          background: var(--httprex-bg);
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-sm);
          color: var(--httprex-text);
          font-family: var(--httprex-font-family-mono);
          font-size: var(--httprex-font-size-sm);
          padding: var(--httprex-spacing-sm);
        }

        .httprex-section {
          border-bottom: 1px solid var(--httprex-border);
        }

        .httprex-section:last-child {
          border-bottom: none;
        }

        .httprex-section-header {
          padding: var(--httprex-spacing-sm) var(--httprex-spacing-md);
          background: var(--httprex-bg-secondary);
          font-weight: 600;
          font-size: var(--httprex-font-size-sm);
          color: var(--httprex-text-secondary);
          cursor: pointer;
          user-select: none;
        }

        .httprex-section-header:hover {
          background: var(--httprex-bg-hover);
        }

        .httprex-section-content {
          padding: var(--httprex-spacing-md);
        }

        .httprex-section-content.collapsed {
          display: none;
        }

        .httprex-header-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: var(--httprex-spacing-sm);
          margin-bottom: var(--httprex-spacing-sm);
          font-family: var(--httprex-font-family-mono);
          font-size: var(--httprex-font-size-sm);
        }

        .httprex-header-name {
          color: var(--httprex-text-secondary);
        }

        .httprex-header-value {
          color: var(--httprex-text);
        }

        .httprex-body-preview {
          background: var(--httprex-bg-secondary);
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-sm);
          font-family: var(--httprex-font-family-mono);
          font-size: var(--httprex-font-size-sm);
          padding: var(--httprex-spacing-md);
          overflow-x: auto;
          white-space: pre-wrap;
          max-height: 300px;
          overflow-y: auto;
        }

        .httprex-variable {
          color: var(--httprex-method-patch);
          font-weight: 600;
        }
      </style>

      <div class="httprex-request-container">
        <div class="httprex-request-line">
          <select class="httprex-method-select" disabled>
            <option>${this.request.method}</option>
          </select>
          <input
            type="text"
            class="httprex-url-input"
            value="${this.escapeHtml(this.request.url)}"
            readonly
          />
        </div>

        ${this.renderHeaders()}
        ${this.renderBody()}
      </div>
    `;
  }

  private renderHeaders(): string {
    if (!this.request || Object.keys(this.request.headers).length === 0) {
      return '';
    }

    const headerRows = Object.entries(this.request.headers)
      .map(([name, value]) => `
        <div class="httprex-header-row">
          <div class="httprex-header-name">${this.escapeHtml(name)}:</div>
          <div class="httprex-header-value">${this.escapeHtml(value)}</div>
        </div>
      `)
      .join('');

    return `
      <div class="httprex-section">
        <div class="httprex-section-header" onclick="this.nextElementSibling.classList.toggle('collapsed')">
          Headers (${Object.keys(this.request.headers).length})
        </div>
        <div class="httprex-section-content">
          ${headerRows}
        </div>
      </div>
    `;
  }

  private renderBody(): string {
    if (!this.request || !this.request.body) {
      return '';
    }

    const bodyContent = typeof this.request.body === 'string'
      ? this.request.body
      : JSON.stringify(this.request.body, null, 2);

    return `
      <div class="httprex-section">
        <div class="httprex-section-header" onclick="this.nextElementSibling.classList.toggle('collapsed')">
          Body
        </div>
        <div class="httprex-section-content">
          <div class="httprex-body-preview">${this.highlightVariables(this.escapeHtml(bodyContent))}</div>
        </div>
      </div>
    `;
  }

  private highlightVariables(text: string): string {
    // Highlight {{varName}} patterns
    return text.replace(/\{\{([^}]+)\}\}/g, (match) => {
      return `<span class="httprex-variable">${match}</span>`;
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('httprex-request', HttprexRequestElement);
