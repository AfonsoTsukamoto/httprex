import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../utils/define';
import { rexTokens } from '../tokens/tokens';

export class RexTextarea extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        font-family: var(--rex-font-sans);
      }

      textarea {
        width: 100%;
        box-sizing: border-box;
        min-height: 120px;
        resize: vertical;
        border: 1px solid var(--rex-color-border);
        background: var(--rex-color-surface);
        color: var(--rex-color-text);
        border-radius: var(--rex-radius-sm);
        padding: var(--rex-space-3);
        font-size: var(--rex-font-size-md);
        font-family: inherit;
        line-height: var(--rex-line-height-md);
        transition: border-color var(--rex-duration-fast) var(--rex-ease), box-shadow var(--rex-duration-fast) var(--rex-ease);
      }

      textarea::placeholder {
        color: var(--rex-color-text-3);
      }

      textarea:hover {
        border-color: var(--rex-color-border-2);
      }

      textarea:focus {
        outline: none;
        box-shadow: 0 0 0 var(--rex-focus-ring-width) rgba(28, 110, 242, 0.22);
        border-color: rgba(28, 110, 242, 0.55);
      }

      :host([mono]) textarea {
        font-family: var(--rex-font-mono);
      }
    `
  ];

  @property({ type: String }) value = '';
  @property({ type: String }) placeholder = '';
  @property({ type: Boolean, reflect: true }) mono = false;

  private _onInput(e: Event) {
    const next = (e.target as HTMLTextAreaElement).value;
    this.value = next;
    this.dispatchEvent(new CustomEvent('rex-input', { detail: { value: next }, bubbles: true, composed: true }));
  }

  render() {
    const ariaLabel = this.getAttribute('aria-label');
    return html`<textarea
      .value=${this.value}
      placeholder=${this.placeholder}
      aria-label=${ariaLabel ?? nothing}
      @input=${this._onInput}
    ></textarea>`;
  }
}

defineElement('rex-textarea', RexTextarea);

declare global {
  interface HTMLElementTagNameMap {
    'rex-textarea': RexTextarea;
  }
}
