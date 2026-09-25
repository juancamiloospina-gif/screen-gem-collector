import { Link } from "@tanstack/react-router";
import { MapPin, Navigation, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COLOR_SEMAFORO, semaforo, type Caso } from "@/lib/casos";

const POSICION: Record<string, { x: number; y: number }> = {
  Barranquilla: { x: 45, y: 20 }, Medellín: { x: 38, y: 39 }, Bogotá: { x: 50, y: 47 }, Cali: { x: 38, y: 56 }, Neiva: { x: 48, y: 61 },
};

export function MapaColombia({ casos, ahora }: { casos: Caso[]; ahora: number }) {
  return <section className="relative min-h-[520px] overflow-hidden rounded-xl border border-ops-line bg-ops-navy shadow-2xl xl:min-h-[650px]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,color-mix(in_oklab,var(--brand-blue)_18%,transparent),transparent_55%)]" />
    <div className="absolute inset-0 opacity-20" style={{backgroundImage:"linear-gradient(var(--ops-line) 1px,transparent 1px),linear-gradient(90deg,var(--ops-line) 1px,transparent 1px)",backgroundSize:"42px 42px"}} />
    <div className="absolute left-5 top-5 z-10 rounded-lg border border-ops-line bg-ops-deep/85 px-4 py-3 backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-sky">Mapa operativo</p><p className="mt-1 font-display text-lg font-semibold">Colombia en vivo</p></div>
    <img src="/colombia-map.svg" alt="Mapa geográfico de Colombia" className="absolute inset-0 size-full object-contain p-12 opacity-85" />
    {casos.map((caso,i)=>{const s=semaforo(caso,ahora);const base=POSICION[caso.ciudad]??{x:50,y:50};const same=casos.filter(c=>c.ciudad===caso.ciudad);const idx=same.findIndex(c=>c.id===caso.id);const angle=idx*2.4;const x=base.x+Math.cos(angle)*idx*3.5;const y=base.y+Math.sin(angle)*idx*3.5;return <Link key={caso.id} to="/caso/$casoId" params={{casoId:caso.id}} className="group absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{left:`${x}%`,top:`${y}%`}} aria-label={`${caso.placa}, ${caso.ciudad}`}><span className={`absolute inset-0 rounded-full ${COLOR_SEMAFORO[s].fondo} ${s==="rojo"?"animate-ping":""}`}/><span className={`relative grid size-5 place-items-center rounded-full border-2 border-ops-ink shadow-lg ${COLOR_SEMAFORO[s].fondo}`}><MapPin className="size-2.5 text-ops-deep"/></span><span className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-ops-line bg-ops-deep px-2.5 py-1.5 text-[10px] font-bold shadow-xl group-hover:block">{caso.placa} · {caso.ciudad}</span></Link>})}
    <div className="absolute right-5 top-5 z-10 flex flex-col rounded-lg border border-ops-line bg-ops-deep/90 p-1 backdrop-blur"><Button variant="ghost" size="icon" className="text-ops-muted" aria-label="Acercar mapa"><Plus/></Button><div className="mx-2 h-px bg-ops-line"/><Button variant="ghost" size="icon" className="text-ops-muted" aria-label="Alejar mapa"><Minus/></Button><div className="mx-2 h-px bg-ops-line"/><Button variant="ghost" size="icon" className="text-brand-sky" aria-label="Centrar mapa"><Navigation/></Button></div>
    <div className="absolute bottom-5 left-5 z-10 flex flex-wrap gap-4 rounded-lg border border-ops-line bg-ops-deep/90 px-4 py-3 text-[10px] text-ops-muted backdrop-blur">{[["bg-sla-green","En tiempo"],["bg-sla-amber","En riesgo"],["bg-sla-red","Incumplido"]].map(([c,l])=><span key={l} className="flex items-center gap-2"><span className={`size-2 rounded-full ${c}`}/>{l}</span>)}</div>
    <div className="absolute bottom-5 right-5 rounded-lg border border-ops-line bg-ops-deep/90 px-3 py-2 text-right backdrop-blur"><p className="font-data text-sm font-medium">{casos.length}</p><p className="text-[9px] uppercase tracking-[0.12em] text-ops-muted">casos activos</p></div>
  </section>;
}
