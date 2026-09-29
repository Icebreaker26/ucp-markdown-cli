// Parser de Markdown deliberadamente mínimo: solo lo que un informe de este tipo necesita.
// Encabezados (# a #####), párrafos con **negrita**/*cursiva*, listas con "- ", imágenes
// (figuras) y tablas (con caption opcional en un comentario <!-- tabla: Título --> justo antes).

export function parsearDocumento(texto) {
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  const bloques = [];
  let i = 0;

  while (i < lineas.length) {
    const linea = lineas[i];

    if (!linea.trim()) { i++; continue; }

    const encabezado = linea.match(/^(#{1,5})\s+(.*)$/);
    if (encabezado) {
      bloques.push({ tipo: 'encabezado', nivel: encabezado[1].length, texto: encabezado[2].trim() });
      i++; continue;
    }

    const imagen = linea.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imagen) {
      bloques.push({ tipo: 'figura', caption: imagen[1].trim(), ruta: imagen[2].trim() });
      i++; continue;
    }

    // comentario genérico (no de tabla): se ignora por completo, nunca es texto visible
    if (/^<!--.*-->\s*$/.test(linea.trim()) && !/^<!--\s*tabla:/i.test(linea.trim())) {
      i++; continue;
    }

    const comentarioTabla = linea.match(/^<!--\s*tabla:\s*(.*?)\s*-->\s*$/i);
    if (comentarioTabla && lineas[i + 1] && lineas[i + 1].trim().startsWith('|')) {
      const caption = comentarioTabla[1].trim();
      i++;
      const filas = [];
      while (i < lineas.length && lineas[i].trim().startsWith('|')) {
        if (!/^\|[\s:|-]+\|$/.test(lineas[i].trim())) {
          filas.push(lineas[i].trim().slice(1, -1).split('|').map((c) => c.trim()));
        }
        i++;
      }
      bloques.push({ tipo: 'tabla', caption, filas });
      continue;
    }

    if (linea.trim().startsWith('|')) {
      const filas = [];
      while (i < lineas.length && lineas[i].trim().startsWith('|')) {
        if (!/^\|[\s:|-]+\|$/.test(lineas[i].trim())) {
          filas.push(lineas[i].trim().slice(1, -1).split('|').map((c) => c.trim()));
        }
        i++;
      }
      bloques.push({ tipo: 'tabla', caption: '', filas });
      continue;
    }

    if (/^[-*]\s+/.test(linea)) {
      const items = [];
      while (i < lineas.length && /^[-*]\s+/.test(lineas[i])) {
        items.push(lineas[i].replace(/^[-*]\s+/, '').trim());
        i++;
      }
      bloques.push({ tipo: 'lista', items });
      continue;
    }

    // párrafo: junta líneas seguidas hasta encontrar una línea en blanco u otro tipo de bloque
    const parrafo = [linea];
    i++;
    while (i < lineas.length && lineas[i].trim() && !/^(#{1,5}\s|!\[|<!--\s*tabla:|[-*]\s+|\|)/.test(lineas[i])) {
      parrafo.push(lineas[i]);
      i++;
    }
    bloques.push({ tipo: 'parrafo', texto: parrafo.join(' ').trim() });
  }

  return bloques;
}

/** Tokeniza texto en línea en runs {texto, negrita, cursiva} para negrita/cursiva simples. */
export function tokenizarInline(texto) {
  const tokens = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|([^*]+)/g;
  let m;
  while ((m = re.exec(texto))) {
    if (m[1] !== undefined) tokens.push({ texto: m[1], negrita: true });
    else if (m[2] !== undefined) tokens.push({ texto: m[2], cursiva: true });
    else if (m[3] !== undefined) tokens.push({ texto: m[3] });
  }
  return tokens;
}
