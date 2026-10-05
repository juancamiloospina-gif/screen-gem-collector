import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, CircleHelp, Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecorridoContext, useRecorrido, type Contexto } from "@/hooks/use-recorrido";
import { PASOS, SECCIONES, rutaBase, type Paso } from "@/lib/recorrido";

const CLAVE = "assisprex:recorrido-visto";

type Sesion = { pasos: Paso[]; i: number };
type Rect = { top: number; left: number; width: number; height: number };

// Primer elemento visible con ese data-tour (el menú, por ejemplo, existe
// dos veces: lateral en escritorio y botón en celular).
function buscarVisible(clave: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${clave}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function medir(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function distinto(a: Rect | null, b: Rect) {
  return (
    !a ||
    Math.abs(a.top - b.top) > 1 ||
    Math.abs(a.left - b.left) > 1 ||
    Math.abs(a.width - b.width) > 1 ||
    Math.abs(a.height - b.height) > 1
  );
}

// Lleva el elemento a una zona visible, dejando espacio para el encabezado
// fijo y, en celular, para la tarjeta que va abajo.
function mostrar(el: HTMLElement) {
  if (el.closest("header, aside")) return;
  const r = el.getBoundingClientRect();
  const alto = window.innerHeight;
  const movil = window.innerWidth < 640;
  const arriba = movil || r.height > alto * 0.55 ? 96 : (alto - r.height) / 2;
  window.scrollTo({ top: Math.max(0, window.scrollY + r.top - arriba), behavior: "auto" });
}

const ANCHO = 360;

function posicionTarjeta(rect: Rect | null): CSSProperties {
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (W < 640) return { left: 12, right: 12, bottom: 12 };
  if (!rect) return { left: (W - ANCHO) / 2, top: Math.max(80, H / 2 - 150), width: ANCHO };
  const left = Math.min(Math.max(12, rect.left), W - ANCHO - 12);
  const debajo = H - (rect.top + rect.height);
  if (debajo >= 250) return { left, top: rect.top + rect.height + 14, width: ANCHO };
  if (rect.top >= 250) return { left, bottom: H - rect.top + 14, width: ANCHO };
  const alto = Math.min(Math.max(88, rect.top), H - 300);
  if (W - (rect.left + rect.width) >= ANCHO + 28)
    return { left: rect.left + rect.width + 14, top: alto, width: ANCHO };
  if (rect.left >= ANCHO + 28) return { left: rect.left - ANCHO - 14, top: alto, width: ANCHO };
  return { right: 16, bottom: 16, width: ANCHO };
}

export function RecorridoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [bienvenida, setBienvenida] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [listo, setListo] = useState(false);
  const [encontrado, setEncontrado] = useState(true);
  const direccion = useRef<1 | -1>(1);
  const botonSiguiente = useRef<HTMLButtonElement>(null);
  const paso = sesion ? sesion.pasos[sesion.i] : undefined;

  // Primera visita: ofrecer el recorrido.
  useEffect(() => {
    try {
      if (!localStorage.getItem(CLAVE)) setBienvenida(true);
    } catch {
      // Sin almacenamiento (ventana privada): no se recuerda, no pasa nada.
    }
  }, []);

  const marcarVisto = useCallback(() => {
    try {
      localStorage.setItem(CLAVE, "1");
    } catch {
      // ver arriba
    }
  }, []);

  const cerrar = useCallback(() => {
    setSesion(null);
    setRect(null);
    setListo(false);
    marcarVisto();
  }, [marcarVisto]);

  const mover = useCallback((delta: 1 | -1) => {
    direccion.current = delta;
    setListo(false);
    setSesion((s) => {
      if (!s) return s;
      const n = s.i + delta;
      if (n < 0) return s;
      if (n >= s.pasos.length) return null;
      return { ...s, i: n };
    });
  }, []);

  const siguiente = useCallback(() => {
    if (sesion && sesion.i >= sesion.pasos.length - 1) cerrar();
    else mover(1);
  }, [sesion, cerrar, mover]);

  const empezar = useCallback((todos: Paso[]) => {
    const pasos = todos.filter((p) => !p.minAncho || window.innerWidth >= p.minAncho);
    if (!pasos.length) return;
    direccion.current = 1;
    setListo(false);
    setRect(null);
    setSesion({ pasos, i: 0 });
  }, []);

  const recorridoCompleto = useCallback(() => empezar(PASOS), [empezar]);
  const explicarSeccion = useCallback(
    (seccion: string) => empezar(PASOS.filter((p) => p.seccion === seccion && !p.soloCompleto)),
    [empezar],
  );
  const pasosAqui = useMemo(
    () => PASOS.filter((p) => rutaBase(p.ruta) === rutaBase(pathname) && !p.soloCompleto),
    [pathname],
  );
  const explicarPantalla = useCallback(() => empezar(pasosAqui), [empezar, pasosAqui]);

  // Cada paso: ir a su pantalla, esperar a que exista el elemento y medirlo.
  useEffect(() => {
    if (!paso) return;
    if (rutaBase(paso.ruta) !== rutaBase(pathname)) {
      if (paso.ruta.startsWith("/caso/"))
        navigate({ to: "/caso/$casoId", params: { casoId: paso.ruta.slice("/caso/".length) } });
      else navigate({ to: paso.ruta as "/centro" });
      return;
    }
    let cancelado = false;
    let intentos = 0;
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    const buscar = () => {
      if (cancelado) return;
      if (!paso.objetivo) {
        window.scrollTo({ top: 0, behavior: "auto" });
        setRect(null);
        setEncontrado(true);
        setListo(true);
        return;
      }
      const el = buscarVisible(paso.objetivo);
      if (!el) {
        if (intentos++ < 30) {
          temporizador = setTimeout(buscar, 100);
          return;
        }
        if (paso.opcional) {
          mover(direccion.current);
          return;
        }
        setRect(null);
        setEncontrado(false);
        setListo(true);
        return;
      }
      mostrar(el);
      requestAnimationFrame(() => {
        if (cancelado) return;
        setRect(medir(el));
        setEncontrado(true);
        setListo(true);
      });
    };
    buscar();
    return () => {
      cancelado = true;
      if (temporizador) clearTimeout(temporizador);
    };
  }, [paso, pathname, navigate, mover]);

  // Mientras el paso está activo, seguir al elemento si se mueve o cambia de
  // tamaño (scroll, mapa que termina de cargar, ventana redimensionada).
  const objetivo = paso?.objetivo;
  const activo = sesion !== null;
  useEffect(() => {
    if (!activo || !objetivo) return;
    const remedir = () => {
      const el = buscarVisible(objetivo);
      if (!el) return;
      const nuevo = medir(el);
      setRect((prev) => (distinto(prev, nuevo) ? nuevo : prev));
    };
    window.addEventListener("resize", remedir);
    window.addEventListener("scroll", remedir, true);
    const id = setInterval(remedir, 350);
    return () => {
      window.removeEventListener("resize", remedir);
      window.removeEventListener("scroll", remedir, true);
      clearInterval(id);
    };
  }, [activo, objetivo]);

  // Teclado: flechas para avanzar, Escape para salir.
  useEffect(() => {
    if (!activo) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
      else if (e.key === "ArrowRight") siguiente();
      else if (e.key === "ArrowLeft") mover(-1);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [activo, cerrar, siguiente, mover]);

  useEffect(() => {
    if (listo) botonSiguiente.current?.focus({ preventScroll: true });
  }, [listo, paso]);

  const ctx = useMemo<Contexto>(
    () => ({
      recorridoCompleto,
      explicarPantalla,
      explicarSeccion,
      hayPasosAqui: pasosAqui.length > 0,
    }),
    [recorridoCompleto, explicarPantalla, explicarSeccion, pasosAqui.length],
  );

  const total = sesion?.pasos.length ?? 0;
  const ultimo = sesion ? sesion.i >= total - 1 : false;

  return (
    <RecorridoContext.Provider value={ctx}>
      {children}

      <Dialog
        open={bienvenida}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setBienvenida(false);
            marcarVisto();
          }
        }}
      >
        <DialogContent className="border-ops-line bg-ops-navy text-ops-ink">
          <DialogHeader>
            <div className="mb-2 grid size-11 place-items-center rounded-xl bg-brand-blue/25 text-brand-sky">
              <Compass className="size-6" />
            </div>
            <DialogTitle className="font-display text-xl">Bienvenido a AssisPrex</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-ops-muted">
              Esta plataforma sigue cada asistencia vehicular desde que el conductor la reporta
              hasta que se cierra. Te acompañamos paso a paso para entender cada parte: son unos 5
              minutos y puedes salir cuando quieras.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1.5 text-xs text-ops-muted">
            <li>• Cada paso resalta una parte de la pantalla y explica cómo leerla.</li>
            <li>• Los datos que verás son de ejemplo.</li>
            <li>• Después lo encuentras en el botón «Guía», arriba.</li>
          </ul>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              className="text-ops-muted"
              onClick={() => {
                setBienvenida(false);
                marcarVisto();
              }}
            >
              Explorar por mi cuenta
            </Button>
            <Button
              className="rounded-lg font-bold"
              onClick={() => {
                setBienvenida(false);
                marcarVisto();
                recorridoCompleto();
              }}
            >
              Empezar el recorrido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {sesion &&
        paso &&
        createPortal(
          <div className="fixed inset-0 z-[2000]" data-recorrido-activo="true">
            {/* Bloquea los clics en la página mientras dura el paso. */}
            <div className="absolute inset-0" aria-hidden="true" />
            {rect ? (
              <div
                className="pointer-events-none fixed rounded-xl ring-2 ring-brand-sky transition-all duration-200"
                style={{
                  top: rect.top - 6,
                  left: rect.left - 6,
                  width: rect.width + 12,
                  height: rect.height + 12,
                  boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.74)",
                }}
              />
            ) : (
              <div className="pointer-events-none absolute inset-0 bg-slate-950/75" />
            )}
            <div
              role="dialog"
              aria-modal="true"
              aria-label={paso.titulo}
              data-recorrido-tarjeta="true"
              data-objetivo-encontrado={encontrado ? "true" : "false"}
              className={`fixed rounded-xl border border-ops-line bg-ops-navy p-5 text-ops-ink shadow-2xl transition-opacity duration-150 ${
                listo ? "opacity-100" : "opacity-0"
              }`}
              style={posicionTarjeta(rect)}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-sky">
                  {paso.seccion} · Paso {sesion.i + 1} de {total}
                </p>
                <button
                  type="button"
                  onClick={cerrar}
                  aria-label="Cerrar el recorrido"
                  className="-mr-1 -mt-1 rounded p-1 text-ops-muted hover:text-ops-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
              <h2 className="mt-2 font-display text-base font-semibold">{paso.titulo}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-ops-ink/90">{paso.texto}</p>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-ops-deep">
                <div
                  className="h-full rounded-full bg-brand-sky transition-all"
                  style={{ width: `${((sesion.i + 1) / total) * 100}%` }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={cerrar}
                  className="text-[11px] text-ops-muted hover:text-ops-ink"
                >
                  Saltar recorrido
                </button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-ops-muted"
                    disabled={sesion.i === 0}
                    onClick={() => mover(-1)}
                  >
                    <ChevronLeft className="size-4" /> Anterior
                  </Button>
                  <Button
                    ref={botonSiguiente}
                    size="sm"
                    className="rounded-lg font-bold"
                    onClick={siguiente}
                  >
                    {ultimo ? "Terminar" : "Siguiente"}
                    {!ultimo && <ChevronRight className="size-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </RecorridoContext.Provider>
  );
}

// Botón del encabezado: repetir el recorrido o explicar una sola pantalla.
export function BotonGuia() {
  const { recorridoCompleto, explicarPantalla, explicarSeccion, hayPasosAqui } = useRecorrido();
  const total = PASOS.length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-tour="guia"
          aria-label="Guía de la plataforma"
          className="ml-auto gap-2 text-ops-muted hover:text-ops-ink lg:ml-0"
        >
          <CircleHelp className="size-5" />
          <span className="hidden sm:inline">Guía</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[70vh] w-72 overflow-y-auto border-ops-line bg-ops-navy text-ops-ink"
      >
        <DropdownMenuItem
          disabled={!hayPasosAqui}
          onSelect={explicarPantalla}
          className="focus:bg-ops-panel"
        >
          Explicar esta pantalla
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={recorridoCompleto} className="focus:bg-ops-panel">
          Recorrido completo ({total} pasos)
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-ops-line" />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.14em] text-ops-muted">
          Explicar una pantalla
        </DropdownMenuLabel>
        {SECCIONES.map((s) => (
          <DropdownMenuItem
            key={s.seccion}
            onSelect={() => explicarSeccion(s.seccion)}
            className="focus:bg-ops-panel"
          >
            {s.seccion}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
