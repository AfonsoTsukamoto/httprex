import { LitElement, css, html, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { defineElement } from '../utils/define';
import { rexTokens } from '../tokens/tokens';
import type { RexHttpMethod } from './rex-method-selector';
import type { RexKeyValueItem } from './rex-header-editor';
import type { RexResponsePanel } from './rex-response-panel';
import { HttpRex } from '../lib-httprex/index';
import { serializeRequest } from '../lib-httprex/serializer';
import type { ParsedRequest } from '../lib-httprex/types';

const DEFAULT_RAW_TEXT = `GET https://api.example.com/users
Accept: application/json
`;

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

  /** The raw HTTP text — single source of truth */
  @state() private _rawText = DEFAULT_RAW_TEXT;

  /** Parsed request derived from _rawText */
  @state() private _parsed: ParsedRequest | null = null;

  @state() private _view: 'ui' | 'code' = 'ui';
  @state() private _loading = false;

  @query('rex-response-panel')
  private _responsePanel!: RexResponsePanel;

  connectedCallback() {
    super.connectedCallback();
    this._reparse();
  }

  /**
   * Re-parse the raw text and update the derived state.
   * This is the ONLY place ParsedRequest is created.
   */
  private _reparse() {
    const result = HttpRex.parse(this._rawText);
    this._parsed = result.success ? result.data : null;
  }

  /**
   * Update the raw text and re-parse.
   * All state changes flow through here.
   */
  private _updateRawText(text: string) {
    this._rawText = text;
    this._reparse();
  }

  // ── UI → raw text ──────────────────────────────────────────────

  private _onUrlBarChange(e: CustomEvent<{ method: RexHttpMethod; url: string }>) {
    const method = e.detail?.method ?? this._parsed?.method ?? 'GET';
    const url = e.detail?.url ?? this._parsed?.url ?? '';
    this._rebuildFromUI({ method, url });
  }

  private _onHeaderChange(e: CustomEvent<{ items: RexKeyValueItem[] }>) {
    this._rebuildFromUI({ headers: e.detail?.items });
  }

  private _onParamChange(e: CustomEvent<{ items: RexKeyValueItem[] }>) {
    this._rebuildFromUI({ params: e.detail?.items });
  }

  private _onBodyInput(e: CustomEvent<{ value: string }>) {
    this._rebuildFromUI({ body: e.detail?.value });
  }

  /**
   * Rebuild raw text from UI changes. Takes a partial update and merges
   * with current parsed state, then serializes back to text.
   */
  private _rebuildFromUI(patch: {
    method?: string;
    url?: string;
    headers?: RexKeyValueItem[];
    params?: RexKeyValueItem[];
    body?: string;
  }) {
    const method = patch.method ?? this._parsed?.method ?? 'GET';
    let url = patch.url ?? this._parsed?.url ?? '';

    // Merge params into URL
    const params = patch.params ?? this._extractParams();
    const enabledParams = params.filter(p => p.enabled && p.key);
    if (enabledParams.length > 0) {
      try {
        const urlObj = new URL(url.includes('://') ? url : `https://${url}`);
        // Clear existing params from parsed URL if we're managing them
        urlObj.search = '';
        for (const p of enabledParams) {
          urlObj.searchParams.append(p.key, p.value);
        }
        url = urlObj.toString();
      } catch {
        const qs = enabledParams
          .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&');
        const sep = url.includes('?') ? '&' : '?';
        url = `${url}${sep}${qs}`;
      }
    }

    // Build headers from UI items
    const headers = patch.headers ?? this._extractHeaders();
    const enabledHeaders = headers
      .filter(h => h.enabled && h.key)
      .map(h => ({ key: h.key, value: h.value }));

    const body = patch.body ?? this._parsed?.body ?? undefined;
    const hasBody = !['GET', 'HEAD'].includes(method);
    const bodyStr = hasBody && typeof body === 'string' && body.trim() ? body.trim() : undefined;

    const text = serializeRequest({
      method,
      url,
      headers: enabledHeaders,
      body: bodyStr,
    });

    this._updateRawText(text);
  }

  /**
   * Extract current headers as RexKeyValueItem[] from parsed state.
   */
  private _extractHeaders(): RexKeyValueItem[] {
    if (!this._parsed?.headers) return [];
    return Object.entries(this._parsed.headers).map(([key, value], i) => ({
      id: `hdr-${i}`,
      enabled: true,
      key,
      value,
    }));
  }

  /**
   * Extract query params from the current parsed URL as RexKeyValueItem[].
   */
  private _extractParams(): RexKeyValueItem[] {
    if (!this._parsed?.url) return [];
    try {
      const url = new URL(this._parsed.url);
      const params: RexKeyValueItem[] = [];
      url.searchParams.forEach((value, key) => {
        params.push({ id: `param-${params.length}`, enabled: true, key, value });
      });
      return params;
    } catch {
      return [];
    }
  }

  // ── Code view → raw text ───────────────────────────────────────

  private _onCodeChange(e: CustomEvent<{ value: string }>) {
    this._updateRawText(e.detail?.value ?? '');
  }

  // ── Execution ──────────────────────────────────────────────────

  private async _onSend() {
    if (this._loading || !this._parsed) return;

    this._loading = true;
    this._responsePanel?.setLoading();

    this.dispatchEvent(new CustomEvent('rex-send', {
      detail: { request: this._parsed },
      bubbles: true,
      composed: true,
    }));

    try {
      const result = await HttpRex.execute(this._parsed);

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
    const method = (this._parsed?.method ?? 'GET') as RexHttpMethod;
    const url = this._parsed?.url ?? '';
    const headers = this._extractHeaders();
    const params = this._extractParams();
    const body = typeof this._parsed?.body === 'string' ? this._parsed.body : '';

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
              .method=${method}
              .url=${url}
              ?disabled=${this._loading}
              @rex-change=${this._onUrlBarChange}
              @rex-send=${this._onSend}
              theme=${theme}
            ></rex-url-bar>

            <div class="two">
              <rex-request-panel
                theme=${theme}
                .headers=${headers}
                .params=${params}
                .body=${body}
                @rex-header-change=${this._onHeaderChange}
                @rex-param-change=${this._onParamChange}
                @rex-body-input=${this._onBodyInput}
              ></rex-request-panel>
              <rex-response-panel theme=${theme}></rex-response-panel>
            </div>
          ` : html`
            <rex-code-preview
              .value=${this._rawText}
              editable
              theme=${theme}
              title="Raw request"
              @rex-code-change=${this._onCodeChange}
            ></rex-code-preview>
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
