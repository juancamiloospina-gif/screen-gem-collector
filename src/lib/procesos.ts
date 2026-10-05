import {
  VENTANA_PREDICTIVA_MIN,
  esAbierto,
  minutosRestantes,
  estaInactivo,
  minutosEnEtapa,
  porVencer,
  procesoDe,
  semaforo,
  type Caso,
  type Proceso,
  type Vencimiento,
} from "./casos";

export type CasoPorVencer = { caso: Caso; vence: Vencimiento };

// Casos abiertos que se vencen dentro de la ventana, del más urgente al menos.
export function casosPorVencer(
  casos: Caso[],
  ahora: number,
  ventana: number = VENTANA_PREDICTIVA_MIN,
): CasoPorVencer[] {
  return casos
    .map((caso) => ({ caso, vence: porVencer(caso, ahora, ventana) }))
    .filter((x): x is CasoPorVencer => x.vence !== null)
    .sort((a, b) => a.vence.minutos - b.vence.minutos);
}

export function resumenProceso(casos: Caso[], ahora: number, proceso: Proceso) {
  const lista = casos.filter((c) => esAbierto(c) && procesoDe(c) === proceso);
  const criticos = lista.filter((c) => semaforo(c, ahora) === "rojo");
  const venciendo = casosPorVencer(lista, ahora);
  const inactivos = lista.filter((c) => estaInactivo(c, ahora));
  const minutos = lista.map((c) => minutosEnEtapa(c, ahora));
  const promedioEtapa = minutos.length
    ? Math.round(minutos.reduce((s, m) => s + m, 0) / minutos.length)
    : 0;
  return { lista, criticos, venciendo, inactivos, promedioEtapa };
}

const ORDEN = { rojo: 0, amarillo: 1, verde: 2 } as const;

// Prioridad: primero lo que ya incumplió, luego lo más cerca de vencerse.
export function ordenarPorPrioridad(casos: Caso[], ahora: number) {
  return [...casos].sort(
    (a, b) =>
      ORDEN[semaforo(a, ahora)] - ORDEN[semaforo(b, ahora)] ||
      minutosRestantes(a, ahora) - minutosRestantes(b, ahora),
  );
}
