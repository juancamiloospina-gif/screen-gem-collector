import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Chip, Encabezado, Kpi, Panel } from "@/components/ops";
import { COBERTURA_POR_TIPO, FLOTA, POLIZA, REGIONALES } from "@/lib/flota";
import { PLACAS_RECURRENTES } from "@/lib/historico";

export const Route = createFileRoute("/flota")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {},
  head: () => ({
    meta: [
      { title: "Base maestra de flota · AssisPrex" },
      {
        name: "description",
        content:
          "Vehículos de INDEGA con póliza, coberturas, regional, conductor y responsables a notificar.",
      },
    ],
  }),
  component: Flota,
});

function Flota() {
  const { q } = Route.useSearch();
  const [filtro, setFiltro] = useState(q ?? "");
  // El buscador del encabezado puede cambiar ?q= sin desmontar la página.
  useEffect(() => setFiltro(q ?? ""), [q]);
  const [soloFuera, setSoloFuera] = useState(false);
  const f = filtro.trim().toLowerCase();
  const filas = FLOTA.filter(
    (v) =>
      (!soloFuera || !v.en_cartera) &&
      (!f ||
        [v.placa, v.conductor, v.marca, v.linea, v.regional, v.sede].some((x) =>
          x.toLowerCase().includes(f),
        )),
  );
  const fuera = FLOTA.filter((v) => !v.en_cartera).length;

  return (
    <main className="p-4 lg:p-7">
      <Encabezado
        eyebrow="Base maestra de flota"
        titulo="Una sola fuente de verdad por vehículo"
        texto="El conductor solo informa placa, servicio y ubicación: el resto sale de aquí. Se concilia cada mes con la cartera asegurada."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Vehículos registrados"
          value={String(FLOTA.length)}
          note="Muestra de demostración"
        />
        <Kpi
          label="En cartera asegurada"
          value={String(FLOTA.length - fuera)}
          note={`${POLIZA.aseguradora} · ${POLIZA.vigencia}`}
          tone="text-sla-green"
        />
        <Kpi
          label="Fuera de cartera"
          value={String(fuera)}
          note="Operan sin póliza vigente"
          tone="text-sla-red"
        />
        <Kpi label="Última conciliación" value="1 sep 2026" note="Próxima: 1 oct 2026" />
      </div>

      <Panel
        className="mt-5"
        eyebrow="Vehículos"
        titulo={`${filas.length} de ${FLOTA.length} vehículos`}
        accion={
          <label className="flex items-center gap-2 text-[11px] text-ops-muted">
            <input
              type="checkbox"
              checked={soloFuera}
              onChange={(e) => setSoloFuera(e.target.checked)}
              className="accent-[var(--sla-red)]"
            />
            Solo fuera de cartera
          </label>
        }
      >
        <div className="border-b border-ops-line px-5 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-ops-line bg-ops-deep px-3 py-2">
            <Search className="size-4 text-ops-muted" />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por placa, conductor, marca, regional o sede…"
              className="w-full bg-transparent text-xs text-ops-ink outline-none placeholder:text-ops-muted"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-[11px]">
            <thead className="bg-ops-deep/50 text-[9px] uppercase tracking-[0.12em] text-ops-muted">
              <tr>
                {[
                  "Placa",
                  "Vehículo",
                  "Regional · sede",
                  "Centro de costo",
                  "Conductor",
                  "Responsables a notificar",
                  "Cobertura",
                  "Eventos 12m",
                ].map((h) => (
                  <th key={h} className="px-4 py-2 font-bold first:pl-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ops-line">
              {filas.map((v) => {
                const cob = COBERTURA_POR_TIPO[v.tipo_vehiculo];
                const eventos =
                  PLACAS_RECURRENTES.find((p) => p.placa === v.placa)?.expedientes_12m ?? 1;
                return (
                  <tr key={v.placa} className="hover:bg-ops-panel/40">
                    <td className="px-4 py-3 pl-5 font-data font-medium">{v.placa}</td>
                    <td className="px-4 py-3">
                      {v.marca} {v.linea} {v.modelo}
                      <p className="text-[10px] text-ops-muted">{v.tipo_vehiculo}</p>
                    </td>
                    <td className="px-4 py-3">
                      {v.regional}
                      <p className="text-[10px] text-ops-muted">{v.sede}</p>
                    </td>
                    <td className="px-4 py-3 font-data text-ops-muted">{v.centro_costo}</td>
                    <td className="px-4 py-3">
                      {v.conductor}
                      <p className="font-data text-[10px] text-ops-muted">{v.telefono_conductor}</p>
                    </td>
                    <td className="px-4 py-3 text-ops-muted">
                      {v.jefe_inmediato} (jefe inmediato)
                      <p className="text-[10px]">
                        {REGIONALES[v.regional].director} (dir. regional)
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {v.en_cartera ? (
                        <Chip tono="verde">En cartera · tope {cob.tope_km} km</Chip>
                      ) : (
                        <Chip tono="rojo">Fuera de cartera</Chip>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 font-data ${eventos >= 5 ? "text-sla-amber" : "text-ops-muted"}`}
                    >
                      {eventos}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        className="mt-5"
        eyebrow="Condiciones de la póliza"
        titulo={`${POLIZA.nombre} (valores por validar con INDEGA)`}
      >
        <div className="grid gap-px bg-ops-line md:grid-cols-3">
          {Object.entries(COBERTURA_POR_TIPO).map(([tipo, c]) => (
            <div key={tipo} className="bg-ops-navy p-5">
              <p className="text-xs font-bold">{tipo}</p>
              <p className="mt-2 text-[11px] text-ops-muted">
                Tope de traslado: {c.tope_km} km · hasta {c.eventos_anio} eventos al año
              </p>
              <ul className="mt-3 space-y-1 text-[11px]">
                {c.servicios.map((s) => (
                  <li key={s}>✓ {s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </main>
  );
}
