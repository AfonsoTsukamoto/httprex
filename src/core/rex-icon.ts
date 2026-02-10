import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { defineElement } from '../utils/define';

export type RexIconName =
  | 'play'
  | 'copy'
  | 'trash'
  | 'plus'
  | 'chevron-down'
  | 'globe'
  | 'settings'
  | 'diamond'
  | 'code'
  | 'layers';

const ICONS: Record<RexIconName, string> = {
  play: '<path d="M8 5.75v12.5c0 .6.66.97 1.17.66l10.2-6.25c.5-.3.5-1.02 0-1.32L9.17 5.09A.77.77 0 0 0 8 5.75Z"/>' ,
  copy: '<path d="M8 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V8Z"/><path d="M6 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  trash:
    '<path d="M9 3.5h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M6.5 6h13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M8 6l.8 14h8.4L18 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M10.5 10v7M13 10v7M15.5 10v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  plus: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'chevron-down': '<path d="M6.5 9.5 12 15l5.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  globe:
    '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
    '<path d="M3.6 9h16.8M3.6 15h16.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M12 3c2.4 2.5 3.8 5.6 3.8 9S14.4 18.5 12 21c-2.4-2.5-3.8-5.6-3.8-9S9.6 5.5 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  settings:
    '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
    '<path d="M19.4 13.1a7.9 7.9 0 0 0 0-2.2l2-1.5-2-3.5-2.4.7a8 8 0 0 0-1.9-1.1L14.7 3h-4l-.4 2.5a8 8 0 0 0-2 1.1l-2.4-.7-2 3.5 2 1.5a7.9 7.9 0 0 0 0 2.2l-2 1.5 2 3.5 2.4-.7a8 8 0 0 0 2 1.1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.9-1.1l2.4.7 2-3.5-2-1.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  diamond: '<path d="M12 3L20 12L12 21L4 12Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  layers:
    '<path d="M4 8h16M4 12h16M4 16h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
};

export class RexIcon extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      width: 16px;
      height: 16px;
      color: currentColor;
    }

    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `;

  @property({ type: String }) name: RexIconName | '' = '';
  @property({ type: Number }) size = 16;

  render() {
    if (!this.name) return nothing;
    const body = ICONS[this.name as RexIconName];
    return html`<svg
      viewBox="0 0 24 24"
      width=${this.size}
      height=${this.size}
      fill="currentColor"
      aria-hidden="true"
      part="svg"
    >
      ${body ? unsafeSVG(body) : nothing}
    </svg>`;
  }
}

defineElement('rex-icon', RexIcon);

declare global {
  interface HTMLElementTagNameMap {
    'rex-icon': RexIcon;
  }
}
