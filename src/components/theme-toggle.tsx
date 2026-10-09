import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export type Tema = "light" | "dark";

function aplicarTema(tema: Tema) {
  document.documentElement.classList.toggle("theme-light", tema === "light");
  document.documentElement.classList.toggle("theme-dark", tema === "dark");
}

export function useTema(): [Tema, (tema: Tema) => void] {
  const [tema, setTema] = useState<Tema>("dark");

  useEffect(() => {
    const guardado = window.localStorage.getItem("assisprex-tema");
    const inicial: Tema = guardado === "light" || guardado === "dark" ? guardado : "dark";
    setTema(inicial);
    aplicarTema(inicial);
  }, []);

  const cambiar = (nuevo: Tema) => {
    setTema(nuevo);
    window.localStorage.setItem("assisprex-tema", nuevo);
    aplicarTema(nuevo);
  };

  return [tema, cambiar];
}

export function TemaToggle({ compact = false }: { compact?: boolean }) {
  const [tema, cambiar] = useTema();
  const siguiente: Tema = tema === "dark" ? "light" : "dark";
  const esNoche = tema === "dark";
  return (
    <button
      type="button"
      onClick={() => cambiar(siguiente)}
      aria-label={`Cambiar a modo ${siguiente === "dark" ? "noche" : "día"}`}
      title={`Cambiar a modo ${siguiente === "dark" ? "noche" : "día"}`}
      className={`inline-flex shrink-0 items-center gap-2 rounded-lg border border-ops-line bg-ops-navy text-ops-ink transition-colors hover:border-brand-sky ${compact ? "size-9 justify-center" : "px-3 py-2 text-xs font-bold"}`}
    >
      {esNoche ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {!compact && <span>{esNoche ? "Modo día" : "Modo noche"}</span>}
    </button>
  );
}
