import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Clock3, MapPin, Radio, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAhora } from "@/hooks/use-ahora";
import {
  COLOR_SEMAFORO,
  ETIQUETA_SEMAFORO,
  formatoReloj,
  minutosTranscurridos,
  semaforo,
} from "@/lib/casos";
import { casoQuery } from "@/services/casos";
import { catalogoOperativoQuery } from "@/services/catalogo";

export const Route = createFileRoute("/caso/$casoId")({
  head: () => ({
    meta: [
      { title: "Detalle de asistencia · AssisPrex" },
      {
        name: "description",
        content: "Seguimiento completo de una asistencia vehicular y sus ocho etapas operativas.",
      },
      { property: "og:title", content: "Detalle de asistencia · AssisPrex" },
      {
        property: "og:description",
        content: "Estado, ubicación, tiempo y cronología completa del caso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DetalleCaso,
});

function DetalleCaso() {
  const { casoId } = Route.useParams();
  const ahora = useAhora();
  const { data, isLoading, error } = useQuery(casoQuery(casoId));
  const { data: catalogo, isLoading: loadingCatalogo, error: errorCatalogo } = useQuery(catalogoOperativoQuery);

  if (isLoading || loadingCatalogo) return <div className="p-8 text-sm text-ops-muted">Cargando caso…</div>;
  if (error || errorCatalogo || !data || !catalogo)
    return <div className="p-8 text-sm text-sla-red">No fue posible cargar el caso.</div>;

  const { caso, eventos } = data;
  const etapas = catalogo.etapas.map((e) => e.nombre);

  const s = semaforo(caso, ahora);
  const min = minutosTranscurridos(caso, ahora);
  const actual = etapas.indexOf(caso.etapa);
  const pct = Math.min(100, Math.round((min / caso.prometido_min) * 100));

  return (
    <main className="p-4 lg:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="text-ops-muted">
            <Link to="/centro" aria-label="Volver al centro operativo">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-sky">Caso #{caso.numero}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              {caso.placa} · {caso.tipo_servicio}
            </h2>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 rounded-lg border border-ops-line bg-ops-navy px-3 py-2 text-xs font-bold ${COLOR_SEMAFORO[s].texto}`}
        >
          <span className={`size-2 rounded-full ${COLOR_SEMAFORO[s].fondo}`} />
          {ETIQUETA_SEMAFORO[s]}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_380px]">
        <section className="overflow-hidden rounded-xl border border-ops-line bg-ops-navy">
          <div className="grid gap-px bg-ops-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Truck, "Vehículo", `${caso.tipo_vehiculo} · ${caso.placa}`],
              [MapPin, "Ubicación", `${caso.ciudad} · ${caso.ubicacion}`],
              [Clock3, "Apertura", formatoReloj(caso.creado_en)],
              [Radio, "Origen", caso.origen],
            ].map(([I, l, v]) => {
              const Icon = I as typeof Truck;
              return (
                <div key={String(l)} className="bg-ops-navy p-4">
                  <Icon className="size-4 text-brand-sky" />
                  <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-ops-muted">
                    {String(l)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">{String(v)}</p>
                </div>
              );
            })}
          </div>

          <div className="p-5 lg:p-7">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
                  Cronología operativa
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold">8 etapas de la asistencia</h3>
              </div>
              <span className="font-data text-xs text-ops-muted">
                {actual + 1} / 8
              </span>
            </div>

            <ol className="relative grid gap-0 lg:grid-cols-2 lg:gap-x-12">
              {etapas.map((etapa, i) => {
                const evento = eventos.find((e) => e.etapa === etapa);
                const done = i < actual;
                const current = i === actual;

                return (
                  <li key={etapa} className="relative flex min-h-24 gap-4 pb-5">
                    <div className="flex flex-col items-center">
                      <span
                        className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border ${
                          current
                            ? `${COLOR_SEMAFORO[s].fondo} border-transparent text-ops-deep`
                            : done
                              ? "border-brand-sky bg-brand-blue text-ops-ink"
                              : "border-ops-line bg-ops-deep text-ops-muted"
                        }`}
                      >
                        {done ? <Check className="size-4" /> : <span className="font-data text-[10px]">{i + 1}</span>}
                      </span>
                      {i < etapas.length - 1 && (
                        <span className={`h-full w-px ${done ? "bg-brand-blue" : "bg-ops-line"}`} />
                      )}
                    </div>

                    <div className="pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-sm font-bold ${
                            current ? COLOR_SEMAFORO[s].texto : done ? "text-ops-ink" : "text-ops-muted"
                          }`}
                        >
                          {etapa}
                        </p>
                        {current && (
                          <span className="rounded bg-ops-panel px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-brand-sky">
                            Actual
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-data text-[10px] text-ops-muted">
                        {evento ? formatoReloj(evento.ocurrido_en) : "Pendiente"}
                      </p>
                      {evento?.nota && (
                        <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-ops-muted">{evento.nota}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-xl border border-ops-line bg-ops-navy p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">Control de tiempo</p>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className={`font-display text-4xl font-semibold ${COLOR_SEMAFORO[s].texto}`}>
                  {min}
                  <span className="ml-1 text-sm">min</span>
                </p>
                <p className="mt-1 text-xs text-ops-muted">de {caso.prometido_min} min prometidos</p>
              </div>
              <span className="font-data text-xs text-ops-muted">{pct}%</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-ops-deep">
              <div className={`h-full ${COLOR_SEMAFORO[s].fondo}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-ops-line bg-ops-navy">
            <div className="relative h-72 bg-ops-deep">
              <img
                src="/colombia-map.svg"
                alt="Ubicación del caso en Colombia"
                className="absolute inset-0 size-full object-contain p-6 opacity-80"
              />
              <span
                className={`absolute size-4 rounded-full border-2 border-ops-ink ${COLOR_SEMAFORO[s].fondo}`}
                style={{ left: `${caso.mapa_x}%`, top: `${caso.mapa_y}%` }}
              />
              <div className="absolute bottom-4 left-4 rounded-lg border border-ops-line bg-ops-deep/90 px-3 py-2 backdrop-blur">
                <p className="text-xs font-bold">{caso.ciudad}</p>
                <p className="mt-0.5 text-[10px] text-ops-muted">{caso.ubicacion}</p>
              </div>
            </div>
          </div>

          <Button className="h-11 w-full rounded-lg font-bold">Registrar actualización</Button>
        </aside>
      </div>
    </main>
  );
}
