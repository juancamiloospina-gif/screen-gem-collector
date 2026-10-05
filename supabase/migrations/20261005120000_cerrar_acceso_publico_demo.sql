-- El prototipo ya no usa la base de datos: los casos viven en memoria del
-- navegador (src/lib/casos.ts). Las tablas `casos` y `eventos_caso` quedan
-- como esquema de referencia para la fase real, pero la migración
-- 20260925085727 las dejó abiertas a cualquier visitante anónimo (lectura,
-- creación y actualización sin restricción), lo que el escáner de seguridad
-- marca como crítico.
--
-- Esta migración cierra ese acceso sin borrar tablas ni datos:
--   * se eliminan las políticas "Demo: ..." que permitían todo (USING true);
--   * se retiran los permisos de `anon` y `authenticated`.
-- Con RLS activo y sin políticas, solo `service_role` puede leer o escribir.
-- Cuando se construya la fase real hay que crear políticas por usuario/rol.

DROP POLICY IF EXISTS "Demo: ver casos" ON public.casos;
DROP POLICY IF EXISTS "Demo: crear casos" ON public.casos;
DROP POLICY IF EXISTS "Demo: actualizar casos" ON public.casos;
DROP POLICY IF EXISTS "Demo: ver eventos" ON public.eventos_caso;
DROP POLICY IF EXISTS "Demo: crear eventos" ON public.eventos_caso;

REVOKE ALL ON public.casos FROM anon, authenticated;
REVOKE ALL ON public.eventos_caso FROM anon, authenticated;
