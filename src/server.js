import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { SECCIONES } from './reglas.js';
import { leerCapitulo, escribirCapitulo, leerPortada, guardarPortada, leerFuentes, ROOT } from './store.js';
import { correrChecklist } from './checklist.js';
import { escanearPendientes } from './pendientes.js';
import { escanearCitas } from './citas.js';
import { agregarFuente, reverificarTodas } from './fuentes.js';
import { agregarEntrada, leerLog } from './ialog.js';
import { exportarDocx } from './exportar.js';

const PUBLIC_DIR = path.join(ROOT, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 2e6) throw new Error('Cuerpo demasiado grande');
  }
  return raw ? JSON.parse(raw) : {};
}

async function payloadCapitulos() {
  const { numero } = await escanearCitas();
  const capitulos = [];
  for (const s of SECCIONES) {
    if (s.generado) { capitulos.push({ ...s, generado: true, contenido: '' }); continue; }
    const contenido = await leerCapitulo(s.archivo);
    capitulos.push({ ...s, contenido });
  }
  return { capitulos, numeroCitas: numero };
}

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'POST' && req.headers['x-requested-with'] !== 'ucp-markdown-cli') {
        return send(res, 403, { error: 'Petición no permitida' });
      }

      if (req.method === 'GET' && url.pathname === '/api/data') {
        const [{ capitulos, numeroCitas }, checklist, pendientes, fuentes, portada, ialog] = await Promise.all([
          payloadCapitulos(), correrChecklist(), escanearPendientes(), leerFuentes(), leerPortada(), leerLog(),
        ]);
        return send(res, 200, { capitulos, numeroCitas, checklist, pendientes, fuentes, portada, ialog });
      }

      if (req.method === 'POST' && url.pathname === '/api/capitulo') {
        const { archivo, contenido } = await readBody(req);
        if (!archivo || typeof contenido !== 'string') return send(res, 400, { error: 'Falta archivo o contenido' });
        await escribirCapitulo(archivo, contenido);
        return send(res, 200, { ok: true });
      }

      if (req.method === 'POST' && url.pathname === '/api/portada') {
        const body = await readBody(req);
        await guardarPortada(body);
        return send(res, 200, { ok: true });
      }

      if (req.method === 'POST' && url.pathname === '/api/fuentes') {
        try {
          const r = await agregarFuente(await readBody(req));
          return send(res, 200, r);
        } catch (e) {
          return send(res, 400, { error: e.message });
        }
      }

      if (req.method === 'POST' && url.pathname === '/api/fuentes/verificar') {
        const r = await reverificarTodas();
        return send(res, 200, { resultados: r });
      }

      if (req.method === 'POST' && url.pathname === '/api/ialog') {
        await agregarEntrada(await readBody(req));
        return send(res, 200, { ok: true });
      }

      if (req.method === 'POST' && url.pathname === '/api/export') {
        try {
          const destino = await exportarDocx('informe.docx');
          return send(res, 200, { ok: true, destino: path.basename(destino) });
        } catch (e) {
          return send(res, 500, { error: e.message });
        }
      }

      if (req.method === 'GET' && url.pathname === '/informe.docx') {
        try {
          const buf = await fs.readFile(path.join(ROOT, 'informe.docx'));
          return send(res, 200, buf, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        } catch {
          return send(res, 404, { error: 'Todavía no exportaste nada' });
        }
      }

      if (req.method === 'GET') {
        const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        const full = path.join(PUBLIC_DIR, file);
        if (!full.startsWith(PUBLIC_DIR)) return send(res, 403, 'Prohibido', 'text/plain');
        try {
          return send(res, 200, await fs.readFile(full), MIME[path.extname(full)] || 'application/octet-stream');
        } catch {
          return send(res, 404, 'No encontrado', 'text/plain');
        }
      }
      send(res, 405, { error: 'Método no permitido' });
    } catch (e) {
      send(res, 500, { error: e.message });
    }
  });
}
