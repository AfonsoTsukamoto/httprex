import * as fs from 'fs';
import { JSDOM, ConstructorOptions } from 'jsdom'

export enum TestPage {
  SIMPLE_GIST = 'simple_gist',
  SIMPLE_SNIPPET = 'simple_snippet'
}

export const PAGE_FILE: Record<TestPage, string> = {
  [TestPage.SIMPLE_GIST]: 'src/test/dom/data/simple-gist.html',
  [TestPage.SIMPLE_SNIPPET]: 'src/test/dom/data/simple-gist.html'
}


export const withTestPage = (
  { page, opts }: {page: TestPage, opts?: ConstructorOptions },
  testFn: (dom?: JSDOM) => any
) => {
  const pageFile = PAGE_FILE[page];
  console.log({ pageFile });
  if (pageFile) {
    JSDOM.fromFile(pageFile, opts).then((dom: JSDOM) => {
      const doc = global.document;
      global.document = dom.window.document;
      testFn(dom)
      global.document = doc;
    });
  }
}
