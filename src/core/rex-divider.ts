import { LitElement, css, html } from 'lit';
import { defineElement } from '../utils/define';
import { rexTokens } from '../tokens/tokens';

export class RexDivider extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        height: 1px;
        background: var(--rex-color-border);
        border-radius: 1px;
      }
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'separator');
  }

  render() {
    return html``;
  }
}

defineElement('rex-divider', RexDivider);

declare global {
  interface HTMLElementTagNameMap {
    'rex-divider': RexDivider;
  }
}
