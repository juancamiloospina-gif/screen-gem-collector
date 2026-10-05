import { Link } from "@tanstack/react-router";
import { ArrowRight, Timer } from "lucide-react";
import { Chip } from "@/components/ops";
import { COLOR_SEMAFORO, VENTANA_PREDICTIVA_MIN, semaforo, type Caso } from "@/lib/casos";
import { casosPorVencer } from "@/lib/procesos";

// Predictivo: casos que se vencen en los próximos minutos, antes de que se
// conviertan en incumplimientos.
export function PorVencerLista({
  casos,
  ahora,
  limite = 6,
  ventana = VENTANA_PREDICTIVA_MIN,
}: {
  casos: Caso[];
  ahora: number;
  limite?: number;
  ventana?: number;
}) {
  const lista = casosPorVencer(casos, ahora, ventana);
  if (lista.length === 0)
    return (
      <p className="px-5 py-4 text-[11px] text-ops-muted">
        Ningún caso se vence en los próximos {ventana} min.
      </p>
    );
  return (
    <ul className="divide-y divide-ops-line">
      {lista.slice(0, limite).map(({ caso, vence }) => (
        <li key={caso.id}>
          <Link
            to="/caso/$casoId"
            params={{ casoId: caso.id }}
            className="group flex items-center gap-3 px-5 py-3 hover:bg-ops-panel/50"
          >
            <span
              className={`size-2.5 shrink-0 rounded-full ${COLOR_SEMAFORO[semaforo(caso, ahora)].fondo}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="font-data text-xs font-medium">{caso.placa}</span>
                <span className="truncate text-[10px] text-ops-muted">
                  #{caso.numero} · {caso.ciudad} · {caso.tipo_servicio}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-ops-muted">
                {vence.motivo === "SLA"
                  ? "Tiempo prometido al cliente"
                  : `Tiempo de la etapa “${caso.etapa}”`}
              </p>
            </div>
            <Chip tono={vence.minutos <= 5 ? "rojo" : "ambar"}>
              <Timer className="size-3" /> {vence.minutos} min
            </Chip>
            <ArrowRight className="size-4 shrink-0 text-ops-muted transition-transform group-hover:translate-x-1" />
          </Link>
        </li>
      ))}
      {lista.length > limite && (
        <li className="px-5 py-3 text-[10px] text-ops-muted">
          +{lista.length - limite} más en los próximos {ventana} min
        </li>
      )}
    </ul>
  );
}
