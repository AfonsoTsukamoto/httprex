import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../design-system/define';
import { rexTokens } from '../tokens/tokens';

export type RexCalloutTone = 'note' | 'warning';

export class RexCallout extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: block;
        border-radius: var(--rex-radius-md);
        border: 1px solid var(--rex-color-border);
        background: var(--rex-color-surface-2);
        padding: var(--rex-space-4);
        font-family: var(--rex-font-sans);
        color: var(--rex-color-text);
      }

      :host([tone='warning']) {
        border-color: var(--rex-color-warning-border);
        background: var(--rex-color-warning-bg);
        color: var(--rex-color-warning-text);
      }

      .row {
        display: grid;
        grid-template-columns: 18px 1fr;
        gap: var(--rex-space-3);
        align-items: start;
      }

      .icon {
        width: 18px;
        height: 18px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 12px;
        background: rgba(0, 0, 0, 0.08);
        color: inherit;
        margin-top: 1px;
      }

      :host([tone='warning']) .icon {
        background: color-mix(in srgb, var(--rex-color-warning-border) 30%, transparent);
      }

      .title {
        font-weight: 800;
        font-size: var(--rex-font-size-sm);
        margin: 0;
      }

      .body {
        margin-top: var(--rex-space-1);
        font-size: var(--rex-font-size-sm);
        line-height: var(--rex-line-height-md);
        color: var(--rex-color-text-2);
      }

      :host([tone='warning']) .body {
        color: color-mix(in srgb, currentColor 70%, #111113);
      }
    `
  ];

  @property({ type: String, reflect: true }) tone: RexCalloutTone = 'note';
  @property({ type: String }) title = 'Note';

  render() {
    const glyph = this.tone === 'warning' ? '!' : 'i';
    return html`<div class="row">
      <span class="icon" aria-hidden="true">${glyph}</span>
      <div>
        <div class="title">${this.title}</div>
        <div class="body"><slot></slot></div>
      </div>
    </div>`;
  }
}

defineElement('rex-callout', RexCallout);

declare global {
  interface HTMLElementTagNameMap {
    'rex-callout': RexCallout;
  }
}
