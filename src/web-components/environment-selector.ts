/**
 * Environment selector component
 * Dropdown to switch between environments (local, staging, production, etc.)
 */

import { environmentManager } from '../lib-httprex/variables/environment';
import { sharedStyles } from './styles';

export class HttpRexEnvironmentSelectorElement extends HTMLElement {
  private shadow: ShadowRoot;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    // Subscribe to environment changes
    this.unsubscribe = environmentManager.onChange(() => this.render());
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  private render() {
    const environments = environmentManager.listEnvironments();
    const currentName = environmentManager.getCurrentEnvironmentName();

    this.shadow.innerHTML = `
      <style>
        ${sharedStyles}

        .env-selector {
          display: flex;
          align-items: center;
          gap: var(--httprex-spacing-sm);
        }

        .env-label {
          font-size: var(--httprex-font-size-sm);
          color: var(--httprex-text-secondary);
        }

        .env-dropdown {
          font-family: var(--httprex-font-family);
          font-size: var(--httprex-font-size-sm);
          padding: var(--httprex-spacing-xs) var(--httprex-spacing-sm);
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-sm);
          background: var(--httprex-bg-secondary);
          color: var(--httprex-text);
          cursor: pointer;
          min-width: 120px;
        }

        .env-dropdown:focus {
          border-color: var(--httprex-method-get);
          outline: none;
        }

        .env-dropdown:hover {
          border-color: var(--httprex-border-hover);
        }

        .no-environments {
          font-size: var(--httprex-font-size-sm);
          color: var(--httprex-text-secondary);
          font-style: italic;
        }

        .env-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--httprex-status-success);
          margin-left: var(--httprex-spacing-xs);
        }

        .env-indicator.none {
          background: var(--httprex-text-secondary);
        }
      </style>

      <div class="env-selector">
        ${environments.length > 0 ? `
          <span class="env-label">Env:</span>
          <select class="env-dropdown" id="env-select">
            <option value="">No environment</option>
            ${environments.map(env => `
              <option value="${this.escapeHtml(env)}" ${currentName === env ? 'selected' : ''}>
                ${this.escapeHtml(env)}
              </option>
            `).join('')}
          </select>
          <span class="env-indicator ${currentName ? '' : 'none'}"></span>
        ` : `
          <span class="no-environments">No environments</span>
        `}
      </div>
    `;

    // Attach event listener
    const select = this.shadow.getElementById('env-select') as HTMLSelectElement | null;
    if (select) {
      select.addEventListener('change', (e) => this.handleChange(e));
    }
  }

  private handleChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value || null;

    try {
      environmentManager.setCurrentEnvironment(value);
    } catch (error) {
      console.error('Failed to set environment:', error);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('httprex-environment-selector', HttpRexEnvironmentSelectorElement);
