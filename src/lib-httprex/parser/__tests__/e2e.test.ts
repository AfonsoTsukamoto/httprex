/**
 * End-to-end parser tests
 * Tests the full parser with real-world examples
 */

import { describe, it, expect } from 'vitest';
import { httpParser } from '../index';

describe('httpParser - End-to-End', () => {
  describe('Simple requests', () => {
    it('should parse GET request', () => {
      const text = 'GET https://api.example.com/users';
      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
      if (result.data) {
        expect(result.data.method).toBe('GET');
        expect(result.data.url).toBe('https://api.example.com/users');
      }
    });

    it('should parse POST with JSON body', () => {
      const text = `POST https://api.example.com/users
Content-Type: application/json

{
  "name": "John",
  "email": "john@example.com"
}`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.method).toBe('POST');
        expect(result.data.body).toEqual({
          name: 'John',
          email: 'john@example.com'
        });
      }
    });

    it('should parse request with headers', () => {
      const text = `GET https://api.example.com/users
Authorization: Bearer token123
Accept: application/json`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.headers).toHaveProperty('authorization');
        expect(result.data.headers).toHaveProperty('accept');
      }
    });
  });

  describe('Variables', () => {
    it('should extract variables from request', () => {
      const text = `GET https://{{baseUrl}}/users/{{userId}}
Authorization: Bearer {{token}}`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.variables.length).toBeGreaterThan(0);
        const varNames = result.data.variables.map(v => v.name);
        expect(varNames).toContain('baseUrl');
        expect(varNames).toContain('userId');
        expect(varNames).toContain('token');
      }
    });
  });

  describe('Multi-request files', () => {
    it('should parse multiple requests separated by ###', () => {
      const text = `GET https://api.example.com/users
###
POST https://api.example.com/users
Content-Type: application/json

{"name": "John"}`;

      const result = httpParser.parseFile(text);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.requests).toHaveLength(2);
        expect(result.data.requests[0].method).toBe('GET');
        expect(result.data.requests[1].method).toBe('POST');
      }
    });

    it('should parse file with variables', () => {
      const text = `@baseUrl = https://api.example.com
@token = secret123

###
GET {{baseUrl}}/users
Authorization: Bearer {{token}}`;

      const result = httpParser.parseFile(text);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.fileVariables).toBeTruthy();
        expect(result.data.requests).toHaveLength(1);
      }
    });

    it('should parse named requests', () => {
      const text = `# @name getUsers
GET https://api.example.com/users
###
# @name createUser
POST https://api.example.com/users`;

      const result = httpParser.parseFile(text);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.requests[0].name).toBe('getUsers');
        expect(result.data.requests[1].name).toBe('createUser');
      }
    });
  });

  describe('Real-world examples', () => {
    it('should parse GitHub API request', () => {
      const text = `@apiUrl = https://api.github.com
@token = ghp_xxxxxxxxxxxx

###

# @name getUser
GET {{apiUrl}}/user HTTP/1.1
Accept: application/vnd.github.v3+json
Authorization: Bearer {{token}}
User-Agent: HttpRex/2.0`;

      const result = httpParser.parseFile(text);

      if (!result.success) {
        console.log('GitHub API test errors:', JSON.stringify(result.errors, null, 2));
        console.log('Requests parsed:', result.data?.requests.length);
      }

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.requests).toHaveLength(1);
        expect(result.data.requests[0].name).toBe('getUser');
        expect(result.data.requests[0].method).toBe('GET');
        expect(result.data.requests[0].headers['accept']).toContain('github');
      }
    });

    it('should parse REST API CRUD operations', () => {
      const text = `@baseUrl = https://jsonplaceholder.typicode.com

###

# @name listPosts
GET {{baseUrl}}/posts HTTP/1.1

###

# @name getPost
GET {{baseUrl}}/posts/1 HTTP/1.1

###

# @name createPost
POST {{baseUrl}}/posts HTTP/1.1
Content-Type: application/json

{
  "title": "Test Post",
  "body": "This is a test",
  "userId": 1
}

###

# @name updatePost
PUT {{baseUrl}}/posts/1 HTTP/1.1
Content-Type: application/json

{
  "id": 1,
  "title": "Updated Post",
  "body": "Updated content",
  "userId": 1
}

###

# @name deletePost
DELETE {{baseUrl}}/posts/1 HTTP/1.1`;

      const result = httpParser.parseFile(text);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.requests).toHaveLength(5);
        expect(result.data.requests.map(r => r.name)).toEqual([
          'listPosts',
          'getPost',
          'createPost',
          'updatePost',
          'deletePost'
        ]);
        expect(result.data.requests.map(r => r.method)).toEqual([
          'GET',
          'GET',
          'POST',
          'PUT',
          'DELETE'
        ]);
      }
    });

    it('should parse form-urlencoded request', () => {
      const text = `POST https://api.example.com/login
Content-Type: application/x-www-form-urlencoded

username=john@example.com
password=secret123`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.method).toBe('POST');
        expect(typeof result.data.body).toBe('string');
        expect(result.data.body).toContain('username=');
        expect(result.data.body).toContain('password=');
      }
    });

    it('should parse XML request', () => {
      const text = `POST https://api.example.com/data
Content-Type: application/xml

<?xml version="1.0"?>
<user>
  <name>John</name>
  <email>john@example.com</email>
</user>`;

      const result = httpParser.parse(text);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.method).toBe('POST');
        expect(result.data.body).toBeTruthy();
      }
    });
  });

  describe('Error handling', () => {
    it('should collect errors for invalid request', () => {
      const text = 'INVALID not-a-url';
      const result = httpParser.parse(text);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed JSON gracefully', () => {
      const text = `POST https://api.example.com
Content-Type: application/json

{invalid json}`;

      const result = httpParser.parse(text);

      // Should still parse but with errors
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === 'PARSE_FAILED')).toBe(true);
    });
  });
});
