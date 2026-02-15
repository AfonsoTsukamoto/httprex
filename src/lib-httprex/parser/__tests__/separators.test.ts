/**
 * Tests for separators.ts
 * Tests multi-request file splitting with ### separator
 */

import { describe, it, expect } from 'vitest';
import { splitRequests, extractRequestName } from '../separators';

describe('splitRequests', () => {
  describe('Single request', () => {
    it('should handle single request without separator', () => {
      const text = `GET https://api.example.com/users
Accept: application/json`;

      const blocks = splitRequests(text);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].content).toContain('GET https://api.example.com/users');
    });

    it('should handle single request with separator at start', () => {
      const text = `###
GET https://api.example.com/users
Accept: application/json`;

      const blocks = splitRequests(text);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].content).toContain('GET https://api.example.com/users');
    });
  });

  describe('Multiple requests', () => {
    it('should split on ### separator', () => {
      const text = `GET https://api.example.com/users
###
POST https://api.example.com/users
Content-Type: application/json`;

      const blocks = splitRequests(text);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].content).toContain('GET');
      expect(blocks[1].content).toContain('POST');
    });

    it('should handle three hash marks', () => {
      const text = `GET https://example.com/1
###
GET https://example.com/2
###
GET https://example.com/3`;

      const blocks = splitRequests(text);

      expect(blocks).toHaveLength(3);
    });

    it('should preserve request content', () => {
      const text = `GET https://api.example.com/users
Accept: application/json

###

POST https://api.example.com/users
Content-Type: application/json

{"name": "John"}`;

      const blocks = splitRequests(text);

      expect(blocks[0].content).toContain('Accept: application/json');
      expect(blocks[1].content).toContain('Content-Type: application/json');
      expect(blocks[1].content).toContain('"name": "John"');
    });
  });

  describe('Comments', () => {
    it('should preserve comments in requests', () => {
      const text = `# This is a comment
GET https://api.example.com/users
###
// Another comment
POST https://api.example.com/users`;

      const blocks = splitRequests(text);

      expect(blocks[0].content).toContain('# This is a comment');
      expect(blocks[1].content).toContain('// Another comment');
    });

    it('should extract named requests', () => {
      const text = `# @name getUsers
GET https://api.example.com/users
###
# @name createUser
POST https://api.example.com/users`;

      const blocks = splitRequests(text);

      expect(blocks[0].name).toBe('getUsers');
      expect(blocks[1].name).toBe('createUser');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const blocks = splitRequests('');

      expect(blocks).toHaveLength(0);
    });

    it('should handle only separator', () => {
      const blocks = splitRequests('###');

      expect(blocks).toHaveLength(0);
    });

    it('should handle multiple consecutive separators', () => {
      const text = `GET https://example.com/1
###
###
###
GET https://example.com/2`;

      const blocks = splitRequests(text);

      expect(blocks).toHaveLength(2);
    });
  });
});

describe('extractRequestName', () => {
  describe('Named requests', () => {
    it('should extract name from # @name comment', () => {
      const lines = ['# @name getUsers', 'GET https://api.example.com/users'];
      const name = extractRequestName(lines);

      expect(name).toBe('getUsers');
    });

    it('should return undefined for unnamed request', () => {
      const lines = ['GET https://api.example.com/users', 'Accept: application/json'];
      const name = extractRequestName(lines);

      expect(name).toBeUndefined();
    });
  });
});
