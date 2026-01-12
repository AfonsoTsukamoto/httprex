# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Httprex** is a JavaScript library (like mermaid.js) for embedding interactive HTTP requests in markdown. It parses VSCode REST Client format (`.http` files) and renders them as executable requests in any markdown editor or webpage.

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
Httprex.init() discovers blocks
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

- **`src/lib-httprex/index.ts`**: Public API - `Httprex.parse()`, `Httprex.execute()`, `Httprex.init()`
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
import Httprex from 'httprex';

// Parse request
const result = Httprex.parse(`
GET https://api.example.com/users
Authorization: Bearer token123
`);

// Execute request
const executed = await Httprex.execute(result.data);
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

## Project Status

Active refactoring (v0.1.0). Core library and Web Components complete. Chrome extension integration pending.
