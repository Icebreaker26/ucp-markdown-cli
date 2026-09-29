import { SECCIONES } from './reglas.js';
import { leerCapitulo } from './store.js';

const PENDIENTE_RE = /\[PENDIENTE:([^\]]*)\]/gi;

/** Lista cada [PENDIENTE: ...] en los capítulos, con archivo y línea, para llevarlo a Claude aparte. */
export async function escanearPendientes() {
  const hallazgos = [];
  for (const s of SECCIONES) {
    if (s.generado) continue;
    const texto = await leerCapitulo(s.archivo);
    const lineas = texto.split('\n');
    lineas.forEach((linea, i) => {
      let m;
      PENDIENTE_RE.lastIndex = 0;
      while ((m = PENDIENTE_RE.exec(linea))) {
        hallazgos.push({ archivo: s.archivo, linea: i + 1, nota: m[1].trim() });
      }
    });
  }
  return hallazgos;
}
