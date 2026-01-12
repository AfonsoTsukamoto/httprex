/**
 * Chrome Extension Background Service Worker
 * Manages extension state and badge
 */

// Set initial badge state on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: 'ON',
  });
});

// Toggle extension on/off when user clicks the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  // Get current state
  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  const nextState = prevState === 'ON' ? 'OFF' : 'ON';

  // Update badge
  await chrome.action.setBadgeText({
    tabId: tab.id,
    text: nextState,
  });

  // Reload the page to apply/remove httprex blocks
  if (nextState === 'ON') {
    chrome.tabs.reload(tab.id);
  } else {
    chrome.tabs.reload(tab.id);
  }
});

// Export for TypeScript
export {};
