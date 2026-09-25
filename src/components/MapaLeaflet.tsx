// Mapa interactivo real (Leaflet + teselas oscuras de Esri). Se carga solo
// en el navegador desde MapaColombia, porque Leaflet necesita `window`.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Minus, Navigation, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COLOR_SEMAFORO,
  ETIQUETA_SEMAFORO,
  minutosTranscurridos,
  semaforo,
  type Caso,
} from "@/lib/casos";
import { CIUDAD_LATLON } from "@/lib/geo";

// Vista "Todo el país": encuadra las ciudades donde opera la flota
// (Barranquilla a Neiva) para que los casos se lean bien.
const COLOMBIA: L.LatLngBoundsExpression = [
  [2.4, -77.4],
  [11.3, -73.2],
];
// Margen para que las burbujas no queden debajo de los controles de zoom
// (arriba a la derecha) ni de la leyenda (abajo).
const MARGEN: L.FitBoundsOptions = { paddingTopLeft: [30, 30], paddingBottomRight: [60, 60] };

// Reparte en espiral los casos de una misma ciudad para que no se tapen.
function posicion(caso: Caso, indice: number): [number, number] {
  const [lat, lon] = CIUDAD_LATLON[caso.ciudad] ?? [4.6, -74.1];
  const r = 0.03 * Math.sqrt(indice);
  return [lat + Math.sin(indice * 2.4) * r, lon + Math.cos(indice * 2.4) * r];
}

function icono(clase: string, pulso: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<span class="relative grid size-[22px] place-items-center">${
      pulso
        ? `<span class="absolute inset-0 animate-ping rounded-full ${clase} opacity-60"></span>`
        : ""
    }<span class="relative size-[18px] rounded-full border-2 border-[var(--ops-ink)] ${clase} shadow-lg"></span></span>`,
  });
}

// Burbuja por ciudad (vista país): número de casos y color del peor semáforo.
function iconoCiudad(total: number, clase: string) {
  return L.divIcon({
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `<span class="grid size-[38px] place-items-center rounded-full border-2 border-[var(--ops-ink)] ${clase} font-[var(--font-data)] text-[13px] font-bold text-[var(--ops-deep)] shadow-lg">${total}</span>`,
  });
}

const ZOOM_CIUDAD = 11;
// Por debajo de este zoom se agrupan los casos por ciudad.
const ZOOM_AGRUPAR = 8;

function ZoomActual({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  return null;
}

function Controles({
  ciudad,
  setCiudad,
}: {
  ciudad: string | null;
  setCiudad: (c: string | null) => void;
}) {
  const map = useMap();
  // Al montar, el contenedor puede medir 0 px cuando Leaflet se inicia:
  // se recalcula el tamaño y se encuadra el país sin animación.
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      map.invalidateSize();
      map.fitBounds(COLOMBIA, MARGEN);
      return;
    }
    if (ciudad && CIUDAD_LATLON[ciudad])
      map.flyTo(CIUDAD_LATLON[ciudad], ZOOM_CIUDAD, { duration: 0.8 });
    else map.flyToBounds(COLOMBIA, { ...MARGEN, duration: 0.8 });
  }, [ciudad, map]);
  return (
    <div className="absolute right-5 top-5 z-[500] flex flex-col rounded-lg border border-ops-line bg-ops-deep/90 p-1 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="text-ops-muted"
        aria-label="Acercar mapa"
        onClick={() => map.zoomIn()}
      >
        <Plus />
      </Button>
      <div className="mx-2 h-px bg-ops-line" />
      <Button
        variant="ghost"
        size="icon"
        className="text-ops-muted"
        aria-label="Alejar mapa"
        onClick={() => map.zoomOut()}
      >
        <Minus />
      </Button>
      <div className="mx-2 h-px bg-ops-line" />
      <Button
        variant="ghost"
        size="icon"
        className="text-brand-sky"
        aria-label="Ver todo el país"
        onClick={() => {
          setCiudad(null);
          map.flyToBounds(COLOMBIA, { ...MARGEN, duration: 0.8 });
        }}
      >
        <Navigation />
      </Button>
    </div>
  );
}

export default function MapaLeaflet({
  casos,
  ahora,
  ciudad,
  setCiudad,
}: {
  casos: Caso[];
  ahora: number;
  ciudad: string | null;
  setCiudad: (c: string | null) => void;
}) {
  const [zoom, setZoom] = useState(5);
  const orden = { verde: 0, amarillo: 1, rojo: 2 } as const;
  const grupos = useMemo(
    () =>
      Object.keys(CIUDAD_LATLON)
        .map((c) => {
          const lista = casos.filter((x) => x.ciudad === c);
          const peor = lista.reduce<keyof typeof orden>((p, x) => {
            const s = semaforo(x, ahora);
            return orden[s] > orden[p] ? s : p;
          }, "verde");
          return { ciudad: c, lista, peor };
        })
        .filter((g) => g.lista.length > 0),
    [casos, ahora],
  );

  return (
    <div className="absolute inset-0">
      <MapContainer
        bounds={COLOMBIA}
        boundsOptions={MARGEN}
        zoomControl={false}
        attributionControl
        minZoom={5}
        maxZoom={16}
        maxBounds={[
          [-8, -84],
          [16, -62],
        ]}
        className="size-full bg-ops-deep"
      >
        {/* Esri Dark Gray Canvas: no requiere llave de API. La capa de
            referencia agrega los nombres de ciudades y vías encima. */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution="Teselas &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap"
          maxNativeZoom={16}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={16}
        />
        <ZoomActual onZoom={setZoom} />
        {zoom < ZOOM_AGRUPAR &&
          grupos.map((g) => (
            <Marker
              key={g.ciudad}
              position={CIUDAD_LATLON[g.ciudad]!}
              icon={iconoCiudad(g.lista.length, COLOR_SEMAFORO[g.peor].fondo)}
              eventHandlers={{ click: () => setCiudad(g.ciudad) }}
            >
              <Tooltip direction="top" offset={[0, -20]}>
                {g.ciudad} · {g.lista.length} {g.lista.length === 1 ? "caso" : "casos"} · clic para
                acercar
              </Tooltip>
            </Marker>
          ))}
        {zoom >= ZOOM_AGRUPAR &&
          casos.map((caso) => {
            const s = semaforo(caso, ahora);
            const idx = casos
              .filter((c) => c.ciudad === caso.ciudad)
              .findIndex((c) => c.id === caso.id);
            return (
              <Marker
                key={caso.id}
                position={posicion(caso, idx)}
                icon={icono(COLOR_SEMAFORO[s].fondo, s === "rojo")}
              >
                <Tooltip direction="top" offset={[0, -12]}>
                  {caso.placa} · {caso.ciudad}
                </Tooltip>
                <Popup>
                  <div className="min-w-48 text-ops-ink">
                    <div className="font-data text-xs font-medium">
                      {caso.placa} · #{caso.numero}
                    </div>
                    <div className="mt-1 text-xs">{caso.tipo_servicio}</div>
                    <div className="mt-1 text-[11px] text-ops-muted">
                      {caso.ubicacion} · {caso.etapa}
                    </div>
                    <div className={`mt-2 text-[11px] font-bold ${COLOR_SEMAFORO[s].texto}`}>
                      {ETIQUETA_SEMAFORO[s]} · {minutosTranscurridos(caso, ahora)} /{" "}
                      {caso.prometido_min} min
                    </div>
                    <Link
                      to="/caso/$casoId"
                      params={{ casoId: caso.id }}
                      className="mt-3 inline-block rounded-md bg-brand-blue px-3 py-1.5 text-[11px] font-bold !text-ops-ink"
                    >
                      Ver caso
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        <Controles ciudad={ciudad} setCiudad={setCiudad} />
      </MapContainer>
    </div>
  );
}
