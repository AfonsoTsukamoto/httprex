import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '../design-system/define';
import { rexTokens } from '../tokens/tokens';

export type RexBadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'method';

export class RexBadge extends LitElement {
  static styles = [
    ...rexTokens,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 22px;
        padding: 0 var(--rex-space-2);
        border-radius: 999px;
        font-family: var(--rex-font-sans);
        font-size: var(--rex-font-size-xs);
        font-weight: 700;
        letter-spacing: 0.02em;
        border: 1px solid var(--rex-color-border);
        background: var(--rex-color-surface-2);
        color: var(--rex-color-text-2);
        user-select: none;
        white-space: nowrap;
      }

      :host([tone='success']) {
        background: rgba(22, 163, 74, 0.12);
        border-color: rgba(22, 163, 74, 0.35);
        color: var(--rex-status-ok);
      }

      :host([tone='warning']) {
        background: rgba(245, 158, 11, 0.14);
        border-color: rgba(245, 158, 11, 0.35);
        color: var(--rex-status-warn);
      }

      :host([tone='danger']) {
        background: rgba(239, 68, 68, 0.14);
        border-color: rgba(239, 68, 68, 0.35);
        color: var(--rex-status-error);
      }

      :host([tone='method']) {
        background: rgba(17, 17, 19, 0.06);
      }

      :host([method='GET']) {
        background: color-mix(in srgb, var(--rex-method-get) 16%, transparent);
        border-color: color-mix(in srgb, var(--rex-method-get) 40%, transparent);
        color: var(--rex-method-get);
      }
      :host([method='POST']) {
        background: color-mix(in srgb, var(--rex-method-post) 16%, transparent);
        border-color: color-mix(in srgb, var(--rex-method-post) 40%, transparent);
        color: var(--rex-method-post);
      }
      :host([method='PUT']) {
        background: color-mix(in srgb, var(--rex-method-put) 16%, transparent);
        border-color: color-mix(in srgb, var(--rex-method-put) 40%, transparent);
        color: var(--rex-method-put);
      }
      :host([method='DELETE']) {
        background: color-mix(in srgb, var(--rex-method-delete) 16%, transparent);
        border-color: color-mix(in srgb, var(--rex-method-delete) 40%, transparent);
        color: var(--rex-method-delete);
      }
      :host([method='PATCH']) {
        background: color-mix(in srgb, var(--rex-method-patch) 16%, transparent);
        border-color: color-mix(in srgb, var(--rex-method-patch) 40%, transparent);
        color: var(--rex-method-patch);
      }
    `
  ];

  @property({ type: String, reflect: true }) tone: RexBadgeTone = 'neutral';
  @property({ type: String, reflect: true }) method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | '' = '';

  render() {
    return html`<slot></slot>`;
  }
}

defineElement('rex-badge', RexBadge);

declare global {
  interface HTMLElementTagNameMap {
    'rex-badge': RexBadge;
  }
}
