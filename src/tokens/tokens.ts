import { css } from 'lit';

// Kept in TS so components can share tokens without relying on CSS asset bundling.
// Canonical CSS sources live in src/tokens/*.css.

export const rexBaseTokens = css`
  :host {
    --rex-font-sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji",
      "Segoe UI Emoji";
    --rex-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

    --rex-font-size-xs: 12px;
    --rex-font-size-sm: 13px;
    --rex-font-size-md: 14px;
    --rex-font-size-lg: 16px;

    --rex-line-height-tight: 1.2;
    --rex-line-height-md: 1.4;

    --rex-space-0: 0px;
    --rex-space-1: 4px;
    --rex-space-2: 8px;
    --rex-space-3: 12px;
    --rex-space-4: 16px;
    --rex-space-5: 20px;
    --rex-space-6: 24px;
    --rex-space-8: 32px;
    --rex-space-10: 40px;

    --rex-radius-xs: 6px;
    --rex-radius-sm: 10px;
    --rex-radius-md: 14px;
    --rex-radius-lg: 18px;

    --rex-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
    --rex-shadow-md: 0 8px 24px rgba(0, 0, 0, 0.1);

    --rex-ease: cubic-bezier(0.2, 0.9, 0.2, 1);
    --rex-duration-fast: 120ms;
    --rex-duration-md: 180ms;

    --rex-focus-ring-width: 3px;
  }
`;

export const rexThemeLightTokens = css`
  :host,
  :host([theme='light']) {
    color-scheme: light;

    --rex-color-bg: #ffffff;
    --rex-color-surface: #ffffff;
    --rex-color-surface-2: #f7f7f8;

    --rex-color-text: #111113;
    --rex-color-text-2: #4b4b52;
    --rex-color-text-3: #7a7a85;

    --rex-color-border: #e0e0e0;
    --rex-color-border-2: #d0d0d0;

    --rex-color-hover: rgba(17, 17, 19, 0.06);

    --rex-color-accent: #111113;
    --rex-color-accent-contrast: #ffffff;

    --rex-color-warning-bg: #fff6db;
    --rex-color-warning-border: #f0c75e;
    --rex-color-warning-text: #7a5600;

    --rex-color-code-bg: #111113;
    --rex-color-code-text: #f2f2f3;
    --rex-color-code-muted: rgba(242, 242, 243, 0.7);

    --rex-method-get: #1f9d55;
    --rex-method-post: #1c6ef2;
    --rex-method-put: #f59e0b;
    --rex-method-delete: #ef4444;
    --rex-method-patch: #7c3aed;

    --rex-status-ok: #16a34a;
    --rex-status-warn: #f59e0b;
    --rex-status-error: #ef4444;
  }
`;

export const rexThemeDarkTokens = css`
  :host([theme='dark']) {
    color-scheme: dark;

    --rex-color-bg: #0f0f12;
    --rex-color-surface: #1a1a1f;
    --rex-color-surface-2: #23232a;

    --rex-color-text: #f2f2f3;
    --rex-color-text-2: rgba(242, 242, 243, 0.78);
    --rex-color-text-3: rgba(242, 242, 243, 0.56);

    --rex-color-border: rgba(242, 242, 243, 0.14);
    --rex-color-border-2: rgba(242, 242, 243, 0.22);

    --rex-color-hover: rgba(242, 242, 243, 0.08);

    --rex-color-accent: #f2f2f3;
    --rex-color-accent-contrast: #111113;

    --rex-color-warning-bg: rgba(245, 158, 11, 0.16);
    --rex-color-warning-border: rgba(245, 158, 11, 0.55);
    --rex-color-warning-text: #f7d17b;

    --rex-color-code-bg: #0b0b0d;
    --rex-color-code-text: #f2f2f3;
    --rex-color-code-muted: rgba(242, 242, 243, 0.7);

    --rex-method-get: #22c55e;
    --rex-method-post: #60a5fa;
    --rex-method-put: #fbbf24;
    --rex-method-delete: #f87171;
    --rex-method-patch: #a78bfa;

    --rex-status-ok: #22c55e;
    --rex-status-warn: #fbbf24;
    --rex-status-error: #f87171;
  }

  @media (prefers-color-scheme: dark) {
    :host(:not([theme])) {
      color-scheme: dark;

      --rex-color-bg: #0f0f12;
      --rex-color-surface: #1a1a1f;
      --rex-color-surface-2: #23232a;

      --rex-color-text: #f2f2f3;
      --rex-color-text-2: rgba(242, 242, 243, 0.78);
      --rex-color-text-3: rgba(242, 242, 243, 0.56);

      --rex-color-border: rgba(242, 242, 243, 0.14);
      --rex-color-border-2: rgba(242, 242, 243, 0.22);

      --rex-color-hover: rgba(242, 242, 243, 0.08);

      --rex-color-accent: #f2f2f3;
      --rex-color-accent-contrast: #111113;

      --rex-color-warning-bg: rgba(245, 158, 11, 0.16);
      --rex-color-warning-border: rgba(245, 158, 11, 0.55);
      --rex-color-warning-text: #f7d17b;

      --rex-color-code-bg: #0b0b0d;
      --rex-color-code-text: #f2f2f3;
      --rex-color-code-muted: rgba(242, 242, 243, 0.7);

      --rex-method-get: #22c55e;
      --rex-method-post: #60a5fa;
      --rex-method-put: #fbbf24;
      --rex-method-delete: #f87171;
      --rex-method-patch: #a78bfa;

      --rex-status-ok: #22c55e;
      --rex-status-warn: #fbbf24;
      --rex-status-error: #f87171;
    }
  }
`;

export const rexTokens = [rexBaseTokens, rexThemeLightTokens, rexThemeDarkTokens];
