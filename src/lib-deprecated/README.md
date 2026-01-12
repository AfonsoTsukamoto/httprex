# Deprecated Code

This directory contains the old implementation of httprex before the refactoring to a standalone library architecture.

## Contents

- **lib-old/**: Original parser implementation
  - Used a monolithic parser class
  - Had bugs: double-encoding in form data, empty XML converter, missing error handling
  - No variable resolution system

- **components-old/**: React-based UI components
  - Used Ant Design (antd) for styling
  - Tightly coupled to Chrome extension
  - Not reusable outside of React apps

- **pages-old/**: Chrome extension pages
  - React-based content script
  - Background service worker
  - Layout components (unused)

## Why Deprecated?

The codebase was refactored in January 2025 to:
1. Create a standalone `lib-httprex` library (framework-agnostic)
2. Build Web Components for reusable UI (works anywhere, not just React)
3. Make httprex embeddable like mermaid.js (```httprex code blocks)
4. Fix parser bugs and add comprehensive variable support
5. Reduce bundle size (1 KB vs 3.35 KB for content script)

## New Architecture

See the main README.md for the new architecture:
- **src/lib-httprex/**: Core library (parser, executor, variables)
- **src/web-components/**: Framework-agnostic UI components
- **src/chrome-extension/**: Minimal Chrome extension using the library

## Reference

This code is kept for reference during testing and can be safely deleted once all tests pass and the new implementation is verified.

**Status:** Ready for deletion after Phase 6 (Testing) is complete.
