# Httprex Integration Guide

> Execute HTTP requests from markdown code blocks - like mermaid.js for API testing

## Distribution Files

Httprex is distributed in multiple formats for different use cases:

### Core Library

- **`httprex.mjs`** (35KB) - ES Module format for modern bundlers and browsers
- **`httprex.js`** (38KB) - IIFE format for `<script>` tags (exposes `window.Httprex`)
- **`httprex.min.mjs`** (35KB) - Minified ES Module for production CDN usage
- **`httprex.min.js`** (17KB) - Minified IIFE for production `<script>` tags
- **Type declarations** (`dist/types/lib-httprex/index.d.ts`) - TypeScript support

### Web Components

- **`web-components.mjs`** (67KB) - Custom elements (`<httprex-block>`, `<httprex-request>`, etc.)

---

## Installation Methods

### 1. NPM Package (Recommended for Projects)

```bash
npm install httprex
# or
yarn add httprex
```

**Usage in TypeScript/JavaScript projects:**

```typescript
import Httprex, { LocalStorageVariableStorage } from 'httprex';

// Initialize with options
Httprex.init({
  variableStorage: new LocalStorageVariableStorage(),
  selector: '.httprex'
});

// Parse and execute requests
const result = Httprex.parse('GET https://api.github.com/users/octocat');
if (result.success) {
  const response = await Httprex.execute(result.data);
  console.log(response);
}
```

### 2. Script Tag (CDN) - Legacy / Notion / Static Sites

**For legacy environments (IIFE format):**

```html
<script src="https://cdn.jsdelivr.net/npm/httprex@latest/dist/lib/httprex.min.js"></script>

<pre class="httprex">
GET https://api.github.com/users/octocat
Accept: application/json
</pre>

<script>
  // Httprex is available as global variable
  window.Httprex.init({
    startOnLoad: true,
    selector: '.httprex'
  });
</script>
```

### 3. ES Module (CDN) - Modern Browsers / Obsidian

**For modern browsers with module support:**

```html
<script type="module">
  import Httprex from 'https://cdn.jsdelivr.net/npm/httprex@latest/dist/lib/httprex.min.mjs';

  Httprex.init({
    startOnLoad: true,
    selector: '.httprex'
  });
</script>

<pre class="httprex">
###
GET https://api.github.com/users/octocat
Accept: application/json
</pre>
```

### 4. Web Components Only

**If you only need the custom elements:**

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/httprex@latest/dist/lib/web-components.mjs"></script>

<httprex-block>
GET https://api.github.com/users/octocat
Accept: application/json
</httprex-block>
```

---

## Integration Examples

### Obsidian Plugin

```typescript
import Httprex from 'httprex';
import 'httprex/web-components';

export default class HttprexPlugin extends Plugin {
  async onload() {
    // Initialize with localStorage for variable persistence
    Httprex.init({
      variableStorage: new LocalStorageVariableStorage('obsidian-httprex')
    });

    // Register markdown code block processor
    this.registerMarkdownCodeBlockProcessor('httprex', (source, el, ctx) => {
      const block = document.createElement('httprex-block');
      block.textContent = source;
      el.appendChild(block);
    });
  }
}
```

### Notion Embed

```html
<!-- Notion supports iframe embeds with HTML content -->
<iframe srcdoc="
  <!DOCTYPE html>
  <html>
  <head>
    <script src='https://cdn.jsdelivr.net/npm/httprex@latest/dist/lib/httprex.min.js'></script>
  </head>
  <body>
    <pre class='httprex'>
    GET https://api.github.com/users/octocat
    </pre>
    <script>
      window.Httprex.init({ startOnLoad: true });
    </script>
  </body>
  </html>
"></iframe>
```

### Static Site Generator (Hugo, Jekyll, Eleventy)

**In your layout/template:**

```html
<!-- In <head> -->
<script type="module">
  import Httprex from 'https://cdn.jsdelivr.net/npm/httprex@latest/dist/lib/httprex.min.mjs';
  Httprex.init({ startOnLoad: true, selector: '.language-httprex' });
</script>

<!-- In markdown files, code blocks are auto-discovered -->
```

**In your markdown:**

````markdown
```httprex
GET https://api.github.com/repos/anthropics/httprex
Accept: application/json
```
````

### GitHub Actions (Markdown Preprocessor)

Create a GitHub Action to convert httprex blocks to static API documentation:

```yaml
name: Generate API Docs
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Convert httprex to HTML
        run: |
          npm install httprex
          node generate-docs.js
```

---

## API Reference

### Initialization

```typescript
Httprex.init(options?: HttprexOptions): void
```

**Options:**
- `selector?: string` - CSS selector for auto-discovery (default: `.language-httprex`)
- `variableStorage?: VariableStorage` - Storage adapter for variables
- `cors?: { mode: 'proxy' | 'no-cors' | 'cors', proxyUrl?: string }` - CORS handling
- `timeout?: number` - Request timeout in milliseconds

### Parsing

```typescript
// Parse single request
Httprex.parse(text: string): ParserResult<ParsedRequest>

// Parse file with multiple requests
Httprex.parseFile(text: string): ParserResult<ParsedRequestFile>
```

### Execution

```typescript
Httprex.execute(
  request: ParsedRequest,
  variables?: Record<string, string>,
  options?: ExecuteOptions
): Promise<ExecutedRequest>
```

### Variable Storage

**Available adapters:**
- `InMemoryVariableStorage` - No persistence (default)
- `LocalStorageVariableStorage` - Browser localStorage
- `ChromeStorageVariableStorage` - Chrome extension storage

```typescript
import { LocalStorageVariableStorage } from 'httprex';

const storage = new LocalStorageVariableStorage('my-app-prefix');
await storage.set('baseUrl', 'https://api.example.com');
const value = await storage.get('baseUrl');
```

---

## Request Syntax

Httprex uses VSCode REST Client format:

### Basic Request

```http
GET https://api.github.com/users/octocat
```

### With Headers

```http
GET https://api.github.com/users/octocat
Accept: application/json
Authorization: Bearer {{token}}
```

### POST with JSON Body

```http
POST https://api.example.com/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Variables

**File variables:**
```http
@baseUrl = https://api.github.com
@token = ghp_xxxxxxxxxxxx

###

GET {{baseUrl}}/user
Authorization: Bearer {{token}}
```

**System variables:**
- `{{$timestamp}}` - Current Unix timestamp
- `{{$guid}}` - Random UUID
- `{{$randomInt}}` - Random integer

### Multiple Requests

```http
@baseUrl = https://jsonplaceholder.typicode.com

###

# @name getPosts
GET {{baseUrl}}/posts

###

# @name createPost
POST {{baseUrl}}/posts
Content-Type: application/json

{
  "title": "Test",
  "userId": 1
}
```

---

## Browser Compatibility

- **Modern browsers** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Legacy browsers** via IIFE format and polyfills
- **Node.js** 16+ for server-side usage

---

## CDN Options

Httprex is available on multiple CDNs:

- **jsDelivr**: `https://cdn.jsdelivr.net/npm/httprex@latest/dist/lib/`
- **unpkg**: `https://unpkg.com/httprex@latest/dist/lib/`
- **cdnjs** (coming soon)

---

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import Httprex, {
  ParsedRequest,
  HttpResponse,
  ExecutedRequest,
  VariableStorage,
  HttprexOptions
} from 'httprex';

const result = Httprex.parse('GET https://example.com');
if (result.success) {
  const request: ParsedRequest = result.data;
  const response: ExecutedRequest = await Httprex.execute(request);
}
```

---

## License

MIT License - see LICENSE file for details

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Support

- **Issues**: https://github.com/your-username/httprex/issues
- **Discussions**: https://github.com/your-username/httprex/discussions
- **Documentation**: https://httprex.dev
