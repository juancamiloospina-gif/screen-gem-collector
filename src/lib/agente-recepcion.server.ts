// Punto de extensión: Agente de Recepción (LLM real).
//
// Nota: el prototipo se ejecuta en TanStack Start (sin Supabase Edge
// Functions), así que este placeholder vive como módulo de servidor.
// Cuando conectemos el agente de recepción a un LLM real, su lógica vive
// aquí y se expone vía createServerFn (p. ej. src/lib/agente-recepcion.functions.ts).
//
// Responsabilidad prevista:
//   - Recibir el mensaje del conductor en lenguaje natural (hoy llega por el
//     chat de /reportar, que usa reglas de texto en src/routes/reportar.tsx).
//   - Extraer y confirmar: tipo de servicio, placa, ubicación y ciudad.
//   - Crear el caso (etapa inicial: "Creación") en la tabla `casos`.
//
// Estado actual: NO implementado. El chat de /reportar sigue usando
// detección por reglas (regex de placa, servicio y ciudad) — no un LLM.
export {};
