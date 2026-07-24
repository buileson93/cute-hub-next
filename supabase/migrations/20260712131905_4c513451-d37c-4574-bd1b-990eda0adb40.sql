-- Grant read access to the consolidated problem (RCA) view for signed-in users.
GRANT SELECT ON public.v_van_de TO authenticated;

-- Ensure RCA/escalation RPCs are callable by signed-in users (RLS + role checks inside enforce authorization).
GRANT EXECUTE ON FUNCTION public.promote_ticket_to_su_co(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.phe_duyet_cong_viec(uuid, boolean, text) TO authenticated;