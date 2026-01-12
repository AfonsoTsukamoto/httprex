/**
 * httprex-variable-panel component
 * UI for managing global variables
 */

import { getGlobalVariableStorage } from '../lib-httprex/variables/storage';
import { sharedStyles } from './styles';

export class HttprexVariablePanelElement extends HTMLElement {
  private shadow: ShadowRoot;
  private variables: Record<string, string> = {};
  private fileVariables: Record<string, string> = {};
  private isExpanded: boolean = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.loadVariables();
    this.render();
  }

  setFileVariables(fileVars: Record<string, string>) {
    this.fileVariables = fileVars;
    this.render();
  }

  private async loadVariables() {
    const storage = getGlobalVariableStorage();
    const result = storage.getAll();
    this.variables = result instanceof Promise ? await result : result;
    this.render();
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        ${sharedStyles}

        .variable-panel {
          background: var(--httprex-bg);
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-sm);
          margin: var(--httprex-spacing-md) 0;
        }

        .variable-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--httprex-spacing-sm) var(--httprex-spacing-md);
          cursor: pointer;
          user-select: none;
          background: var(--httprex-bg-secondary);
          border-bottom: 1px solid var(--httprex-border);
        }

        .variable-header:hover {
          background: var(--httprex-bg-hover);
        }

        .variable-header h3 {
          margin: 0;
          font-size: var(--httprex-font-size);
          font-weight: 600;
          color: var(--httprex-text);
        }

        .variable-toggle {
          font-size: var(--httprex-font-size-sm);
          color: var(--httprex-text-secondary);
        }

        .variable-content {
          display: ${this.isExpanded ? 'block' : 'none'};
          padding: var(--httprex-spacing-md);
        }

        .variable-section {
          margin-bottom: var(--httprex-spacing-md);
        }

        .variable-section:last-child {
          margin-bottom: 0;
        }

        .variable-section-title {
          font-size: var(--httprex-font-size-sm);
          font-weight: 600;
          color: var(--httprex-text-secondary);
          margin-bottom: var(--httprex-spacing-sm);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .variable-list {
          display: flex;
          flex-direction: column;
          gap: var(--httprex-spacing-xs);
        }

        .variable-item {
          display: flex;
          align-items: center;
          gap: var(--httprex-spacing-sm);
          padding: var(--httprex-spacing-xs);
          background: var(--httprex-bg-secondary);
          border-radius: var(--httprex-radius-sm);
        }

        .variable-name {
          flex-shrink: 0;
          font-family: var(--httprex-font-mono);
          font-size: var(--httprex-font-size-sm);
          color: var(--httprex-text);
          font-weight: 600;
        }

        .variable-value {
          flex-grow: 1;
          font-family: var(--httprex-font-mono);
          font-size: var(--httprex-font-size-sm);
          color: var(--httprex-text-secondary);
          padding: var(--httprex-spacing-xs) var(--httprex-spacing-sm);
          background: var(--httprex-bg);
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-sm);
          outline: none;
        }

        .variable-value:focus {
          border-color: var(--httprex-method-get);
        }

        .variable-actions {
          display: flex;
          gap: var(--httprex-spacing-xs);
        }

        .variable-btn {
          background: transparent;
          border: none;
          color: var(--httprex-text-secondary);
          cursor: pointer;
          padding: var(--httprex-spacing-xs);
          font-size: var(--httprex-font-size-sm);
          border-radius: var(--httprex-radius-sm);
        }

        .variable-btn:hover {
          background: var(--httprex-bg-hover);
          color: var(--httprex-text);
        }

        .variable-btn.delete:hover {
          color: var(--httprex-method-delete);
        }

        .add-variable-form {
          display: flex;
          gap: var(--httprex-spacing-sm);
          margin-top: var(--httprex-spacing-sm);
        }

        .add-variable-input {
          font-family: var(--httprex-font-mono);
          font-size: var(--httprex-font-size-sm);
          padding: var(--httprex-spacing-xs) var(--httprex-spacing-sm);
          background: var(--httprex-bg);
          border: 1px solid var(--httprex-border);
          border-radius: var(--httprex-radius-sm);
          color: var(--httprex-text);
          outline: none;
        }

        .add-variable-input:focus {
          border-color: var(--httprex-method-get);
        }

        .add-variable-btn {
          background: var(--httprex-method-get);
          border: none;
          border-radius: var(--httprex-radius-sm);
          color: #fff;
          cursor: pointer;
          font-size: var(--httprex-font-size-sm);
          font-weight: 600;
          padding: var(--httprex-spacing-xs) var(--httprex-spacing-md);
        }

        .add-variable-btn:hover {
          filter: brightness(1.1);
        }

        .empty-message {
          color: var(--httprex-text-secondary);
          font-size: var(--httprex-font-size-sm);
          font-style: italic;
          padding: var(--httprex-spacing-sm);
          text-align: center;
        }
      </style>

      <div class="variable-panel">
        <div class="variable-header" onclick="this.getRootNode().host.toggleExpanded()">
          <h3>Variables ${this.getVariableCount()}</h3>
          <span class="variable-toggle">${this.isExpanded ? '▼' : '▶'}</span>
        </div>

        <div class="variable-content">
          ${this.renderGlobalVariables()}
          ${this.renderFileVariables()}
        </div>
      </div>
    `;
  }

  private getVariableCount(): string {
    const globalCount = Object.keys(this.variables).length;
    const fileCount = Object.keys(this.fileVariables).length;
    const total = globalCount + fileCount;
    return total > 0 ? `(${total})` : '';
  }

  private renderGlobalVariables(): string {
    const varEntries = Object.entries(this.variables);

    return `
      <div class="variable-section">
        <div class="variable-section-title">Global Variables</div>
        ${varEntries.length > 0
          ? `<div class="variable-list">
              ${varEntries.map(([name, value]) => `
                <div class="variable-item">
                  <span class="variable-name">{{${name}}}</span>
                  <input
                    type="text"
                    class="variable-value"
                    value="${this.escapeHtml(value)}"
                    data-var-name="${name}"
                    onchange="this.getRootNode().host.updateVariable('${name}', this.value)"
                  />
                  <div class="variable-actions">
                    <button
                      class="variable-btn delete"
                      onclick="this.getRootNode().host.deleteVariable('${name}')"
                      title="Delete variable"
                    >✕</button>
                  </div>
                </div>
              `).join('')}
            </div>`
          : '<div class="empty-message">No global variables defined</div>'
        }

        <div class="add-variable-form">
          <input
            type="text"
            class="add-variable-input"
            placeholder="name"
            id="new-var-name"
            style="flex: 1;"
          />
          <input
            type="text"
            class="add-variable-input"
            placeholder="value"
            id="new-var-value"
            style="flex: 2;"
          />
          <button
            class="add-variable-btn"
            onclick="this.getRootNode().host.addVariable()"
          >Add</button>
        </div>
      </div>
    `;
  }

  private renderFileVariables(): string {
    const varEntries = Object.entries(this.fileVariables);

    if (varEntries.length === 0) return '';

    return `
      <div class="variable-section">
        <div class="variable-section-title">File Variables (Read-only)</div>
        <div class="variable-list">
          ${varEntries.map(([name, value]) => `
            <div class="variable-item">
              <span class="variable-name">{{${name}}}</span>
              <input
                type="text"
                class="variable-value"
                value="${this.escapeHtml(value)}"
                readonly
                disabled
              />
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
    this.render();
  }

  async addVariable() {
    const nameInput = this.shadow.getElementById('new-var-name') as HTMLInputElement;
    const valueInput = this.shadow.getElementById('new-var-value') as HTMLInputElement;

    const name = nameInput?.value.trim();
    const value = valueInput?.value.trim();

    if (!name || !value) return;

    // Check if variable conflicts with file variables
    if (this.fileVariables[name]) {
      alert(`Cannot create global variable "${name}": a file variable with this name already exists. File variables take precedence.`);
      return;
    }

    // Check if global variable already exists
    if (this.variables[name]) {
      const confirmUpdate = confirm(`Variable "${name}" already exists. Update it with the new value?`);
      if (!confirmUpdate) return;
    }

    const storage = getGlobalVariableStorage();
    await storage.set(name, value);

    // Reload variables
    await this.loadVariables();

    // Clear inputs
    if (nameInput) nameInput.value = '';
    if (valueInput) valueInput.value = '';
  }

  async updateVariable(name: string, value: string) {
    const storage = getGlobalVariableStorage();
    await storage.set(name, value);
    await this.loadVariables();
  }

  async deleteVariable(name: string) {
    if (!confirm(`Delete variable "${name}"?`)) return;

    const storage = getGlobalVariableStorage();
    await storage.delete(name);
    await this.loadVariables();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('httprex-variable-panel', HttprexVariablePanelElement);
