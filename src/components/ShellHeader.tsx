import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const NAV = [
  { to: "/", label: "Tablero" },
  { to: "/reportar", label: "Reportar incidente" },
  { to: "/alertas", label: "Alertas" },
  { to: "/antes-despues", label: "Antes / Después" },
] as const;

function Reloj() {
  const [hora, setHora] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setHora(
        new Date().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-right leading-none">
      <div className="font-mono text-lg tabular-nums tracking-tight text-ink">{hora ?? "--:--:--"}</div>
      <div className="text-[9px] uppercase tracking-[0.18em] text-faint">Hora local · COT</div>
    </div>
  );
}

export function ShellHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-6 overflow-hidden border-b border-line bg-panel px-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-14 overflow-hidden">
        <div className="sweep-x absolute left-0 top-0 h-14 w-16 bg-gradient-to-r from-transparent via-cool/15 to-transparent" />
      </div>
      <div className="relative flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded bg-gradient-to-br from-cool/70 to-cool/20 ring-1 ring-cool/40">
          <span className="font-mono text-[13px] font-semibold text-ink">i</span>
        </div>
        <div className="leading-none">
          <div className="text-[15px] font-semibold tracking-tight">INDEGA</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-ink">
            Control de Asistencias
          </div>
        </div>
      </div>

      <nav className="relative ml-2 flex items-center gap-1">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="rounded px-2.5 py-1.5 text-[12px] text-muted-ink transition-colors hover:bg-panel2 hover:text-ink"
            activeProps={{ className: "bg-panel2 text-ink" }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-ink lg:flex">
        <span className="pulse-sla size-1.5 rounded-full bg-sla-green" />
        <span className="text-ink/80">En línea</span>
        <span className="text-faint">·</span>
        <span className="font-mono text-ink/70">NO-7442</span>
      </div>

      <div className="flex items-center gap-3">
        <Reloj />
        <div className="h-8 w-px bg-line" />
        <div className="grid size-8 place-items-center rounded-full bg-panel2 text-xs font-medium text-muted-ink ring-1 ring-line">
          DF
        </div>
      </div>
    </header>
  );
}
