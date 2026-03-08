# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HttpRex** is a JavaScript library (like mermaid.js) for embedding interactive HTTP requests in markdown. It parses VSCode REST Client format (`.http` files) and renders them as executable requests in any markdown editor or webpage.

**Architecture:** Standalone library (`lib-httprex`) + Lit Web Components (design system) + Chrome extension as reference implementation

## Common Commands

```bash
# Development
bun run dev           # Start Vite dev server

# Building
bun run build         # TypeScript compilation + Vite build (app)
bun run build:lib     # Build library bundles (ESM + IIFE + minified + types)
bun run build:all     # Build everything (lib + app)

# Testing
bun test              # Run all tests with Bun test runner
bun test --coverage   # Run tests with coverage report
bun run test:e2e      # Run E2E tests only

# After building, load the extension in Chrome:
# 1. Navigate to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the `dist/` directory
```

## Architecture

### Core Library (`src/lib-httprex/`)

Standalone, framework-agnostic HTTP request library with:

1. **Parser Module** (`parser/`) - VSCode REST Client compatible
   - Request line, headers, body parsing
   - Variable extraction (`{{varName}}`)
   - Multi-request support (`###` separator)
   - File variables (`@varName = value`)

2. **Executor Module** (`executor/`) - HTTP request execution
   - Fetch API wrapper with timeout
   - CORS handling strategies
   - Response formatting
   - cURL export

3. **Variables Module** (`variables/`) - Variable resolution
   - System variables (`$timestamp`, `$guid`, `$randomInt`)
   - File variables
   - Environment support

4. **Secrets Module** (`secrets/`) - Secret management
   - Provider-based architecture (1Password CLI, 1Password Connect, Chrome encrypted, prompt)
   - Secret manager with caching

### Design System (`src/core/` + `src/components/`)

Lit-based Web Components with CSS custom properties and light/dark theme support:

- **Core primitives** (`src/core/`): `rex-button`, `rex-input`, `rex-badge`, `rex-tabs`, `rex-toggle`, `rex-icon`, `rex-select`, `rex-textarea`, `rex-tooltip`, `rex-callout`, `rex-divider`
- **Composite components** (`src/components/`): `rex-request-block`, `rex-url-bar`, `rex-request-panel`, `rex-response-panel`, `rex-header-editor`, `rex-param-editor`, `rex-body-editor`, `rex-code-preview`, `rex-method-selector`
- **Design tokens** (`src/tokens/`): `base.css`, `theme-light.css`, `theme-dark.css`, `tokens.ts`

### Chrome Extension (`src/chrome-extension/` - future)

Reference implementation using lib-httprex + web components. Scaffold exists (background.ts, content.ts, popup.ts, manifest.json).

### Data Flow

```
Markdown with ```httprex block
  ↓
HttpRex.init() discovers blocks
  ↓
HttpParser.parseFile() - Parses multiple requests
  ↓
ParsedRequestFile { requests[], fileVariables, errors }
  ↓
<rex-request-block> Web Component created
  ↓
User clicks "Send"
  ↓
VariableResolver.resolve() - Resolves {{vars}}
  ↓
HttpRex.execute() - Fetch API with CORS handling
  ↓
HttpResponse displayed in <rex-response-panel>
```

### Key Files

- **`src/lib-httprex/index.ts`**: Public API - `HttpRex.parse()`, `HttpRex.execute()`, `HttpRex.init()`
- **`src/lib-httprex/parser/index.ts`**: Main parser with `parse()` and `parseFile()`
- **`src/lib-httprex/executor/fetch-adapter.ts`**: HTTP execution with timeout and CORS
- **`src/lib-httprex/variables/resolver.ts`**: Variable resolution engine
- **`src/lib-httprex/types.ts`**: All TypeScript type definitions
- **`src/components/rex-request-block.ts`**: Main UI component (wired to executor)
- **`src/components/rex-response-panel.ts`**: Response display (status, headers, body, timing)
- **`src/core/`**: Design system primitives

### Build System

Vite with multiple configs:
- `vite.config.ts` — Main app build (index.html, demo.html, Chrome extension entry points)
- `vite.lib.config.ts` — Library ESM + IIFE bundle
- `vite.lib.min.config.ts` — Minified library bundle
- `vite.lib.web-components.config.ts` — Web components bundle

## Development Notes

### Adding Support for New Platforms

1. Add platform enum to `src/host.ts` in `Host` enum
2. Add domain mapping in `HOST_MAP`
3. Add CSS selector in `src/selectors.ts` in `HOST_SELECTOR_MAP`

### Parser Architecture

The parser in `src/lib-httprex/parser/` is modular:
- `request-line.ts` — Parses `METHOD URL HTTP/VERSION`
- `headers.ts` — Parses headers with multi-line (RFC 822) support
- `body.ts` — Content-type aware body parsing (JSON, XML, form-urlencoded)
- `lexer.ts` — Variable extraction (`{{varName}}`)
- `separators.ts` — Request separation (`###`)
- `index.ts` — Orchestrates all modules

### Testing

Tests use Bun's built-in test runner. Test files:
- `src/lib-httprex/parser/__tests__/*.test.ts` — Parser unit + e2e tests
- `src/lib-httprex/variables/__tests__/*.test.ts` — Variable resolver tests
- `src/lib-httprex/secrets/__tests__/*.test.ts` — Secret manager tests
- `test/e2e/httprex-e2e.test.ts` — End-to-end tests with mock HTTP server
- `src/selectors.test.ts` — Platform selector tests

## Usage Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="httprex.js"></script>
</head>
<body>
  <rex-request-block></rex-request-block>
</body>
</html>
```

Or programmatically:

```javascript
import { HttpRex } from 'httprex';

// Parse request
const result = HttpRex.parse(`
GET https://api.example.com/users
Authorization: Bearer token123
`);

// Execute request
const executed = await HttpRex.execute(result.data);
console.log(executed.response);
```

## Format Support

**VSCode REST Client Compatible:**
- Request separator: `###`
- Variables: `{{varName}}`
- File variables: `@varName = value`
- Named requests: `# @name requestName`
- Comments: `#` or `//`
- System variables: `$timestamp`, `$guid`, `$randomInt`

## Git Workflow

**All work MUST go through feature branches and PRs. Never commit directly to `main`.**

1. **Before starting any feature or fix**, create a new branch from `main`:
   - Use the naming convention: `feat/<short-description>`, `fix/<short-description>`, or `chore/<short-description>`
   - Examples: `feat/web-components`, `fix/parser-multiline-body`, `chore/update-deps`
2. **Commit often** with clear, conventional commit messages.
3. **Run `bun test` before pushing** — all tests must pass.
4. **Push the branch and create a PR** using `gh pr create` so the owner can review.
5. **Never force-push to `main`** or merge PRs without owner approval.
6. **Keep PRs focused** — one feature or fix per PR. If a task grows large, split it.

## When to Suggest Claude Code Teams

Claude Code can orchestrate parallel sub-agents ("teams") for complex tasks. **Suggest using teams when:**

- **Multi-file refactors** — e.g., renaming a concept across parser, executor, types, tests, and docs simultaneously
- **Parallel independent workstreams** — e.g., writing tests for module A while implementing module B
- **Large-scale code generation** — e.g., scaffolding multiple Web Components at once
- **Research + implementation** — e.g., one agent researches an API/spec while another prepares the codebase

**Don't suggest teams for:**
- Single-file changes or small fixes
- Sequential work where each step depends on the previous
- Tasks that are quick enough to do inline

When suggesting teams, explain briefly *why* parallelization helps and what each agent would do.

## AI Collaboration Guidelines

- **Always use plan mode (`EnterPlanMode`) for non-trivial features** — get owner sign-off on approach before writing code.
- **Run tests after every meaningful change** — never leave the codebase in a broken state.
- **Don't over-engineer** — implement what's asked, nothing more. Avoid speculative abstractions.
- **Preserve existing patterns** — match the code style, naming conventions, and architecture already in use.
- **When unsure, ask** — use `AskUserQuestion` rather than guessing at requirements or making assumptions.

## Project Status

Active refactoring (v0.1.0). Core library and Web Components complete. Chrome extension integration pending.
