import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Bell, ChartNoAxesCombined, FileText, Headset, LayoutDashboard, LogOut, MessageSquareText, PanelLeft, Search, ShieldCheck, Siren, Truck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { casosQuery } from "@/lib/casos";
import { FLOTA } from "@/lib/flota";

const NAV = [
  { to: "/centro", label: "Centro operativo", icon: LayoutDashboard },
  { to: "/reportar", label: "Reportar incidente", icon: MessageSquareText },
  { to: "/alertas", label: "Alertas", icon: Siren },
  { to: "/supervision", label: "Supervisión", icon: Headset },
  { to: "/coberturas", label: "Coberturas y excedentes", icon: ShieldCheck },
  { to: "/flota", label: "Base de flota", icon: Truck },
  { to: "/analitica", label: "Analítica de flota", icon: Activity },
  { to: "/informes", label: "Indicadores e informes", icon: FileText },
  { to: "/antes-despues", label: "Impacto", icon: ChartNoAxesCombined },
] as const;

// Buscador del encabezado: casos activos por placa o número, y vehículos
// de la base maestra.
function Buscador() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  // Solo consulta cuando hay texto: si cargara al montar, los datos
  // llegarían antes de que la página hidrate y el HTML del servidor no
  // coincidiría con el del cliente.
  const { data } = useQuery({ ...casosQuery, enabled: q.trim().length > 0 });
  const [abierto, setAbierto] = useState(false);
  const t = q.trim().toUpperCase().replace(/[\s#-]/g, "");
  const casos = t ? (data ?? []).filter((c) => c.placa.replace("-", "").includes(t) || String(c.numero).includes(t)).slice(0, 5) : [];
  const vehiculos = t ? FLOTA.filter((v) => v.placa.replace("-", "").includes(t) && !casos.some((c) => c.placa === v.placa)).slice(0, 3) : [];
  const ir = (destino: { caso: string } | { placa: string }) => {
    setQ("");
    setAbierto(false);
    if ("caso" in destino) navigate({ to: "/caso/$casoId", params: { casoId: destino.caso } });
    else navigate({ to: "/flota", search: { q: destino.placa } });
  };
  return (
    <form
      className="relative ml-auto hidden w-full max-w-xs lg:block"
      onSubmit={(e) => {
        e.preventDefault();
        if (casos[0]) ir({ caso: casos[0].id });
        else if (vehiculos[0]) ir({ placa: vehiculos[0].placa });
        else if (q.trim()) ir({ placa: q.trim() });
      }}
    >
      <div className="flex items-center gap-2 rounded-lg border border-ops-line bg-ops-navy px-3 py-2 text-ops-muted focus-within:border-brand-sky">
        <Search className="size-4 shrink-0" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          placeholder="Buscar placa o caso…"
          aria-label="Buscar placa o caso"
          className="w-full bg-transparent text-xs text-ops-ink outline-none placeholder:text-ops-muted"
        />
      </div>
      {abierto && t && (
        <div className="absolute inset-x-0 top-11 z-40 overflow-hidden rounded-lg border border-ops-line bg-ops-navy shadow-2xl">
          {casos.map((c) => (
            <button key={c.id} type="button" onMouseDown={() => ir({ caso: c.id })} className="block w-full px-3 py-2 text-left text-xs hover:bg-ops-panel">
              <span className="font-data">{c.placa}</span> <span className="text-ops-muted">· Caso #{c.numero} · {c.etapa}</span>
            </button>
          ))}
          {vehiculos.map((v) => (
            <button key={v.placa} type="button" onMouseDown={() => ir({ placa: v.placa })} className="block w-full px-3 py-2 text-left text-xs hover:bg-ops-panel">
              <span className="font-data">{v.placa}</span> <span className="text-ops-muted">· Base de flota · {v.marca} {v.linea}</span>
            </button>
          ))}
          {casos.length === 0 && vehiculos.length === 0 && <p className="px-3 py-2 text-xs text-ops-muted">Sin resultados para “{q}”.</p>}
        </div>
      )}
    </form>
  );
}

function Marca() { return <Link to="/" className="flex items-center gap-3"><div className="grid grid-cols-3 gap-0.5">{["bg-brand-sky","bg-brand-blue","bg-transparent","bg-transparent","bg-brand-blue","bg-ops-ink","bg-transparent","bg-ops-ink","bg-transparent"].map((c,i)=><span key={i} className={`size-2 ${c}`} />)}</div><div><div className="font-display text-lg font-semibold text-ops-ink">AssisPrex</div><div className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-sky">INDEGA</div></div></Link> }
function Reloj(){const [hora,setHora]=useState("--:--:--");useEffect(()=>{const tick=()=>setHora(new Date().toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}));tick();const id=setInterval(tick,1000);return()=>clearInterval(id)},[]);return <div className="hidden text-right lg:block"><div className="font-data text-sm tabular-nums text-ops-ink">{hora}</div><div className="text-[9px] uppercase tracking-[0.14em] text-ops-muted">Hora Colombia</div></div>}
function MobileMenu(){const [open,setOpen]=useState(false);return <><Button onClick={()=>setOpen(true)} variant="ghost" size="icon" className="text-ops-muted md:hidden" aria-label="Abrir navegación"><PanelLeft/></Button>{open&&<div className="fixed inset-0 z-50 md:hidden"><button type="button" aria-label="Cerrar navegación" className="absolute inset-0 bg-ops-deep/80" onClick={()=>setOpen(false)}/><aside className="absolute inset-y-0 left-0 w-[82%] max-w-xs border-r border-ops-line bg-ops-navy shadow-2xl"><div className="border-b border-ops-line px-6 py-7"><Marca/></div><nav className="max-h-[calc(100vh-11rem)] space-y-1 overflow-y-auto p-3">{NAV.map(({to,label,icon:Icon})=><Link key={to} to={to} onClick={()=>setOpen(false)} activeOptions={{exact:to==="/centro"}} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-ops-muted" activeProps={{className:"bg-brand-blue/20 text-brand-sky"}}><Icon className="size-5"/>{label}</Link>)}</nav><div className="absolute inset-x-4 bottom-4"><Link to="/" onClick={()=>setOpen(false)} className="flex items-center gap-2 rounded-lg border border-ops-line p-3 text-xs text-ops-muted"><LogOut className="size-4"/> Salir del centro</Link></div></aside></div>}</>}
export function AppShell({ children }: { children: ReactNode }){const path=useRouterState({select:s=>s.location.pathname});if(path==="/")return children;return <div className="flex min-h-screen bg-ops-deep text-ops-ink"><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ops-line bg-ops-navy md:flex"><div className="px-6 py-7"><Marca/></div><nav className="flex-1 space-y-1 overflow-y-auto px-3">{NAV.map(({to,label,icon:Icon})=><Link key={to} to={to} activeOptions={{exact:to==="/centro"}} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ops-muted transition-colors hover:bg-ops-panel hover:text-ops-ink" activeProps={{className:"bg-brand-blue/20 text-brand-sky ring-1 ring-brand-blue/30"}}><Icon className="size-5"/>{label}</Link>)}</nav><div className="m-4 rounded-lg border border-ops-line bg-ops-panel/60 p-3"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-brand-blue font-display text-xs font-bold">DF</div><div><p className="text-xs font-bold">Director de Flota</p><p className="text-[10px] text-ops-muted">Sesión de demostración</p></div></div><Link to="/" className="mt-3 flex items-center gap-2 border-t border-ops-line pt-3 text-xs text-ops-muted hover:text-ops-ink"><LogOut className="size-4"/> Salir del centro</Link></div></aside><div className="min-w-0 flex-1 md:pl-64"><header className="sticky top-0 z-20 flex h-18 items-center gap-4 border-b border-ops-line bg-ops-deep/95 px-4 backdrop-blur-xl lg:px-7"><MobileMenu/><div><h1 className="font-display text-sm font-semibold text-ops-ink lg:text-lg">Centro de Operaciones Digital</h1><div className="mt-0.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-sky"><span className="size-1.5 rounded-full bg-sla-green"/> Sistema activo</div></div><Buscador/><Button asChild size="sm" className="hidden rounded-lg font-bold sm:inline-flex"><Link to="/reportar">Nuevo incidente</Link></Button><Button variant="ghost" size="icon" className="text-ops-muted" aria-label="Ver alertas" asChild><Link to="/alertas"><Bell/></Link></Button><Reloj/></header>{children}</div></div>}
