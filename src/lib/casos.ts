import { supabase } from "@/integrations/supabase/client";

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
  "Bogotá": { x: 39, y: 34 },
  "Medellín": { x: 33, y: 26 },
  "Barranquilla": { x: 41, y: 12 },
  "Cali": { x: 30, y: 58 },
  "Neiva": { x: 36, y: 66 },
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

export const casosQuery = {
  queryKey: ["casos"],
  queryFn: async (): Promise<Caso[]> => {
    const { data, error } = await supabase
      .from("casos")
      .select("*")
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Caso[];
  },
  refetchInterval: 15000,
};

export function casoQuery(id: string) {
  return {
    queryKey: ["caso", id],
    queryFn: async (): Promise<{ caso: Caso; eventos: EventoCaso[] }> => {
      const { data: caso, error } = await supabase.from("casos").select("*").eq("id", id).single();
      if (error) throw error;
      const { data: eventos, error: e2 } = await supabase
        .from("eventos_caso")
        .select("*")
        .eq("caso_id", id)
        .order("ocurrido_en", { ascending: true });
      if (e2) throw e2;
      return { caso: caso as Caso, eventos: (eventos ?? []) as EventoCaso[] };
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
}) {
  const coord = COORD_CIUDAD[input.ciudad] ?? { x: 38, y: 40 };
  const { data, error } = await supabase
    .from("casos")
    .insert({
      ...input,
      etapa: "Creación",
      mapa_x: coord.x + (Math.random() * 4 - 2),
      mapa_y: coord.y + (Math.random() * 4 - 2),
      origen: "Agente IA",
    })
    .select("*")
    .single();
  if (error) throw error;
  const caso = data as Caso;
  await supabase.from("eventos_caso").insert({
    caso_id: caso.id,
    etapa: "Creación",
    nota: "Caso creado por el agente de IA a partir del reporte del conductor.",
  });
  return caso;
}
