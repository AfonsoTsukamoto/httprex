import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../utils/define';
import { rexTokens } from '../tokens/tokens';

export class RexCodePreview extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        font-family: var(--rex-font-sans);
        color: var(--rex-color-text);
      }

      .terminal {
        background: var(--rex-color-code-bg);
        color: var(--rex-color-code-text);
        border-radius: var(--rex-radius-md);
        box-shadow: var(--rex-shadow-md);
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--rex-color-code-text) 10%, transparent);
      }

      .bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--rex-space-2) var(--rex-space-3);
        background: color-mix(in srgb, var(--rex-color-code-bg) 70%, #000);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .dots {
        display: inline-flex;
        gap: 6px;
        align-items: center;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        display: inline-block;
      }

      .dot.red {
        background: #ff5f57;
      }
      .dot.yellow {
        background: #febc2e;
      }
      .dot.green {
        background: #28c840;
      }

      .title {
        font-size: var(--rex-font-size-sm);
        color: var(--rex-color-code-muted);
        font-family: var(--rex-font-mono);
      }

      rex-button {
        color: var(--rex-color-code-muted);
        border-color: rgba(255, 255, 255, 0.12);
      }

      rex-button:hover {
        color: var(--rex-color-code-text);
        border-color: rgba(255, 255, 255, 0.2);
      }

      pre {
        margin: 0;
        padding: var(--rex-space-4);
        font-family: var(--rex-font-mono);
        font-size: 13px;
        line-height: 1.5;
        white-space: pre;
        overflow: auto;
      }
    `
  ];

  @property({ type: String }) title = 'Raw request';
  @property({ type: String }) value = 'GET https://api.example.com/users\nAccept: application/json\n\n';
  @property({ type: String, reflect: true }) theme?: 'light' | 'dark';

  private async _copy() {
    try {
      await navigator.clipboard.writeText(this.value);
      this.dispatchEvent(new CustomEvent('rex-copy', { detail: { value: this.value }, bubbles: true, composed: true }));
    } catch {
      // no-op
    }
  }

  render() {
    const theme = this.theme ?? nothing;
    return html`
      <div class="terminal" role="region" aria-label=${this.title}>
        <div class="bar">
          <span class="dots" aria-hidden="true">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </span>
          <span class="title">${this.title}</span>
          <rex-button variant="icon" size="sm" theme=${theme} aria-label="Copy" @click=${this._copy}>
            <span slot="icon"><rex-icon name="copy"></rex-icon></span>
          </rex-button>
        </div>
        <pre><code>${this.value}</code></pre>
      </div>
    `;
  }
}

defineElement('rex-code-preview', RexCodePreview);

declare global {
  interface HTMLElementTagNameMap {
    'rex-code-preview': RexCodePreview;
  }
}
