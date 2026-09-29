import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, ImageRun, PageBreak, PageNumber,
  Footer, NumberFormat,
} from 'docx';
import { SECCIONES } from './reglas.js';
import { leerCapitulo, leerPortada, ROOT } from './store.js';
import { escanearCitas, resolverCitasEnTexto } from './citas.js';
import { numerarFigurasYTablas } from './figuras.js';
import { formatearReferenciaIEEE } from './fuentes.js';
import { parsearDocumento, tokenizarInline } from './markdown.js';

const FUENTE = 'Arial';
const PT = (n) => n * 2; // docx usa "half-points": 12pt = 24
const cmToTwip = (cm) => Math.round((cm * 1440) / 2.54);

function runsDeTexto(texto, { size = PT(12) } = {}) {
  return tokenizarInline(texto).map((t) => new TextRun({
    text: t.texto,
    bold: !!t.negrita,
    italics: !!t.cursiva,
    font: FUENTE,
    size,
  }));
}

function parrafoTexto(texto, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 276, lineRule: 'auto', after: 160 }, // 1.15 interlineado aprox.
    children: runsDeTexto(texto),
    ...opts,
  });
}

function tituloNivel1(texto) {
  return new Paragraph({
    outlineLevel: 0,
    pageBreakBefore: true,
    spacing: { after: 240 },
    children: [new TextRun({ text: texto.toUpperCase(), bold: false, font: FUENTE, size: PT(12) })],
  });
}
function tituloNivel2(texto) {
  return new Paragraph({
    outlineLevel: 1,
    spacing: { before: 240, after: 160 },
    children: [new TextRun({ text: texto.toUpperCase(), font: FUENTE, size: PT(12) })],
  });
}
function tituloNivel3(texto) {
  const cap = texto.charAt(0).toUpperCase() + texto.slice(1);
  return new Paragraph({
    outlineLevel: 2,
    spacing: { before: 160, after: 120 },
    children: [new TextRun({ text: `${cap}.`, italics: true, font: FUENTE, size: PT(12) })],
  });
}

async function bloqueATabla(bloque, numeroTabla) {
  const filas = bloque.filas;
  if (!filas.length) return [];
  const cols = filas[0].length;
  const anchoCol = Math.floor(9026 / cols); // ancho de tabla ~ página carta menos márgenes, en twips
  const tabla = new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: Array(cols).fill(anchoCol),
    rows: filas.map((fila, i) => new TableRow({
      children: fila.map((celda) => new TableCell({
        width: { size: anchoCol, type: WidthType.DXA },
        children: [new Paragraph({ children: runsDeTexto(celda, { size: PT(11) }) })],
      })),
    })),
  });
  const salida = [];
  if (bloque.caption) {
    // Convención ICONTEC: el título de la tabla va ARRIBA (al contrario que las figuras, que van abajo).
    salida.push(new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [new TextRun({ text: `Tabla ${numeroTabla}. ${bloque.caption}`, font: FUENTE, size: PT(12) })],
    }));
  }
  salida.push(tabla, new Paragraph({ spacing: { after: 200 } }));
  return salida;
}

async function bloqueAFigura(bloque, numero) {
  const rutaAbs = path.isAbsolute(bloque.ruta) ? bloque.ruta : path.join(ROOT, bloque.ruta);
  let buf;
  try {
    buf = await fs.readFile(rutaAbs);
  } catch {
    return [new Paragraph({ children: [new TextRun({ text: `[Imagen no encontrada: ${bloque.ruta}]`, italics: true, font: FUENTE, size: PT(11) })] })];
  }
  const ext = path.extname(rutaAbs).slice(1).toLowerCase();
  const tipo = ['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext) ? (ext === 'jpg' ? 'jpg' : ext) : 'png';
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: buf, transformation: { width: 420, height: 280 }, type: tipo })],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 80, after: 200 },
      children: [new TextRun({ text: `Figura ${numero.figura}. ${bloque.caption}`, font: FUENTE, size: PT(12) })],
    }),
  ];
}

function portada(p) {
  const linea = (t, opts = {}) => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: t, font: FUENTE, size: PT(14), bold: true, ...opts })],
  });
  return [
    new Paragraph({ spacing: { before: 1200 } }),
    linea(p.titulo || '[TÍTULO DEL TRABAJO]'),
    new Paragraph({ spacing: { before: 800 } }),
    linea(p.autores || '[Autor]', { bold: false, size: PT(12) }),
    new Paragraph({ spacing: { before: 2400 } }),
    linea(p.institucion || 'Universidad Católica de Pereira', { bold: false, size: PT(12) }),
    linea(p.facultad || 'Facultad de Ciencias Básicas e Ingeniería', { bold: false, size: PT(12) }),
    linea(p.programa || 'Ingeniería de Sistemas y Telecomunicaciones', { bold: false, size: PT(12) }),
    linea(p.ciudad || 'Pereira', { bold: false, size: PT(12) }),
    linea(p.anio || String(new Date().getFullYear()), { bold: false, size: PT(12) }),
  ];
}

function contraportada(p) {
  const linea = (t, opts = {}) => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: t, font: FUENTE, size: PT(12), ...opts })],
  });
  return [
    new Paragraph({ spacing: { before: 1000 } }),
    linea(p.titulo || '[TÍTULO DEL TRABAJO]', { bold: true, size: PT(14) }),
    linea(p.autores || '[Autor]'),
    linea(p.tipoDocumento || 'Informe de práctica académica, para optar al título de Ingeniero de Sistemas y Telecomunicaciones'),
    new Paragraph({ spacing: { before: 600 } }),
    linea('Director'),
    linea(p.director || '[Nombre del director]'),
    linea(p.cargoDirector || '[Cargo]'),
    new Paragraph({ spacing: { before: 600 } }),
    linea(p.institucion || 'Universidad Católica de Pereira'),
    linea(p.facultad || 'Facultad de Ciencias Básicas e Ingeniería'),
    linea(p.programa || 'Ingeniería de Sistemas y Telecomunicaciones'),
    linea(p.ciudad || 'Pereira'),
    linea(p.anio || String(new Date().getFullYear())),
  ];
}

function listaSimple(items) {
  return items.map((it) => new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: it, font: FUENTE, size: PT(12) })],
  }));
}

export async function exportarDocx(destino = 'informe.docx') {
  const p = (await leerPortada()) || {};
  const { numero, fuentes } = await escanearCitas();
  const { figuras, tablas } = await numerarFigurasYTablas();
  const figuraPorRuta = new Map(figuras.map((f) => [f.ruta, f]));

  const contenidoItems = SECCIONES.filter((s) => !s.generado).map((s, i) => `${i + 1}. ${s.titulo}`);
  contenidoItems.push(`${SECCIONES.length}. Referencias`);
  const listaFiguras = figuras.map((f) => `Figura ${f.numero}. ${f.caption}`);
  const listaTablas = tablas.map((t) => `Tabla ${t.numero}. ${t.caption}`);

  const cuerpo = [];
  let idxCapitulo = 0;
  let nTablaActual = 0;
  for (const s of SECCIONES) {
    if (s.generado) continue;
    idxCapitulo++;
    const texto = resolverCitasEnTexto(await leerCapitulo(s.archivo), numero);
    cuerpo.push(tituloNivel1(`${idxCapitulo}. ${s.titulo}`));

    let n2 = 0, n3 = 0;
    for (const bloque of parsearDocumento(texto)) {
      if (bloque.tipo === 'encabezado' && bloque.nivel === 2) {
        n2++; n3 = 0;
        cuerpo.push(tituloNivel2(`${idxCapitulo}.${n2} ${bloque.texto}`));
      } else if (bloque.tipo === 'encabezado' && bloque.nivel >= 3) {
        n3++;
        cuerpo.push(tituloNivel3(`${idxCapitulo}.${n2}.${n3} ${bloque.texto}`));
      } else if (bloque.tipo === 'parrafo') {
        cuerpo.push(parrafoTexto(bloque.texto));
      } else if (bloque.tipo === 'lista') {
        for (const it of bloque.items) {
          cuerpo.push(new Paragraph({ bullet: { level: 0 }, children: runsDeTexto(it) }));
        }
      } else if (bloque.tipo === 'figura') {
        const f = figuraPorRuta.get(bloque.ruta) || { numero: '?' };
        cuerpo.push(...(await bloqueAFigura(bloque, { figura: f.numero })));
      } else if (bloque.tipo === 'tabla') {
        if (bloque.caption) nTablaActual++;
        cuerpo.push(...(await bloqueATabla(bloque, nTablaActual)));
      }
    }
  }

  // Capítulo de Referencias, generado — nunca se edita a mano.
  idxCapitulo++;
  cuerpo.push(tituloNivel1(`${idxCapitulo}. Referencias`));
  const ordenNumerico = Object.entries(numero).sort((a, b) => a[1] - b[1]);
  for (const [clave, n] of ordenNumerico) {
    const f = fuentes[clave];
    cuerpo.push(new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: f ? formatearReferenciaIEEE(n, f) : `[${n}] (fuente "${clave}" no encontrada en fuentes.json)`, font: FUENTE, size: PT(12) })],
    }));
  }

  const margenRegular = { top: cmToTwip(3), bottom: cmToTwip(3), left: cmToTwip(3), right: cmToTwip(2) };
  const margenPortada = { top: cmToTwip(4), bottom: cmToTwip(3), left: cmToTwip(3), right: cmToTwip(2) };
  const paginaCarta = { width: 12240, height: 15840 };

  const footer = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: FUENTE, size: PT(12) })],
    })],
  });

  const doc = new Document({
    sections: [
      {
        properties: { page: { size: paginaCarta, margin: margenPortada } },
        children: [...portada(p), new Paragraph({ children: [new PageBreak()] }), ...contraportada(p)],
      },
      {
        properties: {
          page: { size: paginaCarta, margin: margenRegular, pageNumbers: { start: 3, formatType: NumberFormat.DECIMAL } },
        },
        footers: { default: footer },
        children: [
          tituloNivel1('Tabla de contenido'),
          ...listaSimple(contenidoItems),
          new Paragraph({ children: [new PageBreak()] }),
          tituloNivel1('Lista de figuras'),
          ...(listaFiguras.length ? listaSimple(listaFiguras) : [new Paragraph({ children: [new TextRun({ text: '(sin figuras todavía)', italics: true, font: FUENTE, size: PT(12) })] })]),
          new Paragraph({ children: [new PageBreak()] }),
          tituloNivel1('Lista de tablas'),
          ...(listaTablas.length ? listaSimple(listaTablas) : [new Paragraph({ children: [new TextRun({ text: '(sin tablas todavía)', italics: true, font: FUENTE, size: PT(12) })] })]),
          ...cuerpo,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(destino, buffer);
  return destino;
}
