// Cumplimiento del SLA (casos abiertos que no han superado el tiempo
// prometido) comparado contra la meta, con semáforo.
import {
  FAMILIAS,
  ETIQUETA_FAMILIA,
  esAbierto,
  familiaDe,
  semaforo,
  type Caso,
  type Familia,
  type Semaforo,
} from "./casos";
import { CIUDAD_LATLON } from "./geo";
import { SLA_CIUDADES_30D, SLA_CLIENTES_30D, SLA_FAMILIAS_30D } from "./historico";

export const META_SLA = 90;
export const META_SLA_FAMILIA: Record<Familia, number> = {
  "Grúa liviana": 90,
  "Grúa pesada": 80,
  "Carro taller": 90,
  CE: 95,
};

export type ResumenSla = {
  clave: string;
  etiqueta: string;
  // Cliente al que pertenece la fila (para agrupar campañas).
  grupo?: string;
  total: number;
  enRiesgo: number;
  incumplidos: number;
  // % de casos abiertos dentro del tiempo prometido; null si no hay casos.
  pct: number | null;
  pct30d: number | null;
  meta: number;
};

export function semaforoSla(pct: number | null, meta: number): Semaforo | null {
  if (pct === null) return null;
  if (pct >= meta) return "verde";
  if (pct >= meta - 10) return "amarillo";
  return "rojo";
}

function resumir(
  casos: Caso[],
  ahora: number,
  base: Pick<ResumenSla, "clave" | "etiqueta" | "meta" | "pct30d"> & { grupo?: string },
): ResumenSla {
  const abiertos = casos.filter(esAbierto);
  const incumplidos = abiertos.filter((c) => semaforo(c, ahora) === "rojo").length;
  const enRiesgo = abiertos.filter((c) => semaforo(c, ahora) === "amarillo").length;
  const total = abiertos.length;
  return {
    ...base,
    total,
    enRiesgo,
    incumplidos,
    pct: total ? Math.round(((total - incumplidos) / total) * 100) : null,
  };
}

export function slaGlobal(casos: Caso[], ahora: number) {
  return resumir(casos, ahora, { clave: "todo", etiqueta: "Nacional", meta: META_SLA, pct30d: 88 });
}

export function slaPorClienteCampana(casos: Caso[], ahora: number): ResumenSla[] {
  return SLA_CLIENTES_30D.map((f) =>
    resumir(
      casos.filter((c) => c.cliente === f.cliente && c.campana === f.campana),
      ahora,
      {
        clave: `${f.cliente}|${f.campana}`,
        etiqueta: f.campana,
        grupo: f.cliente,
        meta: f.meta,
        pct30d: f.pct,
      },
    ),
  );
}

export function slaPorCliente(casos: Caso[], ahora: number): ResumenSla[] {
  const clientes = [...new Set(SLA_CLIENTES_30D.map((f) => f.cliente))];
  return clientes.map((cliente) => {
    const filas = SLA_CLIENTES_30D.filter((f) => f.cliente === cliente);
    const casosCliente = filas.reduce((s, f) => s + f.casos, 0);
    return resumir(
      casos.filter((c) => c.cliente === cliente),
      ahora,
      {
        clave: cliente,
        etiqueta: cliente,
        meta: Math.round(filas.reduce((s, f) => s + f.meta, 0) / filas.length),
        pct30d: Math.round(filas.reduce((s, f) => s + f.pct * f.casos, 0) / casosCliente),
      },
    );
  });
}

export function slaPorCiudad(casos: Caso[], ahora: number): ResumenSla[] {
  return Object.keys(CIUDAD_LATLON).map((ciudad) =>
    resumir(
      casos.filter((c) => c.ciudad === ciudad),
      ahora,
      { clave: ciudad, etiqueta: ciudad, meta: META_SLA, pct30d: SLA_CIUDADES_30D[ciudad] ?? null },
    ),
  );
}

export function slaPorFamilia(casos: Caso[], ahora: number): ResumenSla[] {
  return FAMILIAS.map((f) =>
    resumir(
      casos.filter((c) => familiaDe(c.tipo_servicio) === f),
      ahora,
      {
        clave: f,
        etiqueta: ETIQUETA_FAMILIA[f],
        meta: META_SLA_FAMILIA[f],
        pct30d: SLA_FAMILIAS_30D[f] ?? null,
      },
    ),
  );
}
