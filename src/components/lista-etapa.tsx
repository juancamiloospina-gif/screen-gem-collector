import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { ChipAtencion, ChipCobertura, ChipExcepcion } from "@/components/ops";
import {
  COLOR_SEMAFORO,
  TIEMPO_ESPERADO_ETAPA,
  minutosEnEtapa,
  minutosTranscurridos,
  semaforo,
  type Caso,
} from "@/lib/casos";
import { ordenarPorPrioridad } from "@/lib/procesos";

// Lista de casos de un proceso: cuánto llevan en su etapa frente a lo
// esperado, y cuánto del tiempo prometido al cliente han consumido.
export function ListaEtapa({
  casos,
  ahora,
  vacio,
  extra,
  limite,
}: {
  casos: Caso[];
  ahora: number;
  vacio: string;
  extra?: (c: Caso) => ReactNode;
  limite?: number;
}) {
  const lista = ordenarPorPrioridad(casos, ahora);
  if (lista.length === 0) return <p className="px-5 py-4 text-[11px] text-ops-muted">{vacio}</p>;
  return (
    <ul className="divide-y divide-ops-line">
      {lista.slice(0, limite ?? lista.length).map((c) => {
        const s = semaforo(c, ahora);
        const enEtapa = minutosEnEtapa(c, ahora);
        const esperado = TIEMPO_ESPERADO_ETAPA[c.etapa];
        const excede = Number.isFinite(esperado) && enEtapa > esperado;
        return (
          <li key={c.id}>
            <Link
              to="/caso/$casoId"
              params={{ casoId: c.id }}
              className="group block px-5 py-3 hover:bg-ops-panel/50"
            >
              <div className="flex items-center gap-3">
                <span className={`size-2.5 shrink-0 rounded-full ${COLOR_SEMAFORO[s].fondo}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs">
                    <span className="font-data font-medium">{c.placa}</span>
                    <span className="text-ops-muted">
                      {" "}
                      · #{c.numero} · {c.ciudad} · {c.tipo_servicio}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-ops-muted">
                    {c.etapa}
                    {Number.isFinite(esperado) && (
                      <>
                        {" · "}
                        <span className={excede ? "font-bold text-sla-red" : ""}>
                          {enEtapa} min en la etapa (esperado {esperado})
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`font-data text-[11px] ${COLOR_SEMAFORO[s].texto}`}>
                    {minutosTranscurridos(c, ahora)} / {c.prometido_min} min
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-ops-muted transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-5">
                <ChipAtencion caso={c} />
                {c.cobertura !== "Cubierto" && <ChipCobertura cobertura={c.cobertura} />}
                <ChipExcepcion excepcion={c.excepcion} />
                {extra?.(c)}
              </div>
            </Link>
          </li>
        );
      })}
      {limite && lista.length > limite && (
        <li className="px-5 py-3 text-[10px] text-ops-muted">+{lista.length - limite} más</li>
      )}
    </ul>
  );
}
