// Recorrido guiado de la plataforma. Cada paso resalta una parte de la
// pantalla (el elemento con `data-tour="<objetivo>"`) y explica qué es y
// cómo leerla. Si no hay objetivo, el paso se muestra centrado.

export type Paso = {
  seccion: string;
  ruta: string;
  objetivo?: string;
  titulo: string;
  texto: string;
  // Si el elemento no está visible (por ejemplo en celular), se salta el paso.
  opcional?: boolean;
  // Ancho mínimo de pantalla en que el paso tiene sentido; por debajo no se cuenta.
  minAncho?: number;
  // Solo aparece en el recorrido completo, no al explicar una pantalla.
  soloCompleto?: boolean;
};

// Caso de ejemplo al que lleva el recorrido para explicar el detalle.
const CASO = "/caso/GFT-209";

export const PASOS: Paso[] = [
  // --- Centro operativo -------------------------------------------------
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    titulo: "Bienvenido al Centro operativo",
    texto:
      "Aquí ves toda la operación nacional en una sola pantalla. Cada asistencia pasa por 8 etapas, desde que el conductor avisa hasta que el caso se cierra. Vamos parte por parte, de arriba hacia abajo. Puedes salir cuando quieras.",
  },
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    objetivo: "menu",
    titulo: "El menú, en cuatro grupos",
    texto:
      "Operación (centro, alertas y reportar), Procesos críticos (Front, Back y Seguimiento), Control (supervisión, coberturas y base de flota) y Análisis (analítica, informes e impacto). Siempre está a la mano.",
  },
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    objetivo: "buscador",
    opcional: true,
    minAncho: 1024,
    titulo: "Busca una placa o un caso",
    texto:
      "Escribe una placa o un número de caso y entras directo. Si el vehículo no tiene un caso abierto, te lleva a su ficha en la base de flota.",
  },
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    objetivo: "kpis",
    titulo: "Lo más importante, primero",
    texto:
      "Los indicadores van ordenados por urgencia: casos críticos (ya superaron el tiempo prometido), los que se vencen en 10 minutos, el cumplimiento del SLA contra la meta —el SLA es el tiempo que se le prometió al conductor— y las ciudades y servicios donde la red no alcanza.",
  },
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    objetivo: "procesos",
    titulo: "Tres procesos, una vista para cada uno",
    texto:
      "Front (toma y validación), Back (radicación y asignación de proveedor) y Seguimiento (desde la llegada hasta el cierre). Cada tarjeta muestra cuántos casos tiene, cuántos son críticos y cuántos están por vencerse. Toca una para entrar.",
  },
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    objetivo: "matriz",
    titulo: "Dónde está el dolor",
    texto:
      "Las filas son ciudades y las columnas, los servicios críticos: grúa liviana, grúa pesada, carro taller y conductor elegido. El número grande son los casos que ya incumplieron; el reloj ámbar, los que están por vencerse. Cambia a «Oferta vs demanda» para ver si hay unidades suficientes. Si tocas una celda, todo el tablero se filtra.",
  },
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    objetivo: "predictivo",
    titulo: "Lo predictivo: actuar antes de que falle",
    texto:
      "Casos que se vencen en los próximos 10 minutos, ya sea por el tiempo prometido al cliente o por el tiempo esperado de su etapa. Van del más urgente al menos urgente, con los minutos que les quedan.",
  },
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    objetivo: "criticos",
    titulo: "Críticos ahora",
    texto:
      "Los casos que ya superaron el tiempo prometido, con los minutos transcurridos frente a los prometidos. Son los primeros que hay que atender.",
  },
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    objetivo: "mapa",
    titulo: "Mapa de oferta y demanda",
    texto:
      "Cada burbuja es una ciudad: el número son sus casos y el color, su peor semáforo. La insignia de abajo dice cuántos proveedores están disponibles, en rojo si falta alguno de los servicios. Acércate con la rueda o toca una ciudad para ver cada caso y cada unidad. Puedes apagar la capa de casos o la de proveedores.",
  },
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    objetivo: "red",
    titulo: "Capacidad de la red",
    texto:
      "Por ciudad: proveedores disponibles, ocupados y fuera de zona, frente a la demanda pendiente. El estado lo marca el peor servicio, no el total: una grúa liviana libre no cubre una grúa pesada.",
  },
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    objetivo: "sla",
    titulo: "SLA contra la meta",
    texto:
      "Porcentaje de casos dentro del tiempo prometido. La marca vertical es la meta: verde si se cumple, ámbar hasta 10 puntos por debajo y rojo más abajo. Agrupa por cliente y campaña, por ciudad o por servicio crítico, y compara hoy con los últimos 30 días.",
  },
  {
    seccion: "Centro operativo",
    ruta: "/centro",
    objetivo: "monitor",
    titulo: "Monitor de casos",
    texto:
      "Todos los casos abiertos, con los más urgentes arriba. Cada fila muestra el proceso, la etapa, el tiempo consumido y, si aplica, cuánto falta para vencerse. Toca uno para ver su detalle.",
  },

  // --- Reportar -----------------------------------------------------------
  {
    seccion: "Reportar incidente",
    ruta: "/reportar",
    objetivo: "chat",
    titulo: "Así empieza un caso",
    texto:
      "El conductor escribe como en WhatsApp: qué pasó, la placa y dónde está. También puede mandar su ubicación, una foto o una nota de voz. El agente de IA cruza la placa con la base de flota, valida la cobertura, pide el destino si hay traslado y espera la confirmación antes de abrir el caso.",
  },
  {
    seccion: "Reportar incidente",
    ruta: "/reportar",
    objetivo: "ejemplos",
    titulo: "Pruébalo con un ejemplo",
    texto:
      "Toca cualquiera de estos reportes para ver el flujo completo: uno con placa fuera de cartera, otro de conductor elegido y otro que pasa a una persona. Al confirmar, el caso aparece en todo el tablero.",
  },

  // --- Front -------------------------------------------------------------
  {
    seccion: "Front",
    ruta: "/front",
    objetivo: "encabezado",
    titulo: "Front: la puerta de entrada",
    texto:
      "Aquí está lo que el agente de IA acaba de recibir. Es el primer proceso: tomar la solicitud, validar la cobertura y abrir el caso. Desde esta pantalla puedes probar el chat del conductor.",
  },
  {
    seccion: "Front",
    ruta: "/front",
    objetivo: "kpis",
    titulo: "Los números del proceso",
    texto:
      "Cuántas solicitudes están en toma, cuánto tardan frente a la meta, cuántas están por vencerse y cuántas esperan aprobación por estar fuera de cobertura.",
  },
  {
    seccion: "Front",
    ruta: "/front",
    objetivo: "cola",
    titulo: "Cola de toma",
    texto:
      "Cada solicitud con el tiempo que lleva en esta etapa frente a lo esperado. Si se pasa, se marca en rojo. Las que tienen una persona atendiendo lo indican con su etiqueta.",
  },
  {
    seccion: "Front",
    ruta: "/front",
    objetivo: "cobertura",
    titulo: "Validación de cobertura",
    texto:
      "Si la placa no está en la cartera asegurada o el servicio no está incluido, el caso espera aquí hasta que INDEGA lo apruebe, antes de radicarlo. Se aprueba con un clic.",
  },

  // --- Back --------------------------------------------------------------
  {
    seccion: "Back",
    ruta: "/back",
    objetivo: "encabezado",
    titulo: "Back: radicar y asignar",
    texto:
      "El trámite ante la aseguradora y la búsqueda de una unidad. El cuello de botella casi nunca es el trámite: es que haya proveedores disponibles en la ciudad y el servicio correctos.",
  },
  {
    seccion: "Back",
    ruta: "/back",
    objetivo: "kpis",
    titulo: "Los números del proceso",
    texto:
      "Casos en gestión, ciudades donde la red no alcanza, casos por vencerse y unidades disponibles en total.",
  },
  {
    seccion: "Back",
    ruta: "/back",
    objetivo: "matriz",
    titulo: "Oferta contra demanda",
    texto:
      "Aquí la matriz abre en «Oferta vs demanda»: el número es las unidades disponibles menos los casos que aún necesitan una. En negativo, faltan unidades; en cero, no hay holgura.",
  },
  {
    seccion: "Back",
    ruta: "/back",
    objetivo: "radicacion",
    titulo: "Casos en gestión",
    texto:
      "Cada caso con su número de expediente de la aseguradora y el proveedor asignado. Si falta alguno de los dos, se marca para que se vea qué está pendiente.",
  },
  {
    seccion: "Back",
    ruta: "/back",
    objetivo: "mapa",
    titulo: "El mapa de la red",
    texto:
      "Acércate a una ciudad para ver el círculo de cobertura y cada unidad: azul si está disponible, gris si está ocupada y con borde punteado si está fuera de zona.",
  },
  {
    seccion: "Back",
    ruta: "/back",
    objetivo: "proveedores",
    titulo: "La red conectada",
    texto:
      "Cada unidad con su estado y cuándo se libera. Filtra por estado o por servicio para saber con qué cuentas en una ciudad.",
  },

  // --- Seguimiento ---------------------------------------------------------
  {
    seccion: "Seguimiento",
    ruta: "/seguimiento",
    objetivo: "encabezado",
    titulo: "Seguimiento: de la llegada al cierre",
    texto:
      "Con el proveedor ya asignado, aquí se vigila que llegue, atienda y cierre dentro del tiempo prometido, y que el conductor quede satisfecho.",
  },
  {
    seccion: "Seguimiento",
    ruta: "/seguimiento",
    objetivo: "lista",
    titulo: "En el terreno",
    texto:
      "Los casos que van en camino, en sitio o en traslado, con los más urgentes arriba y el tiempo que llevan en su etapa.",
  },
  {
    seccion: "Seguimiento",
    ruta: "/seguimiento",
    objetivo: "cierre",
    titulo: "Cierre y evaluación",
    texto:
      "Al terminar, el conductor califica el servicio y se revisan los cobros adicionales. Aquí se ven las calificaciones, los comentarios y los excedentes de cada caso cerrado.",
  },
  {
    seccion: "Seguimiento",
    ruta: "/seguimiento",
    objetivo: "sla",
    titulo: "SLA de la operación",
    texto:
      "El mismo cumplimiento contra la meta del tablero principal, para vigilarlo mientras sigues los casos en ruta.",
  },

  // --- Detalle de un caso ----------------------------------------------------
  {
    seccion: "Detalle de un caso",
    ruta: CASO,
    objetivo: "cronologia",
    titulo: "Un caso por dentro",
    texto:
      "Esta es la ficha de una asistencia: quién es el conductor, el vehículo, el origen y el destino, el proveedor asignado y el expediente de la aseguradora. Debajo, las 8 etapas con la hora de cada una y cuánto lleva el caso en la etapa actual.",
  },
  {
    seccion: "Detalle de un caso",
    ruta: CASO,
    objetivo: "cobertura",
    titulo: "Cobertura",
    texto:
      "Si el vehículo está en la cartera asegurada y cuánto cubre el traslado. Si el kilometraje supera el tope, se marca en rojo.",
  },
  {
    seccion: "Detalle de un caso",
    ruta: CASO,
    objetivo: "excedentes",
    titulo: "Excedentes",
    texto:
      "Cobros adicionales como kilometraje de más, horas de espera o peajes. Ninguno se acepta sin la aprobación previa de INDEGA: aquí se aprueba u objeta.",
  },
  {
    seccion: "Detalle de un caso",
    ruta: CASO,
    objetivo: "notificaciones",
    titulo: "Quién fue avisado",
    texto:
      "El registro de cada aviso: al conductor, a su jefe, al director regional, al director de flota y, si hubo un accidente, a seguridad. Se ve a quién, por qué canal y si ya lo leyó.",
  },
  {
    seccion: "Detalle de un caso",
    ruta: CASO,
    objetivo: "actualizar",
    titulo: "Registrar una actualización",
    texto:
      "Para que una persona avance la etapa, deje una novedad, marque una excepción (cancelado, proveedor no llega, reclamo…) o tome el caso del agente de IA. Todo queda con fecha, hora y responsable.",
  },

  // --- Alertas -------------------------------------------------------------
  {
    seccion: "Alertas",
    ruta: "/alertas",
    objetivo: "bandeja",
    titulo: "Bandeja de prioridad",
    texto:
      "Los avisos de la operación: críticos (ya incumplieron), preventivos (van por el 75% del tiempo), casos sin movimiento y los que están por vencerse. Tocas uno y vas a su caso.",
  },
  {
    seccion: "Alertas",
    ruta: "/alertas",
    objetivo: "regla",
    titulo: "Regla de escalamiento",
    texto:
      "A quién se avisa y cuándo: al 75% del tiempo, al coordinador; al 100%, al Director de Flota; y si el caso no cambia de etapa, a un supervisor.",
  },

  // --- Supervisión ---------------------------------------------------------
  {
    seccion: "Supervisión",
    ruta: "/supervision",
    objetivo: "inactividad",
    titulo: "Casos sin movimiento",
    texto:
      "Cada etapa tiene un tiempo esperado. Si un caso lo supera sin cambiar de estado, se escala solo a un supervisor, para que ninguno se pierda.",
  },
  {
    seccion: "Supervisión",
    ruta: "/supervision",
    objetivo: "traspaso",
    titulo: "Casos con una persona",
    texto:
      "Cuando el agente de IA no entiende, el conductor lo pide o el caso es crítico (por ejemplo, un accidente con lesionados), pasa a un supervisor con todo su historial.",
  },
  {
    seccion: "Supervisión",
    ruta: "/supervision",
    objetivo: "turno",
    titulo: "Entrega de turno",
    texto:
      "Antes de cambiar de turno se revisa cada caso abierto. Cuando todos están revisados, se registra la entrega.",
  },

  // --- Coberturas y excedentes -------------------------------------------
  {
    seccion: "Coberturas y excedentes",
    ruta: "/coberturas",
    objetivo: "excedentes",
    titulo: "Aprobación de excedentes",
    texto:
      "Todos los cobros adicionales de los casos activos, con su motivo y su valor. Aquí se aprueban u objetan antes de que se paguen.",
  },
  {
    seccion: "Coberturas y excedentes",
    ruta: "/coberturas",
    objetivo: "validacion",
    titulo: "Casos fuera de cobertura",
    texto:
      "Servicios pedidos para vehículos que no están en la cartera o para servicios no incluidos. No se radican hasta que se aprueben como particulares.",
  },
  {
    seccion: "Coberturas y excedentes",
    ruta: "/coberturas",
    objetivo: "conciliacion",
    titulo: "Conciliación mensual",
    texto:
      "Diferencias entre la flota real y la cartera asegurada: vehículos que hay que incluir, retirar o corregir con la aseguradora.",
  },

  // --- Base de flota -------------------------------------------------------
  {
    seccion: "Base de flota",
    ruta: "/flota",
    objetivo: "tabla",
    titulo: "Una sola fuente de verdad",
    texto:
      "Cada vehículo con su póliza, regional, conductor, cliente y campaña, y las personas a quienes se avisa. El conductor solo da la placa; el resto sale de aquí. Puedes buscar y filtrar los que están fuera de cartera.",
  },

  // --- Analítica -------------------------------------------------------------
  {
    seccion: "Analítica de flota",
    ruta: "/analitica",
    objetivo: "mapa-calor",
    titulo: "Dónde ocurren los incidentes",
    texto:
      "Mapa de calor de los últimos 12 meses: las zonas más rojas concentran más expedientes. Sirve para ajustar rutas y exigir mejor cobertura de la red.",
  },
  {
    seccion: "Analítica de flota",
    ruta: "/analitica",
    objetivo: "recurrencia",
    titulo: "Vehículos que reinciden",
    texto:
      "Las placas con más eventos y cuántas volvieron a fallar en menos de 30 días: una señal de reparaciones que no resolvieron la falla. Sirve para planear el mantenimiento.",
  },

  // --- Indicadores e informes -------------------------------------------
  {
    seccion: "Indicadores e informes",
    ruta: "/informes",
    objetivo: "indicadores",
    titulo: "Indicadores de gestión",
    texto:
      "Nueve indicadores medidos con los casos del centro, frente a la meta propuesta y la línea base del diagnóstico. Así INDEGA tiene sus propios datos, sin esperar el informe de la aseguradora.",
  },
  {
    seccion: "Indicadores e informes",
    ruta: "/informes",
    objetivo: "informes",
    titulo: "Informes",
    texto:
      "Resumen diario, informe de gestión, de coberturas y excedentes, de flota y riesgo, y de vigencia. Elige uno para ver su contenido y, si quieres, imprímelo.",
  },

  // --- Cierre ----------------------------------------------------------------
  {
    seccion: "Indicadores e informes",
    ruta: "/informes",
    soloCompleto: true,
    titulo: "Eso es todo",
    texto:
      "Ya conoces cada parte de la plataforma. Puedes repetir este recorrido, o la explicación de una sola pantalla, desde el botón «Guía» de la parte superior. Recuerda que los datos que ves son de ejemplo.",
  },
];

export function rutaBase(ruta: string) {
  return ruta.startsWith("/caso/") ? "/caso" : ruta;
}

// Pantallas con explicación propia, en el orden del recorrido.
export const SECCIONES: { seccion: string; ruta: string }[] = PASOS.reduce<
  { seccion: string; ruta: string }[]
>((lista, p) => {
  if (!lista.some((s) => s.seccion === p.seccion)) lista.push({ seccion: p.seccion, ruta: p.ruta });
  return lista;
}, []);
