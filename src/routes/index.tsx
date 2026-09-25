import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapaColombia } from "@/components/MapaColombia";
import { useAhora } from "@/hooks/use-ahora";
import {
  casosQuery,
  COLOR_SEMAFORO,
  ETIQUETA_SEMAFORO,
  esAbierto,
  minutosTranscurridos,
  semaforo,
  type Caso,
} from "@/lib/casos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tablero de casos · INDEGA Control de Asistencias" },
      {
        name: "description",
        content:
          "Casos de asistencia vehicular abiertos de la flota INDEGA con etapa actual, tiempo transcurrido y semáforo de cumplimiento.",
      },
      { property: "og:title", content: "Tablero de casos · INDEGA Control de Asistencias" },
      {
        property: "og:description",
        content: "Lista y mapa de casos abiertos con semáforo de cumplimiento en vivo.",
      },
    ],
  }),
  component: Tablero,
});

function Kpi({
  etiqueta,
  valor,
  sufijo,
  nota,
  tono,
}: {
  etiqueta: string;
  valor: string;
  sufijo?: string;
  nota: string;
  tono?: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1 px-5 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-ink">{etiqueta}</div>
      <div className="flex items-baseline gap-2">
        <span className={`font-mono text-2xl tabular-nums tracking-tight ${tono ?? ""}`}>
          {valor}
          {sufijo ? <span className="text-sm text-muted-ink"> {sufijo}</span> : null}
        </span>
        <span className="font-mono text-[11px] text-faint">{nota}</span>
      </div>
    </div>
  );
}

function Fila({ caso, ahora }: { caso: Caso; ahora: number }) {
  const s = semaforo(caso, ahora);
  const min = minutosTranscurridos(caso, ahora);
  const pct = Math.min(100, Math.round((min / caso.prometido_min) * 100));
  return (
    <Link
      to="/caso/$casoId"
      params={{ casoId: caso.id }}
      className="grid grid-cols-[1.1fr_1.6fr_1.1fr_1.7fr_1fr] items-center gap-3 px-4 py-2.5 hover:bg-panel2/50"
    >
      <div>
        <div className="font-mono text-[13px] tabular-nums text-ink">{caso.placa}</div>
        <div className="text-[11px] text-muted-ink">{caso.tipo_servicio}</div>
      </div>
      <div className="text-[12px] text-ink/80">{caso.etapa}</div>
      <div className="text-[12px] text-muted-ink">{caso.ciudad}</div>
      <div>
        <div className="mb-1 flex items-center justify-between font-mono text-[11px] tabular-nums">
          <span className={s === "rojo" ? "text-sla-red" : "text-ink/80"}>{min} min</span>
          <span className="text-faint">/ {caso.prometido_min} min</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-carbon">
          <div
            className={`h-full rounded-full ${COLOR_SEMAFORO[s].fondo} ${s === "rojo" ? "pulse-sla" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <span
          className={`size-1.5 rounded-full ${COLOR_SEMAFORO[s].fondo} ${s === "rojo" ? "pulse-sla" : ""}`}
        />
        <span className={`text-[11px] ${COLOR_SEMAFORO[s].texto}`}>{ETIQUETA_SEMAFORO[s]}</span>
      </div>
    </Link>
  );
}

function Tablero() {
  const ahora = useAhora();
  const { data, isLoading, error } = useQuery(casosQuery);
  const casos = data ?? [];
  const abiertos = casos.filter(esAbierto);
  const incumplidos = abiertos.filter((c) => semaforo(c, ahora) === "rojo");
  const enRiesgo = abiertos.filter((c) => semaforo(c, ahora) === "amarillo");
  const enAtencion = abiertos.filter((c) =>
    ["Llegada a sitio", "En atención", "Traslado"].includes(c.etapa),
  );
  const cumplimiento =
    abiertos.length > 0
      ? Math.round(((abiertos.length - incumplidos.length) / abiertos.length) * 100)
      : 100;

  return (
    <>
      <div className="relative shrink-0 overflow-hidden border-b border-line bg-panel2/60">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="sweep-y absolute left-0 top-0 h-full w-14 bg-gradient-to-b from-transparent via-cool/10 to-transparent" />
        </div>
        <div className="relative flex items-stretch divide-x divide-line">
          <Kpi etiqueta="Casos abiertos" valor={String(abiertos.length)} nota="en vivo" />
          <Kpi
            etiqueta="SLA en curso"
            valor={`${cumplimiento}%`}
            nota="meta 90%"
            tono={cumplimiento < 90 ? "text-sla-amber" : "text-sla-green"}
          />
          <Kpi etiqueta="Llegada promedio" valor="54" sufijo="min" nota="cartera 44" />
          <Kpi etiqueta="En atención" valor={String(enAtencion.length)} nota="en ruta o sitio" />
          <Kpi
            etiqueta="Escalamientos"
            valor={String(incumplidos.length)}
            nota="requieren acción"
            tono="text-sla-red"
          />
          <Kpi etiqueta="NPS cartera" valor="59" nota="antes 92" />
        </div>
      </div>

      <div className="flex gap-3 p-3">
        <MapaColombia casos={abiertos} ahora={ahora} />

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-panel ring-1 ring-line">
          <div className="flex h-10 items-center justify-between border-b border-line px-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-ink">
                Casos abiertos
              </span>
              <span className="rounded bg-panel2 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-ink/80">
                {abiertos.length}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-faint">
              <span>Vista Director de Flota</span>
            </div>
          </div>

          <div className="grid grid-cols-[1.1fr_1.6fr_1.1fr_1.7fr_1fr] gap-3 border-b border-line px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-faint">
            <div>Placa / Servicio</div>
            <div>Etapa actual</div>
            <div>Ubicación</div>
            <div>SLA · transcurrido / prometido</div>
            <div className="text-right">Estado</div>
          </div>

          <div className="divide-y divide-line">
            {isLoading ? (
              <div className="px-4 py-6 text-[12px] text-muted-ink">Cargando casos…</div>
            ) : error ? (
              <div className="px-4 py-6 text-[12px] text-sla-red">
                No fue posible cargar los casos.
              </div>
            ) : (
              abiertos.map((caso) => <Fila key={caso.id} caso={caso} ahora={ahora} />)
            )}
          </div>

          <div className="mt-auto flex h-9 items-center justify-between border-t border-line px-4 font-mono text-[10px] tabular-nums text-faint">
            <span>
              Mostrando {abiertos.length} de {casos.length}
            </span>
            <span className="flex items-center gap-3">
              <span>Actualización cada 15 s</span>
              <span className="pulse-sla size-1 rounded-full bg-sla-green" />
            </span>
          </div>
        </section>

        <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-lg bg-panel ring-1 ring-line">
          <div className="flex h-10 items-center justify-between border-b border-line px-4">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-ink">
              Alertas por incumplimiento
            </span>
            <span className="font-mono text-[10px] tabular-nums text-sla-red">
              {incumplidos.length}
            </span>
          </div>
          <div className="divide-y divide-line">
            {[...incumplidos, ...enRiesgo].slice(0, 6).map((caso) => {
              const s = semaforo(caso, ahora);
              const delta = minutosTranscurridos(caso, ahora) - caso.prometido_min;
              return (
                <Link
                  key={caso.id}
                  to="/caso/$casoId"
                  params={{ casoId: caso.id }}
                  className="block px-4 py-3 hover:bg-panel2/50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${COLOR_SEMAFORO[s].fondo} ${
                        s === "rojo" ? "pulse-sla" : ""
                      }`}
                    />
                    <span className="font-mono text-[12px] tabular-nums text-ink">
                      {caso.placa}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-faint">
                      {delta >= 0 ? `+${delta} min` : `${delta} min`}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-muted-ink">
                    {s === "rojo"
                      ? `Superó el tiempo prometido en etapa ${caso.etapa}. Escalar a coordinador regional.`
                      : `${caso.tipo_servicio} · ${caso.ciudad} · cerca de incumplir.`}
                  </p>
                </Link>
              );
            })}
            {incumplidos.length + enRiesgo.length === 0 && (
              <div className="px-4 py-6 text-[11px] text-muted-ink">
                Sin casos en riesgo en este momento.
              </div>
            )}
          </div>
          <div className="mt-auto flex h-9 items-center justify-between border-t border-line px-4 text-[10px] text-faint">
            <span className="font-mono tabular-nums">Monitoreo continuo</span>
            <Link to="/alertas" className="text-muted-ink hover:text-ink">
              Ver todas
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
