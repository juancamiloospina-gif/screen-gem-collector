import { Link } from "@tanstack/react-router";
import { COLOR_SEMAFORO, semaforo, type Caso } from "@/lib/casos";

export function MapaColombia({ casos, ahora }: { casos: Caso[]; ahora: number }) {
  return (
    <section className="relative w-[340px] shrink-0 overflow-hidden rounded-lg bg-panel ring-1 ring-line">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="sweep-y absolute left-0 top-0 h-full w-16 bg-gradient-to-b from-transparent via-cool/10 to-transparent" />
      </div>
      <div className="relative flex h-10 items-center justify-between border-b border-line px-4">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-ink">
          Mapa operativo · Colombia
        </span>
        <span className="font-mono text-[10px] tabular-nums text-faint">
          {casos.length} casos activos
        </span>
      </div>
      <div className="relative m-3 aspect-[4/5] overflow-hidden rounded-md bg-carbon ring-1 ring-line">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute left-[24%] top-[12%] h-[70%] w-[46%] rounded-[40%_60%_55%_45%/50%_45%_60%_50%] bg-panel2/70 ring-1 ring-cool/20" />
        <div className="absolute left-[40%] top-[64%] h-[26%] w-[30%] rounded-[50%_50%_45%_55%] bg-panel2/60 ring-1 ring-cool/20" />

        {casos.map((caso, i) => {
          const s = semaforo(caso, ahora);
          // Reparte los casos de una misma ciudad para que los pines no se pisen.
          const mismos = casos.filter((c) => c.ciudad === caso.ciudad);
          const idx = mismos.findIndex((c) => c.id === caso.id);
          const dx = (idx % 2 === 0 ? 1 : -1) * Math.ceil(idx / 2) * 7;
          const dy = idx * 5;
          return (
            <Link
              key={caso.id}
              to="/caso/$casoId"
              params={{ casoId: caso.id }}
              className="absolute"
              style={{
                left: `${caso.mapa_x + dx}%`,
                top: `${caso.mapa_y + dy}%`,
                zIndex: 10 + i,
              }}
            >
              <div
                className={`size-2.5 rounded-full ring-2 ring-carbon ${COLOR_SEMAFORO[s].fondo} ${
                  s === "rojo" ? "pulse-sla" : ""
                }`}
              />
              <div className="absolute left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-carbon/80 px-1 font-mono text-[9px] text-ink/80">
                {caso.placa}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-4 px-4 pb-3 text-[10px] text-muted-ink">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-sla-green" />
          En tiempo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-sla-amber" />
          En riesgo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-sla-red" />
          Incumplido
        </span>
      </div>
    </section>
  );
}
