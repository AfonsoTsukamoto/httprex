import { assert, expect, test } from 'vitest';
import { getHeaderContentType } from './content-type';
import { ContentType } from './parser';


describe('content type parsed', () => {
  test('parses headers', () => {
    expect(getHeaderContentType("   application/json;  charset=utf-8")).toBe(ContentType.JSON);
    expect(getHeaderContentType(" application/xml;agoieh2r3")).toBe(ContentType.XML);
    expect(getHeaderContentType(" application/x-www-form-urlencoded afkjein")).toBe(ContentType.X_WWW_FORM_URL_ENCODED);
  });
});
