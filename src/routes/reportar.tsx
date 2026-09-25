import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Bot, Check, MessageSquareText, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CIUDADES, crearCaso, SERVICIOS } from "@/lib/casos";

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

type Mensaje = { de: "conductor" | "ia"; texto: string; hora: string };

type Deteccion = {
  placa: string;
  tipo_servicio: string;
  ciudad: string;
  ubicacion: string;
  tipo_vehiculo: string;
  prometido_min: number;
};

const EJEMPLOS = [
  "Se dañó el camión placa WTX234 en la vía Bogotá-Girardot, altura peaje Chusacá",
  "Choque leve de la camioneta KJR901 en Medellín, necesito abogado",
  "La tractomula PLM558 se quedó sin batería en la vía 40, Barranquilla",
];

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
  if (/abogad|jurídic|juridic|comparendo|tránsito|transito/.test(t)) tipo_servicio = "Asistencia jurídica";
  else if (/batería|bateria|llanta|pinch|taller|no enciende|arranc/.test(t))
    tipo_servicio = "Carro taller";
  else if (/volc|atasc|rescat|barranco|hundi/.test(t)) tipo_servicio = "Rescate";
  else if (/taxi|hotel|hosped|movilidad|traslado del conductor/.test(t))
    tipo_servicio = "Movilidad del conductor";
  else if (/camión|camion|tractomula|mula|grúa|grua|pesado/.test(t))
    tipo_servicio = "Grúa de gran tonelaje";

  const tipo_vehiculo = /camión|camion|tractomula|mula|pesado|furgón|furgon/.test(t)
    ? "Pesado"
    : "Liviano";

  const prometido_min = tipo_servicio === "Grúa de gran tonelaje" ? 60 : 45;

  const ubicacion = texto
    .replace(/^.*?(en|vía|via)\s/i, "")
    .trim()
    .slice(0, 120);

  return {
    placa,
    tipo_servicio,
    ciudad,
    ubicacion: ubicacion || `${ciudad}, ubicación reportada por el conductor`,
    tipo_vehiculo,
    prometido_min,
  };
}

function Reportar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      de: "ia",
      texto:
        "Hola, soy el asistente virtual de INDEGA. Soy un agente de IA, no una persona. Cuéntame qué pasó con el vehículo: placa, qué ocurrió y dónde estás.",
      hora: ahoraHora(),
    },
  ]);
  const [texto, setTexto] = useState("");
  const [pendiente, setPendiente] = useState<Deteccion | null>(null);
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

  function enviar(valor: string) {
    const limpio = valor.trim();
    if (!limpio) return;
    agregar({ de: "conductor", texto: limpio, hora: ahoraHora() });
    setTexto("");
    const d = detectar(limpio);
    setTimeout(() => {
      agregar({
        de: "ia",
        texto: `Entendido. Identifiqué lo siguiente:\n• Placa: ${d.placa}\n• Servicio: ${d.tipo_servicio}\n• Ciudad: ${d.ciudad}\n• Ubicación: ${d.ubicacion}\n\nTiempo prometido de llegada: ${d.prometido_min} minutos. ¿Confirmas para abrir el caso?`,
        hora: ahoraHora(),
      });
      setPendiente(d);
    }, 650);
  }

  async function confirmar() {
    if (!pendiente) return;
    setCreando(true);
    try {
      const caso = await crearCaso(pendiente);
      await queryClient.invalidateQueries({ queryKey: ["casos"] });
      agregar({
        de: "ia",
        texto: `Caso #${caso.numero} creado. Ya es visible en el tablero del Director de Flota y su tiempo empieza a contar desde ahora. Te aviso cada cambio de etapa.`,
        hora: ahoraHora(),
      });
      setPendiente(null);
      setTimeout(() => navigate({ to: "/caso/$casoId", params: { casoId: caso.id } }), 1400);
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
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-sky">Inicio del flujo</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">Reportar una asistencia</h2>
        <p className="mt-1 text-xs text-ops-muted">El conductor describe lo ocurrido y el agente de IA estructura el caso.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-ops-line bg-ops-navy">
        <div className="flex h-16 items-center justify-between border-b border-ops-line px-5">
          <span className="flex items-center gap-3 text-sm font-bold"><span className="grid size-9 place-items-center rounded-lg bg-brand-blue/20 text-brand-sky"><Bot className="size-5" /></span> Agente de asistencia AssisPrex</span>
          <span className="flex items-center gap-1.5 text-[10px] text-ops-muted">
            <span className="pulse-sla size-1.5 rounded-full bg-sla-green" />
            Agente de IA activo
          </span>
        </div>

        <div className="flex h-[58vh] min-h-[480px] flex-col gap-4 overflow-y-auto bg-ops-deep/40 p-5">
          {mensajes.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.de === "conductor" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line ${
                  m.de === "conductor"
                    ? "bg-brand-blue text-ops-ink"
                    : "border border-ops-line bg-ops-panel text-ops-ink/90"
                }`}
              >
                {m.de === "ia" && (
                  <div className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-brand-sky">
                    <Sparkles className="size-3" /> Agente de IA · AssisPrex
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
              size="sm" className="ml-auto rounded-lg font-bold"
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
              variant="ghost" size="sm" className="text-ops-muted"
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
          className="flex items-center gap-3 border-t border-ops-line px-5 py-4"
        >
          <input
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe lo que pasó, como en un chat…"
            className="h-11 flex-1 rounded-lg border border-ops-line bg-ops-deep px-4 text-[13px] text-ops-ink outline-none placeholder:text-ops-muted focus:border-brand-sky"
          />
          <Button
            type="submit"
            size="icon" className="size-11 rounded-lg" aria-label="Enviar mensaje"
          >
            <Send />
          </Button>
        </form>
      </section>

      <aside className="overflow-hidden rounded-xl border border-ops-line bg-ops-navy">
        <div className="border-b border-ops-line p-5">
          <MessageSquareText className="size-5 text-brand-sky" />
          <h3 className="mt-3 text-sm font-bold">Probar con un ejemplo</h3>
          <p className="mt-1 text-[10px] text-ops-muted">Selecciona un reporte para ver el flujo completo.</p>
        </div>
        <div className="divide-y divide-ops-line">
          {EJEMPLOS.map((e) => (
            <Button
              key={e}
              onClick={() => enviar(e)}
              variant="ghost" className="h-auto w-full justify-start whitespace-normal rounded-none px-5 py-4 text-left text-[11px] leading-relaxed text-ops-muted hover:bg-ops-panel hover:text-ops-ink"
            >
              {e}
            </Button>
          ))}
        </div>
        <p className="px-5 py-4 text-[10px] leading-relaxed text-ops-muted">
          Demo: el agente de IA responde con un guion preparado. La integración con WhatsApp
          Business queda fuera de este prototipo.
        </p>
      </aside></div>
    </main>
  );
}
