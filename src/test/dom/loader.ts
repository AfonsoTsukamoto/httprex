import { JSDOM, ConstructorOptions } from 'jsdom'

import fs from 'fs';

export enum TestPage {
  SIMPLE_GIST = 'simple_gist',
  SIMPLE_SNIPPET = 'simple_snippet'
}

export const PAGE_FILE: Record<TestPage, string> = {
  [TestPage.SIMPLE_GIST]: 'src/test/dom/data/simple-gist.html',
  [TestPage.SIMPLE_SNIPPET]: 'src/test/dom/data/simple-snippet.html'
}

export const getTestDOM = async (page: TestPage): Promise<JSDOM> => await JSDOM.fromFile(PAGE_FILE[page]);
