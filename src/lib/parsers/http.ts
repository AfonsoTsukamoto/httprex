// HTTP parser
// Heavily inspired by https://github.com/Huachao/vscode-restclient/blob/master/src/utils/httpRequestParser.ts
// and https://github.com/bewakes/vim-rest-client/blob/master/python/rest.py

import { Parser } from '../parser';
import { getHeaderContentType, findContentTypeHeader } from '../content-type';
import { convertBody } from './body-helpers';
import { EOL_R, RequestContentType } from '@src/constants';

enum ParseState {
  URL,
  Header,
  Body,
}

const REMOVE_HEADERS = [
  'content-length'
]

export class HTTPParser implements Parser {
  private readonly defaultMethod = 'GET';
  private readonly defaultContentType = RequestContentType.X_WWW_FORM_URL_ENCODED;
  private readonly queryStringLinePrefix = /^\s*[&\?]/;
  private readonly methodRegex = /^(GET|HEAD|POST|PUT|DELETE|CONNECT|OPTIONS|TRACE|PATCH)\s+/i;
  private readonly httpVersionRegex = /\s+HTTP\/.*$/i;


  parse(text: string) {
    // parse follows http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html
    // split the request raw text into lines
    const lines: string[] = text.split(EOL_R)
    const requestLines: string[] = [];
    const headersLines: string[] = [];
    const bodyLines: string[] = [];

    let state = ParseState.URL;
    let currentLine: string | undefined;

    while ((currentLine = lines.shift()) !== undefined) {
      const nextLine = lines[0];
      switch (state) {
        case ParseState.URL:
          requestLines.push(currentLine.trim());
          if (nextLine === undefined || this.queryStringLinePrefix.test(nextLine)) {
            // request with request line only
          } else if (nextLine.trim()) {
            state = ParseState.Header;
          } else {
            // request with no headers but has body
            // remove the blank line before the body
            lines.shift();
            state = ParseState.Body;
          }
          break;
        case ParseState.Header:
          headersLines.push(currentLine.trim());
          if (nextLine?.trim() === '') {
            // request with no headers but has body
            // remove the blank line before the body
            lines.shift();
            state = ParseState.Body;
          }
          break;
        case ParseState.Body:
            bodyLines.push(currentLine);
          break;
      }
    }

    // parse request line
    const requestLine = this.parseRequestLine(requestLines.map(l => l.trim()).join(''));

    // parse headers lines
    const headers = this.parseRequestHeaders(headersLines, requestLine.url);

    // parse body lines
    const contentType: RequestContentType = getHeaderContentType(findContentTypeHeader(headers)) || this.defaultContentType;
    let body = this.parseBody(bodyLines, contentType);

    body = convertBody(contentType, body ?? "");
    return { ...requestLine, headers, body }
  }


  private parseRequestLine(line: string): { method: string, url: string } {
    // Request-Line = Method SP Request-URI SP HTTP-Version CRLF
    let method: string;
    let url: string;

    let match: Nullable<RegExpExecArray> = this.methodRegex.exec(line);
    if (match) {
      method = match[1];
      url = line.substring(match[1].length);
    } else {
      // Only provides request url
      method = this.defaultMethod;
      url = line;
    }
    url = url.trim();

    let headerMatch: Nullable<RegExpExecArray> = this.httpVersionRegex.exec(url);
    if (headerMatch) {
      url = url.substring(0, headerMatch.index);
    }

    return { method, url };
  }

  private parseRequestHeaders(headerLines: string[], url: string)  {
    // message-header = field-name ":" [ field-value ]
    const headers: { [key: string]: string } = {};
    const headerNames: { [key: string]: string } = {};
    headerLines.forEach(headerLine => {
        let fieldName: string;
        let fieldValue: string;
        const separatorIndex = headerLine.indexOf(':');
        if (separatorIndex === -1) {
            fieldName = headerLine.trim();
            fieldValue = '';
        } else {
            fieldName = headerLine.substring(0, separatorIndex).trim();
            fieldValue = headerLine.substring(separatorIndex + 1).trim();
        }

        const normalizedFieldName = fieldName.toLowerCase();
        if (!headerNames[normalizedFieldName]) {
            headerNames[normalizedFieldName] = fieldName;
            headers[fieldName] = fieldValue;
        } else {
            const splitter = normalizedFieldName === 'cookie' ? ';' : ',';
            headers[headerNames[normalizedFieldName]] += `${splitter}${fieldValue}`;
        }
    });
    return headers;
  }

  private parseBody(lines: string[], contentTypeHeader: RequestContentType): Nullable<string> {
    if (lines.length === 0) {
      return null;
    }

    if (contentTypeHeader === RequestContentType.X_WWW_FORM_URL_ENCODED) {
      return lines.reduce((p, c, i) => {
        p += `${(i === 0 || c.startsWith('&') ? '' : '\n')}${c}`;
        return p;
      }, '');
    } else {
      return lines.join('\n');
    }
  }
}
