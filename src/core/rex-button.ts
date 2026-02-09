import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../design-system/define';
import { rexTokens } from '../tokens/tokens';

export type RexButtonVariant = 'primary' | 'ghost' | 'icon';
export type RexButtonSize = 'sm' | 'md';

export class RexButton extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: inline-block;
        font-family: var(--rex-font-sans);
      }

      button {
        appearance: none;
        border: 1px solid var(--rex-color-border);
        background: transparent;
        color: var(--rex-color-text);
        border-radius: var(--rex-radius-sm);
        padding: 0 var(--rex-space-4);
        height: 36px;
        font-size: var(--rex-font-size-md);
        line-height: var(--rex-line-height-tight);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--rex-space-2);
        transition:
          background var(--rex-duration-fast) var(--rex-ease),
          border-color var(--rex-duration-fast) var(--rex-ease),
          transform var(--rex-duration-fast) var(--rex-ease),
          opacity var(--rex-duration-fast) var(--rex-ease);
      }

      button:focus-visible {
        outline: none;
        box-shadow: 0 0 0 var(--rex-focus-ring-width) rgba(28, 110, 242, 0.28);
      }

      button:hover:not(:disabled) {
        background: var(--rex-color-hover);
        border-color: var(--rex-color-border-2);
        transform: translateY(-1px);
      }

      button:active:not(:disabled) {
        transform: translateY(0);
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      :host([size='sm']) button {
        height: 30px;
        padding: 0 var(--rex-space-3);
        font-size: var(--rex-font-size-sm);
      }

      :host([variant='primary']) button {
        background: var(--rex-color-accent);
        border-color: var(--rex-color-accent);
        color: var(--rex-color-accent-contrast);
      }

      :host([variant='primary']) button:hover:not(:disabled) {
        filter: brightness(1.05);
        background: var(--rex-color-accent);
        border-color: var(--rex-color-accent);
      }

      :host([variant='ghost']) button {
        background: transparent;
      }

      :host([variant='icon']) button {
        width: 36px;
        padding: 0;
      }

      :host([variant='icon'][size='sm']) button {
        width: 30px;
      }

      .icon {
        display: inline-flex;
      }

      ::slotted(rex-icon) {
        width: 16px;
        height: 16px;
      }
    `
  ];

  @property({ type: String, reflect: true }) variant: RexButtonVariant = 'ghost';
  @property({ type: String, reflect: true }) size: RexButtonSize = 'md';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) type: 'button' | 'submit' = 'button';

  render() {
    const ariaLabel = this.variant === 'icon' ? this.getAttribute('aria-label') : null;
    return html`<button ?disabled=${this.disabled} type=${this.type} aria-label=${ariaLabel ?? nothing}>
      <slot name="icon" class="icon"></slot>
      <slot></slot>
    </button>`;
  }
}

defineElement('rex-button', RexButton);

declare global {
  interface HTMLElementTagNameMap {
    'rex-button': RexButton;
  }
}
