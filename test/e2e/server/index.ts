/**
 * Mock Dinosaur API Server for E2E Testing
 *
 * Mimics RESTasaurus API structure with additional test endpoints.
 * Run with: npx tsx test/e2e/server/index.ts
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { dinosaurs, diets, clades, periods, Dinosaur } from './data';

const PORT = process.env.PORT || 3456;

// In-memory store for testing mutations
let dinosaurStore = [...dinosaurs];
let nextId = dinosaurs.length + 1;

// Helper to parse JSON body
async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
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

// Helper to send JSON response
function sendJson(res: ServerResponse, data: any, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Custom-Header, X-Request-ID'
  });
  res.end(JSON.stringify(data, null, 2));
}

// Helper to send error response
function sendError(res: ServerResponse, message: string, status = 400) {
  sendJson(res, { error: message, status }, status);
}

// Route handler type
type RouteHandler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>) => Promise<void> | void;

// Routes
const routes: Record<string, Record<string, RouteHandler>> = {
  // ========== Dinosaur CRUD Endpoints ==========
  'GET /api/v1/dinosaurs': (req, res) => {
    const url = new URL(req.url!, `http://localhost:${PORT}`);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const diet = url.searchParams.get('diet');
    const period = url.searchParams.get('period');

    let result = [...dinosaurStore];

    if (diet) {
      result = result.filter(d => d.diet === diet);
    }
    if (period) {
      result = result.filter(d => d.period.toLowerCase().includes(period.toLowerCase()));
    }

    const total = result.length;
    result = result.slice(offset, offset + limit);

    sendJson(res, {
      data: result,
      meta: {
        total,
        limit,
        offset,
        count: result.length
      }
    });
  },

  'GET /api/v1/dinosaurs/:id': (req, res, params) => {
    const id = parseInt(params.id);
    const dino = dinosaurStore.find(d => d.id === id);

    if (!dino) {
      return sendError(res, `Dinosaur with id ${id} not found`, 404);
    }

    sendJson(res, { data: dino });
  },

  'GET /api/v1/dinosaurs/name/:name': (req, res, params) => {
    const name = decodeURIComponent(params.name).toLowerCase();
    const dino = dinosaurStore.find(d => d.name.toLowerCase() === name);

    if (!dino) {
      return sendError(res, `Dinosaur "${params.name}" not found`, 404);
    }

    sendJson(res, { data: dino });
  },

  'GET /api/v1/dinosaurs/diet/:diet': (req, res, params) => {
    const diet = params.diet.toLowerCase();
    const result = dinosaurStore.filter(d => d.diet === diet);

    sendJson(res, {
      data: result,
      meta: { count: result.length, diet }
    });
  },

  'GET /api/v1/dinosaurs/random': (req, res) => {
    const url = new URL(req.url!, `http://localhost:${PORT}`);
    const count = Math.min(parseInt(url.searchParams.get('count') || '1'), 10);

    const shuffled = [...dinosaurStore].sort(() => Math.random() - 0.5);
    const result = shuffled.slice(0, count);

    sendJson(res, { data: result });
  },

  'POST /api/v1/dinosaurs': async (req, res) => {
    try {
      const body = await parseBody(req);

      if (!body || !body.name) {
        return sendError(res, 'Missing required field: name', 400);
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
      sendJson(res, { data: newDino, message: 'Dinosaur created successfully' }, 201);
    } catch (e) {
      sendError(res, 'Invalid request body', 400);
    }
  },

  'PUT /api/v1/dinosaurs/:id': async (req, res, params) => {
    try {
      const id = parseInt(params.id);
      const index = dinosaurStore.findIndex(d => d.id === id);

      if (index === -1) {
        return sendError(res, `Dinosaur with id ${id} not found`, 404);
      }

      const body = await parseBody(req);
      if (!body) {
        return sendError(res, 'Request body required', 400);
      }

      dinosaurStore[index] = { ...dinosaurStore[index], ...body, id };
      sendJson(res, { data: dinosaurStore[index], message: 'Dinosaur updated successfully' });
    } catch (e) {
      sendError(res, 'Invalid request body', 400);
    }
  },

  'PATCH /api/v1/dinosaurs/:id': async (req, res, params) => {
    try {
      const id = parseInt(params.id);
      const index = dinosaurStore.findIndex(d => d.id === id);

      if (index === -1) {
        return sendError(res, `Dinosaur with id ${id} not found`, 404);
      }

      const body = await parseBody(req);
      if (!body) {
        return sendError(res, 'Request body required', 400);
      }

      dinosaurStore[index] = { ...dinosaurStore[index], ...body };
      sendJson(res, { data: dinosaurStore[index], message: 'Dinosaur patched successfully' });
    } catch (e) {
      sendError(res, 'Invalid request body', 400);
    }
  },

  'DELETE /api/v1/dinosaurs/:id': (req, res, params) => {
    const id = parseInt(params.id);
    const index = dinosaurStore.findIndex(d => d.id === id);

    if (index === -1) {
      return sendError(res, `Dinosaur with id ${id} not found`, 404);
    }

    const deleted = dinosaurStore.splice(index, 1)[0];
    sendJson(res, { data: deleted, message: 'Dinosaur deleted successfully' });
  },

  // ========== Metadata Endpoints ==========
  'GET /api/v1/diets': (req, res) => {
    sendJson(res, { data: diets });
  },

  'GET /api/v1/clades': (req, res) => {
    sendJson(res, { data: clades });
  },

  'GET /api/v1/periods': (req, res) => {
    sendJson(res, { data: periods });
  },

  'GET /api/v1/names': (req, res) => {
    sendJson(res, { data: dinosaurStore.map(d => d.name) });
  },

  // ========== Test Utility Endpoints ==========
  'GET /api/v1/echo/headers': (req, res) => {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      headers[key] = Array.isArray(value) ? value.join(', ') : value || '';
    }
    sendJson(res, { headers });
  },

  'POST /api/v1/echo': async (req, res) => {
    const body = await parseBody(req);
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      headers[key] = Array.isArray(value) ? value.join(', ') : value || '';
    }
    sendJson(res, {
      method: req.method,
      url: req.url,
      headers,
      body
    });
  },

  'GET /api/v1/delay/:ms': async (req, res, params) => {
    const ms = Math.min(parseInt(params.ms) || 0, 10000); // Max 10 seconds
    await new Promise(resolve => setTimeout(resolve, ms));
    sendJson(res, { delayed: ms, message: `Response delayed by ${ms}ms` });
  },

  'GET /api/v1/status/:code': (req, res, params) => {
    const code = parseInt(params.code) || 200;
    sendJson(res, { status: code, message: `Requested status code: ${code}` }, code);
  },

  'GET /api/v1/error': (req, res) => {
    sendError(res, 'This is a test error response', 500);
  },

  // ========== Server Management ==========
  'POST /api/v1/reset': (req, res) => {
    dinosaurStore = [...dinosaurs];
    nextId = dinosaurs.length + 1;
    sendJson(res, { message: 'Server state reset to initial data' });
  },

  'GET /api/v1/health': (req, res) => {
    sendJson(res, { status: 'ok', timestamp: new Date().toISOString() });
  },

  'GET /': (req, res) => {
    sendJson(res, {
      name: 'DinoAPI Mock Server',
      version: '1.0.0',
      description: 'Mock dinosaur API for HttpRex E2E testing',
      endpoints: Object.keys(routes).sort()
    });
  }
};

// Match route with params
function matchRoute(method: string, url: string): { handler: RouteHandler; params: Record<string, string> } | null {
  const urlPath = url.split('?')[0];

  for (const [route, handler] of Object.entries(routes)) {
    const [routeMethod, routePath] = route.split(' ');
    if (method !== routeMethod) continue;

    const routeParts = routePath.split('/');
    const urlParts = urlPath.split('/');

    if (routeParts.length !== urlParts.length) continue;

    const params: Record<string, string> = {};
    let matches = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = urlParts[i];
      } else if (routeParts[i] !== urlParts[i]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      return { handler, params };
    }
  }

  return null;
}

// Create server
const server = createServer(async (req, res) => {
  const method = req.method || 'GET';
  const url = req.url || '/';

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Custom-Header, X-Request-ID',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  const match = matchRoute(method, url);

  if (match) {
    try {
      await match.handler(req, res, match.params);
    } catch (error) {
      console.error('Handler error:', error);
      sendError(res, 'Internal server error', 500);
    }
  } else {
    sendError(res, `Route not found: ${method} ${url}`, 404);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🦖 DinoAPI Mock Server running at http://localhost:${PORT}`);
  console.log(`   ${Object.keys(routes).length} endpoints available`);
  console.log(`   ${dinosaurs.length} dinosaurs loaded`);
});

// Export for programmatic use
export { server, PORT };
export function resetServer() {
  dinosaurStore = [...dinosaurs];
  nextId = dinosaurs.length + 1;
}
