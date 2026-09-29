import { SECCIONES } from './reglas.js';
import { leerCapitulo } from './store.js';
import { parsearDocumento } from './markdown.js';

/** Recorre los capítulos en orden y numera figuras y tablas por separado, en orden de aparición. */
export async function numerarFigurasYTablas() {
  let nFigura = 0;
  let nTabla = 0;
  const figuras = [];
  const tablas = [];

  for (const s of SECCIONES) {
    if (s.generado) continue;
    const texto = await leerCapitulo(s.archivo);
    for (const bloque of parsearDocumento(texto)) {
      if (bloque.tipo === 'figura') {
        nFigura++;
        figuras.push({ numero: nFigura, caption: bloque.caption, ruta: bloque.ruta, archivo: s.archivo });
      } else if (bloque.tipo === 'tabla' && bloque.caption) {
        nTabla++;
        tablas.push({ numero: nTabla, caption: bloque.caption, archivo: s.archivo });
      }
    }
  }
  return { figuras, tablas };
}
