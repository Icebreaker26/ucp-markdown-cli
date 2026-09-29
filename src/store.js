import { promises as fs } from 'node:fs';
import path from 'node:path';

export const ROOT = process.cwd();
export const CAP_DIR = path.join(ROOT, 'capitulos');
export const FUENTES_PATH = path.join(ROOT, 'fuentes.json');
export const PORTADA_PATH = path.join(ROOT, 'portada.json');
export const IALOG_PATH = path.join(ROOT, 'ia-log.md');

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

export async function leerCapitulo(archivo) {
  const p = path.join(CAP_DIR, archivo);
  if (!(await exists(p))) return '';
  return fs.readFile(p, 'utf8');
}

export async function escribirCapitulo(archivo, contenido) {
  await fs.mkdir(CAP_DIR, { recursive: true });
  await fs.writeFile(path.join(CAP_DIR, archivo), contenido, 'utf8');
}

export async function leerFuentes() {
  if (!(await exists(FUENTES_PATH))) return {};
  return JSON.parse(await fs.readFile(FUENTES_PATH, 'utf8'));
}

export async function guardarFuentes(fuentes) {
  await fs.writeFile(FUENTES_PATH, JSON.stringify(fuentes, null, 2) + '\n', 'utf8');
}

export async function leerPortada() {
  if (!(await exists(PORTADA_PATH))) return null;
  return JSON.parse(await fs.readFile(PORTADA_PATH, 'utf8'));
}

export async function guardarPortada(portada) {
  await fs.writeFile(PORTADA_PATH, JSON.stringify(portada, null, 2) + '\n', 'utf8');
}

export async function existeArchivo(p) {
  return exists(p);
}
