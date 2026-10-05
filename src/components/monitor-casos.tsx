import { Link } from "@tanstack/react-router";
import { ArrowRight, Timer } from "lucide-react";
import { Chip, ChipExcepcion } from "@/components/ops";
import { ordenarPorPrioridad } from "@/lib/procesos";
import {
  COLOR_SEMAFORO,
  ETIQUETA_FAMILIA,
  ETIQUETA_SEMAFORO,
  esAbierto,
  familiaDe,
  minutosRestantes,
  minutosTranscurridos,
  porVencer,
  procesoDe,
  semaforo,
  type Caso,
  type Familia,
} from "@/lib/casos";

function FilaCaso({ caso, ahora }: { caso: Caso; ahora: number }) {
  const s = semaforo(caso, ahora);
  const min = minutosTranscurridos(caso, ahora);
  const pct = Math.min(100, Math.round((min / caso.prometido_min) * 100));
  const vence = porVencer(caso, ahora);
  const familia = familiaDe(caso.tipo_servicio);
  return (
    <Link
      to="/caso/$casoId"
      params={{ casoId: caso.id }}
      className="block border-t border-ops-line px-4 py-3 transition-colors hover:bg-ops-panel/60"
    >
      {/* Tarjeta en móvil */}
      <div className="sm:hidden">
        <div className="flex items-center gap-2">
          <span className={`size-2 shrink-0 rounded-full ${COLOR_SEMAFORO[s].fondo}`} />
          <span className="font-data text-xs font-medium">{caso.placa}</span>
          <span className="text-[10px] text-ops-muted">#{caso.numero}</span>
          <span className="ml-auto text-[10px] text-ops-muted">{caso.ciudad}</span>
        </div>
        <p className="mt-2 truncate text-xs">{caso.tipo_servicio}</p>
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px]">
          <span className="text-ops-muted">
            {procesoDe(caso)} · <span className="text-ops-ink/90">{caso.etapa}</span>
          </span>
          <span className={`shrink-0 font-data ${COLOR_SEMAFORO[s].texto}`}>
            {min} / {caso.prometido_min} min
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ops-deep">
          <div className={`h-full ${COLOR_SEMAFORO[s].fondo}`} style={{ width: `${pct}%` }} />
        </div>
        {(vence || caso.excepcion) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {vence && (
              <Chip tono={vence.minutos <= 5 ? "rojo" : "ambar"}>
                <Timer className="size-3" /> vence en {vence.minutos} min
              </Chip>
            )}
            <ChipExcepcion excepcion={caso.excepcion} />
          </div>
        )}
      </div>

      {/* Fila en escritorio */}
      <div className="hidden grid-cols-[1.1fr_1.2fr_.8fr_1fr_auto] items-center gap-3 sm:grid">
        <div>
          <p className="font-data text-xs font-medium">{caso.placa}</p>
          <p className="mt-0.5 truncate text-[10px] text-ops-muted">
            #{caso.numero} · {caso.tipo_servicio}
          </p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-ops-ink/90">{caso.etapa}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ops-muted">
            {procesoDe(caso)}
            {familia && <span>· {ETIQUETA_FAMILIA[familia]}</span>}
          </p>
        </div>
        <p className="text-xs text-ops-muted">{caso.ciudad}</p>
        <div>
          <div className="mb-1 flex justify-between font-data text-[9px]">
            <span>{min} min</span>
            <span className="text-ops-muted">{caso.prometido_min} min</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ops-deep">
            <div className={`h-full ${COLOR_SEMAFORO[s].fondo}`} style={{ width: `${pct}%` }} />
          </div>
          {vence && (
            <p className="mt-1 flex items-center gap-1 text-[9px] font-bold text-sla-amber">
              <Timer className="size-2.5" /> vence en {vence.minutos} min
            </p>
          )}
        </div>
        <div className={`flex items-center gap-2 text-[10px] font-bold ${COLOR_SEMAFORO[s].texto}`}>
          <span className={`size-2 rounded-full ${COLOR_SEMAFORO[s].fondo}`} />
          <span className="hidden 2xl:inline">{ETIQUETA_SEMAFORO[s]}</span>
          <ArrowRight className="size-3 text-ops-muted" />
        </div>
      </div>
    </Link>
  );
}

export function MonitorCasos({
  casos,
  ahora,
  ciudad = null,
  familia = null,
  cargando = false,
  error = false,
  onLimpiar,
  titulo = "Todas las asistencias abiertas",
}: {
  casos: Caso[];
  ahora: number;
  ciudad?: string | null;
  familia?: Familia | null;
  cargando?: boolean;
  error?: boolean;
  onLimpiar?: () => void;
  titulo?: string;
}) {
  const filtrados = ordenarPorPrioridad(
    casos.filter(
      (c) =>
        esAbierto(c) &&
        (!ciudad || c.ciudad === ciudad) &&
        (!familia || familiaDe(c.tipo_servicio) === familia),
    ),
    ahora,
  );
  const hayFiltro = Boolean(ciudad || familia);
  return (
    <section className="overflow-hidden rounded-xl border border-ops-line bg-ops-navy">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
            Monitor de casos
          </p>
          <h3 className="mt-1 text-sm font-bold">{titulo}</h3>
          <p className="mt-0.5 text-[10px] text-ops-muted">
            Ordenado por prioridad: primero lo crítico, luego lo más cerca de vencerse.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hayFiltro && (
            <button
              type="button"
              onClick={onLimpiar}
              className="rounded-md border border-brand-sky bg-brand-blue/30 px-2.5 py-1 text-[10px] font-bold"
            >
              {[ciudad, familia && ETIQUETA_FAMILIA[familia]].filter(Boolean).join(" · ")} ✕
            </button>
          )}
          <span className="font-data text-[10px] text-ops-muted">{filtrados.length} registros</span>
        </div>
      </div>
      <div className="hidden grid-cols-[1.1fr_1.2fr_.8fr_1fr_auto] gap-3 border-t border-ops-line bg-ops-deep/50 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-ops-muted sm:grid">
        <span>Vehículo</span>
        <span>Proceso · etapa</span>
        <span>Ciudad</span>
        <span>SLA</span>
        <span>Estado</span>
      </div>
      {cargando ? (
        <p className="border-t border-ops-line p-5 text-xs text-ops-muted">Cargando casos…</p>
      ) : error ? (
        <p className="border-t border-ops-line p-5 text-xs text-sla-red">
          No fue posible cargar los casos.
        </p>
      ) : filtrados.length === 0 ? (
        <p className="border-t border-ops-line p-5 text-xs text-ops-muted">
          No hay casos abiertos con este filtro.
        </p>
      ) : (
        filtrados.map((c) => <FilaCaso key={c.id} caso={c} ahora={ahora} />)
      )}
    </section>
  );
}
