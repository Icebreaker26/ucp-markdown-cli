import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT } from './store.js';

export const IMG_DIR = path.join(ROOT, 'capitulos', 'img');
const EXTENSIONES = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);

export async function listarImagenes() {
  try {
    const archivos = await fs.readdir(IMG_DIR);
    return archivos
      .filter((f) => EXTENSIONES.has(path.extname(f).toLowerCase()))
      .sort()
      .map((f) => `capitulos/img/${f}`);
  } catch {
    return [];
  }
}

/** Guarda una imagen subida desde el panel (base64, sin el prefijo "data:...;base64,"). */
export async function guardarImagen(nombreOriginal, base64) {
  const ext = path.extname(nombreOriginal).toLowerCase();
  if (!EXTENSIONES.has(ext)) throw new Error(`Formato no soportado: ${ext || '(sin extensión)'}`);

  await fs.mkdir(IMG_DIR, { recursive: true });
  const base = path.basename(nombreOriginal, ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'imagen';
  let nombre = `${base}${ext}`;
  let n = 1;
  while (await existe(path.join(IMG_DIR, nombre))) {
    nombre = `${base}-${n++}${ext}`;
  }
  const buf = Buffer.from(base64, 'base64');
  await fs.writeFile(path.join(IMG_DIR, nombre), buf);
  return `capitulos/img/${nombre}`;
}

async function existe(p) {
  try { await fs.access(p); return true; } catch { return false; }
}
