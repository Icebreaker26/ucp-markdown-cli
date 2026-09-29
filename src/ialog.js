import { promises as fs } from 'node:fs';
import { IALOG_PATH, existeArchivo } from './store.js';

const CABECERA = `# Bitácora de uso de IA

Registro de cada vez que se consultó un asistente de IA durante la escritura de este informe: qué se le pidió, qué se usó y qué se verificó. Esta bitácora es la base de la sección "Declaración de uso de IA" — nunca se resume sola, la lee y la resume el autor.

Regla: la IA nunca redacta texto que termine tal cual en el informe. Solo sugiere, verifica o critica; el autor escribe.

`;

export async function agregarEntrada({ pregunta, uso, verificado }) {
  if (!(await existeArchivo(IALOG_PATH))) {
    await fs.writeFile(IALOG_PATH, CABECERA, 'utf8');
  }
  const fecha = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const entrada = `## ${fecha}\n\n- **Se preguntó:** ${pregunta}\n- **Qué se usó:** ${uso}\n- **Verificado:** ${verificado}\n\n`;
  await fs.appendFile(IALOG_PATH, entrada, 'utf8');
}

export async function leerLog() {
  if (!(await existeArchivo(IALOG_PATH))) return CABECERA;
  return fs.readFile(IALOG_PATH, 'utf8');
}

export async function contarEntradas() {
  const texto = await leerLog();
  return (texto.match(/^## /gm) || []).length;
}
