import { useState } from "react";
import { Panel } from "@/components/ops";
import { COLOR_SEMAFORO, type Caso } from "@/lib/casos";
import {
  semaforoSla,
  slaPorCiudad,
  slaPorCliente,
  slaPorClienteCampana,
  slaPorFamilia,
  type ResumenSla,
} from "@/lib/sla";

// Barra de cumplimiento: el color sale del semáforo contra la meta y la
// marca vertical indica dónde está la meta.
export function BarraSla({ pct, meta }: { pct: number | null; meta: number }) {
  const s = semaforoSla(pct, meta);
  return (
    <div className="relative h-2 rounded-full bg-ops-deep">
      {pct !== null && s && (
        <div
          className={`h-full rounded-full ${COLOR_SEMAFORO[s].fondo}`}
          style={{ width: `${pct}%` }}
        />
      )}
      <span
        className="absolute -top-1 h-4 w-0.5 rounded bg-ops-ink"
        style={{ left: `${meta}%` }}
        title={`Meta ${meta}%`}
      />
    </div>
  );
}

export function PctSla({ pct, meta }: { pct: number | null; meta: number }) {
  const s = semaforoSla(pct, meta);
  return (
    <span
      className={`font-data text-sm font-medium ${s ? COLOR_SEMAFORO[s].texto : "text-ops-muted"}`}
    >
      {pct === null ? "—" : `${pct}%`}
    </span>
  );
}

const DIMENSIONES = [
  ["cliente", "Cliente y campaña"],
  ["ciudad", "Ciudad"],
  ["servicio", "Servicio crítico"],
] as const;
type Dimension = (typeof DIMENSIONES)[number][0];

function Fila({ f, sub = false }: { f: ResumenSla; sub?: boolean }) {
  const s = semaforoSla(f.pct, f.meta);
  return (
    <li
      className={`grid items-center gap-x-4 gap-y-2 px-5 py-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_64px_64px_56px] ${sub ? "bg-ops-deep/30" : ""}`}
    >
      <div className={`flex items-center gap-2 ${sub ? "pl-4" : ""}`}>
        <span
          className={`size-2.5 shrink-0 rounded-full ${s ? COLOR_SEMAFORO[s].fondo : "bg-ops-line"}`}
        />
        <div className="min-w-0">
          <p className={`truncate text-xs ${sub ? "" : "font-bold"}`}>{f.etiqueta}</p>
          <p className="text-[10px] text-ops-muted">
            {f.total === 0
              ? "Sin casos abiertos"
              : `${f.total} abiertos${f.incumplidos ? ` · ${f.incumplidos} incumplidos` : ""}${f.enRiesgo ? ` · ${f.enRiesgo} en riesgo` : ""}`}
          </p>
        </div>
      </div>
      <BarraSla pct={f.pct} meta={f.meta} />
      <div className="flex items-baseline justify-between sm:block sm:text-right">
        <span className="text-[9px] uppercase text-ops-muted sm:hidden">Hoy</span>
        <PctSla pct={f.pct} meta={f.meta} />
      </div>
      <div className="flex items-baseline justify-between sm:block sm:text-right">
        <span className="text-[9px] uppercase text-ops-muted sm:hidden">30 días</span>
        <span className="font-data text-xs text-ops-muted">
          {f.pct30d === null ? "—" : `${f.pct30d}%`}
        </span>
      </div>
      <div className="flex items-baseline justify-between sm:block sm:text-right">
        <span className="text-[9px] uppercase text-ops-muted sm:hidden">Meta</span>
        <span className="font-data text-xs text-ops-muted">{f.meta}%</span>
      </div>
    </li>
  );
}

export function SlaPanel({
  casos,
  ahora,
  dimensionInicial = "cliente",
}: {
  casos: Caso[];
  ahora: number;
  dimensionInicial?: Dimension;
}) {
  const [dim, setDim] = useState<Dimension>(dimensionInicial);
  const clientes = dim === "cliente" ? slaPorCliente(casos, ahora) : [];
  const campanas = dim === "cliente" ? slaPorClienteCampana(casos, ahora) : [];
  const planas =
    dim === "ciudad"
      ? slaPorCiudad(casos, ahora)
      : dim === "servicio"
        ? slaPorFamilia(casos, ahora)
        : [];

  return (
    <Panel
      eyebrow="SLA contra la meta"
      titulo="Cumplimiento del tiempo prometido"
      accion={
        <div className="flex flex-wrap gap-1" role="group" aria-label="Agrupar SLA por">
          {DIMENSIONES.map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setDim(k)}
              className={`rounded-md border px-2.5 py-1 text-[10px] font-bold ${
                dim === k
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
      <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_64px_64px_56px] gap-x-4 border-b border-ops-line bg-ops-deep/50 px-5 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-ops-muted sm:grid">
        <span>
          {dim === "cliente" ? "Cliente / campaña" : dim === "ciudad" ? "Ciudad" : "Servicio"}
        </span>
        <span>Hoy frente a la meta</span>
        <span className="text-right">Hoy</span>
        <span className="text-right">30 días</span>
        <span className="text-right">Meta</span>
      </div>
      <ul className="divide-y divide-ops-line">
        {dim === "cliente"
          ? clientes.flatMap((c) => [
              <Fila key={c.clave} f={c} />,
              ...campanas
                .filter((k) => k.grupo === c.clave)
                .map((k) => <Fila key={k.clave} f={k} sub />),
            ])
          : planas.map((f) => <Fila key={f.clave} f={f} />)}
      </ul>
      <p className="border-t border-ops-line px-5 py-3 text-[10px] text-ops-muted">
        Verde: en o sobre la meta · Ámbar: hasta 10 puntos por debajo · Rojo: más de 10 puntos por
        debajo. La marca vertical es la meta. Cuentas y campañas de ejemplo.
      </p>
    </Panel>
  );
}
