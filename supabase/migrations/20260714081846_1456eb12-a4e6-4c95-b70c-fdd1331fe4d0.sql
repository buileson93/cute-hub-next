
-- =========================================================
-- Migration 1: RBAC scope + permission matrix + helpers
-- =========================================================

-- 1.1 user_scope: gán phạm vi tổ chức/đơn vị cho user
CREATE TABLE public.user_scope (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_chuc_id uuid REFERENCES public.dm_to_chuc(id) ON DELETE CASCADE,
  don_vi_id uuid REFERENCES public.dm_don_vi(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  note text
);
CREATE UNIQUE INDEX user_scope_uniq ON public.user_scope(
  user_id, COALESCE(to_chuc_id,'00000000-0000-0000-0000-000000000000'::uuid), COALESCE(don_vi_id,'00000000-0000-0000-0000-000000000000'::uuid)
);
CREATE INDEX user_scope_user_idx ON public.user_scope(user_id);

GRANT SELECT ON public.user_scope TO authenticated;
GRANT ALL ON public.user_scope TO service_role;
ALTER TABLE public.user_scope ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_scope_self_read" ON public.user_scope
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt'));
CREATE POLICY "user_scope_admin_write" ON public.user_scope
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 1.2 role_permission matrix
CREATE TABLE public.role_permission (
  role app_role NOT NULL,
  module text NOT NULL,
  action text NOT NULL,
  allowed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (role, module, action)
);
GRANT SELECT ON public.role_permission TO authenticated;
GRANT ALL ON public.role_permission TO service_role;
ALTER TABLE public.role_permission ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_perm_read" ON public.role_permission FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_perm_admin_write" ON public.role_permission FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Seed default matrix
DO $$
DECLARE
  m text;
  a text;
  r app_role;
  modules text[] := ARRAY['thiet_bi','he_thong','su_co','bao_tri','kiem_ke','giay_phep','so_do','du_an','kho','form_template','danh_muc','admin','audit','ai'];
  actions text[] := ARRAY['view','create','edit','delete','approve','export','import'];
BEGIN
  FOREACH m IN ARRAY modules LOOP
    FOREACH a IN ARRAY actions LOOP
      FOR r IN SELECT unnest(enum_range(NULL::app_role)) LOOP
        INSERT INTO public.role_permission(role,module,action,allowed) VALUES (r,m,a,
          CASE
            WHEN r='admin' THEN true
            WHEN r='phong_kt' AND a IN ('view','export','approve') THEN true
            WHEN r='phong_kt' AND m IN ('thiet_bi','he_thong','su_co','bao_tri','kiem_ke','giay_phep','danh_muc') THEN true
            WHEN r='phu_trach_dv' AND a IN ('view','create','edit','approve','export') AND m NOT IN ('admin','audit') THEN true
            WHEN r='to_truong' AND a IN ('view','create','edit','export') AND m IN ('thiet_bi','he_thong','su_co','bao_tri','kiem_ke','so_do','kho','ai') THEN true
            WHEN r='ktv' AND a IN ('view','create','edit') AND m IN ('thiet_bi','su_co','bao_tri','kiem_ke','so_do','ai') THEN true
            WHEN r='quan_ly_du_an' AND m IN ('du_an','thiet_bi','he_thong','ai') AND a IN ('view','create','edit','approve','export') THEN true
            WHEN r='readonly' AND a='view' AND m NOT IN ('admin','audit') THEN true
            ELSE false
          END
        ) ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END$$;

-- 1.3 Helpers
CREATE OR REPLACE FUNCTION public.user_scope_don_vi(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT CASE
    WHEN public.has_role(_user_id,'admin') OR public.has_role(_user_id,'phong_kt')
      THEN ARRAY(SELECT id FROM public.dm_don_vi)
    WHEN EXISTS (SELECT 1 FROM public.user_scope WHERE user_id=_user_id AND to_chuc_id IS NULL AND don_vi_id IS NULL)
      THEN ARRAY(SELECT id FROM public.dm_don_vi)
    ELSE COALESCE(
      (SELECT array_agg(DISTINCT dv.id)
         FROM public.dm_don_vi dv
         JOIN public.user_scope us ON us.user_id=_user_id
        WHERE us.don_vi_id = dv.id
           OR (us.to_chuc_id IS NOT NULL AND EXISTS(
               SELECT 1 FROM public.dm_he_thong h WHERE h.don_vi_id=dv.id AND h.to_chuc_id=us.to_chuc_id))
      ), ARRAY[]::uuid[])
  END;
$$;

CREATE OR REPLACE FUNCTION public.user_scope_to_chuc(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT CASE
    WHEN public.has_role(_user_id,'admin') OR public.has_role(_user_id,'phong_kt')
      THEN ARRAY(SELECT id FROM public.dm_to_chuc)
    WHEN EXISTS (SELECT 1 FROM public.user_scope WHERE user_id=_user_id AND to_chuc_id IS NULL AND don_vi_id IS NULL)
      THEN ARRAY(SELECT id FROM public.dm_to_chuc)
    ELSE COALESCE(
      (SELECT array_agg(DISTINCT to_chuc_id) FROM public.user_scope WHERE user_id=_user_id AND to_chuc_id IS NOT NULL),
      ARRAY[]::uuid[])
  END;
$$;

CREATE OR REPLACE FUNCTION public.user_can_see_he_thong(_user_id uuid, _he_thong_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.has_role(_user_id,'admin')
      OR public.has_role(_user_id,'phong_kt')
      OR EXISTS (SELECT 1 FROM public.user_scope WHERE user_id=_user_id AND to_chuc_id IS NULL AND don_vi_id IS NULL)
      OR EXISTS (
        SELECT 1 FROM public.dm_he_thong h
        WHERE h.id=_he_thong_id
          AND (h.don_vi_id = ANY(public.user_scope_don_vi(_user_id))
            OR h.to_chuc_id = ANY(public.user_scope_to_chuc(_user_id)))
      );
$$;

CREATE OR REPLACE FUNCTION public.user_can(_user_id uuid, _module text, _action text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.role_permission rp
    JOIN public.user_roles ur ON ur.role = rp.role
    WHERE ur.user_id=_user_id
      AND rp.module=_module AND rp.action=_action AND rp.allowed=true
  );
$$;

-- Default: seed toàn quyền cho các user hiện có (backward-compatible)
INSERT INTO public.user_scope(user_id, to_chuc_id, don_vi_id, note)
SELECT id, NULL, NULL, 'auto-seed backward compat' FROM auth.users
ON CONFLICT DO NOTHING;

-- 1.4 Request access (yêu cầu cấp quyền tạm)
CREATE TABLE public.access_request (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  action text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending', -- pending|approved|rejected|expired
  ttl_minutes integer NOT NULL DEFAULT 60,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.access_request TO authenticated;
GRANT ALL ON public.access_request TO service_role;
ALTER TABLE public.access_request ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ar_owner_read" ON public.access_request FOR SELECT TO authenticated
  USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ar_owner_insert" ON public.access_request FOR INSERT TO authenticated
  WITH CHECK (user_id=auth.uid());
CREATE POLICY "ar_admin_update" ON public.access_request FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
