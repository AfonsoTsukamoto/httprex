import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defineElement } from '../utils/define';
import { rexTokens } from '../tokens/tokens';
import type { RexHttpMethod } from './rex-method-selector';

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

  private _onUrlBarChange(e: CustomEvent<{ method: RexHttpMethod; url: string }>) {
    this._method = e.detail?.method ?? 'GET';
    this._url = e.detail?.url ?? '';
  }

  private _onSend(e: CustomEvent<{ method: RexHttpMethod; url: string }>) {
    // This is a design-system demo component; consumers can listen to rex-send.
    this.dispatchEvent(new CustomEvent('rex-send', { detail: e.detail, bubbles: true, composed: true }));
  }

  private _setView(view: 'ui' | 'code') {
    this._view = view;
  }

  render() {
    const theme = this.theme ?? nothing;
    const raw = `${this._method} ${this._url}\nAccept: application/json\n\n`;

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
              @rex-change=${this._onUrlBarChange}
              @rex-send=${this._onSend}
              theme=${theme}
            ></rex-url-bar>

            <div class="two">
              <rex-request-panel theme=${theme}></rex-request-panel>
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
