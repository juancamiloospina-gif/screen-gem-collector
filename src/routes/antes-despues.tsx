import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/antes-despues")({
  head: () => ({
    meta: [
      { title: "Antes / Después · INDEGA Control de Asistencias" },
      {
        name: "description",
        content:
          "Comparación entre la operación actual sin visibilidad y la operación con seguimiento en vivo y alertas automáticas.",
      },
      { property: "og:title", content: "Antes / Después · INDEGA" },
      {
        property: "og:description",
        content: "54 minutos y cero visibilidad frente a seguimiento en vivo con alertas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AntesDespues,
});

const ANTES = [
  { k: "Tiempo de llegada promedio", v: "54 min", n: "vs. 44 min del resto de la cartera" },
  { k: "Visibilidad del caso", v: "Ninguna", n: "nadie en INDEGA sabe dónde va la asistencia" },
  { k: "Aviso de incumplimiento", v: "Semanas después", n: "por el informe de la aseguradora" },
  { k: "Nivel de servicio telefónico", v: "63%", n: "llamadas atendidas" },
  { k: "NPS", v: "59", n: "cayó desde 92" },
];

const DESPUES = [
  { k: "Tiempo de llegada", v: "Medido en vivo", n: "cronómetro por caso contra el prometido" },
  { k: "Visibilidad del caso", v: "8 etapas", n: "fecha y hora de cada cambio de estado" },
  { k: "Aviso de incumplimiento", v: "Inmediato", n: "alerta automática al Director de Flota" },
  { k: "Canal del conductor", v: "Chat con IA", n: "el caso se abre en segundos, sin llamada" },
  { k: "Evidencia para negociar", v: "Datos propios", n: "ya no dependen del informe externo" },
];

function Columna({
  titulo,
  subtitulo,
  filas,
  tono,
}: {
  titulo: string;
  subtitulo: string;
  filas: { k: string; v: string; n: string }[];
  tono: string;
}) {
  return (
    <section className="flex-1 overflow-hidden rounded-xl border border-ops-line bg-ops-navy">
      <div className="border-b border-ops-line px-5 py-5">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-ink">{titulo}</div>
        <div className={`mt-1 text-[15px] ${tono}`}>{subtitulo}</div>
      </div>
      <div className="divide-y divide-ops-line">
        {filas.map((f) => (
          <div key={f.k} className="px-5 py-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-faint">{f.k}</div>
            <div className={`mt-1 font-mono text-2xl tabular-nums tracking-tight ${tono}`}>
              {f.v}
            </div>
            <div className="mt-1 text-[12px] text-muted-ink">{f.n}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AntesDespues() {
  return (
    <main className="p-4 lg:p-7">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-ink">
          Antes / Después
        </div>
        <h2 className="mt-1 font-display text-2xl font-semibold">De reacción tardía a control en vivo</h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ops-muted">
          El problema de hoy no es solo el tiempo de llegada: es que INDEGA no puede verlo mientras
          ocurre. Con este modelo, cada caso se mide contra su tiempo prometido y el incumplimiento
          se avisa en el momento, no semanas después.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Columna
          titulo="Hoy · sin visibilidad"
          subtitulo="La flota se entera cuando ya es tarde"
          filas={ANTES}
          tono="text-sla-red"
        />
        <Columna
          titulo="Con este modelo"
          subtitulo="Seguimiento en vivo y alerta automática"
          filas={DESPUES}
          tono="text-sla-green"
        />
      </div>
    </main>
  );
}
