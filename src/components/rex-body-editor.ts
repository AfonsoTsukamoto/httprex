import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../utils/define';
import { rexTokens } from '../tokens/tokens';

export class RexBodyEditor extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        font-family: var(--rex-font-sans);
        color: var(--rex-color-text);
      }

      .label {
        display: inline-flex;
        align-items: center;
        gap: var(--rex-space-2);
        font-size: var(--rex-font-size-sm);
        color: var(--rex-color-text-2);
        margin-bottom: var(--rex-space-2);
      }

      .pill {
        font-family: var(--rex-font-mono);
        font-size: 12px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid var(--rex-color-border);
        background: var(--rex-color-surface-2);
        color: var(--rex-color-text-2);
      }

      rex-textarea {
        width: 100%;
      }
    `
  ];

  @property({ type: String }) value = '{\n  "hello": "world"\n}';
  @property({ type: String, reflect: true }) theme?: 'light' | 'dark';

  private _onInput(e: CustomEvent<{ value: string }>) {
    this.value = e.detail?.value ?? '';
    this.dispatchEvent(new CustomEvent('rex-input', { detail: { value: this.value }, bubbles: true, composed: true }));
  }

  render() {
    const theme = this.theme ?? nothing;

    return html`
      <div class="label"><span class="pill">JSON</span> Request body</div>
      <rex-textarea
        .value=${this.value}
        mono
        theme=${theme}
        placeholder="{}"
        aria-label="Request body"
        @rex-input=${this._onInput}
      ></rex-textarea>
    `;
  }
}

defineElement('rex-body-editor', RexBodyEditor);

declare global {
  interface HTMLElementTagNameMap {
    'rex-body-editor': RexBodyEditor;
  }
}
