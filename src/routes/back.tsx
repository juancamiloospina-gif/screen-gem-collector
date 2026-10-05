import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CapacidadRed } from "@/components/capacidad-red";
import { ListaEtapa } from "@/components/lista-etapa";
import { MapaColombia } from "@/components/MapaColombia";
import { MatrizDolor } from "@/components/matriz-dolor";
import { Chip, Encabezado, Kpi, Panel } from "@/components/ops";
import { PorVencerLista } from "@/components/por-vencer";
import { ProcesoNav } from "@/components/proceso-nav";
import { ProveedoresTabla } from "@/components/proveedores-tabla";
import { useAhora } from "@/hooks/use-ahora";
import { VENTANA_PREDICTIVA_MIN, casosQuery, type Familia } from "@/lib/casos";
import { resumenProceso } from "@/lib/procesos";
import { capacidadPorCiudad, estadoCiudad } from "@/lib/red";

export const Route = createFileRoute("/back")({
  head: () => ({
    meta: [
      { title: "Back · Radicación y asignación · AssisPrex" },
      {
        name: "description",
        content:
          "Proceso de radicación ante la aseguradora y asignación de proveedor, con la capacidad de la red por ciudad.",
      },
    ],
  }),
  component: Back,
});

function Back() {
  const ahora = useAhora();
  const { data } = useQuery(casosQuery);
  const casos = data ?? [];
  const [ciudad, setCiudad] = useState<string | null>(null);
  const [familia, setFamilia] = useState<Familia | null>(null);
  const r = resumenProceso(casos, ahora, "Back");
  const capacidad = capacidadPorCiudad(casos);
  const enDeficit = capacidad.filter((c) => estadoCiudad(c).semaforo === "rojo");
  const sinProveedor = r.lista.filter((c) => !c.proveedor);
  const unidades = capacidad.reduce((s, c) => s + c.disponibles + c.ocupados + c.fuera, 0);
  const disponibles = capacidad.reduce((s, c) => s + c.disponibles, 0);

  return (
    <main className="p-4 lg:p-7">
      <Encabezado
        eyebrow="Proceso 2 de 3 · Etapas: Trámite y Asignado"
        titulo="Back · Radicación y asignación"
        texto="Radicar ante Mapfre y conseguir una unidad. El cuello de botella casi nunca es el trámite: es que haya proveedores disponibles en la ciudad y el servicio correctos."
      />
      <ProcesoNav casos={casos} ahora={ahora} activo="Back" />

      <div data-tour="kpis" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="En radicación y asignación"
          value={String(r.lista.length)}
          note={`${sinProveedor.length} sin proveedor aún`}
          tone="text-brand-sky"
          acento="azul"
          grande
        />
        <Kpi
          label="Ciudades con déficit"
          value={String(enDeficit.length)}
          note={
            enDeficit.length ? enDeficit.map((c) => c.ciudad).join(", ") : "La red alcanza en todas"
          }
          tone={enDeficit.length ? "text-sla-red" : "text-sla-green"}
          acento={enDeficit.length ? "rojo" : "verde"}
          grande
        />
        <Kpi
          label={`Por vencer ≤ ${VENTANA_PREDICTIVA_MIN} min`}
          value={String(r.venciendo.length)}
          note="Sin asignar y con el reloj corriendo"
          tone="text-sla-amber"
          acento="ambar"
          grande
        />
        <Kpi
          label="Unidades disponibles"
          value={`${disponibles}/${unidades}`}
          note="De la red conectada"
          tone="text-brand-sky"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <MatrizDolor
          casos={casos}
          ahora={ahora}
          ciudad={ciudad}
          familia={familia}
          onSelect={(c, f) => {
            setCiudad(c);
            setFamilia(f);
          }}
          lenteInicial="red"
        />
        <div className="space-y-5">
          <Panel
            tour="radicacion"
            eyebrow="Radicación y asignación"
            titulo="Casos en gestión con el proveedor"
          >
            <ListaEtapa
              casos={r.lista}
              ahora={ahora}
              vacio="No hay casos pendientes de radicar o asignar."
              extra={(c) => (
                <>
                  <Chip tono={c.expediente ? "azul" : "gris"}>
                    {c.expediente ?? "Sin expediente"}
                  </Chip>
                  <Chip tono={c.proveedor ? "verde" : "ambar"}>
                    {c.proveedor ?? "Sin proveedor"}
                  </Chip>
                </>
              )}
            />
          </Panel>
          <Panel
            eyebrow="Predictivo"
            titulo={`Se vencen en los próximos ${VENTANA_PREDICTIVA_MIN} min`}
          >
            <PorVencerLista casos={r.lista} ahora={ahora} limite={4} />
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <MapaColombia
          casos={r.lista}
          ahora={ahora}
          ciudad={ciudad}
          onCiudad={setCiudad}
          familia={familia}
          onFamilia={setFamilia}
        />
        <CapacidadRed casos={casos} detalle ciudad={ciudad} onCiudad={setCiudad} />
      </div>

      <div className="mt-5">
        <ProveedoresTabla ciudad={ciudad} familia={familia} />
      </div>
    </main>
  );
}
