import { leerFuentes, guardarFuentes } from './store.js';

const TIPOS = ['libro', 'libro-en-linea', 'capitulo', 'articulo', 'tesis', 'manual', 'patente', 'video', 'software', 'podcast', 'sitio-web', 'dataset'];

function claveSugerida(autor, anio) {
  const base = String(autor || 'ref').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 15);
  return `${base}${anio || ''}`;
}

export async function agregarFuente({ clave, tipo, autor, anio, titulo, url, verificar = true }) {
  if (tipo && !TIPOS.includes(tipo)) {
    throw new Error(`Tipo inválido "${tipo}". Usa uno de: ${TIPOS.join(', ')}`);
  }
  const fuentes = await leerFuentes();
  const key = clave || claveSugerida(autor, anio);
  if (fuentes[key]) throw new Error(`Ya existe una fuente con la clave "${key}". Usa --clave para darle otra.`);

  let verificada = null;
  if (url && verificar) {
    verificada = await verificarUrl(url);
  }

  fuentes[key] = {
    tipo: tipo || 'sitio-web',
    autor: autor || '',
    anio: anio || '',
    titulo: titulo || '',
    url: url || '',
    verificada,
    verificadaEn: url && verificar ? new Date().toISOString() : null,
    agregadaEn: new Date().toISOString(),
  };
  await guardarFuentes(fuentes);
  return { key, ...fuentes[key] };
}

export async function verificarUrl(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(10000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function reverificarTodas() {
  const fuentes = await leerFuentes();
  const resultados = [];
  for (const [key, f] of Object.entries(fuentes)) {
    if (!f.url) { resultados.push({ key, url: null, ok: null }); continue; }
    const ok = await verificarUrl(f.url);
    f.verificada = ok;
    f.verificadaEn = new Date().toISOString();
    resultados.push({ key, url: f.url, ok });
  }
  await guardarFuentes(fuentes);
  return resultados;
}

export async function listarFuentes() {
  return leerFuentes();
}

// Formato IEEE de la entrada de referencia (aproximado; VII.Ejemplo de referencias de la Guía FCBI).
export function formatearReferenciaIEEE(n, f) {
  const autor = f.autor || 'Autor desconocido';
  switch (f.tipo) {
    case 'libro':
      return `[${n}] ${autor}, ${f.titulo}. ${f.anio}.`;
    case 'libro-en-linea':
    case 'sitio-web':
      return `[${n}] ${autor}, "${f.titulo}". ${f.url ? `[En línea]. Disponible: ${f.url}.` : ''}`;
    case 'articulo':
      return `[${n}] ${autor}, "${f.titulo}". ${f.anio}.`;
    case 'tesis':
      return `[${n}] ${autor}, "${f.titulo}", Tesis, ${f.anio}.`;
    case 'video':
      return `[${n}] ${autor}, "${f.titulo}". ${f.url ? `[En línea]. Disponible: ${f.url}.` : ''}`;
    case 'software':
      return `[${n}] ${autor}, "${f.titulo}". ${f.anio}. ${f.url ? `Disponible en: ${f.url}.` : ''}`;
    case 'dataset':
      return `[${n}] ${autor}, "${f.titulo}". ${f.anio}.`;
    default:
      return `[${n}] ${autor}, "${f.titulo}". ${f.anio}. ${f.url || ''}`;
  }
}
