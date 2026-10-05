// Red de proveedores conectada (datos inventados). Cada proveedor es una
// unidad (grúa, carro taller o conductor elegido) con un estado:
//   Disponible    en su base, dentro de la zona de la ciudad
//   Ocupado       atendiendo otro servicio
//   Fuera de zona más allá del radio de cobertura de la ciudad
// La oferta se compara con la demanda: casos abiertos que aún necesitan una
// unidad (en toma, trámite o asignación) o que hay que reasignar.
import { CIUDAD_LATLON } from "./geo";
import { esAbierto, FAMILIAS, familiaDe, type Caso, type Familia, type Semaforo } from "./casos";

export type EstadoProveedor = "Disponible" | "Ocupado" | "Fuera de zona";
export const ESTADOS_PROVEEDOR: EstadoProveedor[] = ["Disponible", "Ocupado", "Fuera de zona"];

export type Proveedor = {
  id: string;
  nombre: string;
  ciudad: string;
  familia: Familia;
  estado: EstadoProveedor;
  lat: number;
  lon: number;
  detalle: string;
};

export const RADIO_ZONA_KM = 15;

// [disponibles, ocupados, fuera de zona] por ciudad y servicio crítico.
type Terna = [number, number, number];
const CAPACIDAD: Record<string, Record<Familia, Terna>> = {
  Bogotá: {
    "Grúa liviana": [4, 3, 1],
    "Grúa pesada": [1, 2, 1],
    "Carro taller": [2, 1, 0],
    CE: [3, 2, 0],
  },
  Medellín: {
    "Grúa liviana": [2, 2, 1],
    "Grúa pesada": [1, 1, 1],
    "Carro taller": [1, 1, 0],
    CE: [2, 1, 0],
  },
  Barranquilla: {
    "Grúa liviana": [2, 1, 0],
    "Grúa pesada": [0, 1, 2],
    "Carro taller": [1, 0, 1],
    CE: [1, 1, 0],
  },
  Cali: {
    "Grúa liviana": [2, 1, 1],
    "Grúa pesada": [1, 1, 0],
    "Carro taller": [0, 2, 1],
    CE: [1, 0, 1],
  },
  Neiva: {
    "Grúa liviana": [1, 0, 1],
    "Grúa pesada": [0, 1, 1],
    "Carro taller": [1, 0, 0],
    CE: [1, 0, 0],
  },
};

const NOMBRE_BASE: Record<Familia, string> = {
  "Grúa liviana": "Grúas Express",
  "Grúa pesada": "Grúas Gran Tonelaje",
  "Carro taller": "Taller Móvil",
  CE: "Conductor Elegido",
};

// Azar determinista: la misma red en cada carga, sin depender de Math.random.
function azar(clave: string) {
  let h = 2166136261;
  for (const ch of clave) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function generar(): Proveedor[] {
  const lista: Proveedor[] = [];
  for (const [ciudad, porFamilia] of Object.entries(CAPACIDAD)) {
    const [lat0, lon0] = CIUDAD_LATLON[ciudad]!;
    for (const familia of FAMILIAS) {
      const terna = porFamilia[familia];
      let n = 0;
      ESTADOS_PROVEEDOR.forEach((estado, e) => {
        for (let k = 0; k < terna[e]!; k++) {
          n++;
          const id = `${ciudad}-${familia}-${n}`;
          const angulo = azar(`${id}a`) * Math.PI * 2;
          const radio =
            estado === "Fuera de zona"
              ? 0.17 + azar(`${id}r`) * 0.12
              : 0.02 + azar(`${id}r`) * 0.08;
          const km = Math.round(radio * 111);
          const detalle =
            estado === "Disponible"
              ? `En base · llega en ~${6 + Math.round(azar(`${id}t`) * 14)} min`
              : estado === "Ocupado"
                ? `En servicio · libre en ~${15 + Math.round(azar(`${id}t`) * 40)} min`
                : `A ${km} km de ${ciudad} · fuera del radio de ${RADIO_ZONA_KM} km`;
          lista.push({
            id,
            nombre: `${NOMBRE_BASE[familia]} ${ciudad} · U${n}`,
            ciudad,
            familia,
            estado,
            lat: lat0 + Math.sin(angulo) * radio,
            lon: lon0 + Math.cos(angulo) * radio,
            detalle,
          });
        }
      });
    }
  }
  return lista;
}

export const PROVEEDORES: Proveedor[] = generar();

export type Celda = {
  disponibles: number;
  ocupados: number;
  fuera: number;
  demanda: number;
  // disponibles - demanda: negativo = faltan unidades
  balance: number;
};
export type CapacidadCiudad = Celda & { ciudad: string; porFamilia: Record<Familia, Celda> };

// Casos que todavía necesitan una unidad: aún sin proveedor en camino, o
// con proveedor que no llegó. Los no cubiertos esperan aprobación y no
// consumen capacidad.
export function consumeCapacidad(caso: Caso) {
  if (!esAbierto(caso) || caso.cobertura !== "Cubierto") return false;
  return (
    caso.etapa === "Creación" ||
    caso.etapa === "Trámite" ||
    caso.etapa === "Asignado" ||
    caso.excepcion === "Proveedor no llega"
  );
}

export function semaforoBalance(balance: number): Semaforo {
  return balance < 0 ? "rojo" : balance === 0 ? "amarillo" : "verde";
}

export function etiquetaBalance(balance: number) {
  return balance < 0 ? `Déficit ${balance}` : balance === 0 ? "Sin holgura" : `Holgura +${balance}`;
}

export type EstadoCiudad = {
  semaforo: Semaforo;
  etiqueta: string;
  deficits: { familia: Familia; balance: number }[];
};

// Estado de una ciudad según su peor servicio: la holgura de una grúa
// liviana no cubre el déficit de una grúa pesada, así que no se suman.
export function estadoCiudad(c: CapacidadCiudad): EstadoCiudad {
  const activas = FAMILIAS.filter((f) => {
    const x = c.porFamilia[f];
    return x.disponibles + x.ocupados + x.fuera + x.demanda > 0;
  });
  const deficits = activas
    .filter((f) => c.porFamilia[f].balance < 0)
    .map((f) => ({ familia: f, balance: c.porFamilia[f].balance }));
  const sinHolgura = activas.filter(
    (f) => c.porFamilia[f].balance === 0 && c.porFamilia[f].demanda > 0,
  );
  if (deficits.length)
    return {
      semaforo: "rojo",
      etiqueta: `Déficit · ${deficits.map((d) => d.familia).join(", ")}`,
      deficits,
    };
  if (sinHolgura.length)
    return { semaforo: "amarillo", etiqueta: `Sin holgura · ${sinHolgura.join(", ")}`, deficits };
  return { semaforo: "verde", etiqueta: "Holgura", deficits };
}

function celdaVacia(): Celda {
  return { disponibles: 0, ocupados: 0, fuera: 0, demanda: 0, balance: 0 };
}

export function capacidadPorCiudad(
  casos: Caso[],
  proveedores: Proveedor[] = PROVEEDORES,
): CapacidadCiudad[] {
  return Object.keys(CIUDAD_LATLON).map((ciudad) => {
    const porFamilia = Object.fromEntries(FAMILIAS.map((f) => [f, celdaVacia()])) as Record<
      Familia,
      Celda
    >;
    const total = celdaVacia();
    for (const p of proveedores.filter((x) => x.ciudad === ciudad)) {
      const campo =
        p.estado === "Disponible" ? "disponibles" : p.estado === "Ocupado" ? "ocupados" : "fuera";
      porFamilia[p.familia][campo]++;
      total[campo]++;
    }
    for (const c of casos) {
      const f = familiaDe(c.tipo_servicio);
      if (c.ciudad !== ciudad || !f || !consumeCapacidad(c)) continue;
      porFamilia[f].demanda++;
      total.demanda++;
    }
    for (const f of FAMILIAS)
      porFamilia[f].balance = porFamilia[f].disponibles - porFamilia[f].demanda;
    total.balance = total.disponibles - total.demanda;
    return { ciudad, ...total, porFamilia };
  });
}
