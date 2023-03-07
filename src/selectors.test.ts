import { assert, expect, test } from 'vitest';
import { findCodeBlocks  } from './selectors';
import { Host } from './host';
import { withTestPage, TestPage } from './test/dom/loader';

describe('find code blocks', () => {
  test('finds code in github gist', () => {
    withTestPage({ page: TestPage.SIMPLE_GIST }, () => {
      expect(findCodeBlocks(Host.GITHUB)).toBe({});
    });
  });
  test('finds code in gitlab snippet', () => {
  });
});
