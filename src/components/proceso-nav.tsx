import { Link } from "@tanstack/react-router";
import { Timer } from "lucide-react";
import type { Caso, Proceso } from "@/lib/casos";
import { resumenProceso } from "@/lib/procesos";

const TABS = [
  { to: "/front", proceso: "Front", sub: "Toma y validación" },
  { to: "/back", proceso: "Back", sub: "Radicación y asignación" },
  { to: "/seguimiento", proceso: "Seguimiento", sub: "Ruta, atención y cierre" },
] as const satisfies readonly { to: string; proceso: Proceso; sub: string }[];

// Una vista por proceso crítico, con su carga y alertas a la vista.
export function ProcesoNav({
  casos,
  ahora,
  activo,
}: {
  casos: Caso[];
  ahora: number;
  activo: Proceso | null;
}) {
  return (
    <nav className="mb-6 grid gap-2 sm:grid-cols-3" aria-label="Procesos críticos">
      {TABS.map((t) => {
        const r = resumenProceso(casos, ahora, t.proceso);
        const sel = t.proceso === activo;
        return (
          <Link
            key={t.to}
            to={t.to}
            aria-current={sel ? "page" : undefined}
            className={`rounded-xl border px-4 py-3 transition-colors ${
              sel
                ? "border-brand-sky bg-brand-blue/25"
                : "border-ops-line bg-ops-navy hover:bg-ops-panel/60"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-sm font-semibold">{t.proceso}</span>
              <span className="font-data text-lg">{r.lista.length}</span>
            </div>
            <p className="text-[10px] text-ops-muted">{t.sub}</p>
            <div className="mt-2 flex gap-2 text-[10px] font-bold">
              <span className={r.criticos.length ? "text-sla-red" : "text-ops-muted"}>
                {r.criticos.length} críticos
              </span>
              <span
                className={`flex items-center gap-0.5 ${r.venciendo.length ? "text-sla-amber" : "text-ops-muted"}`}
              >
                <Timer className="size-3" /> {r.venciendo.length} por vencer
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
