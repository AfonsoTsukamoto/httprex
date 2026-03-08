import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../utils/define';
import { rexTokens } from '../tokens/tokens';

export class RexTooltip extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: inline-block;
        position: relative;
        font-family: var(--rex-font-sans);
      }

      .tip {
        position: absolute;
        left: 50%;
        top: calc(100% + 8px);
        transform: translateX(-50%);
        background: var(--rex-color-text);
        color: var(--rex-color-accent-contrast);
        border-radius: var(--rex-radius-xs);
        padding: 6px 10px;
        font-size: var(--rex-font-size-xs);
        line-height: var(--rex-line-height-tight);
        white-space: nowrap;
        box-shadow: var(--rex-shadow-md);
        opacity: 0;
        pointer-events: none;
        transition: opacity var(--rex-duration-fast) var(--rex-ease), transform var(--rex-duration-fast) var(--rex-ease);
      }

      .tip::before {
        content: '';
        position: absolute;
        left: 50%;
        top: -6px;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-bottom-color: var(--rex-color-text);
      }

      :host(:hover) .tip,
      :host(:focus-within) .tip {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `
  ];

  @property({ type: String }) text = '';

  render() {
    return html`<slot></slot><span class="tip" role="tooltip">${this.text}</span>`;
  }
}

defineElement('rex-tooltip', RexTooltip);

declare global {
  interface HTMLElementTagNameMap {
    'rex-tooltip': RexTooltip;
  }
}
