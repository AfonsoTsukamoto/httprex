import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defineElement } from '../design-system/define';
import { rexTokens } from '../tokens/tokens';

function statusColor(code: number) {
  if (code >= 200 && code < 300) return 'var(--rex-status-ok)';
  if (code >= 300 && code < 500) return 'var(--rex-status-warn)';
  return 'var(--rex-status-error)';
}

export class RexResponsePanel extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        font-family: var(--rex-font-sans);
        color: var(--rex-color-text);
      }

      .card {
        background: var(--rex-color-surface);
        border: 1px solid var(--rex-color-border);
        border-radius: var(--rex-radius-md);
        padding: var(--rex-space-4);
      }

      .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--rex-space-3);
        margin-bottom: var(--rex-space-3);
      }

      .meta {
        display: inline-flex;
        align-items: center;
        gap: var(--rex-space-2);
        flex-wrap: wrap;
      }

      .time {
        font-family: var(--rex-font-mono);
        font-size: var(--rex-font-size-sm);
        color: var(--rex-color-text-2);
      }

      .body {
        border: 1px solid var(--rex-color-border);
        background: var(--rex-color-surface-2);
        border-radius: var(--rex-radius-sm);
        padding: var(--rex-space-3);
        font-family: var(--rex-font-mono);
        font-size: 13px;
        line-height: 1.5;
        white-space: pre;
        overflow: auto;
      }

      .headers {
        margin-top: var(--rex-space-3);
        border-top: 1px solid var(--rex-color-border);
        padding-top: var(--rex-space-3);
      }

      .headerRow {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: var(--rex-space-2);
        font-family: var(--rex-font-mono);
        font-size: 13px;
        padding: 6px 0;
        border-bottom: 1px dashed color-mix(in srgb, var(--rex-color-border) 60%, transparent);
      }

      .headerRow:last-child {
        border-bottom: none;
      }

      .k {
        color: var(--rex-color-text-2);
      }

      .v {
        color: var(--rex-color-text);
        overflow-wrap: anywhere;
      }
    `
  ];

  @property({ type: Number }) status = 200;
  @property({ type: Number }) timeMs = 148;
  @property({ attribute: false }) headers: Record<string, string> = {
    'content-type': 'application/json; charset=utf-8',
    'x-request-id': 'req_01HZZ...'
  };
  @property({ type: String }) body = JSON.stringify({ ok: true, items: [{ id: 1, name: 'Avery' }] }, null, 2);
  @property({ type: String, reflect: true }) theme?: 'light' | 'dark';

  @state() private _showHeaders = false;

  private _onToggle(e: CustomEvent<{ checked: boolean }>) {
    this._showHeaders = !!e.detail?.checked;
  }

  render() {
    const theme = this.theme ?? nothing;
    const color = statusColor(this.status);

    return html`
      <div class="card">
        <div class="top">
          <div class="meta">
            <rex-badge .style=${`background:${color}; color:#fff; border-color: transparent;`} size="sm" theme=${theme}
              >${this.status}</rex-badge
            >
            <span class="time">${this.timeMs}ms</span>
          </div>
          <rex-toggle .checked=${this._showHeaders} @rex-change=${this._onToggle} theme=${theme}>Headers</rex-toggle>
        </div>

        <div class="body" role="region" aria-label="Response body"><code>${this.body}</code></div>

        ${this._showHeaders
          ? html`
              <div class="headers" role="region" aria-label="Response headers">
                ${Object.entries(this.headers).map(
                  ([k, v]) => html`<div class="headerRow"><div class="k">${k}</div><div class="v">${v}</div></div>`
                )}
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

defineElement('rex-response-panel', RexResponsePanel);

declare global {
  interface HTMLElementTagNameMap {
    'rex-response-panel': RexResponsePanel;
  }
}
