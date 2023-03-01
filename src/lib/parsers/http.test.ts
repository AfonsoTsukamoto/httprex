import { assert, expect, test } from 'vitest'
import { HTTPParser } from './http';

const HTTP_POST =
`POST https://example.com/comments HTTP/1.1
content-type: application/json

{
    "name": "sample",
    "time": "Wed, 21 Oct 2015 18:27:50 GMT"
}`;

describe('http parser', () => {
  test('parses POST', () => {
    const p = new HTTPParser();
    console.log(p);
    expect(p.parse(HTTP_POST)).toBe({
      "body": `{
      "name": "sample",
      "time": "Wed, 21 Oct 2015 18:27:50 GMT"
    }`,
      "body_raw": `{
      "name": "sample",
      "time": "Wed, 21 Oct 2015 18:27:50 GMT"
    }`,
      "headers": {
        "content-type": "application/json",
      },
      "method": "POST",
      "url": "https://example.com/comments"
    });
  });
});
