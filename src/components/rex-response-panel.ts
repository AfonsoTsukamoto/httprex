import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defineElement } from '../utils/define';
import { rexTokens } from '../tokens/tokens';
import type { HttpResponse } from '../lib-httprex/types';

export type RexResponseState = 'idle' | 'loading' | 'success' | 'error';

function statusColor(code: number) {
  if (code >= 200 && code < 300) return 'var(--rex-status-ok)';
  if (code >= 300 && code < 500) return 'var(--rex-status-warn)';
  return 'var(--rex-status-error)';
}

function formatBody(body: string | Record<string, any>): string {
  if (typeof body === 'string') {
    // Try to parse and pretty-print JSON strings
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  }
  return JSON.stringify(body, null, 2);
}

export class RexResponsePanel extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        font-family: var(--rex-font-sans);
        color: var(--rex-color-text);
      }

      .card {
        background: transparent;
        border: none;
        border-radius: 0;
        padding: 0;
      }

      .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--rex-space-3);
        margin-bottom: var(--rex-space-3);
      }

      .meta {
        display: inline-flex;
        align-items: center;
        gap: var(--rex-space-2);
        flex-wrap: wrap;
      }

      .time {
        font-family: var(--rex-font-mono);
        font-size: var(--rex-font-size-sm);
        color: var(--rex-color-text-2);
      }

      .body {
        background: var(--rex-color-surface-2);
        border-radius: var(--rex-radius-sm);
        padding: var(--rex-space-3);
        font-family: var(--rex-font-mono);
        font-size: 13px;
        line-height: 1.5;
        white-space: pre;
        overflow: auto;
      }

      .headers {
        margin-top: var(--rex-space-3);
        padding-top: var(--rex-space-3);
      }

      .headerRow {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: var(--rex-space-2);
        font-family: var(--rex-font-mono);
        font-size: 13px;
        padding: 6px 0;
      }

      .k {
        color: var(--rex-color-text-2);
      }

      .v {
        color: var(--rex-color-text);
        overflow-wrap: anywhere;
      }

      .idle {
        padding: var(--rex-space-4);
        text-align: center;
        color: var(--rex-color-text-3);
        font-size: var(--rex-font-size-sm);
      }

      .loading {
        padding: var(--rex-space-4);
        text-align: center;
        color: var(--rex-color-text-2);
        font-size: var(--rex-font-size-sm);
      }

      .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid var(--rex-color-border);
        border-top-color: var(--rex-color-text-2);
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        margin-right: var(--rex-space-2);
        vertical-align: middle;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .error-box {
        background: var(--rex-color-surface-2);
        border-radius: var(--rex-radius-sm);
        padding: var(--rex-space-3);
        font-family: var(--rex-font-mono);
        font-size: 13px;
        line-height: 1.5;
        color: var(--rex-status-error, #e53e3e);
        white-space: pre-wrap;
      }
    `
  ];

  @property({ type: String, reflect: true }) theme?: 'light' | 'dark';

  /** The current display state */
  @property({ type: String }) responseState: RexResponseState = 'idle';

  /** The HTTP response to display */
  @property({ attribute: false }) response: HttpResponse | null = null;

  /** Error message for failed requests */
  @property({ type: String }) errorMessage = '';

  @state() private _showHeaders = false;

  private _onToggle(e: CustomEvent<{ checked: boolean }>) {
    this._showHeaders = !!e.detail?.checked;
  }

  /**
   * Set response data from an ExecutedRequest or HttpResponse
   */
  setResponse(response: HttpResponse) {
    this.response = response;
    if (response.status === 0) {
      this.responseState = 'error';
      this.errorMessage = typeof response.body === 'string'
        ? response.body
        : (response.body as any)?.error || response.statusText || 'Request failed';
    } else {
      this.responseState = 'success';
      this.errorMessage = '';
    }
  }

  setLoading() {
    this.responseState = 'loading';
    this.response = null;
    this.errorMessage = '';
  }

  setError(message: string) {
    this.responseState = 'error';
    this.errorMessage = message;
    this.response = null;
  }

  private _renderIdle() {
    return html`<div class="idle">Send a request to see the response.</div>`;
  }

  private _renderLoading() {
    return html`<div class="loading"><span class="spinner"></span>Sending request...</div>`;
  }

  private _renderError() {
    const theme = this.theme ?? nothing;
    const body = this.response
      ? formatBody(this.response.body)
      : this.errorMessage;
    const timeMs = this.response?.timing?.duration;

    return html`
      <div class="card">
        <div class="top">
          <div class="meta">
            <rex-badge .style=${'background: var(--rex-status-error); color:#fff; border-color: transparent;'} size="sm" theme=${theme}>
              ${this.response?.status ?? 'ERR'}
            </rex-badge>
            ${timeMs != null ? html`<span class="time">${timeMs}ms</span>` : nothing}
          </div>
        </div>
        <div class="error-box"><code>${body}</code></div>
      </div>
    `;
  }

  private _renderSuccess() {
    const theme = this.theme ?? nothing;
    const resp = this.response!;
    const color = statusColor(resp.status);
    const body = formatBody(resp.body);
    const timeMs = resp.timing.duration;

    return html`
      <div class="card">
        <div class="top">
          <div class="meta">
            <rex-badge .style=${`background:${color}; color:#fff; border-color: transparent;`} size="sm" theme=${theme}
              >${resp.status}</rex-badge
            >
            <span class="time">${timeMs}ms</span>
          </div>
          <rex-toggle .checked=${this._showHeaders} @rex-change=${this._onToggle} theme=${theme}>Headers</rex-toggle>
        </div>

        <div class="body" role="region" aria-label="Response body"><code>${body}</code></div>

        ${this._showHeaders
          ? html`
              <div class="headers" role="region" aria-label="Response headers">
                ${Object.entries(resp.headers).map(
                  ([k, v]) => html`<div class="headerRow"><div class="k">${k}</div><div class="v">${v}</div></div>`
                )}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  render() {
    switch (this.responseState) {
      case 'loading':
        return this._renderLoading();
      case 'error':
        return this._renderError();
      case 'success':
        return this._renderSuccess();
      default:
        return this._renderIdle();
    }
  }
}

defineElement('rex-response-panel', RexResponsePanel);

declare global {
  interface HTMLElementTagNameMap {
    'rex-response-panel': RexResponsePanel;
  }
}
