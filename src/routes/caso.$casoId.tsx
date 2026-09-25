import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAhora } from "@/hooks/use-ahora";
import {
  COLOR_SEMAFORO,
  ETAPAS,
  ETIQUETA_SEMAFORO,
  casoQuery,
  formatoReloj,
  minutosTranscurridos,
  semaforo,
} from "@/lib/casos";

export const Route = createFileRoute("/caso/$casoId")({
  head: () => ({
    meta: [
      { title: "Detalle del caso · INDEGA Control de Asistencias" },
      {
        name: "description",
        content:
          "Línea de tiempo de las 8 etapas del caso de asistencia, con fecha y hora de cada cambio de estado.",
      },
      { property: "og:title", content: "Detalle del caso · INDEGA" },
      {
        property: "og:description",
        content: "Seguimiento etapa por etapa de una asistencia vehicular.",
      },
    ],
  }),
  component: DetalleCaso,
});

function DetalleCaso() {
  const { casoId } = Route.useParams();
  const ahora = useAhora();
  const { data, isLoading, error } = useQuery(casoQuery(casoId));

  if (isLoading) {
    return <div className="p-6 text-[12px] text-muted-ink">Cargando caso…</div>;
  }
  if (error || !data) {
    return <div className="p-6 text-[12px] text-sla-red">No fue posible cargar el caso.</div>;
  }

  const { caso, eventos } = data;
  const s = semaforo(caso, ahora);
  const min = minutosTranscurridos(caso, ahora);
  const indiceActual = ETAPAS.indexOf(caso.etapa);

  return (
    <div className="flex gap-3 p-3">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-panel ring-1 ring-line">
        <div className="flex h-10 items-center justify-between border-b border-line px-4">
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-ink">
            Caso #{caso.numero} · {caso.placa}
          </span>
          <Link to="/" className="font-mono text-[10px] text-faint hover:text-ink">
            ← Volver al tablero
          </Link>
        </div>

        <div className="grid grid-cols-4 divide-x divide-line border-b border-line">
          <div className="px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-ink">Servicio</div>
            <div className="mt-1 text-[13px] text-ink">{caso.tipo_servicio}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-ink">Vehículo</div>
            <div className="mt-1 text-[13px] text-ink">
              {caso.tipo_vehiculo} · {caso.placa}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-ink">Ubicación</div>
            <div className="mt-1 text-[13px] text-ink">
              {caso.ciudad} — {caso.ubicacion}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-ink">
              SLA transcurrido
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`font-mono text-[15px] tabular-nums ${COLOR_SEMAFORO[s].texto}`}>
                {min} min
              </span>
              <span className="font-mono text-[11px] text-faint">/ {caso.prometido_min} min</span>
              <span className={`text-[11px] ${COLOR_SEMAFORO[s].texto}`}>
                {ETIQUETA_SEMAFORO[s]}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 text-[11px] uppercase tracking-[0.16em] text-muted-ink">
            Línea de tiempo de etapas
          </div>
          <ol className="relative border-l border-line pl-6">
            {ETAPAS.map((etapa, i) => {
              const evento = eventos.find((e) => e.etapa === etapa);
              const cumplida = i <= indiceActual;
              const actual = i === indiceActual;
              return (
                <li key={etapa} className="relative pb-6 last:pb-0">
                  <span
                    className={`absolute -left-[31px] top-1 size-2.5 rounded-full ring-2 ring-panel ${
                      actual
                        ? `${COLOR_SEMAFORO[s].fondo} ${s === "rojo" ? "pulse-sla" : ""}`
                        : cumplida
                          ? "bg-cool"
                          : "bg-line"
                    }`}
                  />
                  <div
                    className={`text-[13px] ${cumplida ? "text-ink" : "text-faint"} ${
                      actual ? "font-semibold" : ""
                    }`}
                  >
                    {etapa}
                    {actual && (
                      <span className="ml-2 rounded bg-panel2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-ink">
                        Etapa actual
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] tabular-nums text-faint">
                    {evento ? formatoReloj(evento.ocurrido_en) : "Pendiente"}
                  </div>
                  {evento?.nota && (
                    <div className="mt-1 text-[11px] text-muted-ink">{evento.nota}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <aside className="w-[300px] shrink-0 overflow-hidden rounded-lg bg-panel ring-1 ring-line">
        <div className="flex h-10 items-center border-b border-line px-4 text-[11px] uppercase tracking-[0.16em] text-muted-ink">
          Resumen operativo
        </div>
        <dl className="divide-y divide-line text-[12px]">
          <div className="flex justify-between px-4 py-3">
            <dt className="text-muted-ink">Apertura</dt>
            <dd className="font-mono tabular-nums text-ink">{formatoReloj(caso.creado_en)}</dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-muted-ink">Origen del reporte</dt>
            <dd className="text-ink">{caso.origen}</dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-muted-ink">Etapa</dt>
            <dd className="text-ink">{caso.etapa}</dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-muted-ink">Estado SLA</dt>
            <dd className={COLOR_SEMAFORO[s].texto}>{ETIQUETA_SEMAFORO[s]}</dd>
          </div>
        </dl>
        <p className="px-4 py-3 text-[11px] leading-snug text-faint">
          El cálculo de excedentes y coberturas se presenta aparte; no forma parte de este
          prototipo.
        </p>
      </aside>
    </div>
  );
}
