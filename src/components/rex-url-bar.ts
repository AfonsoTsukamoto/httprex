import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../design-system/define';
import { rexTokens } from '../tokens/tokens';
import type { RexHttpMethod } from './rex-method-selector';

export class RexUrlBar extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        font-family: var(--rex-font-sans);
      }

      .row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: var(--rex-space-2);
        align-items: center;
      }

      rex-input {
        width: 100%;
      }

      .send {
        white-space: nowrap;
      }

      @media (max-width: 560px) {
        .row {
          grid-template-columns: 1fr;
        }

        rex-method-selector,
        rex-button {
          width: 100%;
        }
      }
    `
  ];

  @property({ type: String }) method: RexHttpMethod = 'GET';
  @property({ type: String }) url = 'https://api.example.com/users';
  @property({ type: Boolean }) disabled = false;
  @property({ type: String, reflect: true }) theme?: 'light' | 'dark';

  private _onMethodChange(e: CustomEvent<{ value: string }>) {
    this.method = (e.detail?.value || 'GET') as RexHttpMethod;
    this.dispatchEvent(new CustomEvent('rex-change', { detail: { method: this.method, url: this.url }, bubbles: true, composed: true }));
  }

  private _onUrlInput(e: CustomEvent<{ value: string }>) {
    this.url = e.detail?.value ?? '';
    this.dispatchEvent(new CustomEvent('rex-change', { detail: { method: this.method, url: this.url }, bubbles: true, composed: true }));
  }

  private _send() {
    this.dispatchEvent(
      new CustomEvent('rex-send', { detail: { method: this.method, url: this.url }, bubbles: true, composed: true })
    );
  }

  render() {
    const theme = this.theme ?? nothing;
    return html`
      <div class="row">
        <rex-method-selector .value=${this.method} @rex-change=${this._onMethodChange} theme=${theme}></rex-method-selector>
        <rex-input
          .value=${this.url}
          placeholder="https://..."
          type="url"
          ?disabled=${this.disabled}
          mono
          @rex-input=${this._onUrlInput}
          theme=${theme}
          aria-label="Request URL"
        ></rex-input>
        <rex-button class="send" variant="primary" ?disabled=${this.disabled} @click=${this._send} theme=${theme}>
          <span slot="icon"><rex-icon name="play"></rex-icon></span>
          Send
        </rex-button>
      </div>
    `;
  }
}

defineElement('rex-url-bar', RexUrlBar);

declare global {
  interface HTMLElementTagNameMap {
    'rex-url-bar': RexUrlBar;
  }
}
