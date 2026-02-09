import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../design-system/define';
import { rexTokens } from '../tokens/tokens';

export class RexRequestPanel extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        font-family: var(--rex-font-sans);
        color: var(--rex-color-text);
      }

      .card {
        background: var(--rex-color-surface);
        border: 1px solid var(--rex-color-border);
        border-radius: var(--rex-radius-md);
        padding: var(--rex-space-4);
      }

      rex-tabs {
        --rex-color-border: transparent;
      }

      .section {
        padding-top: var(--rex-space-3);
      }
    `
  ];

  @property({ type: String }) value: 'params' | 'headers' | 'body' = 'params';
  @property({ type: String, reflect: true }) theme?: 'light' | 'dark';

  private _onTabChange(e: CustomEvent<{ value: string }>) {
    const next = (e.detail?.value || 'params') as 'params' | 'headers' | 'body';
    this.value = next;
    this.dispatchEvent(new CustomEvent('rex-change', { detail: { value: next }, bubbles: true, composed: true }));
  }

  render() {
    const theme = this.theme ?? nothing;

    return html`
      <div class="card">
        <rex-tabs .value=${this.value} @rex-change=${this._onTabChange} theme=${theme}>
          <rex-tab name="params" label="Params">
            <div class="section"><rex-param-editor theme=${theme}></rex-param-editor></div>
          </rex-tab>
          <rex-tab name="headers" label="Headers">
            <div class="section"><rex-header-editor theme=${theme}></rex-header-editor></div>
          </rex-tab>
          <rex-tab name="body" label="Body">
            <div class="section"><rex-body-editor theme=${theme}></rex-body-editor></div>
          </rex-tab>
        </rex-tabs>
      </div>
    `;
  }
}

defineElement('rex-request-panel', RexRequestPanel);

declare global {
  interface HTMLElementTagNameMap {
    'rex-request-panel': RexRequestPanel;
  }
}
