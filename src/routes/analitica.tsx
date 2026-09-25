import { createFileRoute, Link } from "@tanstack/react-router";
import { MapaBase, CIUDAD_MAPA } from "@/components/MapaBase";
import { Barra, Chip, Encabezado, Kpi, Panel } from "@/components/ops";
import {
  CONDUCTORES_RECURRENTES,
  DEPARTAMENTOS_12M,
  DIAS,
  HORAS,
  MESES_12M,
  PLACAS_RECURRENTES,
  PROMEDIO_INCIDENTES_CONDUCTOR,
  RESUMEN_12M,
} from "@/lib/historico";

export const Route = createFileRoute("/analitica")({
  head: () => ({
    meta: [
      { title: "Analítica de flota y riesgo · AssisPrex" },
      {
        name: "description",
        content:
          "Recurrencia por vehículo y conductor, mapa de calor de incidentes y patrones de tiempo.",
      },
    ],
  }),
  component: Analitica,
});

function Analitica() {
  const r = RESUMEN_12M;
  const maxMes = Math.max(...MESES_12M.map((m) => m.expedientes));
  const maxHora = Math.max(...HORAS);
  const maxDepto = Math.max(...DEPARTAMENTOS_12M.map((d) => d.expedientes));
  const conMapa = DEPARTAMENTOS_12M.filter((d) => CIUDAD_MAPA[d.ciudad]).map((d) => ({
    ...d,
    ...CIUDAD_MAPA[d.ciudad]!,
  }));

  return (
    <main className="p-4 lg:p-7">
      <Encabezado
        eyebrow="Analítica de comportamiento de flota y riesgo"
        titulo="Cada caso se convierte en información"
        texto="Últimos 12 meses (sep 2025 – ago 2026). Totales del diagnóstico; el detalle por placa y conductor es ilustrativo para la demo."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Expedientes"
          value={r.expedientes.toLocaleString("es-CO")}
          note={`${r.servicios.toLocaleString("es-CO")} servicios · ${r.placas} placas`}
        />
        <Kpi
          label="Placas con 3+ eventos"
          value={String(r.placas_3_o_mas)}
          note={r.concentracion}
          tone="text-sla-amber"
        />
        <Kpi
          label="Reincidencia a 30 días"
          value={`${r.reincidencia_30d_pct}%`}
          note="Reparaciones que no resolvieron la falla"
          tone="text-sla-red"
        />
        <Kpi
          label="Cobertura geográfica"
          value={`${r.departamentos} deptos`}
          note={`${r.municipios} municipios`}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel eyebrow="Análisis geográfico" titulo="Mapa de calor de incidentes">
          <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-ops-deep">
              <MapaBase
                className="p-1"
                opacidad="opacity-70"
                alt="Mapa de calor de incidentes por departamento"
              >
                {conMapa.map((d) => {
                  const k = d.expedientes / maxDepto;
                  const size = 18 + k * 70;
                  return (
                    <span
                      key={d.nombre}
                      title={`${d.nombre}: ${d.expedientes} expedientes`}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        left: `${d.x}%`,
                        top: `${d.y}%`,
                        width: size,
                        height: size,
                        background: `radial-gradient(circle, color-mix(in oklab, var(--sla-red) ${Math.round(40 + k * 50)}%, transparent) 0%, transparent 70%)`,
                      }}
                    />
                  );
                })}
                {conMapa.slice(0, 5).map((d) => (
                  <span
                    key={`${d.nombre}-l`}
                    className={`absolute -translate-y-1/2 whitespace-nowrap rounded bg-ops-deep/80 px-1.5 py-0.5 text-[9px] font-bold ${d.ciudad === "Cali" || d.ciudad === "Medellín" ? "-translate-x-[calc(100%+10px)]" : "translate-x-2.5"}`}
                    style={{ left: `${d.x}%`, top: `${d.y + (d.ciudad === "Neiva" ? 2 : 0)}%` }}
                  >
                    {d.ciudad} · {Math.round((d.expedientes / r.expedientes) * 100)}%
                  </span>
                ))}
              </MapaBase>
            </div>
            <div className="space-y-3">
              {DEPARTAMENTOS_12M.map((d) => (
                <Barra
                  key={d.nombre}
                  label={d.nombre}
                  valor={d.expedientes}
                  max={maxDepto}
                  tono={d.ciudad ? "bg-sla-red/80" : "bg-ops-muted"}
                />
              ))}
            </div>
          </div>
          <p className="border-t border-ops-line px-5 py-3 text-[10px] leading-relaxed text-ops-muted">
            Cinco departamentos concentran el 67% de los expedientes. Crecen Huila, Tolima y
            Atlántico; caen Meta y Caldas. Los corredores viales de municipios pequeños son donde la
            red de proveedores es más débil.
          </p>
        </Panel>

        <div className="space-y-5">
          <Panel eyebrow="Volumen" titulo="Expedientes por mes">
            <div className="flex h-44 items-end gap-1.5 px-5 pb-3 pt-5">
              {MESES_12M.map((m) => (
                <div key={m.mes} className="flex flex-1 flex-col items-center gap-1">
                  <span className="font-data text-[8px] text-ops-muted">{m.expedientes}</span>
                  <div
                    className="w-full rounded-t bg-brand-blue"
                    style={{ height: `${(m.expedientes / maxMes) * 110}px` }}
                  />
                  <span className="text-[8px] text-ops-muted">{m.mes.split(" ")[0]}</span>
                </div>
              ))}
            </div>
            <p className="border-t border-ops-line px-5 py-3 text-[10px] text-ops-muted">
              ~86 expedientes y 146 servicios al mes; 1,69 servicios por expediente (1,43 en 2022).
            </p>
          </Panel>

          <Panel eyebrow="Composición" titulo="Tipo de vehículo y causa">
            <div className="space-y-3 p-5">
              <Barra label="Pesados" valor={r.pesados_pct} max={100} sufijo="%" />
              <Barra
                label="Livianos (de 9% a 26%)"
                valor={r.livianos_pct}
                max={100}
                sufijo="%"
                tono="bg-brand-sky"
              />
              <Barra
                label="Averías"
                valor={r.averias_pct}
                max={100}
                sufijo="%"
                tono="bg-sla-amber"
              />
              <Barra
                label="Accidentes de tránsito"
                valor={r.accidentes_pct}
                max={100}
                sufijo="%"
                tono="bg-sla-red"
              />
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel
          eyebrow="Recurrencia por vehículo"
          titulo="Placas con más eventos · insumo para mantenimiento"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[11px]">
              <thead className="bg-ops-deep/50 text-[9px] uppercase tracking-[0.12em] text-ops-muted">
                <tr>
                  <th className="px-5 py-2 font-bold">Placa</th>
                  <th className="px-3 py-2 font-bold">Regional</th>
                  <th className="px-3 py-2 font-bold">Eventos 12m</th>
                  <th className="px-3 py-2 font-bold">Reinc. &lt;30 d</th>
                  <th className="px-5 py-2 font-bold">Causa principal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ops-line">
                {PLACAS_RECURRENTES.map((p) => (
                  <tr key={p.placa}>
                    <td className="whitespace-nowrap px-5 py-3 font-data">
                      <Link to="/flota" search={{ q: p.placa }} className="hover:text-brand-sky">
                        {p.placa}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-ops-muted">{p.regional}</td>
                    <td className="px-3 py-3 font-data">{p.expedientes_12m}</td>
                    <td className="px-3 py-3">
                      {p.reincidencias_30d > 0 ? (
                        <Chip tono={p.reincidencias_30d >= 2 ? "rojo" : "ambar"}>
                          {p.reincidencias_30d}
                        </Chip>
                      ) : (
                        <span className="text-ops-muted">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-ops-muted">{p.causa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          eyebrow="Recurrencia por conductor"
          titulo={`Conductores sobre el promedio (${PROMEDIO_INCIDENTES_CONDUCTOR} incidentes/año)`}
        >
          <ul className="divide-y divide-ops-line">
            {CONDUCTORES_RECURRENTES.map((c) => (
              <li key={c.conductor} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold">{c.conductor}</span>
                  <span className="font-data text-[11px] text-sla-amber">
                    {c.incidentes_12m} incidentes · {c.accidentes} accidentes
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-ops-muted">
                  Regional {c.regional} · {c.patron}
                </p>
              </li>
            ))}
          </ul>
          <p className="border-t border-ops-line px-5 py-3 text-[10px] text-ops-muted">
            Insumo para capacitación y programas de seguridad vial con HSE.
          </p>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel eyebrow="Franja horaria" titulo="Solicitudes por hora del día">
          <div className="flex h-40 items-end gap-1 px-5 pb-3 pt-5">
            {HORAS.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${i >= 6 && i < 18 ? "bg-brand-blue" : "bg-ops-muted/50"}`}
                  style={{ height: `${(h / maxHora) * 110}px` }}
                />
                <span className="text-[8px] text-ops-muted">{i % 3 === 0 ? i : ""}</span>
              </div>
            ))}
          </div>
          <p className="border-t border-ops-line px-5 py-3 text-[10px] text-ops-muted">
            80% entre 6:00 y 18:00 (pico 8:00–12:00). El 20% nocturno lo atienden los agentes de IA
            sin encarecer turnos.
          </p>
        </Panel>
        <Panel eyebrow="Día de la semana" titulo="Distribución semanal">
          <div className="space-y-2.5 p-5">
            {DIAS.map((d) => (
              <Barra
                key={d.dia}
                label={d.dia}
                valor={d.pct}
                max={20}
                sufijo="%"
                tono={d.dia === "Dom" ? "bg-ops-muted" : "bg-brand-blue"}
              />
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}
