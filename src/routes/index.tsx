import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, CheckCircle2, MapPinned, Radio, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapaBase, posicionEnCiudad } from "@/components/MapaBase";
import { useAhora } from "@/hooks/use-ahora";
import { COLOR_SEMAFORO, casosQuery, esAbierto, semaforo } from "@/lib/casos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AssisPrex · Centro de Operaciones Digital" },
      { name: "description", content: "Acceso al centro de gestión y control de asistencias vehiculares de INDEGA." },
      { property: "og:title", content: "AssisPrex · Centro de Operaciones Digital" },
      { property: "og:description", content: "Visibilidad en vivo para las asistencias vehiculares de INDEGA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

const PASOS = [
  { icon: Bot, titulo: "Reporte inmediato", texto: "El conductor informa la novedad al agente de IA." },
  { icon: Radio, titulo: "Seguimiento en vivo", texto: "La asistencia se controla etapa por etapa." },
  { icon: ShieldCheck, titulo: "Alerta automática", texto: "El Director de Flota actúa antes del incumplimiento." },
];

function Marca() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid grid-cols-3 gap-0.5" aria-hidden="true">
        {["bg-brand-sky", "bg-brand-blue", "bg-transparent", "bg-transparent", "bg-brand-blue", "bg-brand-navy", "bg-transparent", "bg-brand-navy", "bg-transparent"].map((c, i) => <span key={i} className={`size-2.5 ${c}`} />)}
      </div>
      <div><div className="font-display text-xl font-semibold text-brand-navy">AssisPrex</div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-blue">Corremos con propósito</div></div>
    </div>
  );
}

function RelojCOT() {
  const [hora, setHora] = useState("--:--:--");
  useEffect(() => {
    const tick = () => setHora(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-data">COT {hora}</span>;
}

function Inicio() {
  const ahora = useAhora();
  const { data } = useQuery(casosQuery);
  const abiertos = (data ?? []).filter(esAbierto);
  return (
    <main className="min-h-screen bg-brand-mist text-brand-navy">
      <header className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 lg:px-10">
        <Marca />
        <span className="hidden items-center gap-2 text-xs font-semibold text-brand-blue sm:flex"><span className="size-2 rounded-full bg-sla-green" /> Plataforma operativa disponible</span>
      </header>
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1440px] items-center gap-12 px-6 pb-10 pt-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-sky/30 bg-surface px-3 py-1.5 text-xs font-bold text-brand-blue"><MapPinned className="size-4" /> Operación nacional · Colombia</div>
          <h1 className="font-display text-5xl font-semibold leading-[1.04] text-brand-navy md:text-7xl">Cada asistencia.<br/><span className="text-brand-blue">Visible a tiempo.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">INDEGA controla en vivo cada incidente de su flota, desde el primer reporte hasta el cierre.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-lg px-6 font-bold shadow-brand"><Link to="/centro">Entrar como Director de Flota <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-lg border-brand-sky/40 bg-surface px-6 text-brand-navy"><Link to="/reportar">Reportar una asistencia</Link></Button>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {PASOS.map(({ icon: Icon, titulo, texto }) => <div key={titulo} className="border-l-2 border-brand-sky/40 pl-4"><Icon className="mb-3 size-5 text-brand-blue"/><h2 className="text-sm font-bold">{titulo}</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{texto}</p></div>)}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="absolute -inset-5 rounded-[2rem] border border-brand-sky/20" />
          <div className="relative overflow-hidden rounded-2xl bg-ops-navy p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ops-line pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-sky">Cobertura en vivo</p><p className="mt-1 font-display text-xl text-ops-ink">Colombia</p></div><div className="flex items-center gap-2 text-xs text-ops-muted"><span className="size-2 rounded-full bg-sla-green"/> {data ? `${abiertos.length} casos activos` : "Cargando…"}</div></div>
            <div className="relative mt-5 h-[390px] overflow-hidden rounded-xl bg-ops-deep"><MapaBase className="p-5" opacidad="opacity-90">
              {abiertos.map((c)=>{const idx=abiertos.filter(o=>o.ciudad===c.ciudad).findIndex(o=>o.id===c.id);const {x,y}=posicionEnCiudad(c.ciudad,idx,2);return <span key={c.id} title={`${c.placa} · ${c.ciudad}`} className={`absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-ops-deep/70 ${COLOR_SEMAFORO[semaforo(c,ahora)].fondo}`} style={{left:`${x}%`,top:`${y}%`}} />})}
              </MapaBase>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-ops-muted"><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-sla-green"/> Actualización cada 15 segundos</span><RelojCOT /></div>
          </div>
        </div>
      </section>
    </main>
  );
}
