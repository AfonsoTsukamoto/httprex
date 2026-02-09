import { LitElement, css, html, nothing } from 'lit';
import { property, queryAssignedElements, state } from 'lit/decorators.js';
import { defineElement } from '../design-system/define';
import { rexTokens } from '../tokens/tokens';

export class RexTab extends LitElement {
  static styles = css`
    :host {
      display: none;
    }

    :host([active]) {
      display: block;
    }
  `;

  @property({ type: String, reflect: true }) name = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean, reflect: true }) active = false;

  render() {
    return html`<slot></slot>`;
  }
}

defineElement('rex-tab', RexTab);

export class RexTabs extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        font-family: var(--rex-font-sans);
        color: var(--rex-color-text);
      }

      .header {
        display: flex;
        align-items: center;
        gap: var(--rex-space-2);
        border-bottom: 1px solid var(--rex-color-border);
      }

      .tab {
        appearance: none;
        border: none;
        background: transparent;
        padding: var(--rex-space-3) var(--rex-space-2);
        margin: 0;
        font: inherit;
        font-size: var(--rex-font-size-sm);
        color: var(--rex-color-text-2);
        cursor: pointer;
        position: relative;
        transition: color var(--rex-duration-fast) var(--rex-ease);
      }

      .tab:hover {
        color: var(--rex-color-text);
      }

      .tab[aria-selected='true'] {
        color: var(--rex-color-text);
        font-weight: 700;
      }

      .tab[aria-selected='true']::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -1px;
        height: 2px;
        background: var(--rex-color-text);
        border-radius: 2px;
      }

      .panel {
        padding-top: var(--rex-space-3);
      }
    `
  ];

  @property({ type: String }) value = '';
  @state() private _ready = false;

  @queryAssignedElements({ selector: 'rex-tab' }) private _tabs!: RexTab[];

  firstUpdated() {
    this._syncFromChildren();
    this._ready = true;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('value') && this._ready) {
      this._applyActive();
    }
  }

  private _syncFromChildren() {
    const first = this._tabs?.[0];
    const existing = this.value;
    if (!existing && first?.name) {
      this.value = first.name;
    }
    this._applyActive();
  }

  private _applyActive() {
    for (const tab of this._tabs ?? []) {
      tab.active = tab.name === this.value;
      tab.toggleAttribute('active', tab.active);
    }
  }

  private _select(name: string) {
    this.value = name;
    this._applyActive();
    this.dispatchEvent(new CustomEvent('rex-change', { detail: { value: name }, bubbles: true, composed: true }));
  }

  render() {
    const tabs = this._tabs ?? [];
    return html`
      <div class="header" role="tablist">
        ${tabs.map((t) => {
          const selected = t.name === this.value;
          return html`<button
            class="tab"
            role="tab"
            aria-selected=${selected ? 'true' : 'false'}
            @click=${() => this._select(t.name)}
          >
            ${t.label || t.name || nothing}
          </button>`;
        })}
      </div>
      <div class="panel">
        <slot @slotchange=${() => this._syncFromChildren()}></slot>
      </div>
    `;
  }
}

defineElement('rex-tabs', RexTabs);

declare global {
  interface HTMLElementTagNameMap {
    'rex-tabs': RexTabs;
    'rex-tab': RexTab;
  }
}
