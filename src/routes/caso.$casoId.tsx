import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Building2,
  Check,
  Clock3,
  FileText,
  Flag,
  MapPin,
  Radio,
  Route as RouteIcon,
  ShieldAlert,
  Star,
  Truck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapaBase, CIUDAD_MAPA } from "@/components/MapaBase";
import { Chip, ChipAtencion, ChipCobertura, ChipExcedente, ChipExcepcion } from "@/components/ops";
import { useAhora } from "@/hooks/use-ahora";
import {
  COLOR_SEMAFORO,
  ETAPAS,
  ETIQUETA_SEMAFORO,
  EXCEPCIONES,
  TIEMPO_ESPERADO_ETAPA,
  aprobarCobertura,
  avanzarEtapa,
  casoQuery,
  esAbierto,
  estaInactivo,
  formatoReloj,
  marcarExcepcion,
  minutosEnEtapa,
  minutosTranscurridos,
  notificacionesDe,
  registrarNovedad,
  resolverExcedente,
  semaforo,
  topeKm,
  traspasarASupervisor,
  vehiculoDe,
  type Excepcion,
} from "@/lib/casos";
import { POLIZA, formatoCOP } from "@/lib/flota";

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

type Accion = "avanzar" | "novedad" | "excepcion" | "traspaso";

function DetalleCaso() {
  const { casoId } = Route.useParams();
  const ahora = useAhora();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(casoQuery(casoId));
  const [dialogo, setDialogo] = useState(false);

  if (isLoading) return <div className="p-8 text-sm text-ops-muted">Cargando caso…</div>;
  if (error || !data)
    return <div className="p-8 text-sm text-sla-red">No fue posible cargar el caso.</div>;

  const { caso, eventos } = data;
  const s = semaforo(caso, ahora);
  const min = minutosTranscurridos(caso, ahora);
  const actual = ETAPAS.indexOf(caso.etapa);
  const pct = Math.min(100, Math.round((min / caso.prometido_min) * 100));
  const vehiculo = vehiculoDe(caso);
  const notificaciones = notificacionesDe(caso, eventos, ahora);
  const tope = topeKm(caso);
  const inactivo = estaInactivo(caso, ahora);
  const abierto = esAbierto(caso);

  async function refrescar() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["caso", casoId] }),
      queryClient.invalidateQueries({ queryKey: ["casos"] }),
    ]);
  }

  const datos: [typeof Truck, string, string][] = [
    [
      Truck,
      "Vehículo",
      vehiculo
        ? `${vehiculo.marca} ${vehiculo.linea} ${vehiculo.modelo} · ${caso.placa}`
        : `${caso.tipo_vehiculo} · ${caso.placa}`,
    ],
    [
      UserRound,
      "Conductor",
      vehiculo ? `${vehiculo.conductor} · ${vehiculo.telefono_conductor}` : "Sin registro",
    ],
    [MapPin, "Origen", `${caso.ciudad} · ${caso.ubicacion}`],
    [
      Flag,
      "Destino",
      caso.destino
        ? `${caso.destino}${caso.km_traslado ? ` · ${caso.km_traslado} km` : ""}`
        : "No aplica",
    ],
    [Clock3, "Apertura", formatoReloj(caso.creado_en)],
    [Radio, "Canal", caso.origen],
    [Building2, "Proveedor asignado", caso.proveedor ?? "Pendiente de asignación"],
    [FileText, `Expediente ${POLIZA.aseguradora}`, caso.expediente ?? "Pendiente de radicación"],
  ];

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
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-sky">
              Caso #{caso.numero} · {caso.causa}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              {caso.placa} · {caso.tipo_servicio}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <ChipAtencion caso={caso} />
              <ChipCobertura cobertura={caso.cobertura} />
              <ChipExcepcion excepcion={caso.excepcion} />
              {inactivo && (
                <Chip tono="rojo">Sin movimiento {minutosEnEtapa(caso, ahora)} min</Chip>
              )}
            </div>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 rounded-lg border border-ops-line bg-ops-navy px-3 py-2 text-xs font-bold ${abierto ? COLOR_SEMAFORO[s].texto : "text-ops-muted"}`}
        >
          <span
            className={`size-2 rounded-full ${abierto ? COLOR_SEMAFORO[s].fondo : "bg-ops-muted"}`}
          />
          {abierto
            ? ETIQUETA_SEMAFORO[s]
            : caso.excepcion === "Cancelado"
              ? "Cancelado"
              : "Cerrado"}
        </div>
      </div>

      {caso.motivo_traspaso && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-sla-amber/40 bg-sla-amber/10 p-4 text-xs">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-sla-amber" />
          <div className="flex-1">
            <p className="font-bold text-sla-amber">En supervisión humana</p>
            <p className="mt-1 text-ops-ink/90">{caso.motivo_traspaso}</p>
          </div>
          {caso.cobertura !== "Cubierto" && (
            <Button
              size="sm"
              className="rounded-lg font-bold"
              onClick={async () => {
                await aprobarCobertura(caso.id);
                await refrescar();
              }}
            >
              Aprobar servicio
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_380px]">
        <div className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-xl border border-ops-line bg-ops-navy">
            <div className="grid gap-px bg-ops-line sm:grid-cols-2 lg:grid-cols-4">
              {datos.map(([Icon, l, v]) => (
                <div key={l} className="bg-ops-navy p-4">
                  <Icon className="size-4 text-brand-sky" />
                  <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-ops-muted">
                    {l}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">{v}</p>
                </div>
              ))}
            </div>
            <div className="p-5 lg:p-7">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
                    Cronología operativa
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold">
                    8 etapas de la asistencia
                  </h3>
                </div>
                <span className="font-data text-xs text-ops-muted">{actual + 1} / 8</span>
              </div>
              <ol className="relative grid gap-0 lg:grid-cols-2 lg:gap-x-12">
                {ETAPAS.map((etapa, i) => {
                  const evento = eventos.find((e) => e.etapa === etapa);
                  const done = i < actual || (i === actual && !abierto);
                  const current = i === actual && abierto;
                  const omitida = etapa === "Traslado" && !caso.destino && i < actual;
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
                          {done ? (
                            <Check className="size-4" />
                          ) : (
                            <span className="font-data text-[10px]">{i + 1}</span>
                          )}
                        </span>
                        {i < ETAPAS.length - 1 && (
                          <span
                            className={`h-full w-px ${done ? "bg-brand-blue" : "bg-ops-line"}`}
                          />
                        )}
                      </div>
                      <div className="pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`text-sm font-bold ${current ? COLOR_SEMAFORO[s].texto : done ? "text-ops-ink" : "text-ops-muted"}`}
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
                          {omitida
                            ? "No aplica"
                            : evento
                              ? formatoReloj(evento.ocurrido_en)
                              : "Pendiente"}
                        </p>
                        {current && (
                          <p
                            className={`mt-1 text-[10px] ${inactivo ? "text-sla-red" : "text-ops-muted"}`}
                          >
                            {minutosEnEtapa(caso, ahora)} min en esta etapa
                            {Number.isFinite(TIEMPO_ESPERADO_ETAPA[etapa]) &&
                              ` · esperado ${TIEMPO_ESPERADO_ETAPA[etapa]} min`}
                          </p>
                        )}
                        {evento?.nota && (
                          <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-ops-muted">
                            {evento.nota}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-ops-line bg-ops-navy">
              <div className="border-b border-ops-line px-5 py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
                  Trazabilidad
                </p>
                <h3 className="mt-1 text-sm font-bold">Novedades del caso</h3>
              </div>
              <ol className="divide-y divide-ops-line">
                {caso.novedades.length === 0 && (
                  <li className="px-5 py-4 text-[11px] text-ops-muted">
                    Sin novedades registradas.
                  </li>
                )}
                {[...caso.novedades].reverse().map((n, i) => (
                  <li key={i} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3 text-[10px]">
                      <span className="font-bold text-brand-sky">{n.autor}</span>
                      <span className="font-data text-ops-muted">{formatoReloj(n.en)}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-ops-ink/90">{n.texto}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-xl border border-ops-line bg-ops-navy">
              <div className="flex items-center justify-between border-b border-ops-line px-5 py-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
                    Matriz de comunicación
                  </p>
                  <h3 className="mt-1 text-sm font-bold">Notificaciones enviadas</h3>
                </div>
                <span className="flex items-center gap-1 font-data text-[10px] text-ops-muted">
                  <Bell className="size-3" /> {notificaciones.length}
                </span>
              </div>
              <ol className="max-h-[420px] divide-y divide-ops-line overflow-y-auto">
                {notificaciones.map((n) => (
                  <li key={n.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3 text-[10px]">
                      <span className="font-bold">{n.actor}</span>
                      <span className="font-data text-ops-muted">{formatoReloj(n.en)}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-ops-muted">
                      {n.destinatario} · {n.canal} ·{" "}
                      <span className={n.estado === "Leído" ? "text-sla-green" : ""}>
                        {n.estado}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ops-ink/90">{n.mensaje}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-ops-line bg-ops-navy p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
              Control de tiempo
            </p>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className={`font-display text-4xl font-semibold ${COLOR_SEMAFORO[s].texto}`}>
                  {min}
                  <span className="ml-1 text-sm">min</span>
                </p>
                <p className="mt-1 text-xs text-ops-muted">
                  de {caso.prometido_min} min prometidos
                </p>
              </div>
              <span className="font-data text-xs text-ops-muted">{pct}%</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-ops-deep">
              <div className={`h-full ${COLOR_SEMAFORO[s].fondo}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="rounded-xl border border-ops-line bg-ops-navy p-5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
                Cobertura
              </p>
              <ChipCobertura cobertura={caso.cobertura} />
            </div>
            <dl className="mt-4 space-y-2 text-[11px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ops-muted">Póliza</dt>
                <dd className="text-right">
                  {vehiculo?.en_cartera
                    ? `${POLIZA.aseguradora} · ${POLIZA.vigencia}`
                    : "Fuera de cartera"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ops-muted">Regional</dt>
                <dd>{vehiculo ? `${vehiculo.regional} · ${vehiculo.centro_costo}` : "—"}</dd>
              </div>
              {caso.destino && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ops-muted">Traslado vs tope</dt>
                  <dd
                    className={
                      caso.km_traslado && tope && caso.km_traslado > tope ? "text-sla-red" : ""
                    }
                  >
                    {caso.km_traslado ?? "—"} km / {tope} km
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-ops-line bg-ops-navy">
            <div className="border-b border-ops-line px-5 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
                Excedentes
              </p>
              <p className="mt-1 text-[10px] text-ops-muted">
                Todo excedente requiere aprobación previa de INDEGA.
              </p>
            </div>
            {caso.excedentes.length === 0 ? (
              <p className="px-5 py-4 text-[11px] text-ops-muted">
                Sin cobros adicionales reportados.
              </p>
            ) : (
              <ul className="divide-y divide-ops-line">
                {caso.excedentes.map((e) => (
                  <li key={e.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold">{e.concepto}</p>
                      <ChipExcedente estado={e.estado} />
                    </div>
                    <p className="mt-1 text-[11px] text-ops-muted">{e.detalle}</p>
                    <p className="mt-2 font-data text-sm">{formatoCOP(e.valor)}</p>
                    {e.estado === "Pendiente aprobación" && (
                      <div className="mt-3 flex gap-2">
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
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(caso.etapa === "Cierre" || caso.encuesta) && (
            <div className="rounded-xl border border-ops-line bg-ops-navy p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
                Evaluación de cierre
              </p>
              {caso.encuesta ? (
                <>
                  <div className="mt-4 flex items-center gap-3">
                    <Star
                      className={`size-5 ${caso.encuesta.nps >= 9 ? "text-sla-green" : caso.encuesta.nps >= 7 ? "text-sla-amber" : "text-sla-red"}`}
                    />
                    <p className="font-display text-2xl font-semibold">
                      {caso.encuesta.nps}
                      <span className="text-sm text-ops-muted">/10</span>
                    </p>
                    <span className="text-[10px] text-ops-muted">
                      {caso.encuesta.nps >= 9
                        ? "Promotor"
                        : caso.encuesta.nps >= 7
                          ? "Neutro"
                          : "Detractor"}
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] italic leading-relaxed text-ops-ink/90">
                    “{caso.encuesta.comentario}”
                  </p>
                </>
              ) : (
                <p className="mt-3 text-[11px] text-ops-muted">
                  Encuesta enviada por WhatsApp. Esperando respuesta del conductor.
                </p>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-ops-line bg-ops-navy">
            <div className="relative h-60 bg-ops-deep">
              <MapaBase className="p-4" opacidad="opacity-80" alt="Ubicación del caso en Colombia">
                <span
                  className={`absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ops-ink ${COLOR_SEMAFORO[s].fondo}`}
                  style={{
                    left: `${CIUDAD_MAPA[caso.ciudad]?.x ?? caso.mapa_x}%`,
                    top: `${CIUDAD_MAPA[caso.ciudad]?.y ?? caso.mapa_y}%`,
                  }}
                />
              </MapaBase>
              <div className="absolute bottom-4 left-4 rounded-lg border border-ops-line bg-ops-deep/90 px-3 py-2 backdrop-blur">
                <p className="flex items-center gap-1.5 text-xs font-bold">
                  <RouteIcon className="size-3 text-brand-sky" /> {caso.ciudad}
                </p>
                <p className="mt-0.5 text-[10px] text-ops-muted">{caso.ubicacion}</p>
              </div>
            </div>
          </div>
          <Button className="h-11 w-full rounded-lg font-bold" onClick={() => setDialogo(true)}>
            Registrar actualización
          </Button>
        </aside>
      </div>

      <DialogoActualizacion
        abierto={dialogo}
        onCerrar={() => setDialogo(false)}
        puedeAvanzar={caso.etapa !== "Cierre" && caso.excepcion !== "Cancelado"}
        siguiente={ETAPAS[Math.min(actual + 1, ETAPAS.length - 1)]!}
        onAccion={async (accion, valor) => {
          if (accion === "avanzar") await avanzarEtapa(caso.id);
          if (accion === "novedad") await registrarNovedad(caso.id, valor);
          if (accion === "excepcion")
            await marcarExcepcion(caso.id, valor === "Ninguna" ? null : (valor as Excepcion));
          if (accion === "traspaso")
            await traspasarASupervisor(caso.id, valor || "Solicitud manual del coordinador");
          await refrescar();
          setDialogo(false);
        }}
      />
    </main>
  );
}

function DialogoActualizacion({
  abierto,
  onCerrar,
  puedeAvanzar,
  siguiente,
  onAccion,
}: {
  abierto: boolean;
  onCerrar: () => void;
  puedeAvanzar: boolean;
  siguiente: string;
  onAccion: (accion: Accion, valor: string) => Promise<void>;
}) {
  const [accion, setAccion] = useState<Accion>(puedeAvanzar ? "avanzar" : "novedad");
  const [valor, setValor] = useState("");
  const [excepcion, setExcepcion] = useState<string>(EXCEPCIONES[1]);
  const opciones: [Accion, string][] = [
    ...(puedeAvanzar ? ([["avanzar", `Avanzar a "${siguiente}"`]] as [Accion, string][]) : []),
    ["novedad", "Registrar novedad"],
    ["excepcion", "Marcar estado de excepción"],
    ["traspaso", "Traspasar a supervisor humano"],
  ];
  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="border-ops-line bg-ops-navy text-ops-ink">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar actualización</DialogTitle>
          <DialogDescription className="text-ops-muted">
            Cada cambio queda con fecha, hora y responsable, y dispara las notificaciones de la
            matriz.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await onAccion(accion, accion === "excepcion" ? excepcion : valor);
            setValor("");
          }}
        >
          <div className="grid gap-2">
            {opciones.map(([k, l]) => (
              <label
                key={k}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-xs ${accion === k ? "border-brand-sky bg-brand-blue/15" : "border-ops-line"}`}
              >
                <input
                  type="radio"
                  name="accion"
                  value={k}
                  checked={accion === k}
                  onChange={() => setAccion(k)}
                  className="accent-[var(--brand-sky)]"
                />
                {l}
              </label>
            ))}
          </div>
          {accion === "excepcion" && (
            <select
              value={excepcion}
              onChange={(e) => setExcepcion(e.target.value)}
              className="h-10 w-full rounded-lg border border-ops-line bg-ops-deep px-3 text-xs text-ops-ink"
            >
              {EXCEPCIONES.map((x) => (
                <option key={x}>{x}</option>
              ))}
              <option>Ninguna</option>
            </select>
          )}
          {(accion === "novedad" || accion === "traspaso") && (
            <textarea
              required={accion === "novedad"}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={
                accion === "novedad"
                  ? "Ej. El proveedor reporta trancón en la vía, nueva hora estimada 15:40"
                  : "Motivo del traspaso (opcional)"
              }
              className="min-h-24 w-full rounded-lg border border-ops-line bg-ops-deep p-3 text-xs text-ops-ink outline-none placeholder:text-ops-muted focus:border-brand-sky"
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" className="text-ops-muted" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-lg font-bold">
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
