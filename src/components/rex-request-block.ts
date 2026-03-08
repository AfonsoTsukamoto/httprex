import { LitElement, css, html, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { defineElement } from '../utils/define';
import { rexTokens } from '../tokens/tokens';
import type { RexHttpMethod } from './rex-method-selector';
import type { RexKeyValueItem } from './rex-header-editor';
import type { RexResponsePanel } from './rex-response-panel';
import { HttpRex } from '../lib-httprex/index';
import { createRequestPreview } from '../lib-httprex/executor';
import type { ParsedRequest, RequestMethod } from '../lib-httprex/types';

export class RexRequestBlock extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        font-family: var(--rex-font-sans);
        color: var(--rex-color-text);
      }

      .frame {
        background: var(--rex-color-bg);
        border: 1px solid var(--rex-color-border);
        border-radius: var(--rex-radius-md);
        padding: var(--rex-space-5);
      }

      .titlebar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--rex-space-3);
        margin-bottom: var(--rex-space-4);
      }

      .title {
        display: inline-flex;
        align-items: center;
        gap: var(--rex-space-2);
        font-size: var(--rex-font-size-sm);
        font-weight: 500;
        color: var(--rex-color-text-3);
        letter-spacing: 0;
      }

      .title-icon {
        width: 14px;
        height: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--rex-color-text-3);
      }

      .tools {
        display: inline-flex;
        gap: var(--rex-space-1);
        align-items: center;
      }

      .view-toggle {
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        padding: 4px;
        color: var(--rex-color-text-3);
        transition: color var(--rex-duration-fast) var(--rex-ease), opacity var(--rex-duration-fast) var(--rex-ease);
      }

      .view-toggle:hover {
        opacity: 0.7;
      }

      .view-toggle[data-active] {
        color: var(--rex-color-text);
      }

      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--rex-space-4);
      }

      .two {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--rex-space-4);
      }

      @media (min-width: 920px) {
        .two {
          grid-template-columns: 1fr 1fr;
          align-items: start;
        }
      }
    `
  ];

  @property({ type: String, reflect: true }) theme?: 'light' | 'dark';

  @state() private _method: RexHttpMethod = 'GET';
  @state() private _url = 'https://api.example.com/users';
  @state() private _view: 'ui' | 'code' = 'ui';
  @state() private _loading = false;

  /** Current headers from the header editor */
  private _headers: RexKeyValueItem[] = [
    { id: 'default-accept', enabled: true, key: 'Accept', value: 'application/json' }
  ];

  /** Current query params from the param editor */
  private _params: RexKeyValueItem[] = [];

  /** Current body from the body editor */
  private _body = '';

  @query('rex-response-panel')
  private _responsePanel!: RexResponsePanel;

  private _onUrlBarChange(e: CustomEvent<{ method: RexHttpMethod; url: string }>) {
    this._method = e.detail?.method ?? 'GET';
    this._url = e.detail?.url ?? '';
  }

  private _onHeaderChange(e: CustomEvent<{ items: RexKeyValueItem[] }>) {
    this._headers = e.detail?.items ?? [];
  }

  private _onParamChange(e: CustomEvent<{ items: RexKeyValueItem[] }>) {
    this._params = e.detail?.items ?? [];
  }

  private _onBodyInput(e: CustomEvent<{ value: string }>) {
    this._body = e.detail?.value ?? '';
  }

  /**
   * Build a URL with query parameters appended
   */
  private _buildUrlWithParams(): string {
    const enabledParams = this._params.filter(p => p.enabled && p.key);
    if (enabledParams.length === 0) return this._url;

    try {
      const url = new URL(this._url);
      for (const param of enabledParams) {
        url.searchParams.append(param.key, param.value);
      }
      return url.toString();
    } catch {
      // If URL is invalid, just append as query string
      const qs = enabledParams
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&');
      const sep = this._url.includes('?') ? '&' : '?';
      return `${this._url}${sep}${qs}`;
    }
  }

  /**
   * Build enabled headers as a Record<string, string>
   */
  private _buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const h of this._headers) {
      if (h.enabled && h.key) {
        headers[h.key] = h.value;
      }
    }
    return headers;
  }

  /**
   * Build a ParsedRequest from the current UI state
   */
  private _buildParsedRequest(): ParsedRequest {
    const url = this._buildUrlWithParams();
    const headers = this._buildHeaders();
    const method = this._method as RequestMethod;
    const hasBody = !['GET', 'HEAD'].includes(method);
    const body = hasBody && this._body.trim() ? this._body.trim() : undefined;

    // Build raw lines for the preview
    const headerLines = Object.entries(headers).map(([k, v]) => `${k}: ${v}`);
    const bodyLines = body ? body.split('\n') : [];

    return {
      method,
      url,
      headers,
      body: body ?? null,
      variables: [],
      raw: {
        requestLine: `${method} ${url}`,
        headerLines,
        bodyLines,
      }
    };
  }

  /**
   * Build a raw request string for the code view
   */
  private _buildRawRequestString(): string {
    const request = this._buildParsedRequest();
    return createRequestPreview(request);
  }

  private async _onSend(_e: CustomEvent<{ method: RexHttpMethod; url: string }>) {
    if (this._loading) return;

    const request = this._buildParsedRequest();

    // Set loading state
    this._loading = true;
    this._responsePanel?.setLoading();

    // Dispatch event so consumers can listen
    this.dispatchEvent(new CustomEvent('rex-send', {
      detail: { method: this._method, url: this._url, request },
      bubbles: true,
      composed: true,
    }));

    try {
      const result = await HttpRex.execute(request);

      if (result.response) {
        this._responsePanel?.setResponse(result.response);
      } else if (result.error) {
        this._responsePanel?.setError(result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._responsePanel?.setError(message);
    } finally {
      this._loading = false;
    }
  }

  private _setView(view: 'ui' | 'code') {
    this._view = view;
  }

  render() {
    const theme = this.theme ?? nothing;
    const raw = this._buildRawRequestString();

    return html`
      <div class="frame">
        <div class="titlebar">
          <div class="title">
            <span class="title-icon"><rex-icon name="diamond"></rex-icon></span>
            Request Block
          </div>
          <div class="tools">
            <span
              class="view-toggle"
              ?data-active=${this._view === 'ui'}
              @click=${() => this._setView('ui')}
              aria-label="UI view"
            ><rex-icon name="layers"></rex-icon></span>
            <span
              class="view-toggle"
              ?data-active=${this._view === 'code'}
              @click=${() => this._setView('code')}
              aria-label="Code view"
            ><rex-icon name="code"></rex-icon></span>
          </div>
        </div>

        <div class="stack">
          ${this._view === 'ui' ? html`
            <rex-url-bar
              .method=${this._method}
              .url=${this._url}
              ?disabled=${this._loading}
              @rex-change=${this._onUrlBarChange}
              @rex-send=${this._onSend}
              theme=${theme}
            ></rex-url-bar>

            <div class="two">
              <rex-request-panel
                theme=${theme}
                @rex-header-change=${this._onHeaderChange}
                @rex-param-change=${this._onParamChange}
                @rex-body-input=${this._onBodyInput}
              ></rex-request-panel>
              <rex-response-panel theme=${theme}></rex-response-panel>
            </div>
          ` : html`
            <rex-code-preview .value=${raw} theme=${theme} title="Raw request"></rex-code-preview>
          `}
        </div>
      </div>
    `;
  }
}

defineElement('rex-request-block', RexRequestBlock);

declare global {
  interface HTMLElementTagNameMap {
    'rex-request-block': RexRequestBlock;
  }
}
