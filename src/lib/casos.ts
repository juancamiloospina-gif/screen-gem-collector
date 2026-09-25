import type { Caso, Etapa } from "@/services/casos";

export type { Caso, Etapa };

export type Semaforo = "verde" | "amarillo" | "rojo";

const ETAPAS_CERRADAS: Etapa[] = ["Finalizado", "Cierre"];

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
  return !ETAPAS_CERRADAS.includes(caso.etapa);
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
