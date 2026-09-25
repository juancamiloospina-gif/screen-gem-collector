# AssisPrex — Centro de Gestión y Control de Asistencias Vehiculares

Prototipo funcional (no producción) para **INDEGA S.A.**, flota nacional de la operación de Coca-Cola FEMSA Colombia. Demuestra cómo un centro de operaciones digital brinda visibilidad en tiempo real sobre las asistencias vehiculares: desde el reporte del conductor hasta el cierre del caso, con semáforo de cumplimiento contra el tiempo prometido.

> **Prototipo sin backend** — los datos viven en memoria, para fines de demo comercial (mostrarle al cliente cómo se vería). La persistencia real (Supabase/Postgres) es parte de la fase de implementación, no de este prototipo.

## Pantallas

| Ruta | Pantalla | Qué muestra |
| --- | --- | --- |
| `/` | **Inicio** | Bienvenida al centro de operaciones y entrada al flujo. |
| `/reportar` | **Reportar incidente** | Chat donde el conductor describe la asistencia en lenguaje natural y el agente de recepción confirma servicio, placa y ubicación antes de crear el caso. |
| `/centro` | **Centro operativo** | Tablero del Director de Flota: KPIs, mapa de Colombia con los casos abiertos y lista de asistencias con semáforo verde/amarillo/rojo. |
| `/caso/:id` | **Detalle de caso** | Línea de tiempo con las 8 etapas del caso (Creación, Trámite, Asignado, Llegada a sitio, En atención, Traslado, Finalizado, Cierre) y control de tiempo vs. prometido. |
| `/alertas` | **Alertas** | Avisos automáticos al Director de Flota cuando un caso supera el tiempo prometido (escalamiento al 75% y 100%). |
| `/antes-despues` | **Antes / Después** | Comparativa del proceso actual (54 min de llegada promedio, cero visibilidad) contra el modelo con visibilidad en vivo. |

## Qué es real y qué está simulado

**Real:**
- La lógica de negocio: etapa como enum de las 8 etapas, línea de tiempo por caso (`eventos_caso`), cálculo de semáforo contra el tiempo prometido. No está hardcodeada en los componentes visuales.
- El tablero se refresca automáticamente (cada 15 s).
- El mapa de Colombia es un SVG real generado a partir del GeoJSON del país.

**Simulado (fuera de alcance del prototipo):**
- **No hay backend ni base de datos real.** Los 12 casos semilla y sus eventos viven en memoria (`src/lib/casos.ts`) y se recalculan contra la hora actual en cada lectura, así que la demo siempre muestra una mezcla realista de verde/amarillo/rojo sin importar cuánto tiempo lleve corriendo — no hace falta resetear nada antes de una demo. Los casos creados desde `/reportar` sí quedan con su reloj corriendo normalmente, pero solo mientras dure la sesión del navegador (no persisten).
- El agente de recepción del chat usa reglas de texto (detección de placa, servicio y ciudad), **no un LLM real**.
- No hay integración con WhatsApp Business, telefonía/voz, ni con los sistemas de la aseguradora.
- No se calculan excedentes ni coberturas reales; no se generan PDFs.
- Las alertas y la comparativa Antes/Después son demostraciones con datos de ejemplo.

## Extensión futura

- `src/lib/agente-recepcion.server.ts` — punto de extensión reservado para conectar el agente de recepción a un LLM real cuando se decida.
- `supabase/migrations/` — se deja como referencia del esquema (`casos`, `eventos_caso`) y los datos semilla que tendría la fase de implementación con persistencia real (Supabase/Postgres). No se usa en runtime: este prototipo no depende de Supabase ni de ninguna variable de entorno.

## Desarrollo

```sh
npm i
npm run dev
```

## Stack

- TanStack Start (React 19, TypeScript)
- Tailwind CSS v4
- Datos en memoria (sin backend) — ver `src/lib/casos.ts`
