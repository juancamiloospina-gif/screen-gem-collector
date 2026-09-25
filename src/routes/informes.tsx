import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Barra, Chip, ChipExcedente, Encabezado, Panel } from "@/components/ops";
import { useAhora } from "@/hooks/use-ahora";
import {
  COLOR_SEMAFORO,
  casosConEventosQuery,
  esAbierto,
  estaInactivo,
  semaforo,
  type Caso,
  type EventoCaso,
} from "@/lib/casos";
import { formatoCOP } from "@/lib/flota";
import {
  COBERTURAS_12M,
  CONCILIACION_CARTERA,
  CONDUCTORES_RECURRENTES,
  DEPARTAMENTOS_12M,
  LLEGADA_MENSUAL,
  MESES_12M,
  PLACAS_RECURRENTES,
  RESUMEN_12M,
} from "@/lib/historico";

export const Route = createFileRoute("/informes")({
  head: () => ({
    meta: [
      { title: "Indicadores e informes · AssisPrex" },
      {
        name: "description",
        content:
          "Indicadores de gestión con metas y los informes diario, mensual, trimestral y de vigencia.",
      },
    ],
  }),
  component: Informes,
});

type Fila = { caso: Caso; eventos: EventoCaso[] };

function minutosEntre(eventos: EventoCaso[], desde: string, hasta: string) {
  const a = eventos.find((e) => e.etapa === desde);
  const b = eventos.find((e) => e.etapa === hasta);
  return a && b
    ? (new Date(b.ocurrido_en).getTime() - new Date(a.ocurrido_en).getTime()) / 60000
    : null;
}

function promedio(xs: (number | null)[]) {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null;
}

function indicadores(filas: Fila[], ahora: number) {
  const llegadas = filas
    .map(({ caso, eventos }) => {
      const e = eventos.find((x) => x.etapa === "Llegada a sitio");
      return e
        ? (new Date(e.ocurrido_en).getTime() - new Date(caso.creado_en).getTime()) / 60000 <=
            caso.prometido_min
        : null;
    })
    .filter((x): x is boolean => x != null);
  const encuestas = filas.map((f) => f.caso.encuesta?.nps).filter((x): x is number => x != null);
  const conExcedente = filas.filter((f) => f.caso.excedentes.length > 0);
  const objetados = filas.flatMap((f) => f.caso.excedentes).filter((e) => e.estado === "Objetado");
  return [
    {
      nombre: "Tiempo de toma y radicación",
      mide: "Primer contacto hasta servicio radicado",
      valor: `${promedio(filas.map((f) => minutosEntre(f.eventos, "Creación", "Trámite"))) ?? "—"} min`,
      meta: "≤ 10 min",
      base: "7–10 min (Mapfre, coordinación)",
    },
    {
      nombre: "Tiempo de asignación",
      mide: "Radicación hasta proveedor asignado",
      valor: `${promedio(filas.map((f) => minutosEntre(f.eventos, "Trámite", "Asignado"))) ?? "—"} min`,
      meta: "≤ 15 min",
      base: "Sin medición propia",
    },
    {
      nombre: "Llegada y cumplimiento",
      mide: "Llegada real frente a tiempo prometido",
      valor: llegadas.length
        ? `${Math.round((llegadas.filter(Boolean).length / llegadas.length) * 100)}% a tiempo`
        : "—",
      meta: "≥ 90%",
      base: "54 min promedio vs 44 de la cartera",
    },
    {
      nombre: "Tiempo de atención y traslado",
      mide: "Asistencia en sitio y traslado",
      valor: `${promedio(filas.map((f) => minutosEntre(f.eventos, "En atención", "Finalizado"))) ?? "—"} min`,
      meta: "Por definir",
      base: "Sin medición propia",
    },
    {
      nombre: "Tiempo total de ciclo",
      mide: "Solicitud hasta cierre",
      valor: `${promedio(filas.map((f) => minutosEntre(f.eventos, "Creación", "Cierre"))) ?? "—"} min`,
      meta: "Por definir",
      base: "Sin medición propia",
    },
    {
      nombre: "Casos sin seguimiento",
      mide: "Superan el tiempo de su etapa sin cambio",
      valor: String(filas.filter((f) => estaInactivo(f.caso, ahora)).length),
      meta: "0",
      base: "No se mide hoy",
    },
    {
      nombre: "Satisfacción del conductor",
      mide: "NPS de la encuesta de cierre",
      valor: encuestas.length ? `${promedio(encuestas)}/10 (${encuestas.length} resp.)` : "—",
      meta: "NPS ≥ 70",
      base: "NPS 59 en jul 2026 (Mapfre)",
    },
    {
      nombre: "Excedentes",
      mide: "% de servicios con excedente y cobros objetados",
      valor: `${Math.round((conExcedente.length / Math.max(filas.length, 1)) * 100)}% · ${objetados.length} objetado`,
      meta: "Seguimiento",
      base: "66 servicios con horas de espera",
    },
    {
      nombre: "Recurrencia",
      mide: "Placas con reincidencia a 30 días",
      valor: `${RESUMEN_12M.reincidencia_30d_pct}%`,
      meta: "Seguimiento",
      base: `${RESUMEN_12M.placas_3_o_mas} placas con 3+ eventos`,
    },
  ];
}

const INFORMES = [
  {
    id: "diario",
    nombre: "Resumen diario",
    periodicidad: "Diario",
    destinatarios: "Director de flota, regionales",
  },
  {
    id: "mensual",
    nombre: "Informe de gestión",
    periodicidad: "Mensual",
    destinatarios: "Dirección de flota",
  },
  {
    id: "coberturas",
    nombre: "Coberturas y excedentes",
    periodicidad: "Mensual",
    destinatarios: "Flota, compras, seguros",
  },
  {
    id: "riesgo",
    nombre: "Flota y riesgo",
    periodicidad: "Trimestral",
    destinatarios: "Dirección de flota, HSE",
  },
  {
    id: "vigencia",
    nombre: "Informe de vigencia",
    periodicidad: "Anual",
    destinatarios: "Gerencia, seguros",
  },
] as const;
type IdInforme = (typeof INFORMES)[number]["id"];

function Informes() {
  const ahora = useAhora();
  const { data } = useQuery(casosConEventosQuery);
  const filas = data ?? [];
  const [sel, setSel] = useState<IdInforme>("diario");
  const info = INFORMES.find((i) => i.id === sel)!;

  return (
    <main className="p-4 lg:p-7">
      <Encabezado
        eyebrow="Indicadores e informes"
        titulo="Datos propios, sin esperar el informe de la aseguradora"
        texto="Los indicadores se calculan con los casos del centro; las metas se acuerdan con INDEGA a partir de la línea base del diagnóstico."
      />

      <Panel eyebrow="Indicadores de gestión" titulo="Medición en vivo frente a meta y línea base">
        <ul className="divide-y divide-ops-line md:hidden">
          {indicadores(filas, ahora).map((k) => (
            <li key={k.nombre} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold">{k.nombre}</p>
                <Chip tono={k.meta === "Por definir" ? "gris" : "azul"}>{k.meta}</Chip>
              </div>
              <p className="mt-1 font-data text-sm text-brand-sky">{k.valor}</p>
              <p className="mt-1 text-[10px] text-ops-muted">
                {k.mide} · Base: {k.base}
              </p>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-left text-[11px]">
            <thead className="bg-ops-deep/50 text-[9px] uppercase tracking-[0.12em] text-ops-muted">
              <tr>
                {[
                  "Indicador",
                  "Qué mide",
                  "Hoy (casos del centro)",
                  "Meta propuesta",
                  "Línea base",
                ].map((h) => (
                  <th key={h} className="px-4 py-2 font-bold first:pl-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ops-line">
              {indicadores(filas, ahora).map((k) => (
                <tr key={k.nombre}>
                  <td className="px-4 py-3 pl-5 font-bold">{k.nombre}</td>
                  <td className="px-4 py-3 text-ops-muted">{k.mide}</td>
                  <td className="px-4 py-3 font-data text-brand-sky">{k.valor}</td>
                  <td className="px-4 py-3">
                    <Chip tono={k.meta === "Por definir" ? "gris" : "azul"}>{k.meta}</Chip>
                  </td>
                  <td className="px-4 py-3 text-ops-muted">{k.base}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Panel eyebrow="Informes" titulo="Periodicidad y destinatarios">
          <ul className="divide-y divide-ops-line">
            <li>
              <Link to="/centro" className="block px-5 py-3 hover:bg-ops-panel/50">
                <p className="text-xs font-bold">Tablero en línea</p>
                <p className="mt-0.5 text-[10px] text-ops-muted">Tiempo real · Flota, regionales</p>
              </Link>
            </li>
            {INFORMES.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => setSel(i.id)}
                  className={`block w-full px-5 py-3 text-left hover:bg-ops-panel/50 ${sel === i.id ? "bg-brand-blue/15 ring-1 ring-inset ring-brand-blue/40" : ""}`}
                >
                  <p className="text-xs font-bold">{i.nombre}</p>
                  <p className="mt-0.5 text-[10px] text-ops-muted">
                    {i.periodicidad} · {i.destinatarios}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          eyebrow={`${info.periodicidad} · para ${info.destinatarios}`}
          titulo={info.nombre}
          accion={
            <Button
              size="sm"
              variant="ghost"
              className="text-ops-muted"
              onClick={() => window.print()}
            >
              <Printer className="size-4" /> Imprimir
            </Button>
          }
        >
          <div className="p-5">
            {sel === "diario" && <ResumenDiario filas={filas} ahora={ahora} />}
            {sel === "mensual" && <InformeMensual />}
            {sel === "coberturas" && <InformeCoberturas filas={filas} />}
            {sel === "riesgo" && <InformeRiesgo />}
            {sel === "vigencia" && <InformeVigencia />}
          </div>
        </Panel>
      </div>
    </main>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mt-6 first:mt-0">
      <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
        {titulo}
      </p>
      {children}
    </div>
  );
}

function Cifras({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(([l, v]) => (
        <div key={l} className="rounded-lg border border-ops-line bg-ops-deep/40 p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-ops-muted">{l}</p>
          <p className="mt-1 font-display text-lg font-semibold">{v}</p>
        </div>
      ))}
    </div>
  );
}

function ResumenDiario({ filas, ahora }: { filas: Fila[]; ahora: number }) {
  const casos = filas.map((f) => f.caso);
  const abiertos = casos.filter(esAbierto);
  const criticos = abiertos.filter((c) => semaforo(c, ahora) === "rojo" || c.excepcion);
  const fecha = new Date(ahora).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <>
      <p className="text-[11px] text-ops-muted">
        Corte de {fecha}, generado automáticamente por el agente analítico.
      </p>
      <Seccion titulo="Incidentes del día">
        <Cifras
          items={[
            ["Casos del día", String(casos.length)],
            ["Abiertos", String(abiertos.length)],
            ["Críticos", String(criticos.length)],
            ["Accidentes", String(casos.filter((c) => c.causa === "Accidente").length)],
          ]}
        />
      </Seccion>
      <Seccion titulo="Casos críticos y pendientes">
        <ul className="divide-y divide-ops-line rounded-lg border border-ops-line">
          {criticos.map((c) => {
            const s = semaforo(c, ahora);
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[11px]">
                <span className={`size-2 rounded-full ${COLOR_SEMAFORO[s].fondo}`} />
                <Link
                  to="/caso/$casoId"
                  params={{ casoId: c.id }}
                  className="font-data hover:text-brand-sky"
                >
                  {c.placa}
                </Link>
                <span className="text-ops-muted">
                  {c.tipo_servicio} · {c.ciudad} · {c.etapa}
                </span>
                {c.excepcion && <Chip tono="rojo">{c.excepcion}</Chip>}
              </li>
            );
          })}
        </ul>
      </Seccion>
    </>
  );
}

function InformeMensual() {
  const ago = MESES_12M[MESES_12M.length - 1]!;
  const llegada = LLEGADA_MENSUAL[LLEGADA_MENSUAL.length - 1]!;
  const maxLlegada = Math.max(...LLEGADA_MENSUAL.map((m) => m.indega));
  return (
    <>
      <p className="text-[11px] text-ops-muted">Agosto de 2026 · Dirección de Flota INDEGA</p>
      <Seccion titulo="Volumen y tiempos">
        <Cifras
          items={[
            ["Expedientes", String(ago.expedientes)],
            ["Servicios", String(ago.servicios)],
            ["Llegada promedio", `${llegada.indega} min`],
            ["Cartera Mapfre", `${llegada.cartera} min`],
          ]}
        />
      </Seccion>
      <Seccion titulo="Tiempo de llegada INDEGA vs cartera Mapfre (13 meses)">
        <div className="flex h-36 items-end gap-2">
          {LLEGADA_MENSUAL.map((m) => (
            <div key={m.mes} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-data text-[8px] text-ops-muted">{m.indega}</span>
              <div className="flex w-full items-end gap-0.5">
                <div
                  className="flex-1 rounded-t bg-brand-blue"
                  style={{ height: `${(m.indega / maxLlegada) * 90}px` }}
                />
                <div
                  className="flex-1 rounded-t bg-ops-muted/50"
                  style={{ height: `${(m.cartera / maxLlegada) * 90}px` }}
                />
              </div>
              <span className="text-[8px] text-ops-muted">{m.mes.split(" ")[0]}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-ops-muted">
          <span className="text-brand-sky">■</span> INDEGA · <span>■</span> resto de la cartera
        </p>
      </Seccion>
      <Seccion titulo="Novedades del mes">
        <ul className="list-disc space-y-1.5 pl-5 text-[11px] leading-relaxed">
          <li>
            El nivel de servicio telefónico de Mapfre cayó al 63% y el abandono subió a 5,6%: uno de
            cada veinte conductores colgó sin ser atendido.
          </li>
          <li>La llegada promedio bajó a 41 min, por primera vez por debajo de la cartera.</li>
          <li>
            El NPS reportado bajó de 92 (enero) a 59 (julio); los detractores pasaron de 0% a 18%.
          </li>
        </ul>
      </Seccion>
    </>
  );
}

function InformeCoberturas({ filas }: { filas: Fila[] }) {
  const exc = filas.flatMap((f) => f.caso.excedentes.map((e) => ({ placa: f.caso.placa, e })));
  const c = COBERTURAS_12M;
  return (
    <>
      <p className="text-[11px] text-ops-muted">Septiembre de 2026 · Flota, compras y seguros</p>
      <Seccion titulo="Resumen">
        <Cifras
          items={[
            ["Valor 12m", "COP 551 M"],
            ["Grúas", `${c.gruas_pct_valor}% del valor`],
            ["Fuera de cartera", `${c.fuera_cartera_servicios} servicios`],
            ["Valor fuera de cartera", "COP 32 M"],
          ]}
        />
      </Seccion>
      <Seccion titulo="Excedentes validados">
        <ul className="divide-y divide-ops-line rounded-lg border border-ops-line">
          {exc.map(({ placa, e }) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[11px]"
            >
              <span>
                <span className="font-data">{placa}</span> · {e.concepto}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-data">{formatoCOP(e.valor)}</span>
                <ChipExcedente estado={e.estado} />
              </span>
            </li>
          ))}
        </ul>
      </Seccion>
      <Seccion titulo="Conciliación de cartera">
        <ul className="list-disc space-y-1.5 pl-5 text-[11px]">
          {CONCILIACION_CARTERA.map((r) => (
            <li key={r.placa}>
              <span className="font-data">{r.placa}</span>: {r.novedad} → {r.accion}
            </li>
          ))}
        </ul>
      </Seccion>
    </>
  );
}

function InformeRiesgo() {
  const max = Math.max(...DEPARTAMENTOS_12M.map((d) => d.expedientes));
  return (
    <>
      <p className="text-[11px] text-ops-muted">
        Tercer trimestre de 2026 · Dirección de Flota y HSE
      </p>
      <Seccion titulo="Placas recurrentes (mantenimiento preventivo)">
        <div className="space-y-2.5">
          {PLACAS_RECURRENTES.slice(0, 5).map((p) => (
            <Barra
              key={p.placa}
              label={`${p.placa} · ${p.causa}`}
              valor={p.expedientes_12m}
              max={10}
              nota={`${p.reincidencias_30d} reinc.`}
              tono="bg-sla-amber"
            />
          ))}
        </div>
      </Seccion>
      <Seccion titulo="Conductores para capacitación">
        <ul className="list-disc space-y-1.5 pl-5 text-[11px]">
          {CONDUCTORES_RECURRENTES.slice(0, 3).map((c) => (
            <li key={c.conductor}>
              {c.conductor} ({c.regional}): {c.patron}
            </li>
          ))}
        </ul>
      </Seccion>
      <Seccion titulo="Zonas de mayor riesgo">
        <div className="space-y-2.5">
          {DEPARTAMENTOS_12M.slice(0, 5).map((d) => (
            <Barra
              key={d.nombre}
              label={d.nombre}
              valor={d.expedientes}
              max={max}
              tono="bg-sla-red/80"
            />
          ))}
        </div>
      </Seccion>
      <Seccion titulo="Recomendaciones">
        <ul className="list-disc space-y-1.5 pl-5 text-[11px] leading-relaxed">
          <li>
            Revisión de embrague y sistema eléctrico en las 3 placas pesadas con reincidencia a 30
            días.
          </li>
          <li>Programa de manejo defensivo nocturno para la Regional Centro.</li>
          <li>
            Exigir a Mapfre refuerzo de la red de grúas de gran tonelaje en el corredor
            Bogotá–Girardot.
          </li>
        </ul>
      </Seccion>
    </>
  );
}

function InformeVigencia() {
  return (
    <>
      <p className="text-[11px] text-ops-muted">
        Vigencia ago 2025 – jul 2026 · Gerencia y seguros
      </p>
      <Seccion titulo="Balance">
        <Cifras
          items={[
            ["Expedientes", RESUMEN_12M.expedientes.toLocaleString("es-CO")],
            ["Servicios", RESUMEN_12M.servicios.toLocaleString("es-CO")],
            ["Llegada promedio", "54 min"],
            ["vs cartera", "+10 min"],
          ]}
        />
      </Seccion>
      <Seccion titulo="Insumos para la renovación de la póliza">
        <ul className="list-disc space-y-1.5 pl-5 text-[11px] leading-relaxed">
          <li>
            Brecha sostenida de 10 minutos frente al promedio de la cartera: pedir compromiso de
            tiempo de llegada por tipo de grúa.
          </li>
          <li>
            El 44% de las grúas son intermunicipales: negociar topes de kilometraje acordes con los
            corredores de distribución.
          </li>
          <li>Conciliar las 32 placas atendidas fuera de cartera antes de la renovación.</li>
          <li>
            Los livianos pasaron de 9% a 26% de los expedientes: revisar coberturas y tarifas para
            este segmento.
          </li>
        </ul>
      </Seccion>
    </>
  );
}
