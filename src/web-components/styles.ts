/**
 * Shared styles for httprex web components
 * Using CSS custom properties for theming
 */

export const sharedStyles = `
:host {
  /* Colors */
  --httprex-bg: #1e1e1e;
  --httprex-bg-secondary: #252526;
  --httprex-bg-hover: #2a2d2e;
  --httprex-text: #d4d4d4;
  --httprex-text-secondary: #858585;
  --httprex-border: #3c3c3c;
  --httprex-border-hover: #555555;

  /* Method colors */
  --httprex-method-get: #61affe;
  --httprex-method-post: #49cc90;
  --httprex-method-put: #fca130;
  --httprex-method-delete: #f93e3e;
  --httprex-method-patch: #50e3c2;
  --httprex-method-head: #9012fe;
  --httprex-method-options: #0d5aa7;

  /* Status colors */
  --httprex-status-success: #49cc90;
  --httprex-status-redirect: #fca130;
  --httprex-status-error: #f93e3e;
  --httprex-status-info: #61affe;

  /* Spacing */
  --httprex-spacing-xs: 4px;
  --httprex-spacing-sm: 8px;
  --httprex-spacing-md: 12px;
  --httprex-spacing-lg: 16px;
  --httprex-spacing-xl: 24px;

  /* Typography */
  --httprex-font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --httprex-font-family-mono: 'Consolas', 'Monaco', 'Courier New', monospace;
  --httprex-font-size: 14px;
  --httprex-font-size-sm: 12px;
  --httprex-line-height: 1.5;

  /* Border radius */
  --httprex-radius-sm: 3px;
  --httprex-radius-md: 6px;

  /* Shadows */
  --httprex-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --httprex-shadow-md: 0 4px 8px rgba(0, 0, 0, 0.2);

  display: block;
  font-family: var(--httprex-font-family);
  font-size: var(--httprex-font-size);
  line-height: var(--httprex-line-height);
  color: var(--httprex-text);
}

* {
  box-sizing: border-box;
}

.httprex-button {
  background: var(--httprex-bg-secondary);
  border: 1px solid var(--httprex-border);
  border-radius: var(--httprex-radius-sm);
  color: var(--httprex-text);
  cursor: pointer;
  font-family: var(--httprex-font-family);
  font-size: var(--httprex-font-size-sm);
  padding: var(--httprex-spacing-sm) var(--httprex-spacing-md);
  transition: all 0.2s;
}

.httprex-button:hover {
  background: var(--httprex-bg-hover);
  border-color: var(--httprex-border-hover);
}

.httprex-button:active {
  transform: translateY(1px);
}

.httprex-button.primary {
  background: var(--httprex-method-get);
  border-color: var(--httprex-method-get);
  color: #fff;
}

.httprex-button.primary:hover {
  filter: brightness(1.1);
}

.httprex-input {
  background: var(--httprex-bg-secondary);
  border: 1px solid var(--httprex-border);
  border-radius: var(--httprex-radius-sm);
  color: var(--httprex-text);
  font-family: var(--httprex-font-family-mono);
  font-size: var(--httprex-font-size-sm);
  padding: var(--httprex-spacing-sm);
  width: 100%;
}

.httprex-input:focus {
  border-color: var(--httprex-border-hover);
  outline: none;
}

.httprex-code {
  background: var(--httprex-bg-secondary);
  border: 1px solid var(--httprex-border);
  border-radius: var(--httprex-radius-sm);
  font-family: var(--httprex-font-family-mono);
  font-size: var(--httprex-font-size-sm);
  padding: var(--httprex-spacing-md);
  overflow-x: auto;
  white-space: pre;
}

.httprex-error {
  background: rgba(249, 62, 62, 0.1);
  border: 1px solid var(--httprex-status-error);
  border-radius: var(--httprex-radius-sm);
  color: var(--httprex-status-error);
  padding: var(--httprex-spacing-md);
  margin: var(--httprex-spacing-md) 0;
}

.httprex-badge {
  border-radius: var(--httprex-radius-sm);
  display: inline-block;
  font-size: var(--httprex-font-size-sm);
  font-weight: 600;
  padding: 2px 8px;
  text-transform: uppercase;
}

.httprex-method-badge {
  color: #fff;
  font-family: var(--httprex-font-family-mono);
  min-width: 60px;
  text-align: center;
}

.httprex-method-get { background: var(--httprex-method-get); }
.httprex-method-post { background: var(--httprex-method-post); }
.httprex-method-put { background: var(--httprex-method-put); }
.httprex-method-delete { background: var(--httprex-method-delete); }
.httprex-method-patch { background: var(--httprex-method-patch); }
.httprex-method-head { background: var(--httprex-method-head); }
.httprex-method-options { background: var(--httprex-method-options); }

.httprex-status-badge {
  color: #fff;
  font-family: var(--httprex-font-family-mono);
}

.httprex-status-success { background: var(--httprex-status-success); }
.httprex-status-redirect { background: var(--httprex-status-redirect); }
.httprex-status-error { background: var(--httprex-status-error); }
.httprex-status-info { background: var(--httprex-status-info); }
`;

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'var(--httprex-method-get)',
    POST: 'var(--httprex-method-post)',
    PUT: 'var(--httprex-method-put)',
    DELETE: 'var(--httprex-method-delete)',
    PATCH: 'var(--httprex-method-patch)',
    HEAD: 'var(--httprex-method-head)',
    OPTIONS: 'var(--httprex-method-options)'
  };
  return colors[method.toUpperCase()] || 'var(--httprex-text-secondary)';
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'var(--httprex-status-success)';
  if (status >= 300 && status < 400) return 'var(--httprex-status-redirect)';
  if (status >= 400) return 'var(--httprex-status-error)';
  return 'var(--httprex-status-info)';
}
