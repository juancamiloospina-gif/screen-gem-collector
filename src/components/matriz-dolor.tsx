import { useState } from "react";
import { Timer } from "lucide-react";
import { Panel } from "@/components/ops";
import {
  ETIQUETA_FAMILIA,
  FAMILIAS,
  esAbierto,
  familiaDe,
  porVencer,
  semaforo,
  type Caso,
  type Familia,
} from "@/lib/casos";
import { CIUDAD_LATLON } from "@/lib/geo";
import { capacidadPorCiudad, semaforoBalance, type Celda } from "@/lib/red";

export type Lente = "criticos" | "red";

const TONO_CELDA = {
  rojo: "bg-sla-red/15 text-sla-red",
  amarillo: "bg-sla-amber/15 text-sla-amber",
  verde: "bg-sla-green/10 text-sla-green",
  vacio: "bg-ops-deep/40 text-ops-muted",
};

type Conteo = { criticos: number; venciendo: number; total: number };

function contar(lista: Caso[], ahora: number): Conteo {
  return {
    total: lista.length,
    criticos: lista.filter((c) => semaforo(c, ahora) === "rojo").length,
    venciendo: lista.filter((c) => porVencer(c, ahora) !== null).length,
  };
}

// Dónde está el dolor: ciudades en filas, servicios críticos en columnas.
// Dos lentes: casos críticos, u oferta contra demanda de la red.
export function MatrizDolor({
  casos,
  ahora,
  ciudad,
  familia,
  onSelect,
  lenteInicial = "criticos",
}: {
  lenteInicial?: Lente;
  casos: Caso[];
  ahora: number;
  ciudad: string | null;
  familia: Familia | null;
  onSelect: (ciudad: string | null, familia: Familia | null) => void;
}) {
  const [lente, setLente] = useState<Lente>(lenteInicial);
  const abiertos = casos.filter(esAbierto);
  const ciudades = Object.keys(CIUDAD_LATLON);
  const capacidad = capacidadPorCiudad(casos);

  const elegir = (c: string | null, f: Familia | null) => {
    if (c === ciudad && f === familia) onSelect(null, null);
    else onSelect(c, f);
  };

  function Celdilla({ c, f }: { c: string | null; f: Familia | null }) {
    const sel = c === ciudad && f === familia;
    let tono: keyof typeof TONO_CELDA = "vacio";
    let principal = "–";
    let secundario = "";
    let venciendo = 0;

    if (lente === "criticos") {
      const lista = abiertos.filter(
        (x) => (!c || x.ciudad === c) && (!f || familiaDe(x.tipo_servicio) === f),
      );
      const n = contar(lista, ahora);
      principal = n.total ? String(n.criticos) : "–";
      secundario = n.total ? `de ${n.total}` : "";
      venciendo = n.venciendo;
      tono = !n.total ? "vacio" : n.criticos ? "rojo" : n.venciendo ? "amarillo" : "verde";
    } else {
      const filas = capacidad.filter((x) => !c || x.ciudad === c);
      const celdas: Celda[] = filas.map((x) => (f ? x.porFamilia[f] : x));
      const disp = celdas.reduce((s, x) => s + x.disponibles, 0);
      const dem = celdas.reduce((s, x) => s + x.demanda, 0);
      const bal = disp - dem;
      principal = bal > 0 ? `+${bal}` : String(bal);
      secundario = `${disp} disp · ${dem} dem`;
      // En agregados manda el peor servicio, no la suma.
      const hayDeficit = filas.some((x) =>
        FAMILIAS.some((ff) => (!f || ff === f) && x.porFamilia[ff].balance < 0),
      );
      tono = hayDeficit
        ? "rojo"
        : disp === 0 && dem === 0
          ? "amarillo"
          : ({ rojo: "rojo", amarillo: "amarillo", verde: "verde" } as const)[semaforoBalance(bal)];
      if (hayDeficit && !f) secundario = `${secundario} · déficit`;
    }

    return (
      <button
        type="button"
        onClick={() => elegir(c, f)}
        aria-pressed={sel}
        className={`flex min-h-14 flex-col items-center justify-center rounded-lg px-1 py-1.5 transition-shadow ${TONO_CELDA[tono]} ${
          sel ? "ring-2 ring-brand-sky" : "hover:ring-1 hover:ring-ops-line"
        }`}
      >
        <span className="font-display text-lg font-semibold leading-none">{principal}</span>
        {secundario && (
          <span className="mt-1 text-[9px] leading-none opacity-80">{secundario}</span>
        )}
        {venciendo > 0 && (
          <span className="mt-1 flex items-center gap-0.5 text-[9px] font-bold text-sla-amber">
            <Timer className="size-2.5" />
            {venciendo}
          </span>
        )}
      </button>
    );
  }

  const rejilla =
    "grid grid-cols-[76px_repeat(5,minmax(0,1fr))] gap-1.5 sm:grid-cols-[110px_repeat(5,minmax(0,1fr))]";

  return (
    <Panel
      eyebrow="Dónde está el dolor"
      titulo={
        lente === "criticos"
          ? "Casos críticos por ciudad y servicio"
          : "Oferta contra demanda por ciudad y servicio"
      }
      accion={
        <div className="flex gap-1" role="group" aria-label="Lente de la matriz">
          {(
            [
              ["criticos", "Críticos"],
              ["red", "Oferta vs demanda"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setLente(k)}
              className={`rounded-md border px-2.5 py-1 text-[10px] font-bold ${
                lente === k
                  ? "border-brand-sky bg-brand-blue/40 text-ops-ink"
                  : "border-ops-line text-ops-muted hover:text-ops-ink"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      }
    >
      <div className="space-y-1.5 p-4">
        <div className={rejilla}>
          <span />
          {FAMILIAS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => elegir(null, f)}
              className={`rounded-md px-1 py-1 text-center text-[9px] font-bold uppercase leading-tight tracking-wide hover:text-ops-ink ${
                familia === f && !ciudad ? "text-brand-sky" : "text-ops-muted"
              }`}
            >
              {ETIQUETA_FAMILIA[f]}
            </button>
          ))}
          <span className="px-1 py-1 text-center text-[9px] font-bold uppercase tracking-wide text-ops-muted">
            Total
          </span>
        </div>
        {ciudades.map((c) => (
          <div key={c} className={rejilla}>
            <button
              type="button"
              onClick={() => elegir(c, null)}
              className={`self-center truncate text-left text-xs font-bold hover:text-brand-sky ${
                ciudad === c && !familia ? "text-brand-sky" : ""
              }`}
            >
              {c}
            </button>
            {FAMILIAS.map((f) => (
              <Celdilla key={f} c={c} f={f} />
            ))}
            <Celdilla c={c} f={null} />
          </div>
        ))}
        <div className={`${rejilla} border-t border-ops-line pt-2`}>
          <span className="self-center text-xs font-bold text-ops-muted">Nacional</span>
          {FAMILIAS.map((f) => (
            <Celdilla key={f} c={null} f={f} />
          ))}
          <Celdilla c={null} f={null} />
        </div>
      </div>
      <p className="border-t border-ops-line px-5 py-3 text-[10px] leading-relaxed text-ops-muted">
        {lente === "criticos"
          ? "Número grande: casos que ya incumplieron. Debajo, el total abierto; el reloj ámbar cuenta los que se vencen en los próximos 10 min. Toca una celda para filtrar el tablero."
          : "Número grande: unidades disponibles menos casos que aún necesitan unidad (negativo = faltan). Toca una celda para filtrar el tablero y el mapa."}
      </p>
    </Panel>
  );
}
