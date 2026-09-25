import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Camera,
  Check,
  MapPin,
  MessageSquareText,
  Mic,
  Phone,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CIUDADES, crearCaso, SERVICIOS, type Caso } from "@/lib/casos";
import { POLIZA, REGIONALES, validarCobertura, type ResultadoCobertura } from "@/lib/flota";

export const Route = createFileRoute("/reportar")({
  head: () => ({
    meta: [
      { title: "Reportar incidente · INDEGA Control de Asistencias" },
      {
        name: "description",
        content:
          "El conductor describe la avería en lenguaje natural y el agente de IA confirma placa, servicio y ubicación para abrir el caso.",
      },
      { property: "og:title", content: "Reportar incidente · INDEGA" },
      {
        property: "og:description",
        content: "Reporte por chat con agente de IA que crea el caso de asistencia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reportar,
});

type Mensaje = {
  de: "conductor" | "ia" | "humano";
  texto: string;
  hora: string;
  adjunto?: "ubicacion" | "foto" | "voz";
};

type Deteccion = {
  placa: string;
  tipo_servicio: string;
  causa: Caso["causa"];
  ciudad: string;
  ubicacion: string;
  destino: string | null;
  tipo_vehiculo: string;
  prometido_min: number;
};

const EJEMPLOS = [
  "Se dañó el camión placa WTX234 en la vía Bogotá-Girardot, altura peaje Chusacá. Hay que llevarlo a Taller Kenworth Fontibón",
  "Choque leve de la camioneta KJR901 en Medellín, necesito abogado",
  "La tractomula GFT209 no arranca en la Autopista Norte km 21, Bogotá",
  "Se pinchó la llanta de la Kangoo SXM118 en la Av. Boyacá con 13, Bogotá",
];

// Servicios que implican mover el vehículo: el agente pide el destino.
const CON_TRASLADO = ["Grúa de gran tonelaje", "Rescate"];

function ahoraHora() {
  return new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function detectar(texto: string): Deteccion {
  const t = texto.toLowerCase();
  const placaMatch = texto.toUpperCase().match(/([A-Z]{3})[\s-]?(\d{3})/);
  const placa = placaMatch ? `${placaMatch[1]}-${placaMatch[2]}` : "SIN-000";

  const ciudad = CIUDADES.find((c) => t.includes(c.toLowerCase().normalize("NFC"))) ?? "Bogotá";

  let tipo_servicio: string = SERVICIOS[0];
  if (/abogad|jurídic|juridic|comparendo|tránsito|transito/.test(t))
    tipo_servicio = "Asistencia jurídica";
  else if (/batería|bateria|llanta|pinch|taller|no enciende/.test(t))
    tipo_servicio = "Carro taller";
  else if (/volc|atasc|rescat|barranco|hundi/.test(t)) tipo_servicio = "Rescate";
  else if (/taxi|hotel|hosped|movilidad|traslado del conductor/.test(t))
    tipo_servicio = "Movilidad del conductor";
  else if (/camión|camion|tractomula|mula|grúa|grua|pesado|arranca/.test(t))
    tipo_servicio = "Grúa de gran tonelaje";

  const causa: Caso["causa"] = /choque|chocó|choco|accident|colisi|atropell|volc/.test(t)
    ? "Accidente"
    : "Avería";

  const tipo_vehiculo = /camión|camion|tractomula|mula|pesado|furgón|furgon/.test(t)
    ? "Pesado"
    : "Liviano";

  const prometido_min = tipo_servicio === "Grúa de gran tonelaje" ? 60 : 45;

  const destinoMatch = texto.match(
    /(?:llevarlo|llevarla|llevar|destino|hasta)\s+(?:a\s+|al\s+)?(.+)$/i,
  );
  const destino = destinoMatch ? destinoMatch[1]!.trim().replace(/\.$/, "") : null;

  const ubicacion = texto
    .replace(/\.?\s*(hay que\s+)?(llevarlo|llevarla|llevar|destino|hasta)\s.+$/i, "")
    .replace(/^.*?\b(en|vía|via)\s/i, "")
    .trim()
    .slice(0, 120);

  return {
    placa,
    tipo_servicio,
    causa,
    ciudad,
    ubicacion: ubicacion || `${ciudad}, ubicación reportada por el conductor`,
    destino,
    tipo_vehiculo,
    prometido_min,
  };
}

function textoCobertura(cob: ResultadoCobertura) {
  if (cob.estado === "Cubierto")
    return `✓ Vehículo en cartera ${POLIZA.aseguradora} y servicio cubierto (tope de traslado ${cob.tope_km} km).`;
  if (cob.estado === "Servicio no cubierto")
    return `⚠ El vehículo está en cartera, pero este servicio no está incluido para un ${cob.vehiculo.tipo_vehiculo.toLowerCase()}. Aviso a INDEGA antes de proceder.`;
  return cob.vehiculo
    ? "⚠ La placa está en la base maestra de INDEGA pero NO está en la cartera asegurada. El servicio no está cubierto: aviso a INDEGA antes de radicar."
    : "⚠ No encontré la placa en la base maestra de flota. La marco como fuera de cartera y aviso a INDEGA.";
}

function Reportar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      de: "ia",
      texto:
        "Hola, soy el asistente virtual de INDEGA. Soy un agente de IA, no una persona. Cuéntame qué pasó con el vehículo: placa, qué ocurrió y dónde estás. Si prefieres, envíame tu ubicación, una foto o una nota de voz.",
      hora: ahoraHora(),
    },
  ]);
  const [texto, setTexto] = useState("");
  const [pendiente, setPendiente] = useState<Deteccion | null>(null);
  const [esperandoDestino, setEsperandoDestino] = useState<Deteccion | null>(null);
  const [conHumano, setConHumano] = useState(false);
  const [creando, setCreando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, [mensajes]);

  function agregar(m: Mensaje) {
    setMensajes((prev) => [...prev, m]);
  }

  function responder(m: Omit<Mensaje, "hora">, despues?: () => void) {
    setTimeout(() => {
      agregar({ ...m, hora: ahoraHora() });
      despues?.();
    }, 650);
  }

  function resumen(d: Deteccion) {
    const cob = validarCobertura(d.placa, d.tipo_servicio);
    const v = cob.vehiculo;
    const ficha = v
      ? `• Vehículo: ${v.marca} ${v.linea} ${v.modelo} (${v.tipo_vehiculo})\n• Regional ${v.regional} · ${v.sede}\n• Conductor asignado: ${v.conductor}`
      : "• Vehículo: sin registro en la base maestra";
    responder(
      {
        de: "ia",
        texto: `Entendido. Identifiqué lo siguiente:\n• Placa: ${d.placa}\n• Servicio: ${d.tipo_servicio} (${d.causa.toLowerCase()})\n• Ciudad: ${d.ciudad}\n• Ubicación: ${d.ubicacion}${d.destino ? `\n• Destino: ${d.destino}` : ""}\n\nDe la base maestra de flota:\n${ficha}\n\n${textoCobertura(cob)}\n\nTiempo prometido de llegada: ${d.prometido_min} minutos. ¿Confirmas para abrir el caso?`,
      },
      () => setPendiente(v ? { ...d, tipo_vehiculo: v.tipo_vehiculo } : d),
    );
  }

  function enviar(valor: string) {
    const limpio = valor.trim();
    if (!limpio) return;
    agregar({ de: "conductor", texto: limpio, hora: ahoraHora() });
    setTexto("");

    if (conHumano) {
      responder({
        de: "humano",
        texto: "Recibido. Ya lo registré en el caso y sigo pendiente contigo.",
      });
      return;
    }
    if (/persona|humano|asesor|supervisor|operador/i.test(limpio)) {
      setPendiente(null);
      setEsperandoDestino(null);
      responder(
        {
          de: "ia",
          texto: "Claro. Te paso con un supervisor humano con todo lo que me contaste hasta ahora.",
        },
        () => {
          setConHumano(true);
          responder({
            de: "humano",
            texto:
              "Hola, soy Laura Díaz, supervisora del centro de asistencias. Ya tengo tu historial. ¿Estás en un lugar seguro?",
          });
        },
      );
      return;
    }
    if (esperandoDestino) {
      const d = { ...esperandoDestino, destino: limpio };
      setEsperandoDestino(null);
      resumen(d);
      return;
    }
    const d = detectar(limpio);
    if (CON_TRASLADO.includes(d.tipo_servicio) && !d.destino) {
      responder(
        {
          de: "ia",
          texto: `Entiendo que el vehículo ${d.placa} necesita traslado. ¿A dónde lo llevamos? (taller, sede o CEDI)`,
        },
        () => setEsperandoDestino(d),
      );
      return;
    }
    resumen(d);
  }

  function adjuntar(tipo: NonNullable<Mensaje["adjunto"]>) {
    const textos = {
      ubicacion: "📍 Ubicación en tiempo real · 4.6097, -74.0817",
      foto: "📷 Foto del vehículo",
      voz: "🎙️ Nota de voz · 0:14",
    };
    const respuestas = {
      ubicacion: "Recibí tu ubicación en tiempo real. La uso como punto de origen del servicio.",
      foto: "Recibí la foto. Se ve la llanta delantera izquierda pinchada; la adjunto al caso como evidencia.",
      voz: 'Transcribí tu nota de voz: "El camión se apagó y no vuelve a prender, estoy en la berma". ¿Me confirmas la placa?',
    };
    agregar({ de: "conductor", texto: textos[tipo], hora: ahoraHora(), adjunto: tipo });
    responder({ de: "ia", texto: respuestas[tipo] });
  }

  async function confirmar() {
    if (!pendiente) return;
    setCreando(true);
    try {
      const caso = await crearCaso(pendiente);
      await queryClient.invalidateQueries({ queryKey: ["casos"] });
      const vehiculo = validarCobertura(pendiente.placa, pendiente.tipo_servicio).vehiculo;
      agregar({
        de: "ia",
        texto:
          caso.cobertura === "Cubierto"
            ? `Caso #${caso.numero} creado. Ya es visible en el tablero del Director de Flota y avisé a tu jefe inmediato${vehiculo ? ` y a ${REGIONALES[vehiculo.regional].director} (Regional ${vehiculo.regional})` : ""}. Ahora lo radico ante ${POLIZA.aseguradora} y te aviso cada cambio de etapa.`
            : `Caso #${caso.numero} creado como "Servicio no cubierto". No lo radico todavía: el Director de Flota debe aprobarlo. Te aviso apenas tenga respuesta.`,
        hora: ahoraHora(),
      });
      setPendiente(null);
      setTimeout(() => navigate({ to: "/caso/$casoId", params: { casoId: caso.id } }), 1800);
    } catch {
      agregar({
        de: "ia",
        texto: "No pude registrar el caso en este momento. Intenta de nuevo, por favor.",
        hora: ahoraHora(),
      });
    } finally {
      setCreando(false);
    }
  }

  return (
    <main className="p-4 lg:p-7">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-sky">
          Inicio del flujo
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold">Reportar una asistencia</h2>
        <p className="mt-1 text-xs text-ops-muted">
          El conductor describe lo ocurrido y el agente de IA cruza la placa con la base maestra,
          valida la cobertura y estructura el caso.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-ops-line bg-ops-navy">
          <div className="flex h-16 items-center justify-between border-b border-ops-line px-5">
            <span className="flex items-center gap-3 text-sm font-bold">
              <span className="grid size-9 place-items-center rounded-lg bg-brand-blue/20 text-brand-sky">
                {conHumano ? <UserRound className="size-5" /> : <Bot className="size-5" />}
              </span>
              {conHumano ? "Laura Díaz · Supervisora" : "Agente de asistencia AssisPrex"}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-ops-muted">
              <span className="pulse-sla size-1.5 rounded-full bg-sla-green" />
              {conHumano ? "Supervisión humana" : "WhatsApp · Agente de IA activo"}
            </span>
          </div>

          <div className="flex h-[58vh] min-h-[480px] flex-col gap-4 overflow-y-auto bg-ops-deep/40 p-5">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.de === "conductor" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line sm:max-w-[78%] ${
                    m.de === "conductor"
                      ? "bg-brand-blue text-ops-ink"
                      : m.de === "humano"
                        ? "border border-sla-amber/40 bg-ops-panel text-ops-ink/90"
                        : "border border-ops-line bg-ops-panel text-ops-ink/90"
                  }`}
                >
                  {m.de === "ia" && (
                    <div className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-brand-sky">
                      <Sparkles className="size-3" /> Agente de IA · AssisPrex
                    </div>
                  )}
                  {m.de === "humano" && (
                    <div className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-sla-amber">
                      <UserRound className="size-3" /> Supervisora · Laura Díaz
                    </div>
                  )}
                  {m.adjunto === "foto" && (
                    <div className="mb-2 grid h-28 w-48 place-items-center rounded-lg bg-ops-deep/60 text-ops-muted">
                      <Camera className="size-6" />
                    </div>
                  )}
                  {m.texto}
                  <div className="mt-1 text-right font-mono text-[9px] tabular-nums text-faint">
                    {m.hora}
                  </div>
                </div>
              </div>
            ))}
            <div ref={finRef} />
          </div>

          {pendiente && (
            <div className="flex flex-wrap items-center gap-3 border-t border-ops-line bg-ops-panel/60 px-5 py-4">
              <span className="text-[11px] text-muted-ink">
                Confirmar apertura del caso para {pendiente.placa}
              </span>
              <Button
                onClick={confirmar}
                disabled={creando}
                size="sm"
                className="ml-auto rounded-lg font-bold"
              >
                <Check className="size-4" /> {creando ? "Creando…" : "Confirmar y crear caso"}
              </Button>
              <Button
                onClick={() => {
                  setPendiente(null);
                  agregar({
                    de: "ia",
                    texto: "Sin problema. Descríbeme de nuevo el incidente con la placa correcta.",
                    hora: ahoraHora(),
                  });
                }}
                variant="ghost"
                size="sm"
                className="text-ops-muted"
              >
                Corregir
              </Button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
            className="flex items-center gap-2 border-t border-ops-line px-3 py-4 sm:gap-3 sm:px-5"
          >
            <div className="flex">
              {(
                [
                  ["ubicacion", MapPin, "Enviar ubicación"],
                  ["foto", Camera, "Enviar foto"],
                  ["voz", Mic, "Enviar nota de voz"],
                ] as const
              ).map(([tipo, Icon, label]) => (
                <Button
                  key={tipo}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-ops-muted hover:text-brand-sky"
                  aria-label={label}
                  title={label}
                  onClick={() => adjuntar(tipo)}
                >
                  <Icon />
                </Button>
              ))}
            </div>
            <input
              ref={inputRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={
                esperandoDestino
                  ? "Escribe el destino del traslado…"
                  : "Escribe lo que pasó, como en un chat…"
              }
              className="h-11 min-w-0 flex-1 rounded-lg border border-ops-line bg-ops-deep px-4 text-[13px] text-ops-ink outline-none placeholder:text-ops-muted focus:border-brand-sky"
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0 rounded-lg"
              aria-label="Enviar mensaje"
            >
              <Send />
            </Button>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="overflow-hidden rounded-xl border border-ops-line bg-ops-navy">
            <div className="border-b border-ops-line p-5">
              <MessageSquareText className="size-5 text-brand-sky" />
              <h3 className="mt-3 text-sm font-bold">Probar con un ejemplo</h3>
              <p className="mt-1 text-[10px] text-ops-muted">
                Selecciona un reporte para ver el flujo completo.
              </p>
            </div>
            <div className="divide-y divide-ops-line">
              {EJEMPLOS.map((e) => (
                <Button
                  key={e}
                  onClick={() => enviar(e)}
                  variant="ghost"
                  className="h-auto w-full justify-start whitespace-normal rounded-none px-5 py-4 text-left text-[11px] leading-relaxed text-ops-muted hover:bg-ops-panel hover:text-ops-ink"
                >
                  {e}
                </Button>
              ))}
              <Button
                onClick={() => enviar("Quiero hablar con una persona")}
                variant="ghost"
                className="h-auto w-full justify-start whitespace-normal rounded-none px-5 py-4 text-left text-[11px] leading-relaxed text-sla-amber hover:bg-ops-panel"
              >
                “Quiero hablar con una persona” (traspaso a humano)
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-ops-line bg-ops-navy p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-sky">
              Canales del conductor
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <MessageSquareText className="mt-0.5 size-4 shrink-0 text-sla-green" />
                <div>
                  <p className="text-xs font-bold">WhatsApp Business</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ops-muted">
                    Texto, audio, fotos y ubicación en tiempo real. Es el canal de esta demo.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-sky" />
                <div>
                  <p className="text-xs font-bold">Línea telefónica · 601 555 0100</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ops-muted">
                    Un agente de voz toma los mismos cuatro datos en una conversación natural, 24/7.
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-5 border-t border-ops-line pt-4 text-[10px] leading-relaxed text-ops-muted">
              Basta con cuatro datos: tipo de servicio, placa, ubicación de origen y destino si hay
              traslado. El resto sale de la base maestra de flota.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
