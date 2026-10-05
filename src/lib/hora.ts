// Toda hora que muestra la plataforma es hora de Colombia, sin importar la
// zona del navegador de quien la mira (un cliente en Madrid o en Miami ve
// lo mismo que el centro de operaciones en Bogotá).
export const ZONA_COLOMBIA = "America/Bogota";

// Ciclo h23: la medianoche es 00:xx, no 24:xx.
const BASE = { timeZone: ZONA_COLOMBIA, hourCycle: "h23" } as const;

export function horaColombia(fecha: Date | number = new Date(), conSegundos = false) {
  return new Date(fecha).toLocaleTimeString("es-CO", {
    ...BASE,
    hour: "2-digit",
    minute: "2-digit",
    ...(conSegundos ? { second: "2-digit" as const } : {}),
  });
}

// "25 de sept., 13:57"
export function fechaHoraColombia(fecha: Date | string | number) {
  return new Date(fecha).toLocaleString("es-CO", {
    ...BASE,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "lunes, 5 de octubre"
export function fechaLargaColombia(fecha: Date | number = new Date()) {
  return new Date(fecha).toLocaleDateString("es-CO", {
    timeZone: ZONA_COLOMBIA,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
