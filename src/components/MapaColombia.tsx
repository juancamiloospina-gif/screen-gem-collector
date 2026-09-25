import { lazy, Suspense, useEffect, useState } from "react";
import type { Caso } from "@/lib/casos";
import { CIUDAD_LATLON } from "@/lib/geo";

// Leaflet usa `window`: se importa solo en el navegador, después de hidratar.
const MapaLeaflet = lazy(() => import("./MapaLeaflet"));

export function MapaColombia({ casos, ahora }: { casos: Caso[]; ahora: number }) {
  const [enCliente, setEnCliente] = useState(false);
  const [ciudad, setCiudad] = useState<string | null>(null);
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
    <section className="flex min-h-[600px] flex-col overflow-hidden rounded-xl border border-ops-line bg-ops-navy shadow-2xl xl:min-h-[650px]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ops-line px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-sky">
            Mapa operativo
          </p>
          <p className="mt-1 font-display text-lg font-semibold">Colombia en vivo</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ver casos por ciudad">
          <button type="button" onClick={() => setCiudad(null)} className={chip(ciudad === null)}>
            Todo el país · {casos.length}
          </button>
          {Object.keys(CIUDAD_LATLON).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCiudad(c)}
              className={chip(ciudad === c)}
            >
              {c} · {porCiudad(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative isolate flex-1">
        {enCliente ? (
          <Suspense fallback={cargando}>
            <MapaLeaflet casos={casos} ahora={ahora} ciudad={ciudad} setCiudad={setCiudad} />
          </Suspense>
        ) : (
          cargando
        )}
        <div className="pointer-events-none absolute bottom-6 left-4 z-[500] flex flex-wrap gap-4 rounded-lg border border-ops-line bg-ops-deep/90 px-4 py-3 text-[10px] text-ops-muted backdrop-blur">
          {[
            ["bg-sla-green", "En tiempo"],
            ["bg-sla-amber", "En riesgo"],
            ["bg-sla-red", "Incumplido"],
          ].map(([c, l]) => (
            <span key={l} className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${c}`} />
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
