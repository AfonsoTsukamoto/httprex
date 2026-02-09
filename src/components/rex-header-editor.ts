import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defineElement } from '../design-system/define';
import { rexTokens } from '../tokens/tokens';

export type RexKeyValueItem = {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
};

function uid(prefix = 'kv') {
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

export class RexHeaderEditor extends LitElement {
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

      rex-toggle {
        transform: translateY(1px);
      }

      rex-input {
        width: 100%;
      }

      .key rex-input,
      .val rex-input {
        width: 100%;
      }

      .mono rex-input {
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

      rex-button[variant='icon'] {
        color: var(--rex-color-text-2);
      }

      rex-button[variant='icon']:hover {
        color: var(--rex-color-text);
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
    this._items = (next ?? []).map((i) => ({ ...i, id: i.id || uid('hdr') }));
  }
  get items() {
    return this._items;
  }

  @state() private _items: RexKeyValueItem[] = [
    { id: uid('hdr'), enabled: true, key: 'Accept', value: 'application/json' }
  ];

  private _emit() {
    this.dispatchEvent(new CustomEvent('rex-change', { detail: { items: this._items }, bubbles: true, composed: true }));
  }

  private _add() {
    this._items = [...this._items, { id: uid('hdr'), enabled: true, key: '', value: '' }];
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
                aria-label="Enable header"
              ></rex-toggle>

              <div class="key mono">
                <rex-input
                  .value=${row.key}
                  placeholder="Header"
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
                <rex-button variant="icon" size="sm" theme=${theme} aria-label="Remove header" @click=${() => this._remove(row.id)}>
                  <span slot="icon"><rex-icon name="trash"></rex-icon></span>
                </rex-button>
              </div>
            </div>
          `
        )}
      </div>

      <div class="actions">
        <span class="hint">Key/value pairs are included only when enabled.</span>
        <rex-button size="sm" theme=${theme} @click=${this._add}>
          <span slot="icon"><rex-icon name="plus"></rex-icon></span>
          Add parameter
        </rex-button>
      </div>
    `;
  }
}

defineElement('rex-header-editor', RexHeaderEditor);

declare global {
  interface HTMLElementTagNameMap {
    'rex-header-editor': RexHeaderEditor;
  }
}
