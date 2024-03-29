import { assert, expect, test } from 'vitest';
import { getHeaderContentType } from './content-type';


describe('content type parsed', () => {
  test('parses headers', () => {
    expect(getHeaderContentType("   application/json;  charset=utf-8")).toBe(RequestContentType.JSON);
    expect(getHeaderContentType(" application/xml;agoieh2r3")).toBe(RequestContentType.XML);
    expect(getHeaderContentType(" application/x-www-form-urlencoded afkjein"))
      .toBe(RequestContentType.X_WWW_FORM_URL_ENCODED);
  });
});
