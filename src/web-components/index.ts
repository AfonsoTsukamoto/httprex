/**
 * Web Components module
 * Registers all httprex custom elements
 */

// Import components to register them
import './httprex-block';
import './request-editor';
import './response-viewer';
import './variable-panel';
import './environment-selector';
import './secrets-panel';

// Export components for direct use
export { HttpRexBlockElement } from './httprex-block';
export { HttpRexRequestElement } from './request-editor';
export { HttpRexResponseElement } from './response-viewer';
export { HttpRexVariablePanelElement } from './variable-panel';
export { HttpRexEnvironmentSelectorElement } from './environment-selector';
export { HttpRexSecretsPanelElement } from './secrets-panel';

// Export styles
export { sharedStyles, getMethodColor, getStatusColor } from './styles';

/**
 * Check if web components are supported
 */
export function isSupported(): boolean {
  return 'customElements' in window && 'attachShadow' in Element.prototype;
}

/**
 * Discover and initialize all httprex blocks in the document
 */
export function initAll(selector: string = '.language-httprex, .httprex'): void {
  if (!isSupported()) {
    console.warn('Web Components are not supported in this browser');
    return;
  }

  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    // If it's a code block, wrap it in httprex-block
    if (el.classList.contains('language-httprex') || el.tagName === 'CODE') {
      const text = el.textContent || '';
      const block = document.createElement('httprex-block');
      block.textContent = text;

      // Replace the code block with httprex-block
      if (el.parentElement) {
        el.parentElement.replaceChild(block, el);
      }
    }
  });
}

// Auto-initialize on DOM ready if data-auto-init attribute is present
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.documentElement.hasAttribute('data-httprex-auto-init')) {
        initAll();
      }
    });
  } else {
    if (document.documentElement.hasAttribute('data-httprex-auto-init')) {
      initAll();
    }
  }
}
