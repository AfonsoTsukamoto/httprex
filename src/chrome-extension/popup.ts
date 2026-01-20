/**
 * Chrome Extension Popup Script
 * Handles vault unlock/lock and secret management
 */

import { ChromeEncryptedSecretProvider } from '../lib-httprex/secrets/providers/chrome-encrypted';

// DOM Elements
const vaultStatusDot = document.getElementById('vault-status-dot')!;
const vaultStatusText = document.getElementById('vault-status-text')!;
const unlockForm = document.getElementById('unlock-form')!;
const vaultControls = document.getElementById('vault-controls')!;
const secretsSection = document.getElementById('secrets-section')!;
const secretsList = document.getElementById('secrets-list')!;
const errorMessage = document.getElementById('error-message')!;
const successMessage = document.getElementById('success-message')!;

// Input elements
const vaultPasswordInput = document.getElementById('vault-password') as HTMLInputElement;
const secretNameInput = document.getElementById('secret-name') as HTMLInputElement;
const secretValueInput = document.getElementById('secret-value') as HTMLInputElement;

// Button elements
const unlockBtn = document.getElementById('unlock-btn')!;
const lockBtn = document.getElementById('lock-btn')!;
const addSecretBtn = document.getElementById('add-secret-btn')!;

// Vault provider instance
let vaultProvider: ChromeEncryptedSecretProvider | null = null;

// Initialize popup
async function init() {
  // Check vault status
  const response = await chrome.runtime.sendMessage({ type: 'GET_VAULT_STATUS' });
  updateUI(response.unlocked);

  // If unlocked, initialize the vault provider
  if (response.unlocked) {
    const keyResponse = await chrome.runtime.sendMessage({ type: 'GET_VAULT_KEY' });
    if (keyResponse.key) {
      vaultProvider = new ChromeEncryptedSecretProvider();
      await vaultProvider.initialize(keyResponse.key);
      await loadSecrets();
    }
  }
}

// Update UI based on vault state
function updateUI(unlocked: boolean) {
  if (unlocked) {
    vaultStatusDot.classList.add('unlocked');
    vaultStatusText.textContent = 'Vault Unlocked';
    unlockForm.classList.add('hidden');
    vaultControls.classList.remove('hidden');
    secretsSection.classList.remove('hidden');
  } else {
    vaultStatusDot.classList.remove('unlocked');
    vaultStatusText.textContent = 'Vault Locked';
    unlockForm.classList.remove('hidden');
    vaultControls.classList.add('hidden');
    secretsSection.classList.add('hidden');
  }
}

// Show error message
function showError(message: string) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  setTimeout(() => {
    errorMessage.classList.add('hidden');
  }, 5000);
}

// Show success message
function showSuccess(message: string) {
  successMessage.textContent = message;
  successMessage.classList.remove('hidden');
  setTimeout(() => {
    successMessage.classList.add('hidden');
  }, 3000);
}

// Unlock vault
async function unlockVault() {
  const password = vaultPasswordInput.value;

  if (!password) {
    showError('Please enter a password');
    return;
  }

  try {
    // Initialize the vault provider with the password
    vaultProvider = new ChromeEncryptedSecretProvider();
    await vaultProvider.initialize(password);

    // Send password to background script
    const response = await chrome.runtime.sendMessage({
      type: 'UNLOCK_VAULT',
      password: password
    });

    if (response.success) {
      updateUI(true);
      vaultPasswordInput.value = '';
      await loadSecrets();
      showSuccess('Vault unlocked successfully');
    } else {
      showError(response.error || 'Failed to unlock vault');
    }
  } catch (error) {
    showError('Failed to initialize vault');
    console.error(error);
  }
}

// Lock vault
async function lockVault() {
  const response = await chrome.runtime.sendMessage({ type: 'LOCK_VAULT' });

  if (response.success) {
    vaultProvider?.lock();
    vaultProvider = null;
    updateUI(false);
    showSuccess('Vault locked');
  } else {
    showError(response.error || 'Failed to lock vault');
  }
}

// Load and display secrets
async function loadSecrets() {
  if (!vaultProvider) {
    secretsList.innerHTML = '<div class="secret-item"><span>Vault not unlocked</span></div>';
    return;
  }

  try {
    const secrets = await vaultProvider.listSecrets();

    if (secrets.length === 0) {
      secretsList.innerHTML = '<div class="secret-item"><span style="color: var(--text-secondary)">No secrets stored</span></div>';
      return;
    }

    secretsList.innerHTML = secrets.map(name => `
      <div class="secret-item" data-name="${escapeHtml(name)}">
        <span>${escapeHtml(name)}</span>
        <button class="danger delete-secret-btn" data-name="${escapeHtml(name)}">Delete</button>
      </div>
    `).join('');

    // Attach delete handlers
    document.querySelectorAll('.delete-secret-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const name = (e.target as HTMLElement).getAttribute('data-name');
        if (name) {
          await deleteSecret(name);
        }
      });
    });
  } catch (error) {
    secretsList.innerHTML = '<div class="secret-item"><span style="color: var(--error)">Failed to load secrets</span></div>';
    console.error(error);
  }
}

// Add a new secret
async function addSecret() {
  const name = secretNameInput.value.trim();
  const value = secretValueInput.value;

  if (!name) {
    showError('Please enter a secret name');
    return;
  }

  if (!value) {
    showError('Please enter a secret value');
    return;
  }

  if (!vaultProvider) {
    showError('Vault not unlocked');
    return;
  }

  try {
    await vaultProvider.setSecret(name, value);
    secretNameInput.value = '';
    secretValueInput.value = '';
    await loadSecrets();
    showSuccess(`Secret "${name}" added`);
  } catch (error) {
    showError('Failed to add secret');
    console.error(error);
  }
}

// Delete a secret
async function deleteSecret(name: string) {
  if (!vaultProvider) {
    showError('Vault not unlocked');
    return;
  }

  if (!confirm(`Delete secret "${name}"?`)) {
    return;
  }

  try {
    await vaultProvider.deleteSecret(name);
    await loadSecrets();
    showSuccess(`Secret "${name}" deleted`);
  } catch (error) {
    showError('Failed to delete secret');
    console.error(error);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
unlockBtn.addEventListener('click', unlockVault);
lockBtn.addEventListener('click', lockVault);
addSecretBtn.addEventListener('click', addSecret);

// Allow Enter key to submit
vaultPasswordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    unlockVault();
  }
});

secretValueInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addSecret();
  }
});

// Initialize on load
init();
