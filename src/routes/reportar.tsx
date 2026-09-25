import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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
    <div className="flex gap-3 p-3">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-panel ring-1 ring-line">
        <div className="flex h-10 items-center justify-between border-b border-line px-4">
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-ink">
            Reportar incidente · canal conductor
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-faint">
            <span className="pulse-sla size-1.5 rounded-full bg-sla-green" />
            Agente de IA activo
          </span>
        </div>

        <div className="flex h-[60vh] flex-col gap-3 overflow-y-auto p-4">
          {mensajes.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.de === "conductor" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[68%] rounded-lg px-3 py-2 text-[13px] leading-relaxed whitespace-pre-line ${
                  m.de === "conductor"
                    ? "bg-cool/20 text-ink ring-1 ring-cool/30"
                    : "bg-panel2 text-ink/90 ring-1 ring-line"
                }`}
              >
                {m.de === "ia" && (
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
                    Agente de IA · INDEGA
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
          <div className="flex items-center gap-3 border-t border-line bg-panel2/60 px-4 py-3">
            <span className="text-[11px] text-muted-ink">
              Confirmar apertura del caso para {pendiente.placa}
            </span>
            <button
              onClick={confirmar}
              disabled={creando}
              className="ml-auto rounded bg-cool px-3 py-1.5 text-[12px] font-medium text-carbon transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {creando ? "Creando…" : "Confirmar y crear caso"}
            </button>
            <button
              onClick={() => {
                setPendiente(null);
                agregar({
                  de: "ia",
                  texto: "Sin problema. Descríbeme de nuevo el incidente con la placa correcta.",
                  hora: ahoraHora(),
                });
              }}
              className="rounded px-3 py-1.5 text-[12px] text-muted-ink hover:text-ink"
            >
              Corregir
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(texto);
          }}
          className="flex items-center gap-2 border-t border-line px-4 py-3"
        >
          <input
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe lo que pasó, como en un chat…"
            className="flex-1 rounded bg-carbon px-3 py-2 text-[13px] text-ink outline-none ring-1 ring-line placeholder:text-faint focus:ring-cool/60"
          />
          <button
            type="submit"
            className="rounded bg-panel2 px-3 py-2 text-[12px] text-ink ring-1 ring-line hover:bg-panel2/70"
          >
            Enviar
          </button>
        </form>
      </section>

      <aside className="w-[300px] shrink-0 overflow-hidden rounded-lg bg-panel ring-1 ring-line">
        <div className="flex h-10 items-center border-b border-line px-4 text-[11px] uppercase tracking-[0.16em] text-muted-ink">
          Mensajes de ejemplo
        </div>
        <div className="divide-y divide-line">
          {EJEMPLOS.map((e) => (
            <button
              key={e}
              onClick={() => enviar(e)}
              className="block w-full px-4 py-3 text-left text-[12px] leading-snug text-muted-ink hover:bg-panel2/50 hover:text-ink"
            >
              {e}
            </button>
          ))}
        </div>
        <p className="px-4 py-3 text-[11px] leading-snug text-faint">
          Demo: el agente de IA responde con un guion preparado. La integración con WhatsApp
          Business queda fuera de este prototipo.
        </p>
      </aside>
    </div>
  );
}
