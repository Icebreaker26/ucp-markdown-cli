// Reglas reales sacadas de dos documentos oficiales:
//  - Lineamientos Específicos de la Opción de Grado IST-2026 (Tabla 4: Práctica Académica)
//  - Guía para la elaboración de trabajos académicos, FCBI (formato + citación IEEE)
// No se inventa nada acá: si una regla cambia, se edita este archivo y ya.

export const SECCIONES = [
  { archivo: '01-preliminares.md', titulo: 'Preliminares', nota: 'Portada, contraportada, declaración de derechos de autor, tabla de contenido, lista de figuras, lista de tablas, lista de ecuaciones, lista de anexos (se generan solas al exportar; escribe acá solo la declaración de derechos de autor).' },
  { archivo: '02-resumen.md', titulo: 'Resumen y palabras clave', nota: 'En español e inglés (Abstract). 5 palabras clave en cada idioma. 250-500 palabras.', minPalabras: 250, maxPalabras: 500 },
  { archivo: '03-introduccion.md', titulo: 'Introducción' },
  { archivo: '04-escenario.md', titulo: 'Descripción de escenario de práctica' },
  { archivo: '05-areas-intervencion.md', titulo: 'Descripción de las áreas de intervención' },
  { archivo: '06-justificacion.md', titulo: 'Justificación' },
  { archivo: '07-objetivos.md', titulo: 'Objetivos: general y específicos' },
  { archivo: '08-marco-teorico.md', titulo: 'Marco Teórico' },
  { archivo: '09-actividades.md', titulo: 'Actividades realizadas en la práctica', nota: 'Incluye planificación (cronograma) y descripción de las actividades realizadas.' },
  { archivo: '10-desarrollo.md', titulo: 'Desarrollo de la práctica', nota: 'Contextualización + desarrollo de las actividades según los objetivos propuestos + metodología de desarrollo (software) o tecnologías/protocolos (telecomunicaciones).' },
  { archivo: '11-resultados.md', titulo: 'Resultados y análisis' },
  { archivo: '12-conclusiones.md', titulo: 'Conclusiones y recomendaciones' },
  { archivo: '13-declaracion-ia.md', titulo: 'Declaración de uso de IA', nota: 'Obligatoria. Se arma con ia-log.md — no la escribas de cero, corre "npm run ialog -- resumen" antes de redactarla.' },
  { archivo: '14-referencias.md', titulo: 'Referencias', nota: 'Se genera automáticamente a partir de fuentes.json y del orden real de citación al exportar. No edites este archivo a mano.', generado: true },
];

export const FORMATO = {
  fuente: 'Arial',
  tamanoPt: 12,
  papel: 'carta', // 8.5in x 11in
  margenes: { superiorPortada: 4, superiorRegular: 3, inferior: 3, izquierdo: 3, derecho: 2 }, // cm
  interlineado: 1.15,
  alineacion: 'justificado',
  citacion: 'IEEE',
};

export const NIVELES_TITULO = [
  { nivel: 1, formato: 'Arial 12, mayúscula, alineado a la izquierda, inicia en hoja aparte' },
  { nivel: 2, formato: 'Arial 12, mayúscula, alineado a la izquierda' },
  { nivel: 3, formato: 'Arial 12 cursiva, mayúscula inicial, en la misma línea separado por punto' },
  { nivel: 4, formato: 'Arial 12 cursiva, mayúscula inicial, en la misma línea separado por punto' },
  { nivel: 5, formato: 'Arial 12 cursiva, mayúscula inicial, con viñetas' },
];

export const PORTADA_CAMPOS = ['titulo', 'autores', 'institucion', 'facultad', 'programa', 'ciudad', 'anio'];
export const CONTRAPORTADA_CAMPOS_EXTRA = ['tipoDocumento', 'director', 'cargoDirector'];
