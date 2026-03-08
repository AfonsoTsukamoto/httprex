# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HttpRex** is a JavaScript library (like mermaid.js) for embedding interactive HTTP requests in markdown. It parses VSCode REST Client format (`.http` files) and renders them as executable requests in any markdown editor or webpage.

**Architecture:** Standalone library (`lib-httprex`) + Web Components + Chrome extension as reference implementation

## Common Commands

```bash
# Development
yarn dev              # Start Vite dev server

# Building
yarn build            # TypeScript compilation + Vite build for all entry points

# Testing
yarn test             # Run all tests with vitest
yarn coverage         # Run tests with coverage report

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
   - Environment support (future)

### Web Components (`src/web-components/`)

Framework-agnostic custom elements:
- `<httprex-block>` - Main container
- `<httprex-request>` - Request viewer/editor
- `<httprex-response>` - Response viewer

### Chrome Extension (`src/chrome-extension/` - future)

Reference implementation using lib-httprex + web components

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
<httprex-block> Web Component created
  ↓
User clicks "Send"
  ↓
VariableResolver.resolve() - Resolves {{vars}}
  ↓
executeRequest() - Fetch API with CORS handling
  ↓
HttpResponse displayed in <httprex-response>
```

### Key Files

- **`src/lib-httprex/index.ts`**: Public API - `HttpRex.parse()`, `HttpRex.execute()`, `HttpRex.init()`
- **`src/lib-httprex/parser/index.ts`**: Main parser with `parse()` and `parseFile()`
- **`src/lib-httprex/executor/fetch-adapter.ts`**: HTTP execution with timeout and CORS
- **`src/lib-httprex/variables/resolver.ts`**: Variable resolution engine
- **`src/web-components/httprex-block.ts`**: Main UI component
- **`src/lib-httprex/types.ts`**: All TypeScript type definitions

### Build System

Vite is configured with **multi-entry point builds** (`vite.config.ts`):
- `main`: React app (index.html)
- `content`: Content script bundle
- `background`: Background service worker

Each outputs to `dist/src/pages/{name}/index.js` for Chrome extension structure.

## Development Notes

### Adding Support for New Platforms

1. Add platform enum to `src/host.ts` in `Host` enum
2. Add domain mapping in `HOST_MAP`
3. Add CSS selector in `src/selectors.ts` in `HOST_SELECTOR_MAP`

### Parser Architecture

The `HTTPParser` class uses a state machine pattern:
- **ParseState.URL**: Parses request line (e.g., `GET /api/users HTTP/1.1`)
- **ParseState.Header**: Parses headers until blank line
- **ParseState.Body**: Parses request body based on Content-Type

To extend parsing, modify `lib/parsers/http.ts` or implement the `Parser` interface for alternative formats.

### Testing

Tests use vitest with jsdom. Parser tests are at `src/lib/parsers/http.test.ts` and selector tests at `src/selectors.test.ts`.

## Usage Example

```html
<!DOCTYPE html>
<html data-httprex-auto-init>
<head>
  <script type="module" src="httprex.js"></script>
</head>
<body>
  <httprex-block>
###
GET https://api.github.com/users/{{username}}
Authorization: token {{githubToken}}
  </httprex-block>
</body>
</html>
```

Or programmatically:

```javascript
import HttpRex from 'httprex';

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
3. **Run `yarn test` before pushing** — all tests must pass.
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
