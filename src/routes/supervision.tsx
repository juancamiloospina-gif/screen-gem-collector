import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Headset,
  Hourglass,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipAtencion, ChipExcepcion, Encabezado, Kpi, Panel } from "@/components/ops";
import { useAhora } from "@/hooks/use-ahora";
import {
  COLOR_SEMAFORO,
  MATRIZ_COMUNICACION,
  TIEMPO_ESPERADO_ETAPA,
  casosQuery,
  esAbierto,
  estaInactivo,
  minutosEnEtapa,
  semaforo,
  type Caso,
} from "@/lib/casos";

export const Route = createFileRoute("/supervision")({
  head: () => ({
    meta: [
      { title: "Supervisión humana · AssisPrex" },
      {
        name: "description",
        content:
          "Controles para que ningún caso se pierda: inactividad, traspasos, excepciones, entrega de turno y auditoría.",
      },
    ],
  }),
  component: Supervision,
});

const EQUIPO = [
  { nombre: "Laura Díaz", rol: "Supervisora de turno", turno: "06:00 – 18:00", estado: "En turno" },
  {
    nombre: "Andrés Pérez",
    rol: "Supervisor de turno",
    turno: "18:00 – 06:00",
    estado: "Siguiente turno",
  },
  {
    nombre: "Camila Rojas",
    rol: "Analista de calidad",
    turno: "08:00 – 17:00",
    estado: "En turno",
  },
];

const AUDITORIA = [
  {
    caso: "#1038",
    agente: "Agente de recepción",
    hallazgo: "Tomó los 4 datos en 3 mensajes; confirmó la placa con la base maestra.",
    nota: 96,
  },
  {
    caso: "#1036",
    agente: "Agente de seguimiento",
    hallazgo: "Llamó a la grúa a los 12 min, dentro de lo esperado. Registró la hora estimada.",
    nota: 92,
  },
  {
    caso: "#1031",
    agente: "Agente de recepción",
    hallazgo: "No entendió un audio con ruido de fondo; traspasó a humano correctamente.",
    nota: 84,
  },
  {
    caso: "#1029",
    agente: "Agente de cierre",
    hallazgo:
      "Aplicó la encuesta, pero no validó el kilometraje del traslado. Se ajustó la instrucción.",
    nota: 71,
  },
];

function FilaCaso({ caso, ahora, detalle }: { caso: Caso; ahora: number; detalle: ReactNode }) {
  const s = semaforo(caso, ahora);
  return (
    <Link
      to="/caso/$casoId"
      params={{ casoId: caso.id }}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-ops-panel/50"
    >
      <span className={`size-2.5 shrink-0 rounded-full ${COLOR_SEMAFORO[s].fondo}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-data text-xs font-medium">{caso.placa}</span>
          <span className="text-[10px] text-ops-muted">
            #{caso.numero} · {caso.ciudad} · {caso.etapa}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-ops-muted">{detalle}</div>
      </div>
      <ArrowRight className="size-4 shrink-0 text-ops-muted transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function Supervision() {
  const ahora = useAhora();
  const { data } = useQuery(casosQuery);
  const casos = data ?? [];
  const abiertos = casos.filter(esAbierto);
  const inactivos = abiertos.filter((c) => estaInactivo(c, ahora));
  const conHumano = abiertos.filter((c) => c.atendido_por === "Supervisor humano");
  const excepciones = casos.filter((c) => c.excepcion);
  const [entrega, setEntrega] = useState<string | null>(null);
  const [revisados, setRevisados] = useState<Set<string>>(new Set());

  return (
    <main className="p-4 lg:p-7">
      <Encabezado
        eyebrow="Supervisión humana y controles"
        titulo="Ningún caso se pierde"
        texto="Los agentes de IA operan de punta a punta; el equipo humano supervisa, resuelve excepciones y toma los casos críticos."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Casos abiertos"
          value={String(abiertos.length)}
          note="Todos con número propio"
        />
        <Kpi
          label="Sin movimiento"
          value={String(inactivos.length)}
          note="Superan el tiempo de su etapa"
          tone={inactivos.length ? "text-sla-red" : "text-sla-green"}
        />
        <Kpi
          label="En supervisión humana"
          value={String(conHumano.length)}
          note="Traspasados por el agente"
          tone="text-sla-amber"
        />
        <Kpi
          label="Estados de excepción"
          value={String(excepciones.length)}
          note="Cancelados, no cubiertos, reclamos…"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel
          eyebrow="Alerta por inactividad"
          titulo="Casos sin cambio de estado"
          accion={<Hourglass className="size-4 text-sla-red" />}
        >
          <div className="divide-y divide-ops-line">
            {inactivos.length === 0 && (
              <p className="px-5 py-4 text-[11px] text-ops-muted">
                Todos los casos avanzan dentro del tiempo esperado.
              </p>
            )}
            {inactivos.map((c) => (
              <FilaCaso
                key={c.id}
                caso={c}
                ahora={ahora}
                detalle={
                  <span className="text-sla-red">
                    {minutosEnEtapa(c, ahora)} min en “{c.etapa}” · esperado{" "}
                    {TIEMPO_ESPERADO_ETAPA[c.etapa]} min · escalado automáticamente
                  </span>
                }
              />
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Traspaso a humano"
          titulo="Casos tomados por un supervisor"
          accion={<Headset className="size-4 text-sla-amber" />}
        >
          <div className="divide-y divide-ops-line">
            {conHumano.length === 0 && (
              <p className="px-5 py-4 text-[11px] text-ops-muted">
                No hay casos en supervisión humana.
              </p>
            )}
            {conHumano.map((c) => (
              <FilaCaso key={c.id} caso={c} ahora={ahora} detalle={c.motivo_traspaso} />
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Estados de excepción"
          titulo="Cancelados, reprogramados, no cubiertos y reclamos"
          accion={<ShieldAlert className="size-4 text-brand-sky" />}
        >
          <div className="divide-y divide-ops-line">
            {excepciones.map((c) => (
              <FilaCaso
                key={c.id}
                caso={c}
                ahora={ahora}
                detalle={
                  <span className="flex flex-wrap items-center gap-2">
                    <ChipExcepcion excepcion={c.excepcion} />
                    <ChipAtencion caso={c} />
                  </span>
                }
              />
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Entrega de turno"
          titulo="Revisión formal de casos abiertos"
          accion={<ClipboardCheck className="size-4 text-brand-sky" />}
        >
          <div className="px-5 py-4">
            <p className="text-[11px] text-ops-muted">
              Laura Díaz entrega a Andrés Pérez a las 18:00. Marca cada caso abierto como revisado
              antes de cerrar el turno.
            </p>
            <ul className="mt-4 space-y-2">
              {abiertos.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-ops-line px-3 py-2 text-[11px]">
                    <input
                      type="checkbox"
                      className="accent-[var(--sla-green)]"
                      checked={revisados.has(c.id)}
                      onChange={(e) =>
                        setRevisados((prev) => {
                          const n = new Set(prev);
                          if (e.target.checked) n.add(c.id);
                          else n.delete(c.id);
                          return n;
                        })
                      }
                    />
                    <span className="font-data">{c.placa}</span>
                    <span className="truncate text-ops-muted">
                      {c.etapa} · {c.ciudad}
                    </span>
                    {estaInactivo(c, ahora) && <Chip tono="rojo">Pendiente</Chip>}
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="font-data text-[10px] text-ops-muted">
                {revisados.size} / {abiertos.length} revisados
              </span>
              {entrega ? (
                <span className="flex items-center gap-2 text-[11px] font-bold text-sla-green">
                  <CheckCircle2 className="size-4" /> Turno entregado a las {entrega}
                </span>
              ) : (
                <Button
                  size="sm"
                  className="rounded-lg font-bold"
                  disabled={revisados.size < abiertos.length}
                  onClick={() =>
                    setEntrega(
                      new Date().toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }),
                    )
                  }
                >
                  Registrar entrega de turno
                </Button>
              )}
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel eyebrow="Matriz de comunicación" titulo="Quién recibe qué, y por qué canal">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[11px]">
              <thead className="bg-ops-deep/50 text-[9px] uppercase tracking-[0.12em] text-ops-muted">
                <tr>
                  <th className="px-5 py-2 font-bold">Actor</th>
                  <th className="px-3 py-2 font-bold">Qué recibe</th>
                  <th className="px-5 py-2 font-bold">Canal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ops-line">
                {MATRIZ_COMUNICACION.map((f) => (
                  <tr key={f.actor}>
                    <td className="px-5 py-3 font-bold">{f.actor}</td>
                    <td className="px-3 py-3 text-ops-muted">{f.recibe}</td>
                    <td className="px-5 py-3">
                      <Chip tono="azul">{f.canal}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-ops-line px-5 py-3 text-[10px] text-ops-muted">
            Configurable por regional, tipo de vehículo y tipo de servicio.
          </p>
        </Panel>

        <div className="space-y-5">
          <Panel eyebrow="Equipo" titulo="Supervisión 24/7">
            <ul className="divide-y divide-ops-line">
              {EQUIPO.map((p) => (
                <li key={p.nombre} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-xs font-bold">{p.nombre}</p>
                    <p className="text-[10px] text-ops-muted">
                      {p.rol} · {p.turno}
                    </p>
                  </div>
                  <Chip tono={p.estado === "En turno" ? "verde" : "gris"}>{p.estado}</Chip>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel eyebrow="Auditoría de calidad" titulo="Muestreo de interacciones de los agentes">
            <ul className="divide-y divide-ops-line">
              {AUDITORIA.map((a) => (
                <li key={a.caso} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold">
                      {a.caso} · {a.agente}
                    </span>
                    <span
                      className={`font-data text-xs ${a.nota >= 90 ? "text-sla-green" : a.nota >= 80 ? "text-sla-amber" : "text-sla-red"}`}
                    >
                      {a.nota}/100
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-ops-muted">{a.hallazgo}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </main>
  );
}
