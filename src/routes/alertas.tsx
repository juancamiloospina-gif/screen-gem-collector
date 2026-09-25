import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAhora } from "@/hooks/use-ahora";
import {
  COLOR_SEMAFORO,
  ETIQUETA_SEMAFORO,
  casosQuery,
  esAbierto,
  formatoReloj,
  minutosTranscurridos,
  semaforo,
} from "@/lib/casos";

export const Route = createFileRoute("/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas automáticas · INDEGA Control de Asistencias" },
      {
        name: "description",
        content:
          "Aviso automático al Director de Flota cuando un caso supera el tiempo de llegada prometido.",
      },
      { property: "og:title", content: "Alertas automáticas · INDEGA" },
      {
        property: "og:description",
        content: "Notificaciones en vivo por incumplimiento de tiempos de asistencia.",
      },
    ],
  }),
  component: Alertas,
});

function Alertas() {
  const ahora = useAhora();
  const { data } = useQuery(casosQuery);
  const abiertos = (data ?? []).filter(esAbierto);
  const rojos = abiertos.filter((c) => semaforo(c, ahora) === "rojo");
  const amarillos = abiertos.filter((c) => semaforo(c, ahora) === "amarillo");

  return (
    <div className="flex gap-3 p-3">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-panel ring-1 ring-line">
        <div className="flex h-10 items-center justify-between border-b border-line px-4">
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-ink">
            Avisos automáticos al Director de Flota
          </span>
          <span className="font-mono text-[10px] tabular-nums text-sla-red">
            {rojos.length} incumplimientos
          </span>
        </div>
        <div className="divide-y divide-line">
          {[...rojos, ...amarillos].map((caso) => {
            const s = semaforo(caso, ahora);
            const min = minutosTranscurridos(caso, ahora);
            return (
              <Link
                key={caso.id}
                to="/caso/$casoId"
                params={{ casoId: caso.id }}
                className="block px-4 py-4 hover:bg-panel2/50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`size-2 rounded-full ${COLOR_SEMAFORO[s].fondo} ${
                      s === "rojo" ? "pulse-sla" : ""
                    }`}
                  />
                  <span className="font-mono text-[13px] tabular-nums text-ink">
                    Caso #{caso.numero}
                  </span>
                  <span className="text-[12px] text-muted-ink">
                    {caso.tipo_servicio} · {caso.placa} · {caso.ciudad}
                  </span>
                  <span className={`ml-auto text-[11px] ${COLOR_SEMAFORO[s].texto}`}>
                    {ETIQUETA_SEMAFORO[s]}
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-ink/90">
                  {min} min {s === "rojo" ? "sin cerrar la etapa" : "transcurridos"} — prometido:{" "}
                  {caso.prometido_min} min. Etapa actual: {caso.etapa}.
                </p>
                <div className="mt-1 font-mono text-[10px] tabular-nums text-faint">
                  Apertura {formatoReloj(caso.creado_en)} · notificación enviada por correo y
                  WhatsApp (simulado)
                </div>
              </Link>
            );
          })}
          {rojos.length + amarillos.length === 0 && (
            <div className="px-4 py-8 text-[12px] text-muted-ink">
              No hay avisos activos: todos los casos van dentro del tiempo prometido.
            </div>
          )}
        </div>
      </section>

      <aside className="w-[300px] shrink-0 overflow-hidden rounded-lg bg-panel ring-1 ring-line">
        <div className="flex h-10 items-center border-b border-line px-4 text-[11px] uppercase tracking-[0.16em] text-muted-ink">
          Regla de escalamiento
        </div>
        <ul className="divide-y divide-line text-[12px] text-muted-ink">
          <li className="px-4 py-3">
            <span className="text-sla-amber">75% del tiempo prometido</span> — aviso preventivo al
            coordinador.
          </li>
          <li className="px-4 py-3">
            <span className="text-sla-red">100% del tiempo prometido</span> — aviso inmediato al
            Director de Flota.
          </li>
          <li className="px-4 py-3">
            Hoy INDEGA se entera semanas después, por el informe de la aseguradora.
          </li>
        </ul>
      </aside>
    </div>
  );
}
