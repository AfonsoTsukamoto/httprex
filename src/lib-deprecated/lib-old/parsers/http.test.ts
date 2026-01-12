import { assert, expect, test } from 'vitest'
import { HTTPParser } from './http';

const JSON_POST =
`POST https://examples.com/comments HTTP/1.1
content-type: application/json

{
    "name": "sample",
    "time": "Wed, 21 Oct 2015 18:27:50 GMT"
}`;

const FORM_URL_ENCODED_POST =
`POST https://examples.com/comments HTTP/1.1
content-type: application/x-www-form-urlencoded

name=sample
something=else
what=cool
time=Wed, 21 Oct 2015 18:27:50 GMT
`;



describe('http parser', () => {
  test('parses JSON POST', () => {
    const p = new HTTPParser();
    expect(p.parse(JSON_POST)).toStrictEqual({
      "body": {
        "name": "sample",
        "time": "Wed, 21 Oct 2015 18:27:50 GMT",
      },
      "headers": {
        "content-type": "application/json",
      },
      "method": "POST",
      "url": "https://examples.com/comments",
    });
  });
  test('parses x-www-form-urlencoded POST', () => {
    const p = new HTTPParser();
    expect(p.parse(FORM_URL_ENCODED_POST)).toStrictEqual({
      "body": "name=sample&something=else&what=cool&time=Wed%252C%252021%2520Oct%25202015%252018%253A27%253A50%2520GMT&=undefined",
      "headers": {
        "content-type": "application/x-www-form-urlencoded",
      },
      "method": "POST",
      "url": "https://examples.com/comments",
    })
  });
});
