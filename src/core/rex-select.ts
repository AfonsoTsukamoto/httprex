import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../design-system/define';
import { rexTokens } from '../tokens/tokens';

export class RexSelect extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: inline-block;
        font-family: var(--rex-font-sans);
      }

      .wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
        width: 100%;
      }

      select {
        width: 100%;
        appearance: none;
        border: 1px solid var(--rex-color-border);
        background: var(--rex-color-surface);
        color: var(--rex-color-text);
        border-radius: var(--rex-radius-sm);
        height: 36px;
        padding: 0 calc(var(--rex-space-3) + 18px) 0 var(--rex-space-3);
        font-size: var(--rex-font-size-md);
        font-family: inherit;
        cursor: pointer;
        transition: border-color var(--rex-duration-fast) var(--rex-ease);
      }

      select:hover {
        border-color: var(--rex-color-border-2);
      }

      select:focus {
        outline: none;
        box-shadow: 0 0 0 var(--rex-focus-ring-width) rgba(28, 110, 242, 0.22);
        border-color: rgba(28, 110, 242, 0.55);
      }

      .chev {
        position: absolute;
        right: var(--rex-space-2);
        pointer-events: none;
        color: var(--rex-color-text-2);
        display: inline-flex;
        align-items: center;
      }

      :host([size='sm']) select {
        height: 30px;
        font-size: var(--rex-font-size-sm);
      }
    `
  ];

  @property({ type: String }) value = '';
  @property({ type: String, reflect: true }) size: 'sm' | 'md' = 'md';

  private _onChange(e: Event) {
    const next = (e.target as HTMLSelectElement).value;
    this.value = next;
    this.dispatchEvent(new CustomEvent('rex-change', { detail: { value: next }, bubbles: true, composed: true }));
  }

  render() {
    return html`<span class="wrap" part="wrap">
      <select part="select" .value=${this.value} @change=${this._onChange}>
        <slot></slot>
      </select>
      <span class="chev" part="chev"><rex-icon name="chevron-down"></rex-icon></span>
    </span>`;
  }
}

defineElement('rex-select', RexSelect);

declare global {
  interface HTMLElementTagNameMap {
    'rex-select': RexSelect;
  }
}
