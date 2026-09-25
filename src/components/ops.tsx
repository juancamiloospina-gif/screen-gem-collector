// Piezas visuales compartidas por las pantallas del centro de operaciones.
import type { ReactNode } from "react";
import type { Caso, Cobertura, EstadoExcedente, Excepcion } from "@/lib/casos";

export function Encabezado({
  eyebrow,
  titulo,
  texto,
  children,
}: {
  eyebrow: string;
  titulo: string;
  texto?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-sky">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{titulo}</h2>
        {texto && <p className="mt-1 max-w-2xl text-xs text-ops-muted">{texto}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({
  titulo,
  eyebrow,
  accion,
  children,
  className = "",
}: {
  titulo?: string;
  eyebrow?: string;
  accion?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-ops-line bg-ops-navy ${className}`}
    >
      {(titulo || eyebrow) && (
        <div className="flex items-start justify-between gap-3 border-b border-ops-line px-5 py-4">
          <div>
            {eyebrow && (
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
                {eyebrow}
              </p>
            )}
            {titulo && <h3 className="mt-1 text-sm font-bold">{titulo}</h3>}
          </div>
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  note,
  tone = "text-ops-ink",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-ops-line bg-ops-navy p-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ops-muted">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold ${tone}`}>{value}</p>
      {note && <p className="mt-1 text-[10px] text-ops-muted">{note}</p>}
    </div>
  );
}

const TONO = {
  rojo: "bg-sla-red/15 text-sla-red",
  ambar: "bg-sla-amber/15 text-sla-amber",
  verde: "bg-sla-green/15 text-sla-green",
  azul: "bg-brand-blue/20 text-brand-sky",
  gris: "bg-ops-panel text-ops-muted",
};

export function Chip({ tono, children }: { tono: keyof typeof TONO; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${TONO[tono]}`}
    >
      {children}
    </span>
  );
}

export function ChipExcepcion({ excepcion }: { excepcion: Excepcion | null }) {
  if (!excepcion) return null;
  const tono =
    excepcion === "Cancelado" || excepcion === "Reprogramado"
      ? "gris"
      : excepcion === "Reclamo del usuario"
        ? "ambar"
        : "rojo";
  return <Chip tono={tono}>{excepcion}</Chip>;
}

export function ChipCobertura({ cobertura }: { cobertura: Cobertura }) {
  return <Chip tono={cobertura === "Cubierto" ? "verde" : "rojo"}>{cobertura}</Chip>;
}

export function ChipExcedente({ estado }: { estado: EstadoExcedente }) {
  return (
    <Chip tono={estado === "Aprobado" ? "verde" : estado === "Objetado" ? "rojo" : "ambar"}>
      {estado}
    </Chip>
  );
}

export function ChipAtencion({ caso }: { caso: Pick<Caso, "atendido_por"> }) {
  return caso.atendido_por === "Supervisor humano" ? (
    <Chip tono="ambar">Supervisor humano</Chip>
  ) : (
    <Chip tono="azul">Agente IA</Chip>
  );
}

// Barra horizontal simple para las gráficas de analítica e informes.
export function Barra({
  label,
  valor,
  max,
  sufijo = "",
  tono = "bg-brand-blue",
  nota,
}: {
  label: string;
  valor: number;
  max: number;
  sufijo?: string;
  tono?: string;
  nota?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-[11px]">
        <span className="truncate">{label}</span>
        <span className="shrink-0 font-data text-ops-muted">
          {valor.toLocaleString("es-CO")}
          {sufijo}
          {nota && <span className="ml-2 text-faint">{nota}</span>}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ops-deep">
        <div
          className={`h-full rounded-full ${tono}`}
          style={{ width: `${Math.min(100, (valor / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}
