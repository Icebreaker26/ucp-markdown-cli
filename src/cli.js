#!/usr/bin/env node
// Uso: node src/cli.js <init|status|fuentes|pendientes|ialog|export>
import { SECCIONES, FORMATO } from './reglas.js';
import { CAP_DIR, escribirCapitulo, leerCapitulo, guardarPortada, leerPortada, existeArchivo, PORTADA_PATH, FUENTES_PATH } from './store.js';
import { correrChecklist } from './checklist.js';
import { escanearPendientes } from './pendientes.js';
import { escanearCitas } from './citas.js';
import { agregarFuente, listarFuentes, reverificarTodas } from './fuentes.js';
import { agregarEntrada, leerLog } from './ialog.js';
import { exportarDocx } from './exportar.js';
import { promises as fs } from 'node:fs';

const C = { dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', bold: '\x1b[1m', off: '\x1b[0m' };
const ok = (b) => (b ? `${C.green}✓${C.off}` : `${C.red}✗${C.off}`);

async function init() {
  for (const s of SECCIONES) {
    if (s.generado) continue;
    if (await existeArchivo(`${CAP_DIR}/${s.archivo}`)) continue;
    const cabecera = `<!-- ${s.titulo}${s.nota ? ' — ' + s.nota : ''} -->\n\n`;
    await escribirCapitulo(s.archivo, cabecera);
    console.log(`${C.green}creado${C.off} capitulos/${s.archivo}`);
  }
  if (!(await existeArchivo(PORTADA_PATH))) {
    await guardarPortada({
      titulo: '', autores: '', institucion: 'Universidad Católica de Pereira',
      facultad: 'Facultad de Ciencias Básicas e Ingeniería', programa: 'Ingeniería de Sistemas y Telecomunicaciones',
      ciudad: 'Pereira', anio: String(new Date().getFullYear()),
      tipoDocumento: 'Informe de práctica académica, para optar al título de Ingeniero de Sistemas y Telecomunicaciones',
      director: '', cargoDirector: '',
    });
    console.log(`${C.green}creado${C.off} portada.json — complétalo con tus datos reales`);
  }
  if (!(await existeArchivo(FUENTES_PATH))) {
    await fs.writeFile(FUENTES_PATH, '{}\n', 'utf8');
    console.log(`${C.green}creado${C.off} fuentes.json`);
  }
  console.log(`\n${C.bold}Formato aplicado:${C.off} ${FORMATO.fuente} ${FORMATO.tamanoPt}pt, papel ${FORMATO.papel}, interlineado ${FORMATO.interlineado}, citación ${FORMATO.citacion}.`);
  console.log(`Edita los archivos en ${C.bold}capitulos/${C.off} con tu editor de siempre. Corre "npm run status" cuando quieras ver el checklist.`);
}

async function status() {
  const { items, total, pasan } = await correrChecklist();
  console.log(`${C.bold}Checklist: ${pasan}/${total}${C.off}\n`);
  let grupoActual = null;
  for (const it of items) {
    if (it.grupo !== grupoActual) { grupoActual = it.grupo; console.log(`${C.dim}${grupoActual}${C.off}`); }
    console.log(`  ${ok(it.ok)} ${it.detalle}`);
  }
  const pendientes = await escanearPendientes();
  console.log(`\n${C.bold}Pendientes: ${pendientes.length}${C.off}`);
  for (const p of pendientes.slice(0, 10)) console.log(`  ${C.yellow}${p.archivo}:${p.linea}${C.off}  ${p.nota}`);
  if (pendientes.length > 10) console.log(`  ${C.dim}... y ${pendientes.length - 10} más${C.off}`);
}

async function pendientesCmd() {
  const pendientes = await escanearPendientes();
  if (!pendientes.length) return console.log('Sin pendientes. 🎉');
  for (const p of pendientes) console.log(`${C.yellow}${p.archivo}:${p.linea}${C.off}  ${p.nota}`);
}

async function fuentesCmd() {
  const args = process.argv.slice(3);
  const sub = args[0];
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

  if (sub === 'add') {
    const r = await agregarFuente({
      clave: opt('--clave'), tipo: opt('--tipo'), autor: opt('--autor'),
      anio: opt('--anio'), titulo: opt('--titulo'), url: opt('--url'),
    });
    console.log(`${C.green}agregada${C.off} [${r.key}] ${r.titulo}`);
    if (r.url) console.log(r.verificada ? `${ok(true)} URL responde` : `${ok(false)} URL no responde — revísala`);
    console.log(`Cítala en el texto como: ${C.bold}[@${r.key}]${C.off} o ${C.bold}[@${r.key} p.12]${C.off} para cita directa con página.`);
    return;
  }
  if (sub === 'verificar') {
    const r = await reverificarTodas();
    for (const x of r) console.log(`${x.url ? ok(x.ok) : C.dim + '—' + C.off} ${x.key}${x.url ? ' ' + x.url : ' (sin URL)'}`);
    return;
  }
  // list (default)
  const fuentes = await listarFuentes();
  const { numero } = await escanearCitas();
  for (const [key, f] of Object.entries(fuentes)) {
    const n = numero[key] ? `[${numero[key]}]` : `${C.dim}(sin citar)${C.off}`;
    console.log(`${n.padEnd(14)} ${key.padEnd(18)} ${f.titulo}`);
  }
}

async function ialogCmd() {
  const args = process.argv.slice(3);
  if (args[0] === 'resumen') { console.log(await leerLog()); return; }
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : ''; };
  await agregarEntrada({ pregunta: opt('--pregunta') || args.join(' '), uso: opt('--uso') || '', verificado: opt('--verificado') || 'pendiente' });
  console.log(`${C.green}agregado${C.off} a ia-log.md`);
}

async function exportCmd() {
  const destino = process.argv[3] || 'informe.docx';
  const { items } = await correrChecklist();
  const fallas = items.filter((i) => !i.ok);
  if (fallas.length) {
    console.log(`${C.yellow}Aviso:${C.off} el checklist tiene ${fallas.length} punto(s) sin resolver. Exportando de todas formas (vista previa).\n`);
  }
  const out = await exportarDocx(destino);
  console.log(`${C.green}Listo:${C.off} ${out}`);
}

const commands = { init, status, fuentes: fuentesCmd, pendientes: pendientesCmd, ialog: ialogCmd, export: exportCmd };
const cmd = process.argv[2];
if (!commands[cmd]) {
  console.log('Uso: npm run <init | status | fuentes | pendientes | ialog | export>');
  process.exit(cmd ? 1 : 0);
}
try {
  await commands[cmd]();
} catch (e) {
  console.error(`${C.red}Error:${C.off} ${e.message}`);
  process.exit(1);
}
