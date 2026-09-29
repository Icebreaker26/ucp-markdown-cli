# ucp-markdown-cli

Herramienta local para escribir el informe de opción de grado (IST, UCP) en Markdown, con las reglas reales del programa aplicadas: checklist de la Tabla 4 de los Lineamientos IST-2026, formato de la Guía FCBI (Arial 12, carta, márgenes ICONTEC), citación IEEE con numeración automática por orden de aparición, y exportación a `.docx` conforme.

**Vos escribís. La herramienta no redacta nada.** Solo verifica, numera y da formato.

## Uso

```bash
npm install
npm run init      # crea capitulos/*.md (las 14 secciones de la Tabla 4), portada.json, fuentes.json
```

Edita `capitulos/*.md` con tu editor de siempre. Completa `portada.json` con tus datos reales.

### Citar (IEEE)

En el texto: `[@clave]` para paráfrasis, `[@clave p.12]` para cita directa con página.

```bash
npm run fuentes -- add --clave enel2024 --tipo sitio-web --autor "Enel Colombia" --anio 2024 --titulo "Reglamento de peticiones" --url "https://..."
npm run fuentes             # lista fuentes con su número IEEE actual (por orden real de aparición)
npm run fuentes -- verificar # re-chequea que todas las URLs sigan respondiendo
```

El número IEEE de cada fuente se recalcula solo al exportar, según el orden real en que aparece citada — reordená el texto sin miedo.

### Figuras y tablas

```markdown
![Descripción de la figura](ruta/imagen.png)

<!-- tabla: Título de la tabla -->
| Columna A | Columna B |
| --- | --- |
| 1 | 2 |
```

Se numeran solas (Figura 1, Tabla 1...) en orden de aparición, con el pie arriba en tablas y abajo en figuras (convención ICONTEC).

### Pendientes

Escribí `[PENDIENTE: lo que sea]` en cualquier capítulo. Para resolverlo, llevalo a una conversación aparte (Claude u otro) — la herramienta nunca lo resuelve sola.

```bash
npm run pendientes   # lista todos, con archivo y línea
```

### Bitácora de uso de IA

Cada vez que consultes un asistente de IA para investigar, verificar o criticar algo (nunca para redactar), registralo:

```bash
npm run ialog -- --pregunta "¿qué se le preguntó?" --uso "qué se usó del resultado" --verificado "cómo se verificó"
npm run ialog -- resumen   # imprime la bitácora completa
```

Esto alimenta la sección obligatoria "Declaración de uso de IA" — la escribís vos, a partir de la bitácora.

### Estado y exportación

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
│   ├── cli.js        # comandos
│   ├── reglas.js      # secciones de la Tabla 4 + formato de la Guía FCBI (única fuente de verdad)
│   ├── citas.js        # numeración IEEE por orden real de aparición
│   ├── fuentes.js       # biblioteca de fuentes + verificación de URLs
│   ├── checklist.js      # cruza todo contra las reglas reales
│   ├── pendientes.js      # escanea [PENDIENTE: ...]
│   ├── ialog.js            # bitácora de uso de IA
│   ├── markdown.js          # parser mínimo (encabezados, listas, figuras, tablas)
│   ├── figuras.js            # numeración de figuras/tablas
│   └── exportar.js            # arma el .docx final con la librería docx
├── capitulos/*.md               # tu informe, capítulo por capítulo
├── fuentes.json                   # tu biblioteca de referencias
├── portada.json                    # tus datos para portada/contraportada
└── ia-log.md                        # tu bitácora de uso de IA (se crea con el primer "npm run ialog")
```
