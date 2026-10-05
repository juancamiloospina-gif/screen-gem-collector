import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Timer } from "lucide-react";
import { CapacidadRed } from "@/components/capacidad-red";
import { MapaColombia } from "@/components/MapaColombia";
import { MatrizDolor } from "@/components/matriz-dolor";
import { MonitorCasos } from "@/components/monitor-casos";
import { Encabezado, Kpi, Panel } from "@/components/ops";
import { PorVencerLista } from "@/components/por-vencer";
import { ProcesoNav } from "@/components/proceso-nav";
import { SlaPanel } from "@/components/sla-panel";
import { useAhora } from "@/hooks/use-ahora";
import {
  COLOR_SEMAFORO,
  VENTANA_PREDICTIVA_MIN,
  casosQuery,
  esAbierto,
  estaInactivo,
  minutosTranscurridos,
  semaforo,
  type Familia,
} from "@/lib/casos";
import { casosPorVencer, ordenarPorPrioridad } from "@/lib/procesos";
import { capacidadPorCiudad, estadoCiudad } from "@/lib/red";
import { META_SLA, semaforoSla, slaGlobal } from "@/lib/sla";

export const Route = createFileRoute("/centro")({
  head: () => ({
    meta: [
      { title: "Centro operativo · AssisPrex INDEGA" },
      {
        name: "description",
        content:
          "Monitoreo nacional en vivo de asistencias vehiculares, tiempos y alertas para INDEGA.",
      },
      { property: "og:title", content: "Centro operativo · AssisPrex INDEGA" },
      {
        property: "og:description",
        content: "Mapa y control en vivo de la operación nacional de asistencias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Centro,
});

const TONO_SEMAFORO_KPI = { verde: "verde", amarillo: "ambar", rojo: "rojo" } as const;

function Centro() {
  const ahora = useAhora();
  const { data, isLoading, error } = useQuery(casosQuery);
  const [ciudad, setCiudad] = useState<string | null>(null);
  const [familia, setFamilia] = useState<Familia | null>(null);

  const casos = data ?? [];
  const abiertos = casos.filter(esAbierto);
  const rojos = ordenarPorPrioridad(
    abiertos.filter((c) => semaforo(c, ahora) === "rojo"),
    ahora,
  );
  const venciendo = casosPorVencer(abiertos, ahora);
  const inactivos = abiertos.filter((c) => estaInactivo(c, ahora));
  const sla = slaGlobal(casos, ahora);
  const sSla = semaforoSla(sla.pct, META_SLA);
  const capacidad = capacidadPorCiudad(casos);
  const deficits = capacidad.flatMap((c) =>
    estadoCiudad(c).deficits.map((d) => `${c.ciudad} · ${d.familia}`),
  );
  const ajustadas = capacidad.filter((c) => estadoCiudad(c).semaforo === "amarillo").length;
  const sRed = deficits.length ? "rojo" : ajustadas ? "amarillo" : "verde";

  function elegir(c: string | null, f: Familia | null) {
    setCiudad(c);
    setFamilia(f);
  }

  return (
    <main className="p-4 lg:p-6">
      <Encabezado
        eyebrow="Vista Director de Flota"
        titulo="Operación nacional"
        texto="Primero lo crítico y lo que está por vencerse; después dónde duele, cómo va el SLA contra la meta y si la red alcanza."
      >
        <p className="hidden text-xs text-ops-muted sm:block">Actualización automática · 15 s</p>
      </Encabezado>

      {/* 1. KPIs por prioridad */}
      <div data-tour="kpis" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi
          label="Casos críticos"
          value={String(rojos.length)}
          note="Ya superaron el tiempo prometido"
          tone="text-sla-red"
          acento="rojo"
          grande
        />
        <Kpi
          label={`Por vencerse ≤ ${VENTANA_PREDICTIVA_MIN} min`}
          value={String(venciendo.length)}
          note="Predictivo: actuar antes del incumplimiento"
          tone="text-sla-amber"
          acento="ambar"
          grande
        />
        <Kpi
          label="Cumplimiento SLA"
          value={sla.pct === null ? "—" : `${sla.pct}%`}
          note={`Meta ${META_SLA}% · 30 días ${sla.pct30d}%`}
          tone={sSla ? COLOR_SEMAFORO[sSla].texto : "text-ops-ink"}
          acento={sSla ? TONO_SEMAFORO_KPI[sSla] : undefined}
          grande
        />
        <Kpi
          label="Red sin capacidad"
          value={String(deficits.length)}
          note={
            deficits.length
              ? `Faltan unidades: ${deficits.slice(0, 2).join("; ")}${deficits.length > 2 ? ` y ${deficits.length - 2} más` : ""}`
              : ajustadas
                ? `${ajustadas} ciudades sin holgura`
                : "La red alcanza en todas las ciudades"
          }
          tone={COLOR_SEMAFORO[sRed].texto}
          acento={TONO_SEMAFORO_KPI[sRed]}
          grande
        />
        <Kpi
          label="Sin movimiento"
          value={String(inactivos.length)}
          note="Superan el tiempo de su etapa"
          tone={inactivos.length ? "text-sla-red" : "text-sla-green"}
        />
        <Kpi
          label="Casos abiertos"
          value={String(abiertos.length)}
          note="Operación en vivo"
          tone="text-brand-sky"
        />
      </div>

      {/* 2. Una vista por proceso crítico */}
      <div className="mt-5">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
          Procesos críticos
        </p>
        <ProcesoNav casos={casos} ahora={ahora} activo={null} />
      </div>

      {/* 3. Dónde está el dolor + predictivo */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <MatrizDolor
          casos={casos}
          ahora={ahora}
          ciudad={ciudad}
          familia={familia}
          onSelect={elegir}
        />
        <div className="space-y-5">
          <Panel
            tour="predictivo"
            eyebrow="Predictivo"
            titulo={`Se vencen en los próximos ${VENTANA_PREDICTIVA_MIN} min`}
            accion={<Timer className="size-4 text-sla-amber" />}
          >
            <PorVencerLista casos={casos} ahora={ahora} limite={5} />
          </Panel>
          <Panel
            tour="criticos"
            eyebrow="Prioridad operativa"
            titulo="Críticos ahora"
            accion={
              <span className="rounded-md bg-sla-red/15 px-2 py-1 font-data text-[10px] text-sla-red">
                {rojos.length}
              </span>
            }
          >
            <ul className="divide-y divide-ops-line">
              {rojos.length === 0 && (
                <li className="px-5 py-4 text-[11px] text-ops-muted">
                  Ningún caso ha superado el tiempo prometido.
                </li>
              )}
              {rojos.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link
                    to="/caso/$casoId"
                    params={{ casoId: c.id }}
                    className="group flex items-center gap-3 px-5 py-3 hover:bg-ops-panel/50"
                  >
                    <span className="size-2.5 shrink-0 rounded-full bg-sla-red" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs">
                        <span className="font-data font-medium">{c.placa}</span>
                        <span className="text-ops-muted">
                          {" "}
                          · {c.ciudad} · {c.tipo_servicio}
                        </span>
                      </p>
                      <p className="text-[10px] text-ops-muted">{c.etapa}</p>
                    </div>
                    <span className="shrink-0 font-data text-[11px] text-sla-red">
                      {minutosTranscurridos(c, ahora)} / {c.prometido_min} min
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-ops-muted transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/alertas"
              className="flex items-center justify-between border-t border-ops-line bg-ops-deep/50 px-5 py-3 text-xs font-bold text-brand-sky"
            >
              Ver todas las alertas <ArrowRight className="size-4" />
            </Link>
          </Panel>
        </div>
      </div>

      {/* 4. Mapa de oferta y demanda + capacidad de red */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <MapaColombia
          casos={abiertos}
          ahora={ahora}
          ciudad={ciudad}
          onCiudad={(c) => setCiudad(c)}
          familia={familia}
          onFamilia={setFamilia}
        />
        <CapacidadRed casos={casos} ciudad={ciudad} onCiudad={setCiudad} />
      </div>

      {/* 5. SLA contra la meta */}
      <div className="mt-5">
        <SlaPanel casos={casos} ahora={ahora} />
      </div>

      {/* 6. Monitor */}
      <div className="mt-5">
        <MonitorCasos
          casos={casos}
          ahora={ahora}
          ciudad={ciudad}
          familia={familia}
          cargando={isLoading}
          error={Boolean(error)}
          onLimpiar={() => elegir(null, null)}
        />
      </div>
    </main>
  );
}
