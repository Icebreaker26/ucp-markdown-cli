# ucp-markdown-cli

Herramienta local para escribir el informe de opción de grado (IST, UCP) en Markdown, con las reglas reales del programa aplicadas: checklist de la Tabla 4 de los Lineamientos IST-2026, formato de la Guía FCBI (Arial 12, carta, márgenes ICONTEC), citación IEEE con numeración automática por orden de aparición, y exportación a `.docx` conforme.

**Vos escribís. La herramienta no redacta nada.** Solo verifica, numera, da formato y te ayuda a insertar lo tedioso (citas, figuras, tablas) sin que tengas que memorizar sintaxis.

## Requisitos

Node.js 20 o superior. `npm install` instala una sola dependencia (`docx`, para exportar).

## Inicio rápido

```bash
npm install
npm run init      # crea capitulos/*.md (las 14 secciones de la Tabla 4), portada.json, fuentes.json
npm start         # abre el panel en http://127.0.0.1:4321 y lo abre solo en tu navegador
```

Podés escribir desde el panel o directo en `capitulos/*.md` con tu editor de siempre — ambos leen y guardan los mismos archivos, sin pisarse.

**Para no tocar la consola después del primer `npm install` + `npm run init`:** hacé doble clic en `Iniciar panel.bat` (en la raíz del proyecto). Abre el panel en el navegador solo; dejá esa ventana negra abierta mientras trabajás y cerrala para apagar el servidor.

## Respaldo de tu contenido

Tu informe real (`capitulos/*.md`, `capitulos/img/`, `fuentes.json`, `portada.json`, `ia-log.md`) **nunca se sube al repo** — así lo dejamos a propósito, para que nadie más vea tu trabajo en curso. Eso significa que la única copia vive en tu disco: si se daña o perdés la carpeta, se pierde el informe.

Hacé doble clic en `Hacer respaldo.bat` cuando quieras (antes de un cambio grande, al final del día, etc.). Crea un `.zip` con fecha y hora dentro de `respaldos/` — por ejemplo `respaldos/respaldo-2026-09-29_1418.zip` — con todo tu contenido. Los `.zip` se acumulan ahí, así que de vez en cuando podés borrar los más viejos a mano.

`respaldos/` tampoco se sube al repo (está en `.gitignore`), porque son solo copias locales. Para estar realmente a salvo (ej. si el disco falla), copiá de tanto en tanto la carpeta `respaldos/` a un USB, a Google Drive/OneDrive, o a donde prefieras guardar algo importante fuera de esta computadora.

## El panel (`npm start`)

- **Capítulos** — un editor por sección, con una barra de herramientas arriba:
  - **+ Cita** — elegís la fuente de una lista (ya con su autor y título, no tenés que acordarte de la clave) y opcionalmente una página; inserta `[@clave]` o `[@clave p.12]` en el cursor.
  - **+ Imagen** — subís el archivo desde tu computador (o elegís uno ya subido antes) y le ponés descripción; inserta `![descripción](ruta)`.
  - **+ Tabla** — un mini-constructor: filas, columnas y un título; llenás las celdas en una grilla y arma el markdown de la tabla completo, con su comentario de título.
  - **+ Pendiente** — inserta `[PENDIENTE: ]` con el cursor listo para escribir la nota.
- **Fuentes** — agregar una fuente verifica la URL en el momento (petición real, no simulada) y muestra su número IEEE actual.
- **Pendientes** — lista todo lo marcado, con clic para saltar al capítulo.
- **Checklist** — el mismo chequeo que `npm run status`, pero visual.
- **Bitácora de IA** — formulario para registrar cada consulta a un asistente, y el historial completo.
- **Portada** — formulario para los datos de portada/contraportada.
- **Exportar .docx** — genera el documento y lo abre para descargar, en cualquier momento (aunque falten cosas: sirve como vista previa).

Todo lo que hace el panel también se puede hacer por CLI (abajo) — son dos formas de tocar los mismos archivos, no dos sistemas distintos.

## Citar (IEEE)

En el texto: `[@clave]` para paráfrasis, `[@clave p.12]` para cita directa con página. Desde el panel, el botón **+ Cita** lo arma por vos.

```bash
npm run fuentes -- add --clave enel2024 --tipo sitio-web --autor "Enel Colombia" --anio 2024 --titulo "Reglamento de peticiones" --url "https://..."
npm run fuentes             # lista fuentes con su número IEEE actual (por orden real de aparición)
npm run fuentes -- verificar # re-chequea que todas las URLs sigan respondiendo
```

El número IEEE de cada fuente se recalcula solo al exportar, según el orden real en que aparece citada — reordená el texto sin miedo.

## Figuras y tablas

```markdown
![Descripción de la figura](ruta/imagen.png)

<!-- tabla: Título de la tabla -->
| Columna A | Columna B |
| --- | --- |
| 1 | 2 |
```

Se numeran solas (Figura 1, Tabla 1...) en orden de aparición, con el pie arriba en tablas y abajo en figuras (convención ICONTEC). Desde el panel, los botones **+ Imagen** y **+ Tabla** arman esta sintaxis por vos.

## Pendientes

Escribí `[PENDIENTE: lo que sea]` en cualquier capítulo (a mano o con el botón **+ Pendiente**). Para resolverlo, llevalo a una conversación aparte (Claude u otro) — la herramienta nunca lo resuelve sola.

```bash
npm run pendientes   # lista todos, con archivo y línea
```

## Bitácora de uso de IA

Cada vez que consultes un asistente de IA para investigar, verificar o criticar algo (nunca para redactar), registralo — desde el panel (pestaña "Bitácora de IA") o por CLI:

```bash
npm run ialog -- --pregunta "¿qué se le preguntó?" --uso "qué se usó del resultado" --verificado "cómo se verificó"
npm run ialog -- resumen   # imprime la bitácora completa
```

Esto alimenta la sección obligatoria "Declaración de uso de IA" — la escribís vos, a partir de la bitácora.

## Corrección ortográfica

El editor del panel no corrige nada por su cuenta — usa el corrector nativo de tu navegador (`spellcheck` + `lang="es"`): subrayado rojo y sugerencias con clic derecho, igual que en cualquier campo de texto web. Si no ves el subrayado, activá español en `chrome://settings/languages`.

Si escribís directo en `capitulos/*.md` con VS Code, dos extensiones recomendadas:
- **Code Spell Checker** (`streetsidesoftware.code-spell-checker`) + diccionario **Spanish** (`streetsidesoftware.code-spell-checker-spanish`) — liviano, solo ortografía.
- **LTeX** (`valentjn.vscode-ltex`) — ortografía y gramática (LanguageTool), corre sobre `.md` y funciona offline. Más completo para un informe académico.

Ninguna de las dos reescribe nada sola: marcan el problema, vos decidís la corrección.

## Estado y exportación

```bash
npm run status   # checklist completo + pendientes
npm run export   # genera informe.docx (podés correrlo en cualquier momento, aunque falten cosas)
```

## Qué NO hace

- No llama a ningún LLM ni genera texto. Cero API keys, cero dependencia de un servicio externo para redactar.
- No reemplaza el aval del director ni el trámite del comité de ética si tu trabajo maneja información sensible de personas reales — confirmá eso aparte.
- No es específico de ningún proyecto: `fuentes.json`, `capitulos/` y `portada.json` son tus datos, no están cableados a CORE ni a ningún otro proyecto puntual.

## Estructura

```
ucp-markdown-cli/
├── src/
│   ├── cli.js         # comandos
│   ├── server.js        # servidor local del panel y su API
│   ├── reglas.js          # secciones de la Tabla 4 + formato de la Guía FCBI (única fuente de verdad)
│   ├── citas.js             # numeración IEEE por orden real de aparición
│   ├── fuentes.js             # biblioteca de fuentes + verificación de URLs
│   ├── checklist.js             # cruza todo contra las reglas reales
│   ├── pendientes.js              # escanea [PENDIENTE: ...]
│   ├── ialog.js                     # bitácora de uso de IA
│   ├── markdown.js                    # parser mínimo (encabezados, listas, figuras, tablas)
│   ├── figuras.js                       # numeración de figuras/tablas
│   └── exportar.js                        # arma el .docx final con la librería docx
├── public/
│   └── index.html                           # el panel: HTML + CSS + JS en un solo archivo, sin build
├── capitulos/*.md                             # tu informe, capítulo por capítulo
├── fuentes.json                                 # tu biblioteca de referencias
├── portada.json                                   # tus datos para portada/contraportada
└── ia-log.md                                        # tu bitácora de uso de IA (se crea con el primer "npm run ialog")
```
