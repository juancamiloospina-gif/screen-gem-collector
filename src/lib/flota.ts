// Base maestra de flota (propuesta §3.2): fuente única de verdad sobre cada
// vehículo, su póliza, su coberturas y a quién avisar. Datos ficticios de
// demostración; en la implementación real se construye con INDEGA y se
// concilia mensualmente con la cartera asegurada de Mapfre.

export type Regional = "Centro" | "Antioquia" | "Caribe" | "Pacífico" | "Sur";

export type Vehiculo = {
  placa: string;
  tipo_vehiculo: "Pesado" | "Liviano" | "Moto";
  marca: string;
  linea: string;
  modelo: number;
  regional: Regional;
  sede: string;
  centro_costo: string;
  conductor: string;
  telefono_conductor: string;
  jefe_inmediato: string;
  // false = la placa opera pero no está en la cartera asegurada (hallazgo
  // del diagnóstico: 32 placas atendidas por fuera de cartera).
  en_cartera: boolean;
};

export const POLIZA = {
  aseguradora: "Mapfre",
  nombre: "Póliza flota INDEGA 2025-2026",
  vigencia: "ago 2025 – jul 2026",
};

// Condiciones de cobertura de demostración. La propuesta deja "por validar"
// los topes reales de la póliza con Mapfre.
export const COBERTURA_POR_TIPO: Record<
  Vehiculo["tipo_vehiculo"],
  { tope_km: number; servicios: string[]; eventos_anio: number }
> = {
  Pesado: {
    tope_km: 50,
    eventos_anio: 6,
    servicios: [
      "Grúa de gran tonelaje",
      "Rescate",
      "Asistencia jurídica",
      "Carro taller",
      "Movilidad del conductor",
    ],
  },
  Liviano: {
    tope_km: 40,
    eventos_anio: 5,
    servicios: ["Rescate", "Asistencia jurídica", "Carro taller", "Movilidad del conductor"],
  },
  Moto: {
    tope_km: 25,
    eventos_anio: 4,
    servicios: ["Asistencia jurídica", "Movilidad del conductor"],
  },
};

export const REGIONALES: Record<Regional, { ciudad: string; director: string; correo: string }> = {
  Centro: { ciudad: "Bogotá", director: "Andrea Molina", correo: "andrea.molina@indega.demo" },
  Antioquia: {
    ciudad: "Medellín",
    director: "Julián Restrepo",
    correo: "julian.restrepo@indega.demo",
  },
  Caribe: { ciudad: "Barranquilla", director: "Luz Marina Pérez", correo: "luz.perez@indega.demo" },
  Pacífico: { ciudad: "Cali", director: "Óscar Valencia", correo: "oscar.valencia@indega.demo" },
  Sur: { ciudad: "Neiva", director: "Diana Cuéllar", correo: "diana.cuellar@indega.demo" },
};

export const DIRECTOR_FLOTA = { nombre: "Director de Flota", correo: "director.flota@indega.demo" };
export const HSE = { nombre: "Coordinación HSE y seguridad vial", correo: "hse@indega.demo" };

export const FLOTA: Vehiculo[] = [
  {
    placa: "WTX-234",
    tipo_vehiculo: "Pesado",
    marca: "Kenworth",
    linea: "T800",
    modelo: 2019,
    regional: "Centro",
    sede: "Planta Tocancipá",
    centro_costo: "DIST-CEN-01",
    conductor: "Carlos Ruiz",
    telefono_conductor: "310 555 0134",
    jefe_inmediato: "Mauricio Téllez",
    en_cartera: true,
  },
  {
    placa: "KJR-901",
    tipo_vehiculo: "Pesado",
    marca: "International",
    linea: "Prostar",
    modelo: 2020,
    regional: "Antioquia",
    sede: "CEDI Itagüí",
    centro_costo: "DIST-ANT-02",
    conductor: "Jhon Mesa",
    telefono_conductor: "311 555 0178",
    jefe_inmediato: "Paula Gómez",
    en_cartera: true,
  },
  {
    placa: "PLM-558",
    tipo_vehiculo: "Liviano",
    marca: "Chevrolet",
    linea: "NPR",
    modelo: 2022,
    regional: "Caribe",
    sede: "CEDI Barranquilla",
    centro_costo: "VEN-CAR-04",
    conductor: "Rafael Ortega",
    telefono_conductor: "300 555 0112",
    jefe_inmediato: "Kelly Charris",
    en_cartera: true,
  },
  {
    placa: "ZVC-117",
    tipo_vehiculo: "Pesado",
    marca: "Freightliner",
    linea: "M2 106",
    modelo: 2018,
    regional: "Pacífico",
    sede: "Planta Yumbo",
    centro_costo: "DIST-PAC-01",
    conductor: "Wilson Arboleda",
    telefono_conductor: "315 555 0190",
    jefe_inmediato: "Natalia Cruz",
    en_cartera: true,
  },
  {
    placa: "HQN-402",
    tipo_vehiculo: "Liviano",
    marca: "Renault",
    linea: "Duster",
    modelo: 2023,
    regional: "Sur",
    sede: "CEDI Neiva",
    centro_costo: "SUP-SUR-02",
    conductor: "Andrés Perdomo",
    telefono_conductor: "318 555 0145",
    jefe_inmediato: "Liliana Trujillo",
    en_cartera: true,
  },
  {
    placa: "BTR-776",
    tipo_vehiculo: "Pesado",
    marca: "Kenworth",
    linea: "T880",
    modelo: 2021,
    regional: "Centro",
    sede: "CEDI Fontibón",
    centro_costo: "DIST-CEN-03",
    conductor: "Édgar Rincón",
    telefono_conductor: "312 555 0167",
    jefe_inmediato: "Mauricio Téllez",
    en_cartera: true,
  },
  {
    placa: "GFT-209",
    tipo_vehiculo: "Pesado",
    marca: "International",
    linea: "7600",
    modelo: 2017,
    regional: "Centro",
    sede: "Planta Tocancipá",
    centro_costo: "DIST-CEN-01",
    conductor: "Fabio Lozano",
    telefono_conductor: "313 555 0121",
    jefe_inmediato: "Mauricio Téllez",
    en_cartera: true,
  },
  {
    placa: "DRC-330",
    tipo_vehiculo: "Pesado",
    marca: "Hino",
    linea: "500",
    modelo: 2020,
    regional: "Antioquia",
    sede: "CEDI Rionegro",
    centro_costo: "DIST-ANT-01",
    conductor: "Diego Zapata",
    telefono_conductor: "314 555 0156",
    jefe_inmediato: "Paula Gómez",
    en_cartera: true,
  },
  {
    placa: "VBN-615",
    tipo_vehiculo: "Pesado",
    marca: "Freightliner",
    linea: "Cascadia",
    modelo: 2019,
    regional: "Pacífico",
    sede: "Planta Yumbo",
    centro_costo: "DIST-PAC-01",
    conductor: "Harold Mina",
    telefono_conductor: "316 555 0183",
    jefe_inmediato: "Natalia Cruz",
    en_cartera: true,
  },
  {
    placa: "MZN-341",
    tipo_vehiculo: "Liviano",
    marca: "Toyota",
    linea: "Hilux",
    modelo: 2022,
    regional: "Caribe",
    sede: "CEDI Barranquilla",
    centro_costo: "SUP-CAR-01",
    conductor: "Yesid Barrios",
    telefono_conductor: "301 555 0139",
    jefe_inmediato: "Kelly Charris",
    en_cartera: true,
  },
  {
    placa: "RDF-405",
    tipo_vehiculo: "Liviano",
    marca: "Nissan",
    linea: "Frontier",
    modelo: 2021,
    regional: "Sur",
    sede: "CEDI Neiva",
    centro_costo: "VEN-SUR-01",
    conductor: "Camilo Vargas",
    telefono_conductor: "317 555 0172",
    jefe_inmediato: "Liliana Trujillo",
    en_cartera: true,
  },
  {
    placa: "TNP-673",
    tipo_vehiculo: "Liviano",
    marca: "Chevrolet",
    linea: "D-Max",
    modelo: 2023,
    regional: "Centro",
    sede: "CEDI Fontibón",
    centro_costo: "VEN-CEN-02",
    conductor: "Sergio Pineda",
    telefono_conductor: "319 555 0104",
    jefe_inmediato: "Mauricio Téllez",
    en_cartera: true,
  },
  // Placas fuera de cartera: operan en la flota pero no están aseguradas.
  {
    placa: "SXM-118",
    tipo_vehiculo: "Liviano",
    marca: "Renault",
    linea: "Kangoo",
    modelo: 2024,
    regional: "Centro",
    sede: "CEDI Fontibón",
    centro_costo: "VEN-CEN-05",
    conductor: "Luisa Cárdenas",
    telefono_conductor: "320 555 0161",
    jefe_inmediato: "Mauricio Téllez",
    en_cartera: false,
  },
  {
    placa: "JHK-552",
    tipo_vehiculo: "Pesado",
    marca: "JAC",
    linea: "X350",
    modelo: 2024,
    regional: "Caribe",
    sede: "CEDI Cartagena",
    centro_costo: "DIST-CAR-03",
    conductor: "Álvaro Mercado",
    telefono_conductor: "302 555 0187",
    jefe_inmediato: "Kelly Charris",
    en_cartera: false,
  },
  {
    placa: "LKP-219",
    tipo_vehiculo: "Pesado",
    marca: "Kenworth",
    linea: "T800",
    modelo: 2018,
    regional: "Antioquia",
    sede: "CEDI Itagüí",
    centro_costo: "DIST-ANT-02",
    conductor: "Hernán Ospina",
    telefono_conductor: "311 555 0115",
    jefe_inmediato: "Paula Gómez",
    en_cartera: true,
  },
  {
    placa: "QRT-884",
    tipo_vehiculo: "Pesado",
    marca: "International",
    linea: "Prostar",
    modelo: 2016,
    regional: "Centro",
    sede: "Planta Tocancipá",
    centro_costo: "DIST-CEN-02",
    conductor: "Nelson Gil",
    telefono_conductor: "310 555 0198",
    jefe_inmediato: "Mauricio Téllez",
    en_cartera: true,
  },
  {
    placa: "FWL-730",
    tipo_vehiculo: "Pesado",
    marca: "Hino",
    linea: "300",
    modelo: 2019,
    regional: "Pacífico",
    sede: "CEDI Palmira",
    centro_costo: "DIST-PAC-02",
    conductor: "Jairo Caicedo",
    telefono_conductor: "315 555 0127",
    jefe_inmediato: "Natalia Cruz",
    en_cartera: true,
  },
  {
    placa: "MOT-45F",
    tipo_vehiculo: "Moto",
    marca: "Yamaha",
    linea: "XTZ 150",
    modelo: 2023,
    regional: "Sur",
    sede: "CEDI Neiva",
    centro_costo: "VEN-SUR-03",
    conductor: "Brayan Polanía",
    telefono_conductor: "318 555 0150",
    jefe_inmediato: "Liliana Trujillo",
    en_cartera: true,
  },
];

export function buscarVehiculo(placa: string): Vehiculo | undefined {
  const p = placa.toUpperCase().replace(/[\s-]/g, "");
  return FLOTA.find((v) => v.placa.replace("-", "") === p);
}

export type ResultadoCobertura =
  | { estado: "Cubierto"; vehiculo: Vehiculo; tope_km: number }
  | { estado: "Servicio no cubierto"; vehiculo: Vehiculo; tope_km: number }
  | { estado: "Fuera de cartera"; vehiculo: Vehiculo | undefined; tope_km: number };

// Validación en la toma (§4.3): vehículo en cartera + servicio incluido.
export function validarCobertura(placa: string, tipo_servicio: string): ResultadoCobertura {
  const vehiculo = buscarVehiculo(placa);
  if (!vehiculo || !vehiculo.en_cartera)
    return { estado: "Fuera de cartera", vehiculo, tope_km: 0 };
  const cob = COBERTURA_POR_TIPO[vehiculo.tipo_vehiculo];
  if (!cob.servicios.includes(tipo_servicio))
    return { estado: "Servicio no cubierto", vehiculo, tope_km: cob.tope_km };
  return { estado: "Cubierto", vehiculo, tope_km: cob.tope_km };
}

export function formatoCOP(valor: number) {
  return valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}
