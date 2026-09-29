import { SECCIONES, PORTADA_CAMPOS, CONTRAPORTADA_CAMPOS_EXTRA } from './reglas.js';
import { leerCapitulo, leerPortada } from './store.js';
import { escanearCitas } from './citas.js';
import { contarEntradas } from './ialog.js';

function contarPalabras(texto) {
  const sinComentarios = texto.replace(/<!--.*?-->/g, ' ');
  return sinComentarios.trim().split(/\s+/).filter(Boolean).length;
}

export async function correrChecklist() {
  const items = [];

  for (const s of SECCIONES) {
    if (s.generado) continue; // referencias no se revisa como "vacía", se genera al exportar
    const texto = await leerCapitulo(s.archivo);
    const vacio = texto.replace(/<!--.*?-->/g, '').trim().length === 0;
    items.push({
      grupo: 'Secciones obligatorias (Tabla 4)',
      ok: !vacio,
      detalle: vacio ? `${s.titulo} — vacío (${s.archivo})` : `${s.titulo} — ok`,
    });
    if (s.minPalabras) {
      const n = contarPalabras(texto);
      const ok = !vacio && n >= s.minPalabras && n <= (s.maxPalabras || Infinity);
      items.push({
        grupo: 'Extensión',
        ok,
        detalle: `${s.titulo}: ${n} palabras (rango ${s.minPalabras}-${s.maxPalabras})`,
      });
    }
  }

  const portada = await leerPortada();
  const camposPortada = [...PORTADA_CAMPOS, ...CONTRAPORTADA_CAMPOS_EXTRA];
  for (const campo of camposPortada) {
    const ok = !!(portada && portada[campo] && String(portada[campo]).trim());
    items.push({ grupo: 'Portada / contraportada', ok, detalle: `${campo}${ok ? '' : ' — falta'}` });
  }

  const { huerfanas, sinUsar, fuentes } = await escanearCitas();
  items.push({
    grupo: 'Citas',
    ok: huerfanas.length === 0,
    detalle: huerfanas.length ? `Citas sin fuente registrada: ${huerfanas.join(', ')}` : 'Sin citas huérfanas',
  });
  items.push({
    grupo: 'Citas',
    ok: sinUsar.length === 0,
    detalle: sinUsar.length ? `Fuentes guardadas pero nunca citadas: ${sinUsar.join(', ')}` : 'Todas las fuentes guardadas están citadas',
  });
  const sinVerificar = Object.entries(fuentes).filter(([, f]) => f.url && f.verificada === false);
  items.push({
    grupo: 'Citas',
    ok: sinVerificar.length === 0,
    detalle: sinVerificar.length ? `Fuentes con URL que no responde: ${sinVerificar.map(([k]) => k).join(', ')}` : 'Todas las URLs verificadas responden',
  });

  const entradasIA = await contarEntradas();
  items.push({
    grupo: 'Declaración de uso de IA',
    ok: entradasIA > 0,
    detalle: entradasIA > 0 ? `${entradasIA} entrada(s) en ia-log.md` : 'ia-log.md vacío — corre "npm run ialog"',
  });

  const total = items.length;
  const pasan = items.filter((i) => i.ok).length;
  return { items, total, pasan };
}
