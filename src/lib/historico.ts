// Histórico agregado para Analítica, Indicadores e Informes. Las cifras
// totales salen del diagnóstico de la propuesta (§2); el detalle por placa
// y por conductor es ilustrativo (datos inventados para la demo).

export const MESES_12M = [
  { mes: "sep 25", expedientes: 84, servicios: 139 },
  { mes: "oct 25", expedientes: 92, servicios: 158 },
  { mes: "nov 25", expedientes: 81, servicios: 136 },
  { mes: "dic 25", expedientes: 78, servicios: 131 },
  { mes: "ene 26", expedientes: 89, servicios: 152 },
  { mes: "feb 26", expedientes: 83, servicios: 141 },
  { mes: "mar 26", expedientes: 86, servicios: 146 },
  { mes: "abr 26", expedientes: 88, servicios: 149 },
  { mes: "may 26", expedientes: 90, servicios: 153 },
  { mes: "jun 26", expedientes: 85, servicios: 143 },
  { mes: "jul 26", expedientes: 91, servicios: 153 },
  { mes: "ago 26", expedientes: 90, servicios: 147 },
];

export const RESUMEN_12M = {
  expedientes: 1037,
  servicios: 1748,
  placas: 666,
  departamentos: 22,
  municipios: 145,
  pesados_pct: 73,
  livianos_pct: 26,
  averias_pct: 64,
  accidentes_pct: 31,
  placas_3_o_mas: 84,
  reincidencia_30d_pct: 13,
  concentracion: "El 10% de las placas concentra el 28% de los expedientes",
};

// La posición en el mapa sale de la ciudad principal (CIUDAD_MAPA).
export const DEPARTAMENTOS_12M = [
  { nombre: "Cundinamarca", ciudad: "Bogotá", expedientes: 301 },
  { nombre: "Antioquia", ciudad: "Medellín", expedientes: 124 },
  { nombre: "Atlántico", ciudad: "Barranquilla", expedientes: 104 },
  { nombre: "Valle del Cauca", ciudad: "Cali", expedientes: 93 },
  { nombre: "Huila", ciudad: "Neiva", expedientes: 73 },
  { nombre: "Tolima", ciudad: "Ibagué", expedientes: 58 },
  { nombre: "Santander", ciudad: "Bucaramanga", expedientes: 49 },
  { nombre: "Bolívar", ciudad: "Cartagena", expedientes: 42 },
  { nombre: "Meta", ciudad: "Villavicencio", expedientes: 36 },
  { nombre: "Boyacá", ciudad: "Tunja", expedientes: 33 },
  { nombre: "Caldas", ciudad: "Manizales", expedientes: 24 },
  { nombre: "Otros 11 departamentos", ciudad: "", expedientes: 100 },
];

// % de expedientes por hora (0-23). 80% entre 6:00 y 18:00, pico 8-12.
export const HORAS = [
  0.8, 0.6, 0.5, 0.5, 0.7, 1.4, 3.6, 5.8, 8.2, 9.1, 9.4, 8.6, 7.1, 6.3, 6.4, 6.1, 5.8, 4.9, 3.5,
  2.4, 2.0, 1.8, 1.5, 1.0,
];

export const DIAS = [
  { dia: "Lun", pct: 16 },
  { dia: "Mar", pct: 17 },
  { dia: "Mié", pct: 16 },
  { dia: "Jue", pct: 16 },
  { dia: "Vie", pct: 17 },
  { dia: "Sáb", pct: 15 },
  { dia: "Dom", pct: 3 },
];

export const PLACAS_RECURRENTES = [
  {
    placa: "GFT-209",
    tipo: "Pesado",
    regional: "Centro",
    expedientes_12m: 9,
    reincidencias_30d: 3,
    causa: "Avería de embrague repetida",
  },
  {
    placa: "QRT-884",
    tipo: "Pesado",
    regional: "Centro",
    expedientes_12m: 8,
    reincidencias_30d: 2,
    causa: "Sistema eléctrico",
  },
  {
    placa: "VBN-615",
    tipo: "Pesado",
    regional: "Pacífico",
    expedientes_12m: 7,
    reincidencias_30d: 2,
    causa: "Llantas y rines",
  },
  {
    placa: "LKP-219",
    tipo: "Pesado",
    regional: "Antioquia",
    expedientes_12m: 7,
    reincidencias_30d: 1,
    causa: "Arranque / batería",
  },
  {
    placa: "FWL-730",
    tipo: "Pesado",
    regional: "Pacífico",
    expedientes_12m: 6,
    reincidencias_30d: 2,
    causa: "Recalentamiento",
  },
  {
    placa: "WTX-234",
    tipo: "Pesado",
    regional: "Centro",
    expedientes_12m: 5,
    reincidencias_30d: 1,
    causa: "Frenos de aire",
  },
  {
    placa: "KJR-901",
    tipo: "Pesado",
    regional: "Antioquia",
    expedientes_12m: 5,
    reincidencias_30d: 0,
    causa: "Accidentes en corredor Occidente",
  },
  {
    placa: "HQN-402",
    tipo: "Liviano",
    regional: "Sur",
    expedientes_12m: 4,
    reincidencias_30d: 1,
    causa: "Pinchazos",
  },
];

export const CONDUCTORES_RECURRENTES = [
  {
    conductor: "Fabio Lozano",
    regional: "Centro",
    incidentes_12m: 7,
    accidentes: 3,
    patron: "Accidentes en franja nocturna",
  },
  {
    conductor: "Jhon Mesa",
    regional: "Antioquia",
    incidentes_12m: 5,
    accidentes: 3,
    patron: "Choques en pendiente, Túnel de Occidente",
  },
  {
    conductor: "Harold Mina",
    regional: "Pacífico",
    incidentes_12m: 5,
    accidentes: 1,
    patron: "Averías tras mantenimiento vencido",
  },
  {
    conductor: "Nelson Gil",
    regional: "Centro",
    incidentes_12m: 4,
    accidentes: 2,
    patron: "Exceso de velocidad reportado por telemetría",
  },
  {
    conductor: "Rafael Ortega",
    regional: "Caribe",
    incidentes_12m: 4,
    accidentes: 2,
    patron: "Accidentes urbanos en hora pico",
  },
];
export const PROMEDIO_INCIDENTES_CONDUCTOR = 1.6;

// Desempeño Mapfre (§2.7), tal como lo reporta la aseguradora.
export const LLEGADA_MENSUAL = [
  { mes: "ago 25", indega: 55, cartera: 45 },
  { mes: "sep 25", indega: 61, cartera: 46 },
  { mes: "oct 25", indega: 73, cartera: 47 },
  { mes: "nov 25", indega: 58, cartera: 44 },
  { mes: "dic 25", indega: 56, cartera: 45 },
  { mes: "ene 26", indega: 62, cartera: 44 },
  { mes: "feb 26", indega: 51, cartera: 43 },
  { mes: "mar 26", indega: 49, cartera: 43 },
  { mes: "abr 26", indega: 47, cartera: 44 },
  { mes: "may 26", indega: 52, cartera: 44 },
  { mes: "jun 26", indega: 46, cartera: 43 },
  { mes: "jul 26", indega: 44, cartera: 42 },
  { mes: "ago 26", indega: 41, cartera: 42 },
];

// Coberturas y excedentes (§2.8).
export const COBERTURAS_12M = {
  valor_total: 551_000_000,
  valor_promedio_expediente: 556_000,
  gruas_pct_valor: 74,
  intermunicipales_pct: 44,
  intermunicipal_vs_urbano: 2.2,
  fuera_cartera_servicios: 51,
  fuera_cartera_expedientes: 36,
  fuera_cartera_placas: 32,
  fuera_cartera_valor: 32_000_000,
  horas_espera_servicios: 66,
};

export const CONCILIACION_CARTERA = [
  {
    placa: "SXM-118",
    novedad: "Ingresó a la flota en jul 2026, no reportada a Mapfre",
    accion: "Incluir en cartera",
  },
  {
    placa: "JHK-552",
    novedad: "Traslado desde otra filial sin actualizar póliza",
    accion: "Incluir en cartera",
  },
  {
    placa: "TPU-903",
    novedad: "Vehículo vendido en may 2026, sigue en cartera",
    accion: "Retirar de cartera",
  },
  {
    placa: "BXD-417",
    novedad: "Tipo de vehículo distinto en el informe Mapfre (Liviano vs Pesado)",
    accion: "Corregir tipo",
  },
];
