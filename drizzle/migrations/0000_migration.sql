DROP POLICY IF EXISTS "Demo: actualizar casos" ON public.casos;
DROP POLICY IF EXISTS "Demo: crear casos" ON public.casos;
DROP POLICY IF EXISTS "Demo: ver casos" ON public.casos;
DROP POLICY IF EXISTS "Demo: crear eventos" ON public.eventos_caso;
DROP POLICY IF EXISTS "Demo: ver eventos" ON public.eventos_caso;
REVOKE ALL ON public.casos FROM anon, authenticated;
REVOKE ALL ON public.eventos_caso FROM anon, authenticated;
GRANT ALL ON public.casos TO service_role;
GRANT ALL ON public.eventos_caso TO service_role;