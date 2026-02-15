/**
 * Tests for parser/index.ts
 * End-to-end parser integration tests
 */

import { describe, it, expect } from 'vitest';
import { httpParser } from '../index';

describe('httpParser', () => {
  describe('parse() - Single request', () => {
    it('should parse simple GET request', () => {
      const text = `GET https://api.example.com/users`;
      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.method).toBe('GET');
      expect(result.data?.url).toBe('https://api.example.com/users');
      expect(result.data?.headers).toEqual({});
      expect(result.data?.body).toBeNull();
    });

    it('should parse request with headers', () => {
      const text = `GET https://api.example.com/users
Accept: application/json
Authorization: Bearer token123`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.headers).toEqual({
        'accept': 'application/json',
        'authorization': 'Bearer token123'
      });
    });

    it('should parse POST request with JSON body', () => {
      const text = `POST https://api.example.com/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.method).toBe('POST');
      expect(result.data?.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should extract variables', () => {
      const text = `GET https://{{baseUrl}}/users/{{userId}}
Authorization: Bearer {{token}}`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.variables).toHaveLength(3);
      expect(result.data?.variables.map(v => v.name)).toContain('baseUrl');
      expect(result.data?.variables.map(v => v.name)).toContain('userId');
      expect(result.data?.variables.map(v => v.name)).toContain('token');
    });

    it('should parse named request', () => {
      const text = `# @name getUsers
GET https://api.example.com/users`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('getUsers');
    });

    it('should include raw request data', () => {
      const text = `GET https://api.example.com/users
Accept: application/json

{"key": "value"}`;

      const result = httpParser.parse(text);

      expect(result.data?.raw.requestLine).toBe('GET https://api.example.com/users');
      expect(result.data?.raw.headerLines).toContain('Accept: application/json');
      expect(result.data?.raw.bodyLines).toContain('{"key": "value"}');
    });
  });

  describe('parseFile() - Multiple requests', () => {
    it('should parse file with multiple requests', () => {
      const text = `GET https://api.example.com/users
###
POST https://api.example.com/users
Content-Type: application/json

{"name": "John"}`;

      const result = httpParser.parseFile(text);

      expect(result.success).toBe(true);
      expect(result.data?.requests).toHaveLength(2);
      expect(result.data?.requests[0].method).toBe('GET');
      expect(result.data?.requests[1].method).toBe('POST');
    });

    it('should extract file variables', () => {
      const text = `@baseUrl = https://api.example.com
@token = abc123

###
GET {{baseUrl}}/users
Authorization: Bearer {{token}}`;

      const result = httpParser.parseFile(text);

      expect(result.success).toBe(true);
      expect(result.data?.fileVariables).toEqual({
        baseUrl: 'https://api.example.com',
        token: 'abc123'
      });
    });

    it('should parse VSCode REST Client format file', () => {
      const text = `@baseUrl = https://api.example.com

###

# @name listUsers
GET {{baseUrl}}/users HTTP/1.1
Accept: application/json

###

# @name createUser
POST {{baseUrl}}/users HTTP/1.1
Content-Type: application/json

{
  "name": "John",
  "email": "john@example.com"
}

###

# @name deleteUser
DELETE {{baseUrl}}/users/123 HTTP/1.1`;

      const result = httpParser.parseFile(text);

      expect(result.success).toBe(true);
      expect(result.data?.requests).toHaveLength(3);
      expect(result.data?.requests[0].name).toBe('listUsers');
      expect(result.data?.requests[1].name).toBe('createUser');
      expect(result.data?.requests[2].name).toBe('deleteUser');
      expect(result.data?.fileVariables.baseUrl).toBe('https://api.example.com');
    });

    it('should handle requests with different methods', () => {
      const text = `GET https://example.com/1
###
POST https://example.com/2
###
PUT https://example.com/3
###
DELETE https://example.com/4
###
PATCH https://example.com/5`;

      const result = httpParser.parseFile(text);

      expect(result.success).toBe(true);
      expect(result.data?.requests).toHaveLength(5);
      expect(result.data?.requests.map(r => r.method)).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
    });
  });

  describe('Error handling', () => {
    it('should return errors for invalid method', () => {
      const text = `INVALID https://example.com`;
      const result = httpParser.parse(text);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_METHOD');
    });

    it('should return errors for invalid URL', () => {
      const text = `GET not-a-valid-url`;
      const result = httpParser.parse(text);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_URL');
    });

    it('should return errors for invalid JSON body', () => {
      const text = `POST https://example.com
Content-Type: application/json

{invalid json}`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.type === 'PARSE_FAILED')).toBe(true);
    });

    it('should collect multiple errors', () => {
      const text = `INVALID not-a-url
Content-Type: application/json

{invalid}`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should handle empty request', () => {
      const result = httpParser.parse('');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should continue parsing other requests after error in multi-request file', () => {
      const text = `INVALID https://example.com
###
GET https://example.com/valid`;

      const result = httpParser.parseFile(text);

      // Should parse the valid request despite error in first one
      expect(result.data?.requests.length).toBeGreaterThanOrEqual(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Complex scenarios', () => {
    it('should parse request with query parameters', () => {
      const text = `GET https://api.example.com/search?q=test&limit=10&offset=0`;
      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.url).toContain('?q=test&limit=10&offset=0');
    });

    it('should parse request with form-urlencoded body', () => {
      const text = `POST https://api.example.com/login
Content-Type: application/x-www-form-urlencoded

username=john@example.com
password=secret123`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.body).toContain('username=');
      expect(result.data?.body).toContain('password=');
    });

    it('should parse request with XML body', () => {
      const text = `POST https://api.example.com/data
Content-Type: application/xml

<?xml version="1.0"?>
<user>
  <name>John</name>
  <email>john@example.com</email>
</user>`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.body).toBeTruthy();
    });

    it('should parse request with multi-line headers', () => {
      const text = `GET https://api.example.com/users
Accept: application/json,
  application/xml,
  text/plain`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.headers['accept']).toContain('application/json');
      expect(result.data?.headers['accept']).toContain('application/xml');
      expect(result.data?.headers['accept']).toContain('text/plain');
    });

    it('should handle comments throughout the request', () => {
      const text = `# Get all users
# @name getAllUsers
GET https://api.example.com/users
# Accept JSON response
Accept: application/json`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('getAllUsers');
    });

    it('should parse complex real-world example', () => {
      const text = `@apiUrl = https://api.github.com
@token = ghp_xxxxxxxxxxxx

###

# @name getUser
# Get authenticated user information
GET {{apiUrl}}/user HTTP/1.1
Accept: application/vnd.github.v3+json
Authorization: Bearer {{token}}
User-Agent: HttpRex/2.0

###

# @name listRepos
# List user repositories
GET {{apiUrl}}/user/repos?sort=updated&direction=desc HTTP/1.1
Accept: application/vnd.github.v3+json
Authorization: Bearer {{token}}

###

# @name createRepo
# Create a new repository
POST {{apiUrl}}/user/repos HTTP/1.1
Accept: application/vnd.github.v3+json
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "my-new-repo",
  "description": "Created via HttpRex",
  "private": false,
  "auto_init": true
}`;

      const result = httpParser.parseFile(text);

      expect(result.success).toBe(true);
      expect(result.data?.requests).toHaveLength(3);
      expect(result.data?.fileVariables).toHaveProperty('apiUrl');
      expect(result.data?.fileVariables).toHaveProperty('token');
      expect(result.data?.requests[0].name).toBe('getUser');
      expect(result.data?.requests[1].name).toBe('listRepos');
      expect(result.data?.requests[2].name).toBe('createRepo');
      expect(result.data?.requests[2].body).toHaveProperty('name');
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace-only request', () => {
      const result = httpParser.parse('   \n\n   \t\t   ');

      expect(result.success).toBe(false);
    });

    it('should handle request with only comments', () => {
      const text = `# This is a comment
// Another comment
# Yet another comment`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(false);
    });

    it('should preserve HTTP version', () => {
      const text = `GET https://example.com HTTP/2`;
      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.raw.requestLine).toContain('HTTP/2');
    });

    it('should handle very large body', () => {
      const largeObject = { data: Array(1000).fill({ id: 1, name: 'test' }) };
      const text = `POST https://example.com
Content-Type: application/json

${JSON.stringify(largeObject)}`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data?.body).toBeTruthy();
    });
  });
});
