import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { homeAPI } from './server.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'dist');
const dataDir = path.join(root, '.local-data');
const dataFile = path.join(dataDir, 'home-saves.json');
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

async function readRecords() {
  try {
    return JSON.parse(await fs.readFile(dataFile, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function writeRecords(records) {
  await fs.mkdir(dataDir, { recursive: true });
  const temporary = dataFile + '.tmp';
  await fs.writeFile(temporary, JSON.stringify(records, null, 2));
  await fs.rename(temporary, dataFile);
}

const localBucket = {
  async get(key) {
    const records = await readRecords();
    const value = records[key];
    if (!value) return null;
    return {
      body: value.text,
      httpEtag: value.etag,
      text: async () => value.text
    };
  },
  async put(key, text, options) {
    const records = await readRecords();
    const current = records[key];
    const condition = options.onlyIf;
    const ifMatch = condition.get('If-Match');
    const ifNoneMatch = condition.get('If-None-Match');
    if ((ifMatch && current?.etag !== ifMatch) || (ifNoneMatch === '*' && current)) return null;
    const etag = '"' + crypto.createHash('sha256').update(text).digest('hex').slice(0, 16) + '"';
    records[key] = { text, etag };
    await writeRecords(records);
    return { httpEtag: etag };
  }
};

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function serveAPI(request, response, origin) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value !== undefined && !['connection', 'content-length', 'host'].includes(key)) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  headers.set('oai-authenticated-user-id', 'local-player');
  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await readBody(request);
  const webRequest = new Request(origin + '/api/home', { method: request.method, headers, body });
  const result = await homeAPI(webRequest, { BUCKET: localBucket });
  response.writeHead(result.status, Object.fromEntries(result.headers));
  response.end(Buffer.from(await result.arrayBuffer()));
}

async function serveStatic(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }
  const url = new URL(request.url, 'http://localhost');
  const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
  const absolute = path.resolve(publicDir, relative);
  if (absolute !== publicDir && !absolute.startsWith(publicDir + path.sep)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }
  try {
    const data = await fs.readFile(absolute);
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(absolute)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500);
    response.end(error.code === 'ENOENT' ? 'Not found' : 'Local server error');
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const origin = `http://${request.headers.host || `localhost:${port}`}`;
    if (new URL(request.url, origin).pathname === '/api/home') await serveAPI(request, response, origin);
    else await serveStatic(request, response);
  } catch (error) {
    console.error(error);
    response.writeHead(500);
    response.end('Local server error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Noct local development server: http://localhost:${port}`);
  console.log('Local home save: .local-data/home-saves.json');
});
