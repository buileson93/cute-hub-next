CREATE OR REPLACE FUNCTION public.phan_quyen_thong_ke()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_accounts', (SELECT count(*) FROM profiles),
    'active_accounts', (SELECT count(*) FROM profiles WHERE active),
    'roles', COALESCE((
      SELECT jsonb_object_agg(role, jsonb_build_object('total', total, 'active', active))
      FROM (
        SELECT ur.role::text AS role,
               count(*) AS total,
               count(*) FILTER (WHERE p.active) AS active
        FROM user_roles ur
        LEFT JOIN profiles p ON p.id = ur.user_id
        GROUP BY ur.role
      ) r
    ), '{}'::jsonb),
    'units', COALESCE((
      SELECT jsonb_agg(u)
      FROM (
        SELECT jsonb_build_object(
          'don_vi', don_vi::text,
          'accounts', count(*),
          'active', count(*) FILTER (WHERE active)
        ) AS u
        FROM profiles
        WHERE don_vi IS NOT NULL
        GROUP BY don_vi
        ORDER BY count(*) DESC
      ) x
    ), '[]'::jsonb),
    'entities', jsonb_build_object(
      'thiet_bi', (SELECT count(*) FROM thiet_bi),
      'giay_phep', (SELECT count(*) FROM giay_phep),
      'tickets', (SELECT count(*) FROM tickets),
      'du_an', (SELECT count(*) FROM du_an),
      'so_do', (SELECT count(*) FROM so_do_he_thong),
      'forms', (SELECT count(*) FROM form_submission),
      'audit', (SELECT count(*) FROM audit_log)
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.phan_quyen_thong_ke() TO authenticated;