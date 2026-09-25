// Centro de cada ciudad donde opera la flota (lat, lon). Vive fuera del
// componente de Leaflet para poder usarlo en el servidor sin cargar Leaflet.
export const CIUDAD_LATLON: Record<string, [number, number]> = {
  Bogotá: [4.711, -74.072],
  Medellín: [6.244, -75.581],
  Barranquilla: [10.964, -74.796],
  Cali: [3.451, -76.532],
  Neiva: [2.927, -75.282],
};
