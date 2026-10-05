import { useState } from "react";
import { Chip, Panel } from "@/components/ops";
import { ETIQUETA_FAMILIA, FAMILIAS, type Familia } from "@/lib/casos";
import { ESTADOS_PROVEEDOR, PROVEEDORES, type EstadoProveedor } from "@/lib/red";

const TONO_ESTADO = { Disponible: "azul", Ocupado: "gris", "Fuera de zona": "ambar" } as const;

// Detalle de la red conectada: cada unidad con su estado y cuándo se libera.
export function ProveedoresTabla({
  ciudad,
  familia,
}: {
  ciudad: string | null;
  familia: Familia | null;
}) {
  const [estado, setEstado] = useState<EstadoProveedor | null>(null);
  const [fam, setFam] = useState<Familia | null>(familia);
  const filtro = familia ?? fam;
  const lista = PROVEEDORES.filter(
    (p) =>
      (!ciudad || p.ciudad === ciudad) &&
      (!estado || p.estado === estado) &&
      (!filtro || p.familia === filtro),
  );
  const chip = (activo: boolean) =>
    `rounded-md border px-2.5 py-1 text-[10px] font-bold ${
      activo
        ? "border-brand-sky bg-brand-blue/40 text-ops-ink"
        : "border-ops-line text-ops-muted hover:text-ops-ink"
    }`;
  return (
    <Panel
      eyebrow="Red conectada"
      titulo={`${lista.length} unidades${ciudad ? ` en ${ciudad}` : ""}`}
      accion={
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar unidades por estado">
          <button type="button" className={chip(estado === null)} onClick={() => setEstado(null)}>
            Todas
          </button>
          {ESTADOS_PROVEEDOR.map((e) => (
            <button
              key={e}
              type="button"
              className={chip(estado === e)}
              onClick={() => setEstado(estado === e ? null : e)}
            >
              {e}
            </button>
          ))}
        </div>
      }
    >
      <div
        className="flex flex-wrap gap-1 border-b border-ops-line px-5 py-3"
        role="group"
        aria-label="Filtrar unidades por servicio"
      >
        <button type="button" className={chip(filtro === null)} onClick={() => setFam(null)}>
          Todos los servicios
        </button>
        {FAMILIAS.map((f) => (
          <button
            key={f}
            type="button"
            className={chip(filtro === f)}
            onClick={() => setFam(fam === f ? null : f)}
          >
            {ETIQUETA_FAMILIA[f]}
          </button>
        ))}
      </div>
      <ul className="max-h-[420px] divide-y divide-ops-line overflow-y-auto">
        {lista.length === 0 && (
          <li className="px-5 py-4 text-[11px] text-ops-muted">No hay unidades con este filtro.</li>
        )}
        {lista.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{p.nombre}</p>
              <p className="text-[10px] text-ops-muted">
                {ETIQUETA_FAMILIA[p.familia]} · {p.detalle}
              </p>
            </div>
            <Chip tono={TONO_ESTADO[p.estado]}>{p.estado}</Chip>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
