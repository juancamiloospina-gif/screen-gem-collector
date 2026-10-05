import { Panel, Chip } from "@/components/ops";
import { COLOR_SEMAFORO, ETIQUETA_FAMILIA, FAMILIAS, type Caso } from "@/lib/casos";
import { capacidadPorCiudad, estadoCiudad, semaforoBalance } from "@/lib/red";

export function BarraRed({
  disponibles,
  ocupados,
  fuera,
}: {
  disponibles: number;
  ocupados: number;
  fuera: number;
}) {
  const total = Math.max(disponibles + ocupados + fuera, 1);
  return (
    <div className="flex h-2.5 gap-px overflow-hidden rounded-full bg-ops-deep">
      <div
        className="bg-brand-sky"
        style={{ width: `${(disponibles / total) * 100}%` }}
        title={`${disponibles} disponibles`}
      />
      <div
        className="bg-ops-muted"
        style={{ width: `${(ocupados / total) * 100}%` }}
        title={`${ocupados} ocupados`}
      />
      <div
        className="border border-dashed border-ops-muted bg-transparent"
        style={{ width: `${(fuera / total) * 100}%` }}
        title={`${fuera} fuera de zona`}
      />
    </div>
  );
}

export function LeyendaRed() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ops-muted">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-brand-sky" /> Disponible
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-ops-muted" /> Ocupado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm border border-dashed border-ops-muted" /> Fuera de zona
      </span>
    </div>
  );
}

// Capacidad de la red conectada por ciudad: cuántas unidades hay, en qué
// estado, y si alcanzan para la demanda pendiente.
export function CapacidadRed({
  casos,
  detalle = false,
  ciudad = null,
  onCiudad,
}: {
  casos: Caso[];
  detalle?: boolean;
  ciudad?: string | null;
  onCiudad?: (c: string | null) => void;
}) {
  const filas = capacidadPorCiudad(casos);
  const total = filas.reduce(
    (s, f) => ({
      disponibles: s.disponibles + f.disponibles,
      ocupados: s.ocupados + f.ocupados,
      fuera: s.fuera + f.fuera,
      demanda: s.demanda + f.demanda,
    }),
    { disponibles: 0, ocupados: 0, fuera: 0, demanda: 0 },
  );
  return (
    <Panel
      tour="red"
      eyebrow="Capacidad de red"
      titulo="Proveedores conectados frente a la demanda"
      accion={<Chip tono="azul">{total.disponibles + total.ocupados + total.fuera} unidades</Chip>}
    >
      <ul className="divide-y divide-ops-line">
        {filas.map((f) => {
          const estado = estadoCiudad(f);
          const s = estado.semaforo;
          return (
            <li
              key={f.ciudad}
              className={`px-5 py-3 ${ciudad === f.ciudad ? "bg-brand-blue/10" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onCiudad?.(ciudad === f.ciudad ? null : f.ciudad)}
                  className="text-left text-xs font-bold hover:text-brand-sky"
                >
                  {f.ciudad}
                </button>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${COLOR_SEMAFORO[s].texto} bg-ops-deep/60`}
                >
                  {estado.etiqueta}
                </span>
              </div>
              <div className="mt-2">
                <BarraRed disponibles={f.disponibles} ocupados={f.ocupados} fuera={f.fuera} />
              </div>
              <p className="mt-1.5 text-[10px] text-ops-muted">
                <span className="text-brand-sky">{f.disponibles} disponibles</span> · {f.ocupados}{" "}
                ocupados · {f.fuera} fuera de zona · demanda pendiente{" "}
                <span className="font-bold text-ops-ink">{f.demanda}</span>
              </p>
              {detalle && (
                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {FAMILIAS.map((fam) => {
                    const c = f.porFamilia[fam];
                    const sc = semaforoBalance(c.balance);
                    return (
                      <div key={fam} className="rounded-md bg-ops-deep/50 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-wide text-ops-muted">
                          {ETIQUETA_FAMILIA[fam]}
                        </p>
                        <p className={`mt-0.5 font-data text-xs ${COLOR_SEMAFORO[sc].texto}`}>
                          {c.disponibles} disp ↔ {c.demanda} dem
                        </p>
                        <p className="text-[9px] text-ops-muted">
                          {c.ocupados} ocup · {c.fuera} fuera
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="border-t border-ops-line px-5 py-3">
        <LeyendaRed />
      </div>
    </Panel>
  );
}
