/**
 * HttpRex End-to-End Tests
 *
 * Tests the full flow: parsing → variable resolution → HTTP execution → response handling
 * Uses the mock DinoAPI server for reliable, fast testing.
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer, Server } from 'http';
import { dinosaurs, diets, clades, periods, Dinosaur } from './server/data';

// Import HttpRex library
import HttpRex from '../../src/lib-httprex/index';

const PORT = 3457; // Use different port than default to avoid conflicts
const BASE_URL = `http://localhost:${PORT}`;

// ========== Mock Server Setup ==========

let server: Server;
let dinosaurStore: Dinosaur[] = [];
let nextId = 1;

function resetStore() {
  dinosaurStore = [...dinosaurs];
  nextId = dinosaurs.length + 1;
}

async function parseBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => body += chunk);
    req.on('end', () => {
      if (!body) return resolve(null);
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: any, data: any, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Custom-Header, X-Request-ID'
  });
  res.end(JSON.stringify(data));
}

function sendError(res: any, message: string, status = 400) {
  sendJson(res, { error: message, status }, status);
}

beforeAll(() => {
  resetStore();

  server = createServer(async (req, res) => {
    const method = req.method || 'GET';
    const url = req.url || '/';
    const urlPath = url.split('?')[0];
    const searchParams = new URLSearchParams(url.split('?')[1] || '');

    // CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Custom-Header, X-Request-ID'
      });
      res.end();
      return;
    }

    try {
      // GET /api/v1/dinosaurs
      if (method === 'GET' && urlPath === '/api/v1/dinosaurs') {
        const diet = searchParams.get('diet');
        let result = [...dinosaurStore];
        if (diet) result = result.filter(d => d.diet === diet);
        sendJson(res, { data: result, meta: { total: result.length } });
      }
      // GET /api/v1/dinosaurs/:id
      else if (method === 'GET' && urlPath.match(/^\/api\/v1\/dinosaurs\/\d+$/)) {
        const id = parseInt(urlPath.split('/').pop()!);
        const dino = dinosaurStore.find(d => d.id === id);
        if (dino) sendJson(res, { data: dino });
        else sendError(res, `Dinosaur with id ${id} not found`, 404);
      }
      // GET /api/v1/dinosaurs/name/:name
      else if (method === 'GET' && urlPath.startsWith('/api/v1/dinosaurs/name/')) {
        const name = decodeURIComponent(urlPath.split('/').pop()!).toLowerCase();
        const dino = dinosaurStore.find(d => d.name.toLowerCase() === name);
        if (dino) sendJson(res, { data: dino });
        else sendError(res, `Dinosaur not found`, 404);
      }
      // GET /api/v1/dinosaurs/random
      else if (method === 'GET' && urlPath === '/api/v1/dinosaurs/random') {
        const count = Math.min(parseInt(searchParams.get('count') || '1'), 10);
        const shuffled = [...dinosaurStore].sort(() => Math.random() - 0.5);
        sendJson(res, { data: shuffled.slice(0, count) });
      }
      // POST /api/v1/dinosaurs
      else if (method === 'POST' && urlPath === '/api/v1/dinosaurs') {
        const body = await parseBody(req);
        if (!body?.name) {
          sendError(res, 'Missing required field: name', 400);
          return;
        }
        const newDino: Dinosaur = {
          id: nextId++,
          name: body.name,
          description: body.description || '',
          diet: body.diet || 'herbivore',
          period: body.period || 'Unknown',
          lived: body.lived || 'Unknown',
          type: body.type || 'unknown',
          length: body.length || 'Unknown',
          weight: body.weight || 'Unknown',
          taxonomy: body.taxonomy || { clade: 'Unknown', family: 'Unknown' },
          namedBy: body.namedBy || 'Unknown'
        };
        dinosaurStore.push(newDino);
        sendJson(res, { data: newDino }, 201);
      }
      // PUT /api/v1/dinosaurs/:id
      else if (method === 'PUT' && urlPath.match(/^\/api\/v1\/dinosaurs\/\d+$/)) {
        const id = parseInt(urlPath.split('/').pop()!);
        const index = dinosaurStore.findIndex(d => d.id === id);
        if (index === -1) {
          sendError(res, `Dinosaur with id ${id} not found`, 404);
          return;
        }
        const body = await parseBody(req);
        dinosaurStore[index] = { ...dinosaurStore[index], ...body, id };
        sendJson(res, { data: dinosaurStore[index] });
      }
      // DELETE /api/v1/dinosaurs/:id
      else if (method === 'DELETE' && urlPath.match(/^\/api\/v1\/dinosaurs\/\d+$/)) {
        const id = parseInt(urlPath.split('/').pop()!);
        const index = dinosaurStore.findIndex(d => d.id === id);
        if (index === -1) {
          sendError(res, `Dinosaur with id ${id} not found`, 404);
          return;
        }
        const deleted = dinosaurStore.splice(index, 1)[0];
        sendJson(res, { data: deleted });
      }
      // GET /api/v1/diets
      else if (method === 'GET' && urlPath === '/api/v1/diets') {
        sendJson(res, { data: diets });
      }
      // GET /api/v1/clades
      else if (method === 'GET' && urlPath === '/api/v1/clades') {
        sendJson(res, { data: clades });
      }
      // GET /api/v1/echo/headers
      else if (method === 'GET' && urlPath === '/api/v1/echo/headers') {
        sendJson(res, { headers: req.headers });
      }
      // POST /api/v1/echo
      else if (method === 'POST' && urlPath === '/api/v1/echo') {
        const body = await parseBody(req);
        sendJson(res, { method, url, headers: req.headers, body });
      }
      // GET /api/v1/status/:code
      else if (method === 'GET' && urlPath.match(/^\/api\/v1\/status\/\d+$/)) {
        const code = parseInt(urlPath.split('/').pop()!);
        sendJson(res, { status: code }, code);
      }
      // GET /api/v1/delay/:ms
      else if (method === 'GET' && urlPath.match(/^\/api\/v1\/delay\/\d+$/)) {
        const ms = Math.min(parseInt(urlPath.split('/').pop()!), 5000);
        await new Promise(r => setTimeout(r, ms));
        sendJson(res, { delayed: ms });
      }
      // 404
      else {
        sendError(res, `Route not found: ${method} ${urlPath}`, 404);
      }
    } catch (error) {
      sendError(res, 'Internal server error', 500);
    }
  });

  return new Promise<void>((resolve) => {
    server.listen(PORT, () => resolve());
  });
});

afterAll(() => {
  return new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

beforeEach(() => {
  resetStore();
});

// ========== Tests ==========

describe('HttpRex E2E Tests', () => {
  describe('GET Requests', () => {
    it('should parse and execute a simple GET request', async () => {
      const request = `GET ${BASE_URL}/api/v1/dinosaurs`;
      const result = HttpRex.parse(request);

      expect(result.success).toBe(true);
      expect(result.data?.method).toBe('GET');

      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(200);
      expect(executed.response?.body).toHaveProperty('data');
      expect(Array.isArray((executed.response?.body as any).data)).toBe(true);
    });

    it('should execute GET request with path parameter', async () => {
      const request = `GET ${BASE_URL}/api/v1/dinosaurs/1`;
      const result = HttpRex.parse(request);
      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(200);
      const body = executed.response?.body as any;
      expect(body.data.name).toBe('Tyrannosaurus Rex');
    });

    it('should handle 404 errors', async () => {
      const request = `GET ${BASE_URL}/api/v1/dinosaurs/999`;
      const result = HttpRex.parse(request);
      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(404);
      expect((executed.response?.body as any).error).toContain('not found');
    });

    it('should execute GET request with query parameters', async () => {
      const request = `GET ${BASE_URL}/api/v1/dinosaurs?diet=carnivore`;
      const result = HttpRex.parse(request);
      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(200);
      const body = executed.response?.body as any;
      expect(body.data.every((d: Dinosaur) => d.diet === 'carnivore')).toBe(true);
    });

    it('should include custom headers in request', async () => {
      const request = `GET ${BASE_URL}/api/v1/echo/headers
Authorization: Bearer test-token-123
X-Custom-Header: custom-value`;

      const result = HttpRex.parse(request);
      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(200);
      const body = executed.response?.body as any;
      expect(body.headers['authorization']).toBe('Bearer test-token-123');
      expect(body.headers['x-custom-header']).toBe('custom-value');
    });
  });

  describe('POST Requests', () => {
    it('should execute POST request with JSON body', async () => {
      const request = `POST ${BASE_URL}/api/v1/dinosaurs
Content-Type: application/json

{
  "name": "HttpRexosaurus",
  "diet": "carnivore",
  "period": "Digital Age",
  "description": "A mighty API testing dinosaur"
}`;

      const result = HttpRex.parse(request);

      expect(result.success).toBe(true);
      expect(result.data?.method).toBe('POST');
      expect(result.data?.body).toHaveProperty('name', 'HttpRexosaurus');

      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(201);
      const body = executed.response?.body as any;
      expect(body.data.name).toBe('HttpRexosaurus');
      expect(body.data.id).toBeDefined();
    });

    it('should handle POST validation errors', async () => {
      const request = `POST ${BASE_URL}/api/v1/dinosaurs
Content-Type: application/json

{
  "diet": "herbivore"
}`;

      const result = HttpRex.parse(request);
      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(400);
      expect((executed.response?.body as any).error).toContain('name');
    });

    it('should echo back POST body and headers', async () => {
      const request = `POST ${BASE_URL}/api/v1/echo
Content-Type: application/json
X-Request-ID: test-123

{
  "message": "Hello from HttpRex!"
}`;

      const result = HttpRex.parse(request);
      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(200);
      const body = executed.response?.body as any;
      expect(body.body.message).toBe('Hello from HttpRex!');
      expect(body.headers['x-request-id']).toBe('test-123');
    });
  });

  describe('PUT Requests', () => {
    it('should execute PUT request to update a dinosaur', async () => {
      const request = `PUT ${BASE_URL}/api/v1/dinosaurs/1
Content-Type: application/json

{
  "description": "Updated: The king of dinosaurs, now with better API support!"
}`;

      const result = HttpRex.parse(request);
      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(200);
      const body = executed.response?.body as any;
      expect(body.data.description).toContain('Updated');
      expect(body.data.name).toBe('Tyrannosaurus Rex'); // Original name preserved
    });
  });

  describe('DELETE Requests', () => {
    it('should execute DELETE request', async () => {
      const request = `DELETE ${BASE_URL}/api/v1/dinosaurs/1`;

      const result = HttpRex.parse(request);
      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(200);
      const body = executed.response?.body as any;
      expect(body.data.name).toBe('Tyrannosaurus Rex');

      // Verify deletion
      const verifyResult = HttpRex.parse(`GET ${BASE_URL}/api/v1/dinosaurs/1`);
      const verifyExecuted = await HttpRex.execute(verifyResult.data!);
      expect(verifyExecuted.response?.status).toBe(404);
    });
  });

  describe('Variable Resolution', () => {
    it('should resolve file variables in request', async () => {
      const request = `@baseUrl = ${BASE_URL}
@dinoId = 2

###
GET {{baseUrl}}/api/v1/dinosaurs/{{dinoId}}`;

      const fileResult = HttpRex.parseFile(request);

      expect(fileResult.success).toBe(true);
      expect(fileResult.data?.fileVariables).toHaveProperty('baseUrl');
      expect(fileResult.data?.fileVariables).toHaveProperty('dinoId');

      // Set variables and execute
      HttpRex.setVariables({ fromFile: fileResult.data!.fileVariables });
      const resolvedRequest = HttpRex.getResolver().resolveRequest(fileResult.data!.requests[0]);

      expect(resolvedRequest.url).toBe(`${BASE_URL}/api/v1/dinosaurs/2`);

      const executed = await HttpRex.execute(resolvedRequest);
      expect(executed.response?.status).toBe(200);
      expect((executed.response?.body as any).data.name).toBe('Velociraptor');
    });

    it('should resolve system variables', async () => {
      const request = `GET ${BASE_URL}/api/v1/echo/headers
X-Request-ID: {{$guid}}
X-Timestamp: {{$timestamp}}`;

      const result = HttpRex.parse(request);

      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();

      const resolver = HttpRex.getResolver();
      const resolvedRequest = resolver.resolveRequest(result.data!);

      // GUID should be resolved (36 char UUID format)
      expect(resolvedRequest.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);

      // Timestamp should be a number
      expect(resolvedRequest.headers['x-timestamp']).toMatch(/^\d+$/);

      // Execute and verify headers were sent
      const executed = await HttpRex.execute(resolvedRequest);
      expect(executed.response?.status).toBe(200);
    });
  });

  describe('Multi-Request Files', () => {
    it('should parse and execute multiple requests from a file', async () => {
      const fileContent = `@baseUrl = ${BASE_URL}

###
# @name listDinosaurs
GET {{baseUrl}}/api/v1/dinosaurs

###
# @name getDiets
GET {{baseUrl}}/api/v1/diets

###
# @name getClades
GET {{baseUrl}}/api/v1/clades`;

      const fileResult = HttpRex.parseFile(fileContent);

      expect(fileResult.success).toBe(true);
      expect(fileResult.data?.requests).toHaveLength(3);
      expect(fileResult.data?.requests[0].name).toBe('listDinosaurs');
      expect(fileResult.data?.requests[1].name).toBe('getDiets');
      expect(fileResult.data?.requests[2].name).toBe('getClades');

      // Execute each request
      HttpRex.setVariables({ fromFile: fileResult.data!.fileVariables });

      for (const request of fileResult.data!.requests) {
        const resolvedRequest = HttpRex.getResolver().resolveRequest(request);
        const executed = await HttpRex.execute(resolvedRequest);
        expect(executed.response?.status).toBe(200);
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle various HTTP status codes', async () => {
      const statusCodes = [200, 201, 400, 401, 403, 404, 500];

      for (const code of statusCodes) {
        const request = `GET ${BASE_URL}/api/v1/status/${code}`;
        const result = HttpRex.parse(request);
        const executed = await HttpRex.execute(result.data!);

        expect(executed.response?.status).toBe(code);
      }
    });

    it('should handle non-existent routes', async () => {
      const request = `GET ${BASE_URL}/api/v1/nonexistent`;
      const result = HttpRex.parse(request);
      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(404);
    });
  });

  describe('Response Timing', () => {
    it('should measure response timing', async () => {
      const request = `GET ${BASE_URL}/api/v1/delay/100`;
      const result = HttpRex.parse(request);
      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.status).toBe(200);
      expect(executed.response?.timing.duration).toBeGreaterThanOrEqual(90); // Allow some variance
    });
  });

  describe('Content Types', () => {
    it('should handle JSON responses', async () => {
      const request = `GET ${BASE_URL}/api/v1/dinosaurs/1
Accept: application/json`;

      const result = HttpRex.parse(request);
      const executed = await HttpRex.execute(result.data!);

      expect(executed.response?.headers['content-type']).toContain('application/json');
      expect(typeof executed.response?.body).toBe('object');
    });
  });
});
