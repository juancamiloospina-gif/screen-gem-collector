// Prototipo sin backend: los casos viven en memoria (proceso del servidor
// de desarrollo / del navegador), no en una base de datos real. Ver
// supabase/migrations/ para el esquema y los datos semilla equivalentes
// que se usarían en la fase de implementación con persistencia real.

export const ETAPAS = [
  "Creación",
  "Trámite",
  "Asignado",
  "Llegada a sitio",
  "En atención",
  "Traslado",
  "Finalizado",
  "Cierre",
] as const;

export type Etapa = (typeof ETAPAS)[number];

export const SERVICIOS = [
  "Grúa de gran tonelaje",
  "Rescate",
  "Asistencia jurídica",
  "Carro taller",
  "Movilidad del conductor",
] as const;

export const CIUDADES = ["Bogotá", "Medellín", "Barranquilla", "Cali", "Neiva"] as const;

export const COORD_CIUDAD: Record<string, { x: number; y: number }> = {
  Bogotá: { x: 39, y: 34 },
  Medellín: { x: 33, y: 26 },
  Barranquilla: { x: 41, y: 12 },
  Cali: { x: 30, y: 58 },
  Neiva: { x: 36, y: 66 },
};

export type Caso = {
  id: string;
  numero: number;
  placa: string;
  tipo_servicio: string;
  ciudad: string;
  ubicacion: string;
  tipo_vehiculo: string;
  etapa: Etapa;
  prometido_min: number;
  creado_en: string;
  mapa_x: number;
  mapa_y: number;
  origen: string;
};

export type EventoCaso = {
  id: string;
  caso_id: string;
  etapa: Etapa;
  ocurrido_en: string;
  nota: string | null;
};

export type Semaforo = "verde" | "amarillo" | "rojo";

export const CERRADAS: Etapa[] = ["Finalizado", "Cierre"];

export function minutosTranscurridos(caso: Caso, ahora: number = Date.now()) {
  return Math.max(0, Math.round((ahora - new Date(caso.creado_en).getTime()) / 60000));
}

export function semaforo(caso: Caso, ahora: number = Date.now()): Semaforo {
  const ratio = minutosTranscurridos(caso, ahora) / caso.prometido_min;
  if (ratio >= 1) return "rojo";
  if (ratio >= 0.75) return "amarillo";
  return "verde";
}

export const ETIQUETA_SEMAFORO: Record<Semaforo, string> = {
  verde: "En tiempo",
  amarillo: "En riesgo",
  rojo: "Incumplido",
};

export const COLOR_SEMAFORO: Record<Semaforo, { texto: string; fondo: string }> = {
  verde: { texto: "text-sla-green", fondo: "bg-sla-green" },
  amarillo: { texto: "text-sla-amber", fondo: "bg-sla-amber" },
  rojo: { texto: "text-sla-red", fondo: "bg-sla-red" },
};

export function esAbierto(caso: Caso) {
  return !CERRADAS.includes(caso.etapa);
}

export function formatoReloj(fecha: string | Date) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// --- Almacén en memoria -----------------------------------------------
//
// Cada caso semilla conserva los minutos transcurridos "originales" que
// tenía en supabase/migrations (creado_en = now() - X minutes en el
// momento en que se sembró la base de datos). En vez de guardar esa fecha
// fija, aquí se recalcula `creado_en` cada vez que se lee el dato, así
// que la mezcla de semáforo verde/amarillo/rojo es siempre la misma sin
// importar cuánto tiempo lleve corriendo el servidor: es una demo que
// nunca se "vence".
//
// Los casos creados desde /reportar sí guardan una fecha fija real
// (crearCaso), porque su reloj debe avanzar normalmente desde el momento
// en que se crean.

type CasoSemilla = {
  placa: string;
  tipo_servicio: string;
  ciudad: string;
  ubicacion: string;
  tipo_vehiculo: string;
  etapa: Etapa;
  prometido_min: number;
  minutosOriginales: number;
  mapa_x: number;
  mapa_y: number;
};

type CasoInterno = {
  id: string;
  numero: number;
  placa: string;
  tipo_servicio: string;
  ciudad: string;
  ubicacion: string;
  tipo_vehiculo: string;
  etapa: Etapa;
  prometido_min: number;
  mapa_x: number;
  mapa_y: number;
  origen: string;
  // Caso semilla: se recalcula creado_en = ahora - minutosOriginales en cada lectura.
  minutosOriginales?: number;
  // Caso real (creado desde /reportar): fecha fija, avanza con el reloj.
  creadoEnFijo?: string;
  notaCreacion?: string;
};

// Mismas placas, servicio, ciudad, etapa y prometido_min que
// supabase/migrations/20260925085727_*.sql, en el mismo orden de
// inserción (así conservan el mismo #numero: 1040..1051).
const CASOS_SEMILLA: CasoSemilla[] = [
  {
    placa: "WTX-234",
    tipo_servicio: "Grúa de gran tonelaje",
    ciudad: "Bogotá",
    ubicacion: "Vía Bogotá-Girardot, peaje Chusacá",
    tipo_vehiculo: "Pesado",
    etapa: "Llegada a sitio",
    prometido_min: 45,
    minutosOriginales: 28,
    mapa_x: 38,
    mapa_y: 34,
  },
  {
    placa: "KJR-901",
    tipo_servicio: "Rescate",
    ciudad: "Medellín",
    ubicacion: "Túnel de Occidente, km 3",
    tipo_vehiculo: "Pesado",
    etapa: "En atención",
    prometido_min: 50,
    minutosOriginales: 41,
    mapa_x: 34,
    mapa_y: 26,
  },
  {
    placa: "PLM-558",
    tipo_servicio: "Asistencia jurídica",
    ciudad: "Barranquilla",
    ubicacion: "Circunvalar con Cra 38",
    tipo_vehiculo: "Liviano",
    etapa: "Traslado",
    prometido_min: 60,
    minutosOriginales: 88,
    mapa_x: 41,
    mapa_y: 12,
  },
  {
    placa: "ZVC-117",
    tipo_servicio: "Carro taller",
    ciudad: "Cali",
    ubicacion: "Autopista Sur con Cra 50",
    tipo_vehiculo: "Pesado",
    etapa: "Asignado",
    prometido_min: 40,
    minutosOriginales: 12,
    mapa_x: 30,
    mapa_y: 58,
  },
  {
    placa: "HQN-402",
    tipo_servicio: "Movilidad del conductor",
    ciudad: "Neiva",
    ubicacion: "Vía Neiva-Campoalegre km 8",
    tipo_vehiculo: "Liviano",
    etapa: "Trámite",
    prometido_min: 45,
    minutosOriginales: 35,
    mapa_x: 36,
    mapa_y: 66,
  },
  {
    placa: "BTR-776",
    tipo_servicio: "Grúa de gran tonelaje",
    ciudad: "Bogotá",
    ubicacion: "Calle 80 con Cra 100",
    tipo_vehiculo: "Pesado",
    etapa: "Creación",
    prometido_min: 45,
    minutosOriginales: 6,
    mapa_x: 40,
    mapa_y: 36,
  },
  {
    placa: "GFT-209",
    tipo_servicio: "Grúa de gran tonelaje",
    ciudad: "Bogotá",
    ubicacion: "Autopista Norte km 21",
    tipo_vehiculo: "Pesado",
    etapa: "Asignado",
    prometido_min: 60,
    minutosOriginales: 75,
    mapa_x: 41,
    mapa_y: 32,
  },
  {
    placa: "DRC-330",
    tipo_servicio: "Rescate",
    ciudad: "Medellín",
    ubicacion: "Las Palmas, km 12",
    tipo_vehiculo: "Pesado",
    etapa: "En atención",
    prometido_min: 45,
    minutosOriginales: 40,
    mapa_x: 33,
    mapa_y: 28,
  },
  {
    placa: "VBN-615",
    tipo_servicio: "Carro taller",
    ciudad: "Cali",
    ubicacion: "Vía Cali-Jamundí",
    tipo_vehiculo: "Pesado",
    etapa: "Llegada a sitio",
    prometido_min: 45,
    minutosOriginales: 67,
    mapa_x: 31,
    mapa_y: 60,
  },
  {
    placa: "MZN-341",
    tipo_servicio: "Movilidad del conductor",
    ciudad: "Barranquilla",
    ubicacion: "Vía 40 con Calle 72",
    tipo_vehiculo: "Liviano",
    etapa: "Finalizado",
    prometido_min: 45,
    minutosOriginales: 110,
    mapa_x: 42,
    mapa_y: 14,
  },
  {
    placa: "RDF-405",
    tipo_servicio: "Asistencia jurídica",
    ciudad: "Neiva",
    ubicacion: "Av. Circunvalar con Calle 19",
    tipo_vehiculo: "Liviano",
    etapa: "Cierre",
    prometido_min: 60,
    minutosOriginales: 180,
    mapa_x: 35,
    mapa_y: 68,
  },
  {
    placa: "TNP-673",
    tipo_servicio: "Rescate",
    ciudad: "Bogotá",
    ubicacion: "Vía Bogotá-La Calera km 6",
    tipo_vehiculo: "Liviano",
    etapa: "Traslado",
    prometido_min: 50,
    minutosOriginales: 54,
    mapa_x: 39,
    mapa_y: 33,
  },
];

const NUMERO_INICIAL = 1040;

const casos: CasoInterno[] = CASOS_SEMILLA.map((s, i) => ({
  id: crypto.randomUUID(),
  numero: NUMERO_INICIAL + i,
  placa: s.placa,
  tipo_servicio: s.tipo_servicio,
  ciudad: s.ciudad,
  ubicacion: s.ubicacion,
  tipo_vehiculo: s.tipo_vehiculo,
  etapa: s.etapa,
  prometido_min: s.prometido_min,
  mapa_x: s.mapa_x,
  mapa_y: s.mapa_y,
  origen: "Agente IA",
  minutosOriginales: s.minutosOriginales,
}));

let siguienteNumero = NUMERO_INICIAL + casos.length;

function creadoEnMs(c: CasoInterno, ahoraMs: number): number {
  return c.minutosOriginales != null
    ? ahoraMs - c.minutosOriginales * 60_000
    : new Date(c.creadoEnFijo!).getTime();
}

function aCaso(c: CasoInterno, ahoraMs: number): Caso {
  return {
    id: c.id,
    numero: c.numero,
    placa: c.placa,
    tipo_servicio: c.tipo_servicio,
    ciudad: c.ciudad,
    ubicacion: c.ubicacion,
    tipo_vehiculo: c.tipo_vehiculo,
    etapa: c.etapa,
    prometido_min: c.prometido_min,
    creado_en: new Date(creadoEnMs(c, ahoraMs)).toISOString(),
    mapa_x: c.mapa_x,
    mapa_y: c.mapa_y,
    origen: c.origen,
  };
}

// Misma lógica que la migración SQL: reparte el tiempo transcurrido en
// partes iguales entre las etapas ya alcanzadas, así que la etapa actual
// siempre "ocurre" justo ahora y las etapas futuras quedan sin evento
// ("Pendiente" en la UI).
function generarEventos(c: CasoInterno, ahoraMs: number): EventoCaso[] {
  const caso = aCaso(c, ahoraMs);
  const creadoMs = new Date(caso.creado_en).getTime();
  const ordActual = ETAPAS.indexOf(caso.etapa) + 1;
  const transcurridoMs = Math.max(0, ahoraMs - creadoMs);
  const segmentoMs = transcurridoMs / Math.max(ordActual - 1, 1);

  const eventos: EventoCaso[] = [];
  for (let ord = 1; ord <= ordActual; ord++) {
    eventos.push({
      id: `${c.id}-evt-${ord}`,
      caso_id: c.id,
      etapa: ETAPAS[ord - 1]!,
      ocurrido_en: new Date(creadoMs + (ord - 1) * segmentoMs).toISOString(),
      nota: ord === 1 ? (c.notaCreacion ?? null) : null,
    });
  }
  return eventos;
}

export const casosQuery = {
  queryKey: ["casos"],
  queryFn: async (): Promise<Caso[]> => {
    const ahora = Date.now();
    return casos
      .map((c) => aCaso(c, ahora))
      .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());
  },
  refetchInterval: 15000,
};

export function casoQuery(id: string) {
  return {
    queryKey: ["caso", id],
    queryFn: async (): Promise<{ caso: Caso; eventos: EventoCaso[] }> => {
      const c = casos.find((x) => x.id === id);
      if (!c) throw new Error("Caso no encontrado");
      const ahora = Date.now();
      return { caso: aCaso(c, ahora), eventos: generarEventos(c, ahora) };
    },
  };
}

export async function crearCaso(input: {
  placa: string;
  tipo_servicio: string;
  ciudad: string;
  ubicacion: string;
  tipo_vehiculo: string;
  prometido_min: number;
}): Promise<Caso> {
  const coord = COORD_CIUDAD[input.ciudad] ?? { x: 38, y: 40 };
  const ahora = Date.now();
  const nuevo: CasoInterno = {
    id: crypto.randomUUID(),
    numero: siguienteNumero++,
    placa: input.placa,
    tipo_servicio: input.tipo_servicio,
    ciudad: input.ciudad,
    ubicacion: input.ubicacion,
    tipo_vehiculo: input.tipo_vehiculo,
    etapa: "Creación",
    prometido_min: input.prometido_min,
    mapa_x: coord.x + (Math.random() * 4 - 2),
    mapa_y: coord.y + (Math.random() * 4 - 2),
    origen: "Agente IA",
    creadoEnFijo: new Date(ahora).toISOString(),
    notaCreacion: "Caso creado por el agente de IA a partir del reporte del conductor.",
  };
  casos.push(nuevo);
  return aCaso(nuevo, ahora);
}
