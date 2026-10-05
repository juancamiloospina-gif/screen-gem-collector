import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { ListaEtapa } from "@/components/lista-etapa";
import { ChipExcedente, Encabezado, Kpi, Panel } from "@/components/ops";
import { PorVencerLista } from "@/components/por-vencer";
import { ProcesoNav } from "@/components/proceso-nav";
import { SlaPanel } from "@/components/sla-panel";
import { useAhora } from "@/hooks/use-ahora";
import { CERRADAS, VENTANA_PREDICTIVA_MIN, casosQuery, formatoReloj } from "@/lib/casos";
import { formatoCOP } from "@/lib/flota";
import { resumenProceso } from "@/lib/procesos";

export const Route = createFileRoute("/seguimiento")({
  head: () => ({
    meta: [
      { title: "Seguimiento · Ruta, atención y cierre · AssisPrex" },
      {
        name: "description",
        content:
          "Proceso de seguimiento: llegada a sitio, atención, traslado y cierre, con el SLA contra la meta.",
      },
    ],
  }),
  component: Seguimiento,
});

function Seguimiento() {
  const ahora = useAhora();
  const { data } = useQuery(casosQuery);
  const casos = data ?? [];
  const r = resumenProceso(casos, ahora, "Seguimiento");
  const cerrados = casos.filter((c) => CERRADAS.includes(c.etapa));
  const encuestas = casos.flatMap((c) => (c.encuesta ? [c.encuesta.nps] : []));
  const nps = encuestas.length
    ? Math.round((encuestas.reduce((s, n) => s + n, 0) / encuestas.length) * 10) / 10
    : null;

  return (
    <main className="p-4 lg:p-7">
      <Encabezado
        eyebrow="Proceso 3 de 3 · Etapas: Llegada a sitio hasta Cierre"
        titulo="Seguimiento · Ruta, atención y cierre"
        texto="Con el proveedor ya asignado, aquí se vigila que llegue, atienda y cierre dentro del tiempo prometido, y que el conductor quede satisfecho."
      />
      <ProcesoNav casos={casos} ahora={ahora} activo="Seguimiento" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="En ruta o atendiendo"
          value={String(r.lista.length)}
          note="Llegada, atención y traslado"
          tone="text-brand-sky"
          acento="azul"
          grande
        />
        <Kpi
          label="Críticos"
          value={String(r.criticos.length)}
          note="Ya superaron el tiempo prometido"
          tone="text-sla-red"
          acento="rojo"
          grande
        />
        <Kpi
          label={`Por vencer ≤ ${VENTANA_PREDICTIVA_MIN} min`}
          value={String(r.venciendo.length)}
          note="Aún se pueden salvar"
          tone="text-sla-amber"
          acento="ambar"
          grande
        />
        <Kpi
          label="Satisfacción (cierre)"
          value={nps === null ? "—" : `${nps}/10`}
          note={`${encuestas.length} respuestas hoy`}
          tone={
            nps === null
              ? "text-ops-muted"
              : nps >= 9
                ? "text-sla-green"
                : nps >= 7
                  ? "text-sla-amber"
                  : "text-sla-red"
          }
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel eyebrow="En el terreno" titulo="Casos en ruta, en sitio y en traslado">
          <ListaEtapa casos={r.lista} ahora={ahora} vacio="No hay casos en ruta ni en atención." />
        </Panel>
        <div className="space-y-5">
          <Panel
            eyebrow="Predictivo"
            titulo={`Se vencen en los próximos ${VENTANA_PREDICTIVA_MIN} min`}
          >
            <PorVencerLista casos={r.lista} ahora={ahora} />
          </Panel>
          <Panel eyebrow="Cierre y evaluación" titulo="Casos finalizados">
            <ul className="divide-y divide-ops-line">
              {cerrados.length === 0 && (
                <li className="px-5 py-4 text-[11px] text-ops-muted">Aún no hay casos cerrados.</li>
              )}
              {cerrados.map((c) => (
                <li key={c.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to="/caso/$casoId"
                      params={{ casoId: c.id }}
                      className="text-xs font-bold hover:text-brand-sky"
                    >
                      {c.placa} · {c.tipo_servicio}
                    </Link>
                    <span className="text-[10px] text-ops-muted">
                      {c.etapa} · {formatoReloj(c.ultimo_cambio_en)}
                    </span>
                  </div>
                  {c.encuesta ? (
                    <p className="mt-1 flex items-start gap-1.5 text-[11px] text-ops-muted">
                      <Star
                        className={`mt-0.5 size-3 shrink-0 ${c.encuesta.nps >= 9 ? "text-sla-green" : c.encuesta.nps >= 7 ? "text-sla-amber" : "text-sla-red"}`}
                      />
                      <span>
                        <span className="font-bold text-ops-ink">{c.encuesta.nps}/10</span> · “
                        {c.encuesta.comentario}”
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-ops-muted">
                      Encuesta enviada, esperando respuesta.
                    </p>
                  )}
                  {c.excedentes.map((e) => (
                    <p
                      key={e.id}
                      className="mt-1 flex items-center gap-2 text-[11px] text-ops-muted"
                    >
                      {e.concepto} · {formatoCOP(e.valor)} <ChipExcedente estado={e.estado} />
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="mt-5">
        <SlaPanel casos={casos} ahora={ahora} />
      </div>
    </main>
  );
}
