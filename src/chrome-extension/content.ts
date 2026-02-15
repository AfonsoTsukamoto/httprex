/**
 * Chrome Extension Content Script
 * Finds code blocks on GitHub/GitLab and replaces them with <rex-request-block> web components
 */

import '../components'; // Register custom elements
import '../core'; // Register core elements
import { getURLHost, Host } from '../host';

const MAX_ATTEMPTS = 6;
let attempts = 0;

/**
 * CSS selectors for finding HTTP code blocks on different platforms
 */
const HOST_SELECTOR_MAP: Record<Host, string | null> = {
  [Host.GITHUB]: '.highlight.highlight-source-rexx,.highlight.highlight-source-httpspec',
  [Host.GITLAB]: '.code.highlight[lang=http],.code.highlight[canonical-lang=rex]',
  [Host.UNK]: null
};

/**
 * Find all HTTP code blocks on the page
 */
function findCodeBlocks(host: Host | null): NodeListOf<Element> | null {
  if (!host) return null;

  const selector = HOST_SELECTOR_MAP[host];
  if (!selector) return null;

  return document.querySelectorAll(selector);
}

/**
 * Replace a code block element with a <rex-request-block> web component
 */
function replaceWithHttpRexBlock(element: Element): void {
  // Extract the HTTP request text from the code block
  const textContent = element.textContent || '';

  // Create rex-request-block element
  const httprexBlock = document.createElement('rex-request-block');
  httprexBlock.textContent = textContent;

  // Replace the original code block with our web component
  // We want to replace the parent container (usually a <pre> or <div>)
  const container = element.closest('pre, div.highlight') || element;
  container.parentElement?.replaceChild(httprexBlock, container);
}

/**
 * Initialize httprex blocks on the page
 */
function initHttpRexBlocks(): void {
  const host = getURLHost(location.href);
  if (!host) return;

  const codeBlocks = findCodeBlocks(host);

  if (codeBlocks && codeBlocks.length > 0) {
    console.log(`HttpRex: Found ${codeBlocks.length} HTTP code blocks on ${host}`);

    codeBlocks.forEach(block => {
      replaceWithHttpRexBlock(block);
    });
  }
}

/**
 * Poll for code blocks (needed for dynamically loaded content)
 */
function pollForCodeBlocks(): void {
  const jsInitChecker = setInterval(() => {
    const host = getURLHost(location.href);
    const codeBlocks = findCodeBlocks(host);

    if (codeBlocks && codeBlocks.length > 0) {
      clearInterval(jsInitChecker);
      initHttpRexBlocks();
    } else if (attempts >= MAX_ATTEMPTS) {
      clearInterval(jsInitChecker);
      console.log('HttpRex: No HTTP code blocks found after max attempts');
    } else {
      attempts += 1;
    }
  }, 101);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', pollForCodeBlocks);
} else {
  pollForCodeBlocks();
}

// Also listen for navigation events (for SPAs like GitHub)
window.addEventListener('load', pollForCodeBlocks);

// Export for TypeScript
export {};
