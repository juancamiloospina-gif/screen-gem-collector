import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListaEtapa } from "@/components/lista-etapa";
import { Barra, Chip, ChipCobertura, Encabezado, Kpi, Panel } from "@/components/ops";
import { PorVencerLista } from "@/components/por-vencer";
import { ProcesoNav } from "@/components/proceso-nav";
import { BarraSla, PctSla } from "@/components/sla-panel";
import { useAhora } from "@/hooks/use-ahora";
import {
  TIEMPO_ESPERADO_ETAPA,
  VENTANA_PREDICTIVA_MIN,
  aprobarCobertura,
  casosQuery,
  esAbierto,
  minutosEnEtapa,
} from "@/lib/casos";
import { CANALES_HOY } from "@/lib/historico";
import { resumenProceso } from "@/lib/procesos";
import { semaforoSla } from "@/lib/sla";

export const Route = createFileRoute("/front")({
  head: () => ({
    meta: [
      { title: "Front · Toma y validación · AssisPrex" },
      {
        name: "description",
        content:
          "Proceso de toma: solicitudes recién recibidas, validación de cobertura y canales del conductor.",
      },
    ],
  }),
  component: Front,
});

const META_TOMA_MIN = TIEMPO_ESPERADO_ETAPA["Creación"];
const META_SLA_TOMA = 95;

function Front() {
  const ahora = useAhora();
  const queryClient = useQueryClient();
  const { data } = useQuery(casosQuery);
  const casos = data ?? [];
  const r = resumenProceso(casos, ahora, "Front");
  const sinCobertura = casos.filter((c) => esAbierto(c) && c.cobertura !== "Cubierto");
  const dentro = r.lista.filter((c) => minutosEnEtapa(c, ahora) <= META_TOMA_MIN).length;
  const pctToma = r.lista.length ? Math.round((dentro / r.lista.length) * 100) : null;
  const sToma = semaforoSla(pctToma, META_SLA_TOMA);
  const conteo = (estado: string) =>
    casos.filter((c) => esAbierto(c) && c.cobertura === estado).length;

  return (
    <main className="p-4 lg:p-7">
      <Encabezado
        eyebrow="Proceso 1 de 3 · Etapa: Creación"
        titulo="Front · Toma y validación"
        texto="El agente de IA recibe al conductor, cruza la placa con la base maestra, valida la cobertura y abre el caso. Aquí se ve qué está en la puerta y si algo se está quedando."
      >
        <Button asChild className="rounded-lg font-bold">
          <Link to="/reportar">
            <MessageSquareText className="size-4" /> Probar el chat del conductor
          </Link>
        </Button>
      </Encabezado>
      <ProcesoNav casos={casos} ahora={ahora} activo="Front" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="En toma ahora"
          value={String(r.lista.length)}
          note="Solicitudes sin radicar"
          tone="text-brand-sky"
          acento="azul"
          grande
        />
        <Kpi
          label="Tiempo medio en toma"
          value={`${r.promedioEtapa} min`}
          note={`Meta ≤ ${META_TOMA_MIN} min`}
          tone={r.promedioEtapa <= META_TOMA_MIN ? "text-sla-green" : "text-sla-red"}
          acento={r.promedioEtapa <= META_TOMA_MIN ? "verde" : "rojo"}
          grande
        />
        <Kpi
          label={`Por vencer ≤ ${VENTANA_PREDICTIVA_MIN} min`}
          value={String(r.venciendo.length)}
          note="En toma o con el SLA cerca"
          tone="text-sla-amber"
          acento="ambar"
          grande
        />
        <Kpi
          label="Esperan aprobación"
          value={String(sinCobertura.length)}
          note="Fuera de cartera o no cubiertos"
          tone={sinCobertura.length ? "text-sla-red" : "text-sla-green"}
          acento={sinCobertura.length ? "rojo" : "verde"}
          grande
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel eyebrow="Cola de toma" titulo="Solicitudes en la puerta">
            <ListaEtapa
              casos={r.lista}
              ahora={ahora}
              vacio="No hay solicitudes esperando en la toma."
            />
          </Panel>
          <Panel
            eyebrow="Predictivo"
            titulo={`Se vencen en los próximos ${VENTANA_PREDICTIVA_MIN} min`}
          >
            <PorVencerLista casos={r.lista} ahora={ahora} />
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel eyebrow="SLA del proceso" titulo="Toma dentro del tiempo esperado">
            <div className="space-y-3 p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-ops-muted">
                  {dentro} de {r.lista.length} en ≤ {META_TOMA_MIN} min
                </span>
                <PctSla pct={pctToma} meta={META_SLA_TOMA} />
              </div>
              <BarraSla pct={pctToma} meta={META_SLA_TOMA} />
              <p className="text-[10px] text-ops-muted">
                Meta {META_SLA_TOMA}%.{" "}
                {sToma === "rojo"
                  ? "La toma se está atrasando."
                  : sToma === "amarillo"
                    ? "Cerca de la meta."
                    : "Dentro de la meta."}
              </p>
            </div>
          </Panel>

          <Panel eyebrow="Validación en la toma" titulo="Cobertura de los casos abiertos">
            <div className="grid grid-cols-3 gap-px bg-ops-line text-center">
              {(["Cubierto", "Fuera de cartera", "Servicio no cubierto"] as const).map((e) => (
                <div key={e} className="bg-ops-navy px-2 py-3">
                  <p className="font-display text-xl font-semibold">{conteo(e)}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-wide text-ops-muted">{e}</p>
                </div>
              ))}
            </div>
            <ul className="divide-y divide-ops-line">
              {sinCobertura.length === 0 && (
                <li className="px-5 py-4 text-[11px] text-ops-muted">Todo está cubierto.</li>
              )}
              {sinCobertura.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div>
                    <Link
                      to="/caso/$casoId"
                      params={{ casoId: c.id }}
                      className="text-xs font-bold hover:text-brand-sky"
                    >
                      {c.placa} · {c.tipo_servicio}
                    </Link>
                    <p className="mt-1 flex items-center gap-2 text-[10px] text-ops-muted">
                      <ChipCobertura cobertura={c.cobertura} /> No se radica hasta que INDEGA
                      apruebe
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 rounded-lg text-xs font-bold"
                    onClick={async () => {
                      await aprobarCobertura(c.id);
                      await queryClient.invalidateQueries({ queryKey: ["casos"] });
                    }}
                  >
                    Aprobar
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            eyebrow="Canales del conductor"
            titulo="Cómo llegaron las solicitudes hoy"
            accion={<Chip tono="azul">Ejemplo</Chip>}
          >
            <div className="space-y-3 p-5">
              {CANALES_HOY.map((c) => (
                <Barra key={c.canal} label={c.canal} valor={c.pct} max={100} sufijo="%" />
              ))}
              <p className="pt-1 text-[10px] leading-relaxed text-ops-muted">
                Basta con cuatro datos: servicio, placa, ubicación y destino si hay traslado. El
                resto sale de la base maestra de flota.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
