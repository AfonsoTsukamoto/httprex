import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defineElement } from '../utils/define';
import { rexTokens } from '../tokens/tokens';
import type { RexKeyValueItem } from './rex-header-editor';

function uid(prefix = 'kv') {
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

export class RexParamEditor extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        font-family: var(--rex-font-sans);
        color: var(--rex-color-text);
      }

      .rows {
        display: flex;
        flex-direction: column;
        gap: var(--rex-space-2);
      }

      .row {
        display: grid;
        grid-template-columns: auto 1fr 1fr auto;
        gap: var(--rex-space-2);
        align-items: center;
      }

      rex-input {
        width: 100%;
      }

      .mono {
        font-family: var(--rex-font-mono);
      }

      .actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: var(--rex-space-3);
      }

      .hint {
        font-size: var(--rex-font-size-sm);
        color: var(--rex-color-text-3);
      }

      @media (max-width: 720px) {
        .row {
          grid-template-columns: auto 1fr auto;
          grid-template-areas:
            'toggle key del'
            'toggle val del';
        }

        .key {
          grid-area: key;
        }
        .val {
          grid-area: val;
        }
        .del {
          grid-area: del;
        }
        rex-toggle {
          grid-area: toggle;
        }
      }
    `
  ];

  @property({ type: String, reflect: true }) theme?: 'light' | 'dark';

  @property({ attribute: false })
  set items(next: RexKeyValueItem[]) {
    this._items = (next ?? []).map((i) => ({ ...i, id: i.id || uid('qp') }));
  }
  get items() {
    return this._items;
  }

  @state() private _items: RexKeyValueItem[] = [
    { id: uid('qp'), enabled: true, key: 'limit', value: '10' },
    { id: uid('qp'), enabled: false, key: 'cursor', value: '{{cursor}}' }
  ];

  private _emit() {
    this.dispatchEvent(new CustomEvent('rex-change', { detail: { items: this._items }, bubbles: true, composed: true }));
  }

  private _add() {
    this._items = [...this._items, { id: uid('qp'), enabled: true, key: '', value: '' }];
    this._emit();
  }

  private _remove(id: string) {
    this._items = this._items.filter((i) => i.id !== id);
    this._emit();
  }

  private _update(id: string, patch: Partial<RexKeyValueItem>) {
    this._items = this._items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    this._emit();
  }

  render() {
    const theme = this.theme ?? nothing;

    return html`
      <div class="rows">
        ${this._items.map(
          (row) => html`
            <div class="row">
              <rex-toggle
                .checked=${row.enabled}
                @rex-change=${(e: CustomEvent<{ checked: boolean }>) => this._update(row.id, { enabled: !!e.detail?.checked })}
                theme=${theme}
                aria-label="Enable query parameter"
              ></rex-toggle>

              <div class="key mono">
                <rex-input
                  .value=${row.key}
                  placeholder="Parameter"
                  mono
                  size="sm"
                  theme=${theme}
                  @rex-input=${(e: CustomEvent<{ value: string }>) => this._update(row.id, { key: e.detail?.value ?? '' })}
                ></rex-input>
              </div>

              <div class="val mono">
                <rex-input
                  .value=${row.value}
                  placeholder="Value"
                  mono
                  size="sm"
                  theme=${theme}
                  @rex-input=${(e: CustomEvent<{ value: string }>) => this._update(row.id, { value: e.detail?.value ?? '' })}
                ></rex-input>
              </div>

              <div class="del">
                <rex-button variant="icon" size="sm" theme=${theme} aria-label="Remove query parameter" @click=${() => this._remove(row.id)}>
                  <span slot="icon"><rex-icon name="trash"></rex-icon></span>
                </rex-button>
              </div>
            </div>
          `
        )}
      </div>

      <div class="actions">
        <span class="hint">Disabled params are ignored.</span>
        <rex-button size="sm" theme=${theme} @click=${this._add}>
          <span slot="icon"><rex-icon name="plus"></rex-icon></span>
          Add parameter
        </rex-button>
      </div>
    `;
  }
}

defineElement('rex-param-editor', RexParamEditor);

declare global {
  interface HTMLElementTagNameMap {
    'rex-param-editor': RexParamEditor;
  }
}
