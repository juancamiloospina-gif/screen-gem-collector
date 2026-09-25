import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type EtapaCatalogo = Database["public"]["Tables"]["catalogo_etapas"]["Row"];
export type ServicioCatalogo = Database["public"]["Tables"]["catalogo_servicios"]["Row"];
export type CiudadCatalogo = Database["public"]["Tables"]["catalogo_ciudades"]["Row"];

export type CatalogoOperativo = {
  etapas: EtapaCatalogo[];
  servicios: ServicioCatalogo[];
  ciudades: CiudadCatalogo[];
};

export const catalogoOperativoQuery = {
  queryKey: ["catalogo-operativo"],
  queryFn: async (): Promise<CatalogoOperativo> => {
    const [etapasRes, serviciosRes, ciudadesRes] = await Promise.all([
      supabase.from("catalogo_etapas").select("*").order("orden", { ascending: true }),
      supabase.from("catalogo_servicios").select("*").order("id", { ascending: true }),
      supabase.from("catalogo_ciudades").select("*").order("id", { ascending: true }),
    ]);

    if (etapasRes.error) throw etapasRes.error;
    if (serviciosRes.error) throw serviciosRes.error;
    if (ciudadesRes.error) throw ciudadesRes.error;

    return {
      etapas: etapasRes.data ?? [],
      servicios: serviciosRes.data ?? [],
      ciudades: ciudadesRes.data ?? [],
    };
  },
  staleTime: 5 * 60 * 1000,
};
