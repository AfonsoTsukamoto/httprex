import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defineElement } from '../design-system/define';
import { rexTokens } from '../tokens/tokens';

export class RexInput extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: inline-block;
        font-family: var(--rex-font-sans);
      }

      input {
        width: 100%;
        box-sizing: border-box;
        appearance: none;
        border: 1px solid var(--rex-color-border);
        background: var(--rex-color-surface);
        color: var(--rex-color-text);
        border-radius: var(--rex-radius-sm);
        height: 36px;
        padding: 0 var(--rex-space-3);
        font-size: var(--rex-font-size-md);
        font-family: inherit;
        transition: border-color var(--rex-duration-fast) var(--rex-ease), box-shadow var(--rex-duration-fast) var(--rex-ease);
      }

      input::placeholder {
        color: var(--rex-color-text-3);
      }

      input:hover {
        border-color: var(--rex-color-border-2);
      }

      input:focus {
        outline: none;
        box-shadow: 0 0 0 var(--rex-focus-ring-width) rgba(28, 110, 242, 0.22);
        border-color: rgba(28, 110, 242, 0.55);
      }

      input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      :host([mono]) input {
        font-family: var(--rex-font-mono);
      }

      :host([size='sm']) input {
        height: 30px;
        font-size: var(--rex-font-size-sm);
      }
    `
  ];

  @property({ type: String }) value = '';
  @property({ type: String }) placeholder = '';
  @property({ type: String }) name = '';
  @property({ type: String }) type: 'text' | 'url' | 'password' = 'text';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) mono = false;
  @property({ type: String, reflect: true }) size: 'sm' | 'md' = 'md';

  @state() private _id = `rex-input-${Math.random().toString(16).slice(2)}`;

  private _onInput(e: Event) {
    const next = (e.target as HTMLInputElement).value;
    this.value = next;
    this.dispatchEvent(new CustomEvent('rex-input', { detail: { value: next }, bubbles: true, composed: true }));
  }

  render() {
    const ariaLabel = this.getAttribute('aria-label');
    return html`<input
      id=${this._id}
      .value=${this.value}
      placeholder=${this.placeholder}
      name=${this.name}
      type=${this.type}
      ?disabled=${this.disabled}
      aria-label=${ariaLabel ?? nothing}
      @input=${this._onInput}
    />`;
  }
}

defineElement('rex-input', RexInput);

declare global {
  interface HTMLElementTagNameMap {
    'rex-input': RexInput;
  }
}
