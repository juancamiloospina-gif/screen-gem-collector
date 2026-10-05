import { createContext, useContext } from "react";

export type Contexto = {
  recorridoCompleto: () => void;
  explicarPantalla: () => void;
  explicarSeccion: (seccion: string) => void;
  hayPasosAqui: boolean;
};

export const RecorridoContext = createContext<Contexto | null>(null);

export function useRecorrido() {
  const c = useContext(RecorridoContext);
  if (!c) throw new Error("useRecorrido debe usarse dentro de RecorridoProvider");
  return c;
}
