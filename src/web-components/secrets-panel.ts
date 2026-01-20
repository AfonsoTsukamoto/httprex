/**
 * Secrets panel component
 * Shows status of secrets and allows management of secret providers
 */

import { secretManager } from '../lib-httprex/secrets';
import { sharedStyles } from './styles';

export class HttpRexSecretsPanelElement extends HTMLElement {
  private shadow: ShadowRoot;
  private unresolvedSecrets: string[] = [];
  private isExpanded: boolean = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  /**
   * Set the list of unresolved secret references
   */
  setUnresolvedSecrets(secrets: string[]) {
    this.unresolvedSecrets = secrets;
    this.render();
  }

  /**
   * Check if there are any unresolved secrets
   */
  hasUnresolvedSecrets(): boolean {
    return this.unresolvedSecrets.length > 0;
  }

  private render() {
    const providerNames = secretManager.listProviders();
    const hasSecrets = this.unresolvedSecrets.length > 0;

    // Don't render if no secrets and no providers
    if (!hasSecrets && providerNames.length === 0) {
      this.shadow.innerHTML = '';
      return;
    }

    this.shadow.innerHTML = `
      <style>
        ${sharedStyles}

        .secrets-panel {
          background: var(--httprex-bg-secondary);
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-sm);
          margin-bottom: var(--httprex-spacing-md);
        }

        .secrets-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--httprex-spacing-sm) var(--httprex-spacing-md);
          cursor: pointer;
          user-select: none;
        }

        .secrets-header:hover {
          background: var(--httprex-bg-hover);
        }

        .secrets-title {
          display: flex;
          align-items: center;
          gap: var(--httprex-spacing-sm);
          font-size: var(--httprex-font-size-sm);
          font-weight: 500;
        }

        .secrets-icon {
          font-size: 14px;
        }

        .secrets-badge {
          background: var(--httprex-method-put);
          color: #fff;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }

        .secrets-toggle {
          font-size: 10px;
          color: var(--httprex-text-secondary);
          transition: transform 0.2s;
        }

        .secrets-toggle.expanded {
          transform: rotate(90deg);
        }

        .secrets-content {
          display: none;
          padding: var(--httprex-spacing-md);
          border-top: 1px solid var(--httprex-border);
        }

        .secrets-content.expanded {
          display: block;
        }

        .secret-warning {
          background: rgba(252, 161, 48, 0.1);
          border: 1px solid var(--httprex-method-put);
          border-radius: var(--httprex-radius-sm);
          color: var(--httprex-method-put);
          padding: var(--httprex-spacing-sm) var(--httprex-spacing-md);
          margin-bottom: var(--httprex-spacing-md);
          font-size: var(--httprex-font-size-sm);
        }

        .secret-list {
          font-family: var(--httprex-font-family-mono);
          font-size: var(--httprex-font-size-sm);
          margin-bottom: var(--httprex-spacing-md);
        }

        .secret-item {
          display: flex;
          align-items: center;
          gap: var(--httprex-spacing-sm);
          padding: var(--httprex-spacing-xs) 0;
        }

        .secret-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .secret-status.unresolved {
          background: var(--httprex-method-put);
        }

        .secret-status.resolved {
          background: var(--httprex-status-success);
        }

        .providers-section {
          margin-top: var(--httprex-spacing-md);
          padding-top: var(--httprex-spacing-md);
          border-top: 1px solid var(--httprex-border);
        }

        .providers-label {
          font-size: var(--httprex-font-size-sm);
          color: var(--httprex-text-secondary);
          margin-bottom: var(--httprex-spacing-sm);
        }

        .provider-item {
          display: flex;
          align-items: center;
          gap: var(--httprex-spacing-sm);
          font-size: var(--httprex-font-size-sm);
          padding: var(--httprex-spacing-xs) 0;
        }

        .provider-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--httprex-text-secondary);
        }

        .provider-status.available {
          background: var(--httprex-status-success);
        }
      </style>

      <div class="secrets-panel">
        <div class="secrets-header" id="secrets-header">
          <div class="secrets-title">
            <span class="secrets-icon">🔐</span>
            <span>Secrets</span>
            ${hasSecrets ? `<span class="secrets-badge">${this.unresolvedSecrets.length}</span>` : ''}
          </div>
          <span class="secrets-toggle ${this.isExpanded ? 'expanded' : ''}">▶</span>
        </div>

        <div class="secrets-content ${this.isExpanded ? 'expanded' : ''}" id="secrets-content">
          ${hasSecrets ? `
            <div class="secret-warning">
              The following secrets need to be resolved before sending the request:
            </div>
            <div class="secret-list">
              ${this.unresolvedSecrets.map(secret => `
                <div class="secret-item">
                  <span class="secret-status unresolved"></span>
                  <span>{{${this.escapeHtml(secret)}}}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="font-size: var(--httprex-font-size-sm); color: var(--httprex-text-secondary);">
              No secrets required for this request.
            </div>
          `}

          ${providerNames.length > 0 ? `
            <div class="providers-section">
              <div class="providers-label">Secret Providers:</div>
              ${providerNames.map(name => `
                <div class="provider-item" data-provider="${this.escapeHtml(name)}">
                  <span class="provider-status" id="status-${this.escapeHtml(name)}"></span>
                  <span>${this.escapeHtml(name)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Attach event listener
    const header = this.shadow.getElementById('secrets-header');
    if (header) {
      header.addEventListener('click', () => this.toggleExpanded());
    }

    // Check provider availability
    this.checkProviderAvailability();
  }

  private async checkProviderAvailability() {
    const providerNames = secretManager.listProviders();

    for (const name of providerNames) {
      const provider = secretManager.getProvider(name);
      if (provider) {
        try {
          const available = await provider.isAvailable();
          const statusEl = this.shadow.getElementById(`status-${name}`);
          if (statusEl && available) {
            statusEl.classList.add('available');
          }
        } catch {
          // Provider not available
        }
      }
    }
  }

  private toggleExpanded() {
    this.isExpanded = !this.isExpanded;
    this.render();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('httprex-secrets-panel', HttpRexSecretsPanelElement);
