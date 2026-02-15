import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../utils/define';
import { rexTokens } from '../tokens/tokens';

export type RexHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const METHODS: RexHttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

function methodVar(method: RexHttpMethod) {
  switch (method) {
    case 'GET':
      return 'var(--rex-method-get)';
    case 'POST':
      return 'var(--rex-method-post)';
    case 'PUT':
      return 'var(--rex-method-put)';
    case 'DELETE':
      return 'var(--rex-method-delete)';
    case 'PATCH':
      return 'var(--rex-method-patch)';
  }
}

export class RexMethodSelector extends LitElement {
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
        width: 120px;
      }

      rex-badge {
        position: absolute;
        left: var(--rex-space-2);
        pointer-events: none;
        font-family: var(--rex-font-mono);
        font-weight: 700;
        letter-spacing: 0.3px;
      }

      rex-select {
        width: 100%;
      }

      /* Override rex-select inner border-radius to capsule */
      rex-select::part(select) {
        padding-left: 64px;
        border-radius: 999px;
      }

      rex-select::part(wrap) {
        border-radius: 999px;
      }

      /* Fallback shim */
      .shim {
        position: absolute;
        inset: 0;
        pointer-events: none;
        border-radius: 999px;
      }
    `
  ];

  @property({ type: String }) value: RexHttpMethod = 'GET';
  @property({ type: String, reflect: true }) theme?: 'light' | 'dark';

  private _onChange(e: CustomEvent<{ value: string }>) {
    const next = (e.detail?.value || 'GET') as RexHttpMethod;
    this.value = next;
    this.dispatchEvent(new CustomEvent('rex-change', { detail: { value: next }, bubbles: true, composed: true }));
  }

  render() {
    const color = methodVar(this.value);
    const theme = this.theme ?? nothing;

    return html`
      <span class="wrap">
        <rex-badge .style=${`background:${color}; color: #fff; border-color: transparent;`} size="sm" theme=${theme}
          >${this.value}</rex-badge
        >
        <rex-select .value=${this.value} @rex-change=${this._onChange} size="md" theme=${theme} aria-label="HTTP method">
          ${METHODS.map((m) => html`<option value=${m}>${m}</option>`)}
        </rex-select>
        <span class="shim"></span>
      </span>
    `;
  }
}

defineElement('rex-method-selector', RexMethodSelector);

declare global {
  interface HTMLElementTagNameMap {
    'rex-method-selector': RexMethodSelector;
  }
}
