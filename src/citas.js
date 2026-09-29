import { SECCIONES } from './reglas.js';
import { leerCapitulo } from './store.js';
import { leerFuentes } from './store.js';

// Sintaxis de cita en los .md: [@clave] (paráfrasis) o [@clave p.12] (cita directa con página).
// Varias en el mismo corchete: [@clave1,@clave2 p.5]
const CITA_RE = /\[(@[^\]]+)\]/g;

function parsearGrupo(grupo) {
  return grupo.split(',').map((pieza) => {
    const m = pieza.trim().match(/^@([a-zA-Z0-9_-]+)(?:\s+p\.\s*(\d+))?$/);
    if (!m) return null;
    return { clave: m[1], pagina: m[2] || null };
  }).filter(Boolean);
}

/**
 * Recorre los capítulos EN EL ORDEN OFICIAL (Tabla 4) y devuelve:
 *  - orden: array de claves en orden de primera aparición (esto define el número IEEE)
 *  - usos: [{ archivo, clave, pagina }] cada aparición, en orden
 *  - huerfanas: claves citadas que no existen en fuentes.json
 *  - sinUsar: claves en fuentes.json que nunca se citan
 */
export async function escanearCitas() {
  const fuentes = await leerFuentes();
  const orden = [];
  const usos = [];
  const vistos = new Set();

  for (const s of SECCIONES) {
    if (s.generado) continue; // 14-referencias.md se genera, no se escanea
    const texto = await leerCapitulo(s.archivo);
    let m;
    CITA_RE.lastIndex = 0;
    while ((m = CITA_RE.exec(texto))) {
      for (const { clave, pagina } of parsearGrupo(m[1])) {
        usos.push({ archivo: s.archivo, clave, pagina });
        if (!vistos.has(clave)) { vistos.add(clave); orden.push(clave); }
      }
    }
  }

  const huerfanas = orden.filter((c) => !fuentes[c]);
  const sinUsar = Object.keys(fuentes).filter((c) => !vistos.has(c));
  const numero = Object.fromEntries(orden.map((c, i) => [c, i + 1]));

  return { orden, usos, huerfanas, sinUsar, numero, fuentes };
}

/** Reemplaza [@clave p.N] por [n, p. N] y [@clave] por [n] en un texto ya con los números resueltos. */
export function resolverCitasEnTexto(texto, numero) {
  return texto.replace(CITA_RE, (_, grupo) => {
    const piezas = parsearGrupo(grupo);
    const partes = piezas.map(({ clave, pagina }) => {
      const n = numero[clave];
      if (!n) return `[¿${clave}?]`; // huérfana: se marca visible en vez de fallar en silencio
      return pagina ? `[${n}, p. ${pagina}]` : `[${n}]`;
    });
    return partes.join(',');
  });
}
