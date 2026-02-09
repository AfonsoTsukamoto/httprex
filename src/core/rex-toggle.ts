import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../design-system/define';
import { rexTokens } from '../tokens/tokens';

export class RexToggle extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: var(--rex-space-2);
        font-family: var(--rex-font-sans);
        color: var(--rex-color-text);
      }

      label {
        display: inline-flex;
        align-items: center;
        gap: var(--rex-space-2);
        cursor: pointer;
        user-select: none;
      }

      input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .track {
        width: 34px;
        height: 20px;
        border-radius: 999px;
        background: var(--rex-color-border);
        border: 1px solid var(--rex-color-border-2);
        display: inline-flex;
        align-items: center;
        padding: 2px;
        box-sizing: border-box;
        transition: background var(--rex-duration-fast) var(--rex-ease);
      }

      .thumb {
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: var(--rex-color-surface);
        box-shadow: var(--rex-shadow-sm);
        transform: translateX(0);
        transition: transform var(--rex-duration-fast) var(--rex-ease);
      }

      :host([checked]) .track {
        background: var(--rex-method-post);
        border-color: color-mix(in srgb, var(--rex-method-post) 60%, transparent);
      }

      :host([checked]) .thumb {
        transform: translateX(14px);
      }

      :host([disabled]) label {
        opacity: 0.6;
        cursor: not-allowed;
      }

      :host(:focus-within) .track {
        box-shadow: 0 0 0 var(--rex-focus-ring-width) rgba(28, 110, 242, 0.22);
      }

      .text {
        font-size: var(--rex-font-size-sm);
        color: var(--rex-color-text-2);
      }
    `
  ];

  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  private _onChange(e: Event) {
    if (this.disabled) return;
    const next = (e.target as HTMLInputElement).checked;
    this.checked = next;
    this.dispatchEvent(new CustomEvent('rex-change', { detail: { checked: next }, bubbles: true, composed: true }));
  }

  render() {
    return html`<label>
      <input type="checkbox" ?checked=${this.checked} ?disabled=${this.disabled} @change=${this._onChange} />
      <span class="track" part="track"><span class="thumb" part="thumb"></span></span>
      <span class="text"><slot></slot></span>
    </label>`;
  }
}

defineElement('rex-toggle', RexToggle);

declare global {
  interface HTMLElementTagNameMap {
    'rex-toggle': RexToggle;
  }
}
