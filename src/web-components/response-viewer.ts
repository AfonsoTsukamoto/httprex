/**
 * httprex-response component
 * Displays HTTP response
 */

import { HttpResponse } from '../lib-httprex/types';
import { sharedStyles, getStatusColor } from './styles';

export class HttpRexResponseElement extends HTMLElement {
  private shadow: ShadowRoot;
  private response: HttpResponse | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }

  setResponse(response: HttpResponse) {
    this.response = response;
    this.render();
  }

  getResponse(): HttpResponse | null {
    return this.response;
  }

  private render() {
    if (!this.response) {
      this.shadow.innerHTML = `
        <style>${sharedStyles}</style>
        <div class="httprex-response-empty">
          <p style="color: var(--httprex-text-secondary); text-align: center; padding: var(--httprex-spacing-xl);">
            Click "Send" to execute the request
          </p>
        </div>
      `;
      return;
    }

    const statusColor = getStatusColor(this.response.status);
    const statusClass = this.getStatusClass(this.response.status);

    this.shadow.innerHTML = `
      <style>
        ${sharedStyles}

        .httprex-response-container {
          background: var(--httprex-bg);
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-md);
          overflow: hidden;
          margin-top: var(--httprex-spacing-md);
        }

        .httprex-response-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--httprex-spacing-md);
          background: var(--httprex-bg-secondary);
          border-bottom: 1px solid var(--httprex-border);
        }

        .httprex-status-info {
          display: flex;
          align-items: center;
          gap: var(--httprex-spacing-md);
        }

        .httprex-status-code {
          font-family: var(--httprex-font-family-mono);
          font-weight: 600;
          font-size: 16px;
          color: ${statusColor};
        }

        .httprex-status-text {
          color: var(--httprex-text-secondary);
        }

        .httprex-timing {
          color: var(--httprex-text-secondary);
          font-size: var(--httprex-font-size-sm);
          font-family: var(--httprex-font-family-mono);
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
          display: flex;
          justify-content: space-between;
          align-items: center;
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
          grid-template-columns: 250px 1fr;
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
          word-break: break-all;
        }

        .httprex-body-content {
          background: var(--httprex-bg-secondary);
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-sm);
          font-family: var(--httprex-font-family-mono);
          font-size: var(--httprex-font-size-sm);
          padding: var(--httprex-spacing-md);
          overflow-x: auto;
          white-space: pre-wrap;
          max-height: 500px;
          overflow-y: auto;
        }

        .httprex-copy-button {
          background: transparent;
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-sm);
          color: var(--httprex-text);
          cursor: pointer;
          font-size: var(--httprex-font-size-sm);
          padding: 4px 8px;
        }

        .httprex-copy-button:hover {
          background: var(--httprex-bg-hover);
        }
      </style>

      <div class="httprex-response-container">
        <div class="httprex-response-status">
          <div class="httprex-status-info">
            <span class="httprex-status-code">${this.response.status}</span>
            <span class="httprex-status-text">${this.escapeHtml(this.response.statusText)}</span>
          </div>
          <div class="httprex-timing">
            ${this.response.timing.duration}ms
          </div>
        </div>

        ${this.renderHeaders()}
        ${this.renderBody()}
      </div>
    `;
  }

  private renderHeaders(): string {
    if (!this.response || Object.keys(this.response.headers).length === 0) {
      return '';
    }

    const headerRows = Object.entries(this.response.headers)
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
          <span>Response Headers (${Object.keys(this.response.headers).length})</span>
        </div>
        <div class="httprex-section-content collapsed">
          ${headerRows}
        </div>
      </div>
    `;
  }

  private renderBody(): string {
    if (!this.response || !this.response.body) {
      return '';
    }

    const bodyContent = typeof this.response.body === 'string'
      ? this.response.body
      : JSON.stringify(this.response.body, null, 2);

    return `
      <div class="httprex-section">
        <div class="httprex-section-header" onclick="this.nextElementSibling.classList.toggle('collapsed')">
          <span>Response Body</span>
          <button class="httprex-copy-button" onclick="event.stopPropagation(); this.getRootNode().host.copyBody()">
            Copy
          </button>
        </div>
        <div class="httprex-section-content">
          <div class="httprex-body-content">${this.escapeHtml(bodyContent)}</div>
        </div>
      </div>
    `;
  }

  private getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'httprex-status-success';
    if (status >= 300 && status < 400) return 'httprex-status-redirect';
    if (status >= 400) return 'httprex-status-error';
    return 'httprex-status-info';
  }

  copyBody() {
    if (!this.response || !this.response.body) return;

    const bodyContent = typeof this.response.body === 'string'
      ? this.response.body
      : JSON.stringify(this.response.body, null, 2);

    navigator.clipboard.writeText(bodyContent).then(() => {
      // Could show a toast notification here
      console.log('Response body copied to clipboard');
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('httprex-response', HttpRexResponseElement);
