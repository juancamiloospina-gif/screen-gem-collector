export type Perfil = "director" | "supervisor" | "operador";

export type Permiso =
  "ver_todo" | "gestionar_casos" | "contactar_proveedor" | "supervisar" | "ver_informes";

export const PERFIL_STORAGE_KEY = "assisprex-perfil";

export const PERFILES: Record<
  Perfil,
  { nombre: string; descripcion: string; iniciales: string; permisos: Permiso[] }
> = {
  director: {
    nombre: "Director de Flota",
    descripcion: "Acceso total y visión ejecutiva de la operación.",
    iniciales: "DF",
    permisos: ["ver_todo", "gestionar_casos", "contactar_proveedor", "supervisar", "ver_informes"],
  },
  supervisor: {
    nombre: "Supervisor",
    descripcion: "Administra casos críticos, equipos y excepciones.",
    iniciales: "SU",
    permisos: ["gestionar_casos", "contactar_proveedor", "supervisar", "ver_informes"],
  },
  operador: {
    nombre: "Operador",
    descripcion: "Consulta y actualiza el flujo básico de asistencias.",
    iniciales: "OP",
    permisos: ["gestionar_casos", "contactar_proveedor"],
  },
};

export function tienePermiso(perfil: Perfil, permiso: Permiso) {
  return (
    PERFILES[perfil].permisos.includes(permiso) || PERFILES[perfil].permisos.includes("ver_todo")
  );
}

export function leerPerfil(): Perfil {
  if (typeof window === "undefined") return "director";
  const valor = window.localStorage.getItem(PERFIL_STORAGE_KEY);
  return valor === "director" || valor === "supervisor" || valor === "operador"
    ? valor
    : "director";
}

export function guardarPerfil(perfil: Perfil) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PERFIL_STORAGE_KEY, perfil);
  window.dispatchEvent(new CustomEvent("assisprex-perfil-change", { detail: perfil }));
}
