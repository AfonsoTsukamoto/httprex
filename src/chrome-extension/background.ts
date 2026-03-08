/**
 * Chrome Extension Background Service Worker
 * Manages extension state, badge, and vault key
 */

// Vault key stored only in memory (cleared on browser restart)
// This is intentional for security - the key is never persisted
let vaultKey: string | null = null;

// Message types for vault management
interface VaultMessage {
  type: 'UNLOCK_VAULT' | 'LOCK_VAULT' | 'GET_VAULT_STATUS' | 'GET_VAULT_KEY';
  password?: string;
}

interface VaultResponse {
  success?: boolean;
  unlocked?: boolean;
  key?: string | null;
  error?: string;
}

// Set initial badge state on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: 'ON',
  });
  chrome.action.setBadgeBackgroundColor({
    color: '#49cc90'
  });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  (message: VaultMessage, sender, sendResponse: (response: VaultResponse) => void) => {
    switch (message.type) {
      case 'UNLOCK_VAULT':
        if (message.password) {
          vaultKey = message.password;
          // Update badge to show vault is unlocked
          chrome.action.setBadgeText({ text: '🔓' });
          sendResponse({ success: true, unlocked: true });
        } else {
          sendResponse({ success: false, error: 'Password required' });
        }
        break;

      case 'LOCK_VAULT':
        vaultKey = null;
        // Update badge to show vault is locked
        chrome.action.setBadgeText({ text: 'ON' });
        sendResponse({ success: true, unlocked: false });
        break;

      case 'GET_VAULT_STATUS':
        sendResponse({ unlocked: vaultKey !== null });
        break;

      case 'GET_VAULT_KEY':
        // Only respond to requests from our extension
        if (sender.id === chrome.runtime.id) {
          sendResponse({ key: vaultKey });
        } else {
          sendResponse({ key: null, error: 'Unauthorized' });
        }
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }

    // Return true to indicate we will send a response asynchronously
    return true;
  }
);

// Export for TypeScript
export {};
