// Mapa interactivo real (Leaflet + teselas oscuras de Esri). Se carga solo
// en el navegador desde MapaColombia, porque Leaflet necesita `window`.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
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
  ETIQUETA_FAMILIA,
  ETIQUETA_SEMAFORO,
  familiaDe,
  minutosTranscurridos,
  semaforo,
  type Caso,
  type Familia,
} from "@/lib/casos";
import { CIUDAD_LATLON } from "@/lib/geo";
import {
  PROVEEDORES,
  RADIO_ZONA_KM,
  capacidadPorCiudad,
  estadoCiudad,
  type EstadoProveedor,
} from "@/lib/red";

export type CapasMapa = { casos: boolean; red: boolean };

// Vista "Todo el país": encuadra las ciudades donde opera la flota
// (Barranquilla a Neiva) para que los casos se lean bien.
const COLOMBIA: L.LatLngBoundsExpression = [
  [2.4, -77.4],
  [11.3, -73.2],
];
// Margen para que las burbujas no queden debajo de los controles de zoom
// (arriba a la derecha) y haya aire para los nombres de las ciudades.
const MARGEN: L.FitBoundsOptions = { paddingTopLeft: [24, 28], paddingBottomRight: [64, 34] };

// Reparte en espiral los casos de una misma ciudad para que no se tapen.
function posicion(caso: Caso, indice: number): [number, number] {
  const [lat, lon] = CIUDAD_LATLON[caso.ciudad] ?? [4.6, -74.1];
  const r = 0.06 * Math.sqrt(indice);
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
const ETIQUETA_CIUDAD =
  "absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-ops-ink [text-shadow:0_1px_3px_#000]";

function iconoCiudad(total: number, clase: string, nombre: string) {
  return L.divIcon({
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `<span class="relative grid size-[38px] place-items-center rounded-full border-2 border-[var(--ops-ink)] ${clase} font-[var(--font-data)] text-[13px] font-bold text-[var(--ops-deep)] shadow-lg"><span class="${ETIQUETA_CIUDAD}">${nombre}</span>${total}</span>`,
  });
}

// Insignia de oferta por ciudad (vista país): unidades disponibles, pintada
// con el balance contra la demanda pendiente.
function iconoOferta(texto: string, clase: string, bajoBurbuja: boolean, nombre: string) {
  return L.divIcon({
    className: "",
    iconSize: [72, 20],
    iconAnchor: [36, bajoBurbuja ? -24 : 10],
    html: `<span class="relative flex h-5 items-center justify-center rounded-md border border-[var(--ops-ink)] ${clase} px-1.5 text-[10px] font-bold text-[var(--ops-deep)] shadow-lg">${bajoBurbuja ? "" : `<span class="${ETIQUETA_CIUDAD}">${nombre}</span>`}${texto}</span>`,
  });
}

// Unidad de la red: cuadrado azul (disponible), gris (ocupado) o con borde
// punteado (fuera de zona).
function iconoProveedor(estado: EstadoProveedor) {
  const clase =
    estado === "Disponible"
      ? "bg-brand-sky border-ops-ink"
      : estado === "Ocupado"
        ? "bg-ops-muted border-ops-deep"
        : "bg-ops-deep/70 border-dashed border-ops-muted";
  return L.divIcon({
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<span class="block size-[14px] rounded-[3px] border-2 ${clase}"></span>`,
  });
}

// Gravedad del semáforo, para pintar cada burbuja con su peor caso.
const orden = { verde: 0, amarillo: 1, rojo: 2 } as const;

const ZOOM_CIUDAD = 10;
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
  familia = null,
  capas = { casos: true, red: false },
}: {
  casos: Caso[];
  ahora: number;
  ciudad: string | null;
  setCiudad: (c: string | null) => void;
  familia?: Familia | null;
  capas?: CapasMapa;
}) {
  const [zoom, setZoom] = useState(5);
  const casosVisibles = useMemo(
    () => (familia ? casos.filter((c) => familiaDe(c.tipo_servicio) === familia) : casos),
    [casos, familia],
  );
  const proveedores = useMemo(
    () => (familia ? PROVEEDORES.filter((p) => p.familia === familia) : PROVEEDORES),
    [familia],
  );
  const capacidad = useMemo(
    () => capacidadPorCiudad(casosVisibles, proveedores),
    [casosVisibles, proveedores],
  );
  const grupos = useMemo(
    () =>
      Object.keys(CIUDAD_LATLON)
        .map((c) => {
          const lista = casosVisibles.filter((x) => x.ciudad === c);
          const peor = lista.reduce<keyof typeof orden>((p, x) => {
            const s = semaforo(x, ahora);
            return orden[s] > orden[p] ? s : p;
          }, "verde");
          return { ciudad: c, lista, peor };
        })
        .filter((g) => g.lista.length > 0),
    [casosVisibles, ahora],
  );
  const agrupado = zoom < ZOOM_AGRUPAR;

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

        {/* Vista país: demanda (burbuja) y oferta (insignia) por ciudad. */}
        {agrupado &&
          capas.casos &&
          grupos.map((g) => (
            <Marker
              key={g.ciudad}
              position={CIUDAD_LATLON[g.ciudad]!}
              icon={iconoCiudad(g.lista.length, COLOR_SEMAFORO[g.peor].fondo, g.ciudad)}
              eventHandlers={{ click: () => setCiudad(g.ciudad) }}
            >
              <Tooltip direction="top" offset={[0, -20]}>
                {g.ciudad} · {g.lista.length} {g.lista.length === 1 ? "caso" : "casos"} · clic para
                acercar
              </Tooltip>
            </Marker>
          ))}
        {agrupado &&
          capas.red &&
          capacidad.map((c) => {
            const estado = estadoCiudad(c);
            return (
              <Marker
                key={`oferta-${c.ciudad}`}
                position={CIUDAD_LATLON[c.ciudad]!}
                icon={iconoOferta(
                  `${c.disponibles} disp.`,
                  COLOR_SEMAFORO[estado.semaforo].fondo,
                  capas.casos && grupos.some((g) => g.ciudad === c.ciudad),
                  c.ciudad,
                )}
                eventHandlers={{ click: () => setCiudad(c.ciudad) }}
              >
                <Tooltip direction="top" offset={[0, -14]}>
                  {c.ciudad} · oferta {c.disponibles} disp., {c.ocupados} ocup., {c.fuera} fuera de
                  zona · demanda {c.demanda} · {estado.etiqueta}
                </Tooltip>
              </Marker>
            );
          })}

        {/* Vista de ciudad: zona de cobertura, unidades y casos. */}
        {!agrupado &&
          capas.red &&
          Object.entries(CIUDAD_LATLON).map(([nombre, centro]) => (
            <Circle
              key={`zona-${nombre}`}
              center={centro}
              radius={RADIO_ZONA_KM * 1000}
              pathOptions={{
                color: "#5aa9e6",
                weight: 1,
                dashArray: "5 5",
                fillColor: "#5aa9e6",
                fillOpacity: 0.05,
              }}
            />
          ))}
        {!agrupado &&
          capas.red &&
          proveedores.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lon]} icon={iconoProveedor(p.estado)}>
              <Tooltip direction="top" offset={[0, -8]}>
                {p.nombre} · {p.estado}
              </Tooltip>
              <Popup>
                <div className="min-w-48 text-ops-ink">
                  <div className="text-xs font-bold">{p.nombre}</div>
                  <div className="mt-1 text-[11px] text-ops-muted">
                    {ETIQUETA_FAMILIA[p.familia]} · {p.ciudad}
                  </div>
                  <div className="mt-2 text-[11px] font-bold">{p.estado}</div>
                  <div className="text-[11px] text-ops-muted">{p.detalle}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        {!agrupado &&
          capas.casos &&
          casosVisibles.map((caso) => {
            const s = semaforo(caso, ahora);
            const idx = casosVisibles
              .filter((c) => c.ciudad === caso.ciudad)
              .findIndex((c) => c.id === caso.id);
            return (
              <Marker
                key={caso.id}
                position={posicion(caso, idx)}
                icon={icono(COLOR_SEMAFORO[s].fondo, s === "rojo")}
                zIndexOffset={500}
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
