import { lazy, Suspense, useEffect, useState } from "react";
import { ETIQUETA_FAMILIA, type Caso, type Familia } from "@/lib/casos";
import { CIUDAD_LATLON } from "@/lib/geo";
import type { CapasMapa } from "./MapaLeaflet";

// Leaflet usa `window`: se importa solo en el navegador, después de hidratar.
const MapaLeaflet = lazy(() => import("./MapaLeaflet"));

export function MapaColombia({
  casos,
  ahora,
  ciudad,
  onCiudad,
  familia = null,
  onFamilia,
  capasIniciales = { casos: true, red: true },
  alto = "min-h-[600px] xl:min-h-[650px]",
}: {
  casos: Caso[];
  ahora: number;
  ciudad: string | null;
  onCiudad: (c: string | null) => void;
  familia?: Familia | null;
  onFamilia?: (f: Familia | null) => void;
  capasIniciales?: CapasMapa;
  alto?: string;
}) {
  const [enCliente, setEnCliente] = useState(false);
  const [capas, setCapas] = useState<CapasMapa>(capasIniciales);
  useEffect(() => setEnCliente(true), []);
  const porCiudad = (c: string) => casos.filter((x) => x.ciudad === c).length;
  const cargando = (
    <p className="absolute inset-0 grid place-items-center text-xs text-ops-muted">
      Cargando mapa…
    </p>
  );

  const chip = (activo: boolean) =>
    `rounded-md border px-2.5 py-1 text-[10px] font-bold transition-colors ${
      activo
        ? "border-brand-sky bg-brand-blue/40 text-ops-ink"
        : "border-ops-line bg-ops-deep/60 text-ops-muted hover:text-ops-ink"
    }`;

  return (
    <section
      data-tour="mapa"
      className={`flex flex-col overflow-hidden rounded-xl border border-ops-line bg-ops-navy shadow-2xl ${alto}`}
    >
      <div className="space-y-3 border-b border-ops-line px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-sky">
              Mapa operativo
            </p>
            <p className="mt-1 font-display text-lg font-semibold">Oferta y demanda en vivo</p>
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Capas del mapa">
            <button
              type="button"
              aria-pressed={capas.casos}
              onClick={() => setCapas((c) => ({ ...c, casos: !c.casos }))}
              className={chip(capas.casos)}
            >
              Casos (demanda)
            </button>
            <button
              type="button"
              aria-pressed={capas.red}
              onClick={() => setCapas((c) => ({ ...c, red: !c.red }))}
              className={chip(capas.red)}
            >
              Red de proveedores (oferta)
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ver casos por ciudad">
          <button type="button" onClick={() => onCiudad(null)} className={chip(ciudad === null)}>
            Todo el país · {casos.length}
          </button>
          {Object.keys(CIUDAD_LATLON).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCiudad(c)}
              className={chip(ciudad === c)}
            >
              {c} · {porCiudad(c)}
            </button>
          ))}
        </div>
        {familia && (
          <p className="flex items-center gap-2 text-[10px] text-ops-muted">
            Filtrando por{" "}
            <span className="font-bold text-ops-ink">{ETIQUETA_FAMILIA[familia]}</span>
            {onFamilia && (
              <button
                type="button"
                onClick={() => onFamilia(null)}
                className="text-brand-sky underline"
              >
                Quitar filtro
              </button>
            )}
          </p>
        )}
      </div>

      <div className="relative isolate min-h-[520px] flex-1">
        {enCliente ? (
          <Suspense fallback={cargando}>
            <MapaLeaflet
              casos={casos}
              ahora={ahora}
              ciudad={ciudad}
              setCiudad={onCiudad}
              familia={familia}
              capas={capas}
            />
          </Suspense>
        ) : (
          cargando
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-ops-line bg-ops-deep/60 px-5 py-3 text-[10px] text-ops-muted">
        {capas.casos &&
          [
            ["bg-sla-green", "En tiempo"],
            ["bg-sla-amber", "En riesgo"],
            ["bg-sla-red", "Incumplido"],
          ].map(([c, l]) => (
            <span key={l} className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${c}`} />
              {l}
            </span>
          ))}
        {capas.red && (
          <>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-sm bg-brand-sky" /> Proveedor disponible
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-sm bg-ops-muted" /> Ocupado
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-sm border border-dashed border-ops-muted" /> Fuera de
              zona
            </span>
          </>
        )}
      </div>
    </section>
  );
}
