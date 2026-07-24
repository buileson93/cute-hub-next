-- T11: Snapshot đơn vị (immutable) + RLS fallback cho lịch sử
-- Giữ phạm vi xem lịch sử theo đơn vị sở hữu tại thời điểm tạo bản ghi,
-- không bị trôi khi thiết bị bị chuyển đơn vị / ngừng khai thác / xoá (T10).

-- 1) Thêm cột snapshot đơn vị
ALTER TABLE public.su_co    ADD COLUMN IF NOT EXISTS don_vi_id_snapshot uuid;
ALTER TABLE public.bao_tri  ADD COLUMN IF NOT EXISTS don_vi_id_snapshot uuid;
ALTER TABLE public.hong_hoc ADD COLUMN IF NOT EXISTS don_vi_id_snapshot uuid;
ALTER TABLE public.ban_giao ADD COLUMN IF NOT EXISTS don_vi_id_snapshot uuid;

-- 2) Helper suy đơn vị sở hữu từ thiết bị (fallback qua hệ thống)
CREATE OR REPLACE FUNCTION public._snapshot_don_vi_from_thiet_bi(_tb_id uuid, _ht_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT COALESCE(t.don_vi_quan_ly_id, t.don_vi_id, t.don_vi_giu_id)
       FROM public.thiet_bi t WHERE t.id = _tb_id),
    (SELECT COALESCE(t.don_vi_quan_ly_id, t.don_vi_id, t.don_vi_giu_id)
       FROM public.thiet_bi t
      WHERE _ht_id IS NOT NULL
        AND t.he_thong_id = _ht_id
        AND COALESCE(t.don_vi_quan_ly_id, t.don_vi_id, t.don_vi_giu_id) IS NOT NULL
      LIMIT 1)
  )
$$;

REVOKE EXECUTE ON FUNCTION public._snapshot_don_vi_from_thiet_bi(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- 3) Trigger điền snapshot lúc tạo; bất biến sau khi đã có giá trị (client không sửa được)
CREATE OR REPLACE FUNCTION public.trg_fill_don_vi_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  j jsonb := to_jsonb(NEW);
  old_snap uuid;
  tb_id uuid;
  ht_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_snap := (to_jsonb(OLD)->>'don_vi_id_snapshot')::uuid;
  END IF;

  IF TG_OP = 'UPDATE' AND old_snap IS NOT NULL THEN
    -- đã có snapshot: giữ nguyên, chặn mọi thay đổi từ client
    NEW.don_vi_id_snapshot := old_snap;
  ELSE
    tb_id := COALESCE((j->>'thiet_bi_id')::uuid, (j->>'thiet_bi_hong_id')::uuid);
    ht_id := (j->>'he_thong_id')::uuid;
    NEW.don_vi_id_snapshot := public._snapshot_don_vi_from_thiet_bi(tb_id, ht_id);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trg_fill_don_vi_snapshot() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_su_co_snapshot    ON public.su_co;
DROP TRIGGER IF EXISTS trg_bao_tri_snapshot  ON public.bao_tri;
DROP TRIGGER IF EXISTS trg_hong_hoc_snapshot ON public.hong_hoc;
DROP TRIGGER IF EXISTS trg_ban_giao_snapshot ON public.ban_giao;

CREATE TRIGGER trg_su_co_snapshot    BEFORE INSERT OR UPDATE ON public.su_co    FOR EACH ROW EXECUTE FUNCTION public.trg_fill_don_vi_snapshot();
CREATE TRIGGER trg_bao_tri_snapshot  BEFORE INSERT OR UPDATE ON public.bao_tri  FOR EACH ROW EXECUTE FUNCTION public.trg_fill_don_vi_snapshot();
CREATE TRIGGER trg_hong_hoc_snapshot BEFORE INSERT OR UPDATE ON public.hong_hoc FOR EACH ROW EXECUTE FUNCTION public.trg_fill_don_vi_snapshot();
CREATE TRIGGER trg_ban_giao_snapshot BEFORE INSERT OR UPDATE ON public.ban_giao FOR EACH ROW EXECUTE FUNCTION public.trg_fill_don_vi_snapshot();

-- 4) Backfill bản ghi cũ (chỉ khi xác định được đơn vị từ thiết bị hiện tại)
UPDATE public.su_co    s SET don_vi_id_snapshot = public._snapshot_don_vi_from_thiet_bi(s.thiet_bi_id, s.he_thong_id)      WHERE s.don_vi_id_snapshot IS NULL;
UPDATE public.bao_tri  b SET don_vi_id_snapshot = public._snapshot_don_vi_from_thiet_bi(b.thiet_bi_id, b.he_thong_id)      WHERE b.don_vi_id_snapshot IS NULL;
UPDATE public.hong_hoc h SET don_vi_id_snapshot = public._snapshot_don_vi_from_thiet_bi(h.thiet_bi_hong_id, NULL)          WHERE h.don_vi_id_snapshot IS NULL;
UPDATE public.ban_giao g SET don_vi_id_snapshot = public._snapshot_don_vi_from_thiet_bi(g.thiet_bi_id, g.he_thong_id)      WHERE g.don_vi_id_snapshot IS NULL;

-- 5) RLS: thêm fallback theo snapshot đơn vị (giữ current-asset HOẶC snapshot)
DROP POLICY IF EXISTS su_co_select ON public.su_co;
CREATE POLICY su_co_select ON public.su_co FOR SELECT
USING (
  is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR (thiet_bi_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_id, auth.uid()))
    OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(auth.uid()))
  )
);

DROP POLICY IF EXISTS bao_tri_select ON public.bao_tri;
CREATE POLICY bao_tri_select ON public.bao_tri FOR SELECT
USING (
  is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR (thiet_bi_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_id, auth.uid()))
    OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(auth.uid()))
  )
);

DROP POLICY IF EXISTS hong_hoc_select ON public.hong_hoc;
CREATE POLICY hong_hoc_select ON public.hong_hoc FOR SELECT
USING (
  is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR (thiet_bi_hong_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_hong_id, auth.uid()))
    OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(auth.uid()))
  )
);

DROP POLICY IF EXISTS ban_giao_select ON public.ban_giao;
CREATE POLICY ban_giao_select ON public.ban_giao FOR SELECT
USING (
  is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR (thiet_bi_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_id, auth.uid()))
    OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(auth.uid()))
  )
);