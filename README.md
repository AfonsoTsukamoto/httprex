# HttpRex

Interactive HTTP requests for markdown — like [mermaid.js](https://mermaid.js.org) but for APIs.

HttpRex parses [VSCode REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) format and renders executable request blocks as Web Components.

## Quick Start

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/httprex@latest/dist/lib/httprex.min.mjs"></script>

<rex-request-block>
GET https://api.github.com/users/octocat
Accept: application/json
</rex-request-block>
```

## Programmatic Usage

```typescript
import { HttpRex } from 'httprex';

const result = HttpRex.parse(`
@baseUrl = https://api.example.com

###
# @name getUsers
GET {{baseUrl}}/users
Authorization: Bearer {{token}}
`);

if (result.success) {
  const response = await HttpRex.execute(result.data.requests[0]);
  console.log(response);
}
```

## Features

- **VSCode REST Client compatible** — `###` separators, `{{variables}}`, `@fileVars`, named requests
- **Web Components** — drop-in `<rex-request-block>` with built-in UI
- **Design system** — light/dark themes, CSS custom properties
- **Framework-agnostic** — works anywhere: static sites, Obsidian, Notion, SSGs
- **Secrets support** — 1Password, Chrome encrypted storage, prompt-based providers

## Format

```http
@baseUrl = https://jsonplaceholder.typicode.com
@token = my-secret-token

###

# @name listPosts
GET {{baseUrl}}/posts
Accept: application/json
Authorization: Bearer {{token}}

###

# @name createPost
POST {{baseUrl}}/posts
Content-Type: application/json

{
  "title": "Hello",
  "body": "World",
  "userId": 1
}
```

## Development

```bash
bun install
bun run dev       # Vite dev server
bun test          # Run tests
bun run build     # Build app
bun run build:lib # Build library bundles
```

## License

MIT
