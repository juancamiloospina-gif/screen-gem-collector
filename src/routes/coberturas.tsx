import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipExcedente, Encabezado, Kpi, Panel } from "@/components/ops";
import { aprobarCobertura, casosQuery, resolverExcedente } from "@/lib/casos";
import { formatoCOP } from "@/lib/flota";
import { COBERTURAS_12M, CONCILIACION_CARTERA } from "@/lib/historico";

export const Route = createFileRoute("/coberturas")({
  head: () => ({
    meta: [
      { title: "Coberturas y excedentes · AssisPrex" },
      {
        name: "description",
        content:
          "Validación de cobertura en la toma, aprobación de excedentes y conciliación de la cartera asegurada.",
      },
    ],
  }),
  component: Coberturas,
});

function Coberturas() {
  const queryClient = useQueryClient();
  const { data } = useQuery(casosQuery);
  const casos = data ?? [];
  const excedentes = casos.flatMap((c) => c.excedentes.map((e) => ({ caso: c, e })));
  const pendientes = excedentes.filter((x) => x.e.estado === "Pendiente aprobación");
  const noCubiertos = casos.filter((c) => c.cobertura !== "Cubierto");
  const refrescar = () => queryClient.invalidateQueries({ queryKey: ["casos"] });
  const c = COBERTURAS_12M;

  return (
    <main className="p-4 lg:p-7">
      <Encabezado
        eyebrow="Control de coberturas y excedentes"
        titulo="Cada servicio contra lo que cubre la póliza"
        texto="Sin intervenir en la relación de costos entre Mapfre y su empresa de asistencia: validamos cobertura desde la toma y contrastamos cada cobro adicional con datos objetivos."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Valor gestionado 12m"
          value="COP 551 M"
          note={`${formatoCOP(c.valor_promedio_expediente)} por expediente`}
        />
        <Kpi
          label="Traslados intermunicipales"
          value={`${c.intermunicipales_pct}%`}
          note={`Cuestan ${c.intermunicipal_vs_urbano}× un traslado urbano`}
          tone="text-sla-amber"
        />
        <Kpi
          label="Servicios fuera de cartera"
          value={String(c.fuera_cartera_servicios)}
          note={`${c.fuera_cartera_placas} placas · COP 32 M`}
          tone="text-sla-red"
        />
        <Kpi
          label="Excedentes por aprobar"
          value={String(pendientes.length)}
          note="Requieren visto bueno de INDEGA"
          tone={pendientes.length ? "text-sla-amber" : "text-sla-green"}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel eyebrow="Aprobación previa" titulo="Excedentes reportados en casos activos">
          <ul className="divide-y divide-ops-line">
            {excedentes.map(({ caso, e }) => (
              <li key={e.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to="/caso/$casoId"
                    params={{ casoId: caso.id }}
                    className="text-xs font-bold hover:text-brand-sky"
                  >
                    {caso.placa} · #{caso.numero} · {e.concepto}
                  </Link>
                  <ChipExcedente estado={e.estado} />
                </div>
                <p className="mt-1 text-[11px] text-ops-muted">{e.detalle}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-data text-sm">{formatoCOP(e.valor)}</span>
                  {e.estado === "Pendiente aprobación" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 rounded-lg text-xs font-bold"
                        onClick={async () => {
                          await resolverExcedente(caso.id, e.id, "Aprobado");
                          await refrescar();
                        }}
                      >
                        <BadgeCheck className="size-3.5" /> Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg text-xs text-sla-red hover:bg-sla-red/10 hover:text-sla-red"
                        onClick={async () => {
                          await resolverExcedente(caso.id, e.id, "Objetado");
                          await refrescar();
                        }}
                      >
                        Objetar
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel eyebrow="Validación en la toma" titulo="Casos fuera de cobertura">
            <ul className="divide-y divide-ops-line">
              {noCubiertos.length === 0 && (
                <li className="px-5 py-4 text-[11px] text-ops-muted">
                  Todos los casos activos están cubiertos.
                </li>
              )}
              {noCubiertos.map((caso) => (
                <li
                  key={caso.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <Link
                      to="/caso/$casoId"
                      params={{ casoId: caso.id }}
                      className="text-xs font-bold hover:text-brand-sky"
                    >
                      {caso.placa} · {caso.tipo_servicio}
                    </Link>
                    <p className="mt-1 text-[11px] text-ops-muted">
                      {caso.cobertura} · {caso.ciudad}. No se radica hasta que INDEGA lo apruebe.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 rounded-lg text-xs font-bold"
                    onClick={async () => {
                      await aprobarCobertura(caso.id);
                      await refrescar();
                    }}
                  >
                    Aprobar como particular
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel eyebrow="Focos de excedente" titulo="Qué contrastamos en cada cobro">
            <ul className="divide-y divide-ops-line text-[11px]">
              {[
                [
                  "Kilometraje",
                  `Kilómetros reales del traslado frente al tope. El ${c.intermunicipales_pct}% de las grúas son intermunicipales.`,
                ],
                [
                  "Horas de espera",
                  `${c.horas_espera_servicios} servicios con horas de espera en los últimos 12 meses.`,
                ],
                [
                  "Peajes y desplazamientos",
                  "Peajes y desplazamientos fuera de cobertura contra las tarifas pactadas.",
                ],
                [
                  "Servicios adicionales",
                  "Servicios no solicitados por INDEGA o duplicados en el mismo expediente.",
                ],
              ].map(([t, d]) => (
                <li key={t} className="px-5 py-3">
                  <p className="font-bold">{t}</p>
                  <p className="mt-1 text-ops-muted">{d}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel
        className="mt-5"
        eyebrow="Conciliación mensual"
        titulo="Flota real frente a cartera asegurada · septiembre 2026"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[11px]">
            <thead className="bg-ops-deep/50 text-[9px] uppercase tracking-[0.12em] text-ops-muted">
              <tr>
                <th className="px-5 py-2 font-bold">Placa</th>
                <th className="px-3 py-2 font-bold">Novedad</th>
                <th className="px-5 py-2 font-bold">Acción con Mapfre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ops-line">
              {CONCILIACION_CARTERA.map((r) => (
                <tr key={r.placa}>
                  <td className="px-5 py-3 font-data">{r.placa}</td>
                  <td className="px-3 py-3 text-ops-muted">{r.novedad}</td>
                  <td className="px-5 py-3">
                    <Chip tono={r.accion.startsWith("Incluir") ? "ambar" : "gris"}>{r.accion}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </main>
  );
}
