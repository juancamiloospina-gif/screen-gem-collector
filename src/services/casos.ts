import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Etapa = Database["public"]["Enums"]["etapa_caso"];
export type Caso = Database["public"]["Tables"]["casos"]["Row"];
export type EventoCaso = Database["public"]["Tables"]["eventos_caso"]["Row"];

export const casosQuery = {
  queryKey: ["casos"],
  queryFn: async (): Promise<Caso[]> => {
    const { data, error } = await supabase
      .from("casos")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
  refetchInterval: 15000,
};

export function casoQuery(id: string) {
  return {
    queryKey: ["caso", id],
    queryFn: async (): Promise<{ caso: Caso; eventos: EventoCaso[] }> => {
      const { data: caso, error } = await supabase.from("casos").select("*").eq("id", id).single();
      if (error) throw error;

      const { data: eventos, error: eventosError } = await supabase
        .from("eventos_caso")
        .select("*")
        .eq("caso_id", id)
        .order("ocurrido_en", { ascending: true });

      if (eventosError) throw eventosError;
      return { caso, eventos: eventos ?? [] };
    },
  };
}

export async function crearCaso(input: {
  placa: string;
  tipo_servicio: string;
  ciudad: string;
  ubicacion: string;
  tipo_vehiculo: string;
  prometido_min: number;
}) {
  const { data: ciudadCatalogo } = await supabase
    .from("catalogo_ciudades")
    .select("mapa_x, mapa_y")
    .eq("nombre", input.ciudad)
    .maybeSingle();

  const baseX = Number(ciudadCatalogo?.mapa_x ?? 38);
  const baseY = Number(ciudadCatalogo?.mapa_y ?? 40);

  const { data, error } = await supabase
    .from("casos")
    .insert({
      ...input,
      etapa: "Creación",
      mapa_x: baseX + (Math.random() * 4 - 2),
      mapa_y: baseY + (Math.random() * 4 - 2),
      origen: "Agente IA",
    })
    .select("*")
    .single();

  if (error) throw error;

  await supabase.from("eventos_caso").insert({
    caso_id: data.id,
    etapa: "Creación",
    nota: "Caso creado por el agente de IA a partir del reporte del conductor.",
  });

  return data;
}
