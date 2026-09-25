import { useEffect, useState } from "react";

/** Reloj compartido que se refresca cada 30 s (evita desajustes de hidratación). */
export function useAhora() {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}
