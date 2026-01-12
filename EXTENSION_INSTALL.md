# Installing Httprex Chrome Extension

## Development Installation

1. **Build the extension:**
   ```bash
   yarn build
   ```

2. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder in this project

3. **Test the extension:**
   - Navigate to a GitHub or GitLab page with HTTP code blocks
   - Look for code blocks with language `rexx` or `httpspec` on GitHub
   - Look for code blocks with language `http` on GitLab
   - The extension should automatically replace them with interactive `<httprex-block>` components

## Creating HTTP Code Blocks

### On GitHub

Create a code block with `rexx` or `httpspec` language:

\`\`\`rexx
###
GET https://api.github.com/users/octocat
Accept: application/json
\`\`\`

### On GitLab

Create a code block with `http` language:

\`\`\`http
###
GET https://jsonplaceholder.typicode.com/users/1
Accept: application/json
\`\`\`

## Extension Features

- **Auto-discovery:** Automatically finds and replaces HTTP code blocks
- **Interactive execution:** Click "Send" to execute requests
- **Variable support:** Use `{{varName}}` and `@varName = value` syntax
- **Copy as cURL:** Export requests to cURL commands
- **Response viewer:** See status, headers, body, and timing

## Manifest Location

The extension uses:
- **Manifest:** `/manifest.json` (root)
- **Content Script:** `dist/chrome-extension/content.js`
- **Background Worker:** `dist/chrome-extension/background.js`

## Toggle Extension

Click the Httprex icon in the Chrome toolbar to toggle the extension ON/OFF.
The badge will show the current state.

## Debugging

1. **Check console:** Open DevTools on GitHub/GitLab to see Httprex logs
2. **Inspect element:** Right-click on an httprex-block and select "Inspect"
3. **Background logs:** Go to `chrome://extensions/`, find Httprex, click "service worker" link

## Architecture

The refactored extension (v2.0.0) uses:
- **No React:** Pure Web Components for minimal bundle size
- **lib-httprex:** Standalone HTTP parser and executor
- **Shadow DOM:** Encapsulated styling with CSS custom properties

Old React-based files are deprecated and will be removed in a future update.
