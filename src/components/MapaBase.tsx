import type { ReactNode } from "react";

// Posición de cada ciudad en % sobre /colombia-map.svg (viewBox 0-100),
// proyectada desde su latitud y longitud con los límites del SVG
// (incluye San Andrés y Providencia).
export const CIUDAD_MAPA: Record<string, { x: number; y: number }> = {
  Bogotá: { x: 51.1, y: 49.4 },
  Medellín: { x: 43.9, y: 41.7 },
  Barranquilla: { x: 47.5, y: 18.1 },
  Cali: { x: 39.2, y: 55.6 },
  Neiva: { x: 45.2, y: 58.2 },
  Ibagué: { x: 45.5, y: 50.7 },
  Bucaramanga: { x: 55.7, y: 37.3 },
  Cartagena: { x: 44.1, y: 21.0 },
  Villavicencio: { x: 53.2, y: 52.2 },
  Tunja: { x: 54.5, y: 45.2 },
  Manizales: { x: 44.0, y: 47.6 },
};

// Reparte en espiral los puntos de una misma ciudad para que no se tapen.
export function posicionEnCiudad(ciudad: string, indice: number, paso = 1.6) {
  const base = CIUDAD_MAPA[ciudad] ?? { x: 50, y: 50 };
  return {
    x: base.x + Math.cos(indice * 2.4) * indice * paso,
    y: base.y + Math.sin(indice * 2.4) * indice * paso,
  };
}

// Mapa cuadrado que se ajusta al contenedor: los hijos se posicionan con
// left/top en % y siempre coinciden con el dibujo del mapa.
export function MapaBase({
  children,
  className = "p-4",
  opacidad = "opacity-85",
  alt = "Mapa de Colombia",
}: {
  children?: ReactNode;
  className?: string;
  opacidad?: string;
  alt?: string;
}) {
  return (
    <div className={`absolute inset-0 grid place-items-center [container-type:size] ${className}`}>
      <div className="relative aspect-square w-[min(100cqw,100cqh)]">
        <img
          src="/colombia-map.svg"
          alt={alt}
          className={`absolute inset-0 size-full ${opacidad}`}
        />
        {children}
      </div>
    </div>
  );
}
