export type ReceptionAgentRequest = {
  message: string;
  conversationId?: string;
};

export type ReceptionAgentResponse = {
  reply: string;
  detected?: {
    placa?: string;
    servicio?: string;
    ciudad?: string;
    ubicacion?: string;
  };
};

export async function invokeReceptionAgent(
  _request: ReceptionAgentRequest,
): Promise<ReceptionAgentResponse> {
  // TODO: integrar Supabase Edge Function (ej. "reception-agent") con un LLM real.
  // Este prototipo conserva respuestas guionadas en UI y no hace llamadas a proveedores externos.
  throw new Error("Reception agent no implementado en este prototipo");
}
