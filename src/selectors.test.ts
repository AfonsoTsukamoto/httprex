import { vi, afterEach, expect, test } from 'vitest';
import { findCodeBlocks  } from './selectors';
import { Host } from './host';
import { getTestDOM, TestPage } from './test/dom/loader';

afterEach(async () => {
  vi.unstubAllGlobals()
});

describe('find code blocks', () => {
  test('finds code in github gist', async () => {
    const jsdom = await getTestDOM(TestPage.SIMPLE_GIST);
    vi.stubGlobal('document', jsdom.window.document);
    const found: HTMLDivElement = findCodeBlocks(Host.GITHUB)?.item(0) as HTMLDivElement;

    expect(found.outerHTML).toBe(
      '<div class="highlight highlight-source-httpspec" dir="auto"><pre><span class="pl-k">POST</span>'+
      '<span class="pl-c1"> https://google.com</span>\n' +
      '<span class="pl-s"><span class="pl-v">content-type:</span> application/json</span>\n' +
      '\n' +
      '{\n' +
      '    <span class="pl-ii">email: foo@bar.com</span>\n' +
      '}</pre></div>');
  });

  test('finds code in gitlab snippet', async () => {
    const jsdom = await getTestDOM(TestPage.SIMPLE_SNIPPET);
    vi.stubGlobal('document', jsdom.window.document);
    const found: HTMLDivElement = findCodeBlocks(Host.GITLAB)?.item(0) as HTMLDivElement;
    expect(found.outerHTML).toBe(
      '<pre class="code highlight js-syntax-highlight language-http white" lang="http" ' +
      'data-sourcepos="12:1-19:3" id="code-4"><code><span lang="http" class="line" id="LC1">' +
      '<span class="err">POST https://google.com</span></span>\n' +
      '<span lang="http" class="line" id="LC2"><span class="err">content-type: application/json</span></span>\n' +
      '<span lang="http" class="line" id="LC3"></span>\n' +
      '<span lang="http" class="line" id="LC4"><span class="err">{</span></span>\n' +
      '<span lang="http" class="line" id="LC5"><span class="err">    email: foo@bar.com</span></span>\n' +
      '<span lang="http" class="line" id="LC6"><span class="err">}</span></span></code></pre>'
    );
  });
});
