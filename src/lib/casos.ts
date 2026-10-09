// Prototipo sin backend: los casos son datos inventados que viven en
// memoria del navegador. Cualquier cambio (crear un caso, avanzar etapa,
// aprobar un excedente) dura mientras la pestaña esté abierta. Ver
// supabase/migrations/ para el esquema de referencia de la fase real.

import { fechaHoraColombia } from "./hora";
import {
  COBERTURA_POR_TIPO,
  DIRECTOR_FLOTA,
  HSE,
  REGIONALES,
  buscarVehiculo,
  validarCobertura,
  type Vehiculo,
} from "./flota";

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
  "Grúa liviana",
  "Grúa de gran tonelaje",
  "Rescate",
  "Asistencia jurídica",
  "Carro taller",
  "Movilidad del conductor",
  "Conductor elegido",
] as const;

export const CIUDADES = ["Bogotá", "Medellín", "Barranquilla", "Cali", "Neiva"] as const;

export const COORD_CIUDAD: Record<string, { x: number; y: number }> = {
  Bogotá: { x: 39, y: 34 },
  Medellín: { x: 33, y: 26 },
  Barranquilla: { x: 41, y: 12 },
  Cali: { x: 30, y: 58 },
  Neiva: { x: 36, y: 66 },
};

// Estados de excepción de la propuesta (§3.4).
export const EXCEPCIONES = [
  "Cancelado",
  "Reprogramado",
  "Servicio no cubierto",
  "Proveedor no llega",
  "Reclamo del usuario",
] as const;
export type Excepcion = (typeof EXCEPCIONES)[number];

export type Cobertura = "Cubierto" | "Fuera de cartera" | "Servicio no cubierto";

export type EstadoExcedente = "Pendiente aprobación" | "Aprobado" | "Objetado";
export type Excedente = {
  id: string;
  concepto: "Kilometraje adicional" | "Horas de espera" | "Peajes" | "Servicio adicional";
  detalle: string;
  valor: number;
  estado: EstadoExcedente;
};

export type Novedad = { en: string; autor: string; texto: string };

export type CanalContacto = "Llamada" | "Chat";
export type EstadoSeguimiento = "Pendiente" | "En contacto" | "Controlado" | "Resuelto";
export type ContactoProveedor = {
  en: string;
  autor: string;
  proveedor: string;
  canal: CanalContacto;
  razon_atraso: string;
  compromiso: string;
};

export type Caso = {
  id: string;
  numero: number;
  placa: string;
  tipo_servicio: string;
  causa: "Avería" | "Accidente" | "Solicitud";
  cliente: string;
  campana: string;
  ciudad: string;
  ubicacion: string;
  destino: string | null;
  km_traslado: number | null;
  tipo_vehiculo: string;
  etapa: Etapa;
  prometido_min: number;
  creado_en: string;
  ultimo_cambio_en: string;
  mapa_x: number;
  mapa_y: number;
  origen: string;
  proveedor: string | null;
  expediente: string | null;
  cobertura: Cobertura;
  excepcion: Excepcion | null;
  atendido_por: "Agente IA" | "Supervisor humano";
  motivo_traspaso: string | null;
  responsable: string | null;
  estado_seguimiento: EstadoSeguimiento;
  razon_atraso: string | null;
  contactos_proveedor: ContactoProveedor[];
  excedentes: Excedente[];
  encuesta: { nps: number; comentario: string } | null;
  novedades: Novedad[];
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

// Servicios críticos que se monitorean por ciudad: ahí está el dolor.
export const FAMILIAS = ["Grúa liviana", "Grúa pesada", "Carro taller", "CE"] as const;
export type Familia = (typeof FAMILIAS)[number];

export const ETIQUETA_FAMILIA: Record<Familia, string> = {
  "Grúa liviana": "Grúa liviana",
  "Grúa pesada": "Grúa pesada",
  "Carro taller": "Carro taller",
  CE: "Conductor elegido",
};

export function familiaDe(tipo_servicio: string): Familia | null {
  switch (tipo_servicio) {
    case "Grúa liviana":
      return "Grúa liviana";
    case "Grúa de gran tonelaje":
      return "Grúa pesada";
    case "Carro taller":
      return "Carro taller";
    case "Conductor elegido":
      return "CE";
    default:
      return null;
  }
}

// Los tres procesos críticos del servicio. Front toma y valida; Back radica
// y asigna proveedor; Seguimiento acompaña desde la llegada hasta el cierre.
export const PROCESOS = ["Front", "Back", "Seguimiento"] as const;
export type Proceso = (typeof PROCESOS)[number];

export const PROCESO_DE_ETAPA: Record<Etapa, Proceso> = {
  Creación: "Front",
  Trámite: "Back",
  Asignado: "Back",
  "Llegada a sitio": "Seguimiento",
  "En atención": "Seguimiento",
  Traslado: "Seguimiento",
  Finalizado: "Seguimiento",
  Cierre: "Seguimiento",
};

export function procesoDe(caso: Pick<Caso, "etapa">): Proceso {
  return PROCESO_DE_ETAPA[caso.etapa];
}

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
  return !CERRADAS.includes(caso.etapa) && caso.excepcion !== "Cancelado";
}

export function formatoReloj(fecha: string | Date) {
  return fechaHoraColombia(fecha);
}

// --- Control de inactividad (§3.6) -------------------------------------
// Minutos que un caso puede quedarse en una etapa antes de escalar a un
// supervisor humano.
export const TIEMPO_ESPERADO_ETAPA: Record<Etapa, number> = {
  Creación: 8,
  Trámite: 10,
  Asignado: 25,
  "Llegada a sitio": 15,
  "En atención": 40,
  Traslado: 60,
  Finalizado: 30,
  Cierre: Infinity,
};

export function minutosEnEtapa(caso: Caso, ahora: number = Date.now()) {
  return Math.max(0, Math.round((ahora - new Date(caso.ultimo_cambio_en).getTime()) / 60000));
}

export function estaInactivo(caso: Caso, ahora: number = Date.now()) {
  return esAbierto(caso) && minutosEnEtapa(caso, ahora) > TIEMPO_ESPERADO_ETAPA[caso.etapa];
}

// --- Predictivo: casos por vencerse -------------------------------------

export const VENTANA_PREDICTIVA_MIN = 10;

export function minutosRestantes(caso: Caso, ahora: number = Date.now()) {
  return caso.prometido_min - minutosTranscurridos(caso, ahora);
}

export type Vencimiento = { minutos: number; motivo: "SLA" | "Etapa" };

// Lo próximo que se vence: el tiempo prometido al cliente (SLA) o el tiempo
// esperado de la etapa actual. Los casos que ya incumplieron no son
// predictivos: son críticos.
export function porVencer(
  caso: Caso,
  ahora: number = Date.now(),
  ventana: number = VENTANA_PREDICTIVA_MIN,
): Vencimiento | null {
  if (!esAbierto(caso) || semaforo(caso, ahora) === "rojo") return null;
  const candidatos: Vencimiento[] = [];
  const sla = minutosRestantes(caso, ahora);
  if (sla > 0) candidatos.push({ minutos: sla, motivo: "SLA" });
  const limiteEtapa = TIEMPO_ESPERADO_ETAPA[caso.etapa];
  if (Number.isFinite(limiteEtapa)) {
    const etapa = limiteEtapa - minutosEnEtapa(caso, ahora);
    if (etapa > 0) candidatos.push({ minutos: etapa, motivo: "Etapa" });
  }
  const proximo = candidatos.reduce<Vencimiento | null>(
    (a, b) => (a === null || b.minutos < a.minutos ? b : a),
    null,
  );
  return proximo && proximo.minutos <= ventana ? proximo : null;
}

// --- Matriz de comunicación (§4.2) -------------------------------------

export type Disparador =
  | "Nuevo incidente"
  | "Cada hito"
  | "Escalamiento"
  | "Cierre"
  | "Accidente"
  | "Resumen diario"
  | "Encuesta";

export const MATRIZ_COMUNICACION: {
  actor: string;
  recibe: string;
  canal: "WhatsApp" | "Correo" | "WhatsApp o correo" | "Correo y tablero";
  disparadores: Disparador[];
}[] = [
  {
    actor: "Conductor",
    recibe: "Confirmación, tiempo estimado, llegada, novedades, cierre y encuesta",
    canal: "WhatsApp",
    disparadores: ["Nuevo incidente", "Cada hito", "Cierre", "Encuesta"],
  },
  {
    actor: "Jefe inmediato",
    recibe: "Todos los hitos del caso",
    canal: "WhatsApp",
    disparadores: ["Nuevo incidente", "Cada hito", "Escalamiento", "Cierre"],
  },
  {
    actor: "Director regional",
    recibe: "Nuevo incidente, novedades, escalamientos y cierre",
    canal: "WhatsApp o correo",
    disparadores: ["Nuevo incidente", "Escalamiento", "Cierre"],
  },
  {
    actor: "Director de flota",
    recibe: "Nuevo incidente, casos críticos y escalamientos; resumen diario",
    canal: "Correo y tablero",
    disparadores: ["Nuevo incidente", "Escalamiento", "Resumen diario"],
  },
  {
    actor: "HSE y seguridad vial",
    recibe: "Accidentes, eventos en zonas de riesgo y lesionados",
    canal: "WhatsApp o correo",
    disparadores: ["Accidente"],
  },
];

export type Notificacion = {
  id: string;
  en: string;
  actor: string;
  destinatario: string;
  canal: string;
  mensaje: string;
  estado: "Entregado" | "Leído";
};

// --- Almacén en memoria ------------------------------------------------
//
// Los casos semilla guardan minutos relativos ("hace X minutos") y su fecha
// se recalcula en cada lectura, así la mezcla de semáforos es siempre la
// misma sin importar cuándo se abra la demo. Los casos creados desde
// /reportar y los cambios hechos a mano sí usan la hora real.

type CasoSemilla = {
  placa: string;
  tipo_servicio: string;
  causa: Caso["causa"];
  ciudad: string;
  ubicacion: string;
  destino?: string;
  km_traslado?: number;
  tipo_vehiculo: string;
  etapa: Etapa;
  prometido_min: number;
  minutosOriginales: number;
  // Minutos desde el último cambio de etapa. Por defecto el tiempo se
  // reparte en partes iguales entre las etapas alcanzadas.
  minutosSinCambio?: number;
  mapa_x: number;
  mapa_y: number;
  excepcion?: Excepcion;
  motivo_traspaso?: string;
  excedentes?: Omit<Excedente, "id">[];
  encuesta?: Caso["encuesta"];
  novedades?: { haceMin: number; autor: string; texto: string }[];
  razon_atraso?: string;
  responsable?: string;
};

type CasoInterno = Omit<
  Caso,
  | "creado_en"
  | "ultimo_cambio_en"
  | "novedades"
  | "excedentes"
  | "contactos_proveedor"
> & {
  excedentes: Excedente[];
  // Caso semilla: fechas relativas a "ahora".
  minutosOriginales?: number | undefined;
  minutosSinCambio?: number | undefined;
  novedadesRelativas?: { haceMin: number; autor: string; texto: string }[] | undefined;
  // Caso real (creado en /reportar) o actualizado a mano: fechas fijas.
  creadoEnFijo?: string;
  cambiosFijos: { etapa: Etapa; en: string }[];
  novedadesFijas: Novedad[];
  contactosProveedorFijos: ContactoProveedor[];
  notaCreacion?: string;
};

const PROVEEDOR_CIUDAD: Record<string, string> = {
  Bogotá: "Grúas Sabana 24H",
  Medellín: "Rescates Aburrá S.A.S.",
  Barranquilla: "Asistencias Costa Norte",
  Cali: "Taller Móvil Pacífico",
  Neiva: "Movilidad Opita",
};

function proveedorPara(tipo_servicio: string, ciudad: string) {
  if (tipo_servicio === "Asistencia jurídica") return "Abogados en Vía S.A.S.";
  if (tipo_servicio === "Movilidad del conductor") return "Transporte Seguro Mapfre";
  if (tipo_servicio === "Conductor elegido") return "Conductor Elegido Express";
  if (tipo_servicio === "Grúa liviana") return `Grúas Express ${ciudad}`;
  return PROVEEDOR_CIUDAD[ciudad] ?? "Red de proveedores Mapfre";
}

// Mismas placas, servicio, ciudad, etapa y prometido_min que
// supabase/migrations/20260925085727_*.sql (#1040..1051), más dos casos
// nuevos para mostrar fuera de cartera y cancelación.
const CASOS_SEMILLA: CasoSemilla[] = [
  {
    placa: "WTX-234",
    tipo_servicio: "Grúa de gran tonelaje",
    causa: "Avería",
    ciudad: "Bogotá",
    ubicacion: "Vía Bogotá-Girardot, peaje Chusacá",
    destino: "Taller Kenworth, Fontibón",
    km_traslado: 38,
    tipo_vehiculo: "Pesado",
    etapa: "Llegada a sitio",
    prometido_min: 45,
    minutosOriginales: 28,
    mapa_x: 38,
    mapa_y: 34,
    excedentes: [
      {
        concepto: "Horas de espera",
        detalle: "2 h de espera por cierre de vía en Chusacá",
        valor: 180000,
        estado: "Pendiente aprobación",
      },
    ],
  },
  {
    placa: "KJR-901",
    tipo_servicio: "Rescate",
    causa: "Accidente",
    ciudad: "Medellín",
    ubicacion: "Túnel de Occidente, km 3",
    tipo_vehiculo: "Pesado",
    etapa: "En atención",
    prometido_min: 50,
    minutosOriginales: 41,
    mapa_x: 34,
    mapa_y: 26,
    novedades: [
      {
        haceMin: 6,
        autor: "Agente de seguimiento",
        texto: "El proveedor confirma que el vehículo quedó asegurado; inicia maniobra de rescate.",
      },
    ],
  },
  {
    placa: "PLM-558",
    tipo_servicio: "Asistencia jurídica",
    causa: "Accidente",
    ciudad: "Barranquilla",
    ubicacion: "Circunvalar con Cra 38",
    destino: "Fiscalía URI Barranquilla",
    km_traslado: 9,
    tipo_vehiculo: "Liviano",
    etapa: "Traslado",
    prometido_min: 60,
    minutosOriginales: 88,
    mapa_x: 41,
    mapa_y: 12,
    motivo_traspaso: "Accidente con lesionado reportado por el conductor",
    novedades: [
      {
        haceMin: 70,
        autor: "Supervisor · Laura Díaz",
        texto: "Tomo el caso: hay un tercero lesionado. Aviso a HSE y al director regional.",
      },
    ],
  },
  {
    placa: "ZVC-117",
    tipo_servicio: "Carro taller",
    causa: "Avería",
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
    causa: "Avería",
    ciudad: "Neiva",
    ubicacion: "Vía Neiva-Campoalegre km 8",
    tipo_vehiculo: "Liviano",
    etapa: "Trámite",
    prometido_min: 45,
    minutosOriginales: 35,
    minutosSinCambio: 22,
    mapa_x: 36,
    mapa_y: 66,
    novedades: [
      {
        haceMin: 12,
        autor: "Agente de radicación",
        texto:
          "Segundo intento de radicación: la línea de Mapfre no contesta. Reintento automático en curso.",
      },
    ],
  },
  {
    placa: "BTR-776",
    tipo_servicio: "Grúa de gran tonelaje",
    causa: "Avería",
    ciudad: "Bogotá",
    ubicacion: "Calle 80 con Cra 100",
    destino: "Planta Tocancipá",
    km_traslado: 47,
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
    causa: "Avería",
    ciudad: "Bogotá",
    ubicacion: "Autopista Norte km 21",
    destino: "Taller International, Chía",
    km_traslado: 72,
    tipo_vehiculo: "Pesado",
    etapa: "Asignado",
    prometido_min: 60,
    minutosOriginales: 75,
    minutosSinCambio: 41,
    mapa_x: 41,
    mapa_y: 32,
    excedentes: [
      {
        concepto: "Kilometraje adicional",
        detalle: "Traslado de 72 km frente a tope de 50 km (22 km extra)",
        valor: 264000,
        estado: "Pendiente aprobación",
      },
    ],
  },
  {
    placa: "DRC-330",
    tipo_servicio: "Rescate",
    causa: "Avería",
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
    causa: "Avería",
    ciudad: "Cali",
    ubicacion: "Vía Cali-Jamundí",
    tipo_vehiculo: "Pesado",
    etapa: "Llegada a sitio",
    prometido_min: 45,
    minutosOriginales: 67,
    mapa_x: 31,
    mapa_y: 60,
    excepcion: "Proveedor no llega",
    motivo_traspaso: "Proveedor sin llegar 22 min después del tiempo prometido",
    novedades: [
      {
        haceMin: 20,
        autor: "Agente de seguimiento",
        texto: "El técnico no contesta. Mapfre reporta que sigue en otro servicio en Jamundí.",
      },
      {
        haceMin: 8,
        autor: "Supervisor · Laura Díaz",
        texto: "Solicito a Mapfre reasignar proveedor. Escalado al director regional.",
      },
    ],
  },
  {
    placa: "MZN-341",
    tipo_servicio: "Movilidad del conductor",
    causa: "Avería",
    ciudad: "Barranquilla",
    ubicacion: "Vía 40 con Calle 72",
    destino: "CEDI Barranquilla",
    km_traslado: 12,
    tipo_vehiculo: "Liviano",
    etapa: "Finalizado",
    prometido_min: 45,
    minutosOriginales: 110,
    mapa_x: 42,
    mapa_y: 14,
    excedentes: [
      {
        concepto: "Peajes",
        detalle: "Peaje Papiros ida y regreso",
        valor: 24600,
        estado: "Aprobado",
      },
    ],
  },
  {
    placa: "RDF-405",
    tipo_servicio: "Asistencia jurídica",
    causa: "Accidente",
    ciudad: "Neiva",
    ubicacion: "Av. Circunvalar con Calle 19",
    tipo_vehiculo: "Liviano",
    etapa: "Cierre",
    prometido_min: 60,
    minutosOriginales: 180,
    mapa_x: 35,
    mapa_y: 68,
    excepcion: "Reclamo del usuario",
    encuesta: {
      nps: 4,
      comentario: "El abogado llegó tarde y no explicó bien el proceso del comparendo.",
    },
    excedentes: [
      {
        concepto: "Servicio adicional",
        detalle: "Segunda visita del abogado no solicitada por INDEGA",
        valor: 150000,
        estado: "Objetado",
      },
    ],
  },
  {
    placa: "TNP-673",
    tipo_servicio: "Rescate",
    causa: "Accidente",
    ciudad: "Bogotá",
    ubicacion: "Vía Bogotá-La Calera km 6",
    destino: "CEDI Fontibón",
    km_traslado: 29,
    tipo_vehiculo: "Liviano",
    etapa: "Traslado",
    prometido_min: 50,
    minutosOriginales: 54,
    mapa_x: 39,
    mapa_y: 33,
  },
  {
    placa: "SXM-118",
    tipo_servicio: "Carro taller",
    causa: "Avería",
    ciudad: "Bogotá",
    ubicacion: "Av. Boyacá con Calle 13",
    tipo_vehiculo: "Liviano",
    etapa: "Creación",
    prometido_min: 45,
    minutosOriginales: 4,
    mapa_x: 38,
    mapa_y: 35,
    excepcion: "Servicio no cubierto",
    motivo_traspaso: "Placa fuera de la cartera asegurada: requiere aprobación de INDEGA",
  },
  {
    placa: "LKP-219",
    tipo_servicio: "Grúa de gran tonelaje",
    causa: "Avería",
    ciudad: "Medellín",
    ubicacion: "Autopista Medellín-Bogotá km 30",
    tipo_vehiculo: "Pesado",
    etapa: "Asignado",
    prometido_min: 60,
    minutosOriginales: 32,
    mapa_x: 35,
    mapa_y: 27,
    excepcion: "Cancelado",
    novedades: [
      {
        haceMin: 10,
        autor: "Agente de comunicación",
        texto: "El conductor logró encender el vehículo. Servicio cancelado ante Mapfre sin costo.",
      },
    ],
  },
  {
    placa: "FCT-482",
    tipo_servicio: "Grúa liviana",
    causa: "Avería",
    ciudad: "Medellín",
    ubicacion: "Av. Las Vegas con Calle 10",
    destino: "Taller Mazda, El Poblado",
    km_traslado: 9,
    tipo_vehiculo: "Liviano",
    etapa: "Trámite",
    prometido_min: 45,
    minutosOriginales: 20,
    minutosSinCambio: 6,
    mapa_x: 33,
    mapa_y: 27,
  },
  {
    placa: "NRW-317",
    tipo_servicio: "Grúa liviana",
    causa: "Accidente",
    ciudad: "Cali",
    ubicacion: "Calle 5 con Cra 66",
    destino: "Taller Kia, Av. Roosevelt",
    km_traslado: 11,
    tipo_vehiculo: "Liviano",
    etapa: "Asignado",
    prometido_min: 45,
    minutosOriginales: 38,
    minutosSinCambio: 12,
    mapa_x: 30,
    mapa_y: 59,
  },
  {
    placa: "BGH-256",
    tipo_servicio: "Conductor elegido",
    causa: "Solicitud",
    ciudad: "Bogotá",
    ubicacion: "Zona T, Calle 82 con Cra 12",
    destino: "Conjunto Cedritos, Calle 140",
    km_traslado: 14,
    tipo_vehiculo: "Liviano",
    etapa: "Creación",
    prometido_min: 40,
    minutosOriginales: 3,
    mapa_x: 39,
    mapa_y: 35,
  },
  {
    placa: "ZPL-904",
    tipo_servicio: "Conductor elegido",
    causa: "Solicitud",
    ciudad: "Medellín",
    ubicacion: "Parque Lleras, El Poblado",
    destino: "Laureles, Cra 70",
    km_traslado: 7,
    tipo_vehiculo: "Liviano",
    etapa: "Asignado",
    prometido_min: 40,
    minutosOriginales: 36,
    minutosSinCambio: 14,
    mapa_x: 34,
    mapa_y: 26,
  },
  {
    placa: "CMV-662",
    tipo_servicio: "Grúa de gran tonelaje",
    causa: "Avería",
    ciudad: "Barranquilla",
    ubicacion: "Vía 40 km 5, zona industrial",
    destino: "Taller Kenworth, Malambo",
    km_traslado: 22,
    tipo_vehiculo: "Pesado",
    etapa: "Trámite",
    prometido_min: 60,
    minutosOriginales: 19,
    minutosSinCambio: 9,
    mapa_x: 41,
    mapa_y: 13,
  },
  {
    placa: "TQW-571",
    tipo_servicio: "Carro taller",
    causa: "Avería",
    ciudad: "Bogotá",
    ubicacion: "Calle 100 con Autopista Norte",
    tipo_vehiculo: "Liviano",
    etapa: "Llegada a sitio",
    prometido_min: 45,
    minutosOriginales: 30,
    mapa_x: 40,
    mapa_y: 33,
  },
  {
    placa: "RHD-308",
    tipo_servicio: "Grúa liviana",
    causa: "Avería",
    ciudad: "Neiva",
    ubicacion: "Carrera 5 con Calle 21",
    destino: "Taller Nissan, Neiva",
    km_traslado: 6,
    tipo_vehiculo: "Liviano",
    etapa: "Asignado",
    prometido_min: 45,
    minutosOriginales: 20,
    minutosSinCambio: 8,
    mapa_x: 36,
    mapa_y: 67,
  },
];

const NUMERO_INICIAL = 1040;

function expedientePara(numero: number) {
  return `MAP-26-${String(480000 + numero * 37).padStart(6, "0")}`;
}

function nuevoInterno(
  base: Omit<
    CasoInterno,
    | "proveedor"
    | "expediente"
    | "cobertura"
    | "atendido_por"
    | "cambiosFijos"
    | "novedadesFijas"
    | "contactosProveedorFijos"
    | "cliente"
    | "campana"
  > & { motivo_traspaso: string | null },
): CasoInterno {
  const cob = validarCobertura(base.placa, base.tipo_servicio);
  const ord = ETAPAS.indexOf(base.etapa);
  return {
    ...base,
    cliente: cob.vehiculo?.cliente ?? "Sin cliente",
    campana: cob.vehiculo?.campana ?? "Sin campaña",
    cobertura: cob.estado,
    proveedor:
      ord >= ETAPAS.indexOf("Asignado") ? proveedorPara(base.tipo_servicio, base.ciudad) : null,
    expediente: ord >= ETAPAS.indexOf("Trámite") ? expedientePara(base.numero) : null,
    atendido_por: base.motivo_traspaso ? "Supervisor humano" : "Agente IA",
    cambiosFijos: [],
    novedadesFijas: [],
    contactosProveedorFijos: [],
  };
}

const casos: CasoInterno[] = CASOS_SEMILLA.map((s, i) =>
  nuevoInterno({
    // La placa hace de id estable: un UUID aleatorio cambiaría en cada
    // carga de página y rompería cualquier link compartido.
    id: s.placa,
    numero: NUMERO_INICIAL + i,
    placa: s.placa,
    tipo_servicio: s.tipo_servicio,
    causa: s.causa,
    ciudad: s.ciudad,
    ubicacion: s.ubicacion,
    destino: s.destino ?? null,
    km_traslado: s.km_traslado ?? null,
    tipo_vehiculo: s.tipo_vehiculo,
    etapa: s.etapa,
    prometido_min: s.prometido_min,
    mapa_x: s.mapa_x,
    mapa_y: s.mapa_y,
    origen: "Agente IA · WhatsApp",
    excepcion: s.excepcion ?? null,
    motivo_traspaso: s.motivo_traspaso ?? null,
    responsable: s.responsable ?? (s.motivo_traspaso ? "Laura Díaz" : null),
    estado_seguimiento: s.motivo_traspaso ? "En contacto" : "Pendiente",
    razon_atraso: s.razon_atraso ?? s.motivo_traspaso ?? null,
    excedentes: (s.excedentes ?? []).map((e, j) => ({ ...e, id: `${s.placa}-exc-${j}` })),
    encuesta: s.encuesta ?? null,
    minutosOriginales: s.minutosOriginales,
    minutosSinCambio: s.minutosSinCambio,
    novedadesRelativas: s.novedades,
  }),
);

let siguienteNumero = NUMERO_INICIAL + casos.length;

function creadoEnMs(c: CasoInterno, ahoraMs: number): number {
  return c.minutosOriginales != null
    ? ahoraMs - c.minutosOriginales * 60_000
    : new Date(c.creadoEnFijo!).getTime();
}

// Reparte el tiempo transcurrido entre las etapas alcanzadas. Los cambios
// hechos a mano (Registrar actualización) conservan su hora real.
function generarEventos(c: CasoInterno, ahoraMs: number): EventoCaso[] {
  const creadoMs = creadoEnMs(c, ahoraMs);
  const ordActual = ETAPAS.indexOf(c.etapa) + 1;
  const fijos = new Map(c.cambiosFijos.map((f) => [f.etapa, new Date(f.en).getTime()]));
  const ordBase = Math.max(
    1,
    ...ETAPAS.map((e, i) => (fijos.has(e) ? 0 : i + 1)).filter((o) => o <= ordActual),
  );
  const finBaseMs =
    c.minutosSinCambio != null && ordBase === ordActual
      ? ahoraMs - c.minutosSinCambio * 60_000
      : null;
  const transcurridoMs = Math.max(0, ahoraMs - creadoMs);
  const segmentoMs =
    finBaseMs != null
      ? (finBaseMs - creadoMs) / Math.max(ordBase - 1, 1)
      : transcurridoMs / Math.max(ordBase, 1);

  const eventos: EventoCaso[] = [];
  for (let ord = 1; ord <= ordActual; ord++) {
    const etapa = ETAPAS[ord - 1]!;
    const ms = fijos.get(etapa) ?? creadoMs + (ord - 1) * segmentoMs;
    eventos.push({
      id: `${c.id}-evt-${ord}`,
      caso_id: c.id,
      etapa,
      ocurrido_en: new Date(ms).toISOString(),
      nota: ord === 1 ? (c.notaCreacion ?? null) : null,
    });
  }
  return eventos;
}

function aCaso(c: CasoInterno, ahoraMs: number): Caso {
  const eventos = generarEventos(c, ahoraMs);
  const novedades: Novedad[] = [
    ...(c.novedadesRelativas ?? []).map((n) => ({
      en: new Date(ahoraMs - n.haceMin * 60_000).toISOString(),
      autor: n.autor,
      texto: n.texto,
    })),
    ...c.novedadesFijas,
  ].sort((a, b) => new Date(a.en).getTime() - new Date(b.en).getTime());
  const {
    minutosOriginales: _mo,
    minutosSinCambio: _msc,
    novedadesRelativas: _nr,
    creadoEnFijo: _cf,
    cambiosFijos: _cfs,
    novedadesFijas: _nf,
    contactosProveedorFijos: _cpf,
    notaCreacion: _nc,
    ...resto
  } = c;
  return {
    ...resto,
    creado_en: new Date(creadoEnMs(c, ahoraMs)).toISOString(),
    ultimo_cambio_en: eventos[eventos.length - 1]!.ocurrido_en,
    novedades,
    contactos_proveedor: c.contactosProveedorFijos,
  };
}

export function vehiculoDe(caso: Pick<Caso, "placa">): Vehiculo | undefined {
  return buscarVehiculo(caso.placa);
}

export function topeKm(caso: Caso) {
  const v = vehiculoDe(caso);
  return v ? COBERTURA_POR_TIPO[v.tipo_vehiculo].tope_km : 0;
}

// Notificaciones enviadas según la matriz de comunicación: se derivan de
// los hitos del caso para que la demo sea coherente con su etapa.
export function notificacionesDe(
  caso: Caso,
  eventos: EventoCaso[],
  ahora: number = Date.now(),
): Notificacion[] {
  const v = vehiculoDe(caso);
  const regional = v ? REGIONALES[v.regional] : undefined;
  const destinatarios: Record<string, string> = {
    Conductor: v ? `${v.conductor} · ${v.telefono_conductor}` : "Conductor",
    "Jefe inmediato": v?.jefe_inmediato ?? "Jefe inmediato",
    "Director regional": regional
      ? `${regional.director} · Regional ${v!.regional}`
      : "Director regional",
    "Director de flota": DIRECTOR_FLOTA.correo,
    "HSE y seguridad vial": HSE.correo,
  };
  const out: Notificacion[] = [];
  const push = (en: string, disparador: Disparador, mensaje: string) => {
    for (const fila of MATRIZ_COMUNICACION) {
      if (!fila.disparadores.includes(disparador)) continue;
      out.push({
        id: `${caso.id}-${out.length}`,
        en,
        actor: fila.actor,
        destinatario: destinatarios[fila.actor]!,
        canal: fila.canal,
        mensaje,
        estado: ahora - new Date(en).getTime() > 3 * 60_000 ? "Leído" : "Entregado",
      });
    }
  };
  for (const e of eventos) {
    if (e.etapa === "Creación") {
      push(
        e.ocurrido_en,
        "Nuevo incidente",
        `Nuevo incidente #${caso.numero}: ${caso.placa} · ${caso.tipo_servicio} en ${caso.ciudad}.`,
      );
      if (caso.causa === "Accidente")
        push(
          e.ocurrido_en,
          "Accidente",
          `Accidente de tránsito reportado: ${caso.placa} en ${caso.ubicacion}.`,
        );
    } else if (e.etapa === "Asignado") {
      push(
        e.ocurrido_en,
        "Cada hito",
        `Proveedor asignado: ${caso.proveedor ?? "por confirmar"}. Llegada estimada en ${caso.prometido_min} min.`,
      );
    } else if (e.etapa === "Finalizado") {
      push(e.ocurrido_en, "Cierre", `Servicio #${caso.numero} finalizado.`);
    } else if (e.etapa === "Cierre") {
      push(e.ocurrido_en, "Encuesta", "Encuesta de satisfacción enviada al conductor.");
    } else {
      push(e.ocurrido_en, "Cada hito", `Caso #${caso.numero}: etapa ${e.etapa}.`);
    }
  }
  const creado = new Date(caso.creado_en).getTime();
  if (minutosTranscurridos(caso, ahora) >= caso.prometido_min * 0.75 && esAbierto(caso)) {
    push(
      new Date(creado + caso.prometido_min * 0.75 * 60_000).toISOString(),
      "Escalamiento",
      `Aviso preventivo: ${caso.placa} lleva el 75% del tiempo prometido.`,
    );
  }
  if (minutosTranscurridos(caso, ahora) >= caso.prometido_min && esAbierto(caso)) {
    push(
      new Date(creado + caso.prometido_min * 60_000).toISOString(),
      "Escalamiento",
      `Incumplimiento: ${caso.placa} superó los ${caso.prometido_min} min prometidos.`,
    );
  }
  if (caso.responsable && caso.motivo_traspaso) {
    out.push({
      id: `${caso.id}-responsable`,
      en: caso.creado_en,
      actor: "Sistema",
      destinatario: caso.responsable,
      canal: "Chat",
      mensaje: `Caso crítico asignado para seguimiento: ${caso.motivo_traspaso}`,
      estado: "Entregado",
    });
  }
  return out.sort((a, b) => new Date(b.en).getTime() - new Date(a.en).getTime());
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

// Casos con su cronología, para indicadores e informes.
export const casosConEventosQuery = {
  queryKey: ["casos", "con-eventos"],
  queryFn: async (): Promise<{ caso: Caso; eventos: EventoCaso[] }[]> => {
    const ahora = Date.now();
    return casos.map((c) => ({ caso: aCaso(c, ahora), eventos: generarEventos(c, ahora) }));
  },
  refetchInterval: 15000,
};

const CASO_NO_ENCONTRADO = "Caso no encontrado";

export function casoQuery(id: string) {
  return {
    queryKey: ["caso", id],
    queryFn: async (): Promise<{ caso: Caso; eventos: EventoCaso[] }> => {
      const c = casos.find((x) => x.id === id);
      if (!c) throw new Error(CASO_NO_ENCONTRADO);
      const ahora = Date.now();
      return { caso: aCaso(c, ahora), eventos: generarEventos(c, ahora) };
    },
    // Un id inexistente no se arregla reintentando: sin esto React Query
    // reintenta 3 veces con backoff (~7 s en "Cargando caso…").
    retry: (fallos: number, error: Error) => error.message !== CASO_NO_ENCONTRADO && fallos < 3,
  };
}

export async function crearCaso(input: {
  placa: string;
  tipo_servicio: string;
  causa: Caso["causa"];
  ciudad: string;
  ubicacion: string;
  destino: string | null;
  tipo_vehiculo: string;
  prometido_min: number;
}): Promise<Caso> {
  const coord = COORD_CIUDAD[input.ciudad] ?? { x: 38, y: 40 };
  const ahora = Date.now();
  const cob = validarCobertura(input.placa, input.tipo_servicio);
  const nuevo = nuevoInterno({
    id: crypto.randomUUID(),
    numero: siguienteNumero++,
    ...input,
    km_traslado: input.destino ? 18 + Math.round(Math.random() * 40) : null,
    etapa: "Creación",
    mapa_x: coord.x + (Math.random() * 4 - 2),
    mapa_y: coord.y + (Math.random() * 4 - 2),
    origen: "Agente IA · WhatsApp",
    excepcion: cob.estado === "Cubierto" ? null : "Servicio no cubierto",
    responsable: cob.estado === "Cubierto" ? null : "Laura Díaz",
    estado_seguimiento: cob.estado === "Cubierto" ? "Pendiente" : "En contacto",
    razon_atraso:
      cob.estado === "Cubierto"
        ? null
        : `${cob.estado}: requiere aprobación de INDEGA antes de radicar`,
    motivo_traspaso:
      cob.estado === "Cubierto"
        ? null
        : `${cob.estado}: requiere aprobación de INDEGA antes de radicar`,
    excedentes: [],
    encuesta: null,
    creadoEnFijo: new Date(ahora).toISOString(),
    notaCreacion: "Caso creado por el agente de IA a partir del reporte del conductor.",
  });
  casos.push(nuevo);
  return aCaso(nuevo, ahora);
}

// --- Acciones de supervisión (Registrar actualización) -----------------

function buscarInterno(id: string) {
  const c = casos.find((x) => x.id === id);
  if (!c) throw new Error(CASO_NO_ENCONTRADO);
  return c;
}

function registrar(c: CasoInterno, autor: string, texto: string) {
  c.novedadesFijas.push({ en: new Date().toISOString(), autor, texto });
}

export async function avanzarEtapa(id: string, autor = "Supervisor · Laura Díaz") {
  const c = buscarInterno(id);
  const ord = ETAPAS.indexOf(c.etapa);
  if (ord >= ETAPAS.length - 1) return;
  // Traslado solo aplica si hay destino.
  let siguiente = ETAPAS[ord + 1]!;
  if (siguiente === "Traslado" && !c.destino) siguiente = "Finalizado";
  c.etapa = siguiente;
  c.cambiosFijos.push({ etapa: siguiente, en: new Date().toISOString() });
  if (siguiente === "Trámite") c.expediente = expedientePara(c.numero);
  if (siguiente === "Asignado") c.proveedor = proveedorPara(c.tipo_servicio, c.ciudad);
  if (siguiente === "Cierre" && !c.encuesta)
    c.encuesta = { nps: 9, comentario: "Buena atención, el técnico explicó todo." };
  if (
    c.excepcion === "Proveedor no llega" &&
    ETAPAS.indexOf(siguiente) > ETAPAS.indexOf("Llegada a sitio")
  )
    c.excepcion = null;
  registrar(c, autor, `Etapa actualizada a "${siguiente}".`);
}

export async function registrarNovedad(
  id: string,
  texto: string,
  autor = "Supervisor · Laura Díaz",
) {
  registrar(buscarInterno(id), autor, texto);
}

export async function marcarExcepcion(
  id: string,
  excepcion: Excepcion | null,
  autor = "Supervisor · Laura Díaz",
) {
  const c = buscarInterno(id);
  c.excepcion = excepcion;
  registrar(c, autor, excepcion ? `Estado de excepción: ${excepcion}.` : "Excepción resuelta.");
}

export async function traspasarASupervisor(id: string, motivo: string) {
  const c = buscarInterno(id);
  c.atendido_por = "Supervisor humano";
  c.motivo_traspaso = motivo;
  c.responsable ??= "Laura Díaz";
  c.estado_seguimiento = "Pendiente";
  c.razon_atraso = motivo;
  registrar(c, "Agente IA", `Caso traspasado a supervisión humana: ${motivo}`);
}

export async function escalarCaso(id: string, motivo: string, responsable = "Laura Díaz") {
  const c = buscarInterno(id);
  c.atendido_por = "Supervisor humano";
  c.responsable = responsable;
  c.estado_seguimiento = "Pendiente";
  c.razon_atraso = motivo;
  c.motivo_traspaso = motivo;
  registrar(c, "Agente IA", `Caso escalado a ${responsable}: ${motivo}`);
}

export async function registrarContactoProveedor(
  id: string,
  input: {
    razon_atraso: string;
    compromiso: string;
    canal?: CanalContacto;
    autor?: string;
  },
) {
  const c = buscarInterno(id);
  const contacto: ContactoProveedor = {
    en: new Date().toISOString(),
    autor: input.autor ?? c.responsable ?? "Supervisor · Laura Díaz",
    proveedor: c.proveedor ?? "Proveedor pendiente de asignación",
    canal: input.canal ?? "Llamada",
    razon_atraso: input.razon_atraso,
    compromiso: input.compromiso,
  };
  c.contactosProveedorFijos.push(contacto);
  c.responsable ??= "Laura Díaz";
  c.estado_seguimiento = "En contacto";
  c.razon_atraso = input.razon_atraso;
  registrar(
    c,
    contacto.autor,
    `${contacto.canal} a ${contacto.proveedor}. Razón: ${input.razon_atraso}. Compromiso: ${input.compromiso}`,
  );
}

export async function actualizarSeguimiento(id: string, estado: EstadoSeguimiento) {
  const c = buscarInterno(id);
  c.estado_seguimiento = estado;
  registrar(c, c.responsable ?? "Supervisor · Laura Díaz", `Seguimiento actualizado a "${estado}".`);
}

export async function aprobarCobertura(id: string) {
  const c = buscarInterno(id);
  c.excepcion = null;
  c.cobertura = "Cubierto";
  c.motivo_traspaso = null;
  c.atendido_por = "Agente IA";
  registrar(
    c,
    "Director de Flota",
    "Servicio aprobado por INDEGA pese a estar fuera de cobertura. Se radica como servicio particular.",
  );
}

export async function resolverExcedente(
  casoId: string,
  excedenteId: string,
  estado: EstadoExcedente,
) {
  const c = buscarInterno(casoId);
  const e = c.excedentes.find((x) => x.id === excedenteId);
  if (!e) return;
  e.estado = estado;
  registrar(
    c,
    "Director de Flota",
    `Excedente "${e.concepto}" ${estado === "Aprobado" ? "aprobado" : "objetado"}.`,
  );
}
