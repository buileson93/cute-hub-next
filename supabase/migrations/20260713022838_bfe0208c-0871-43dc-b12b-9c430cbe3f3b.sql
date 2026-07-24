
-- ============================================================================
-- Record-book identity SNAPSHOT (mã, tên, hệ thống, đơn vị, vị trí)
-- Client KHÔNG được sửa snapshot (khoá bằng trigger: chỉ điền khi đang trống).
-- ============================================================================

-- 1) Add snapshot columns -----------------------------------------------------
ALTER TABLE public.su_co
  ADD COLUMN IF NOT EXISTS snapshot_ma_thiet_bi  text,
  ADD COLUMN IF NOT EXISTS snapshot_ten_thiet_bi text,
  ADD COLUMN IF NOT EXISTS snapshot_he_thong     text,
  ADD COLUMN IF NOT EXISTS snapshot_don_vi       text,
  ADD COLUMN IF NOT EXISTS snapshot_vi_tri       text;

ALTER TABLE public.bao_tri
  ADD COLUMN IF NOT EXISTS snapshot_ma_thiet_bi  text,
  ADD COLUMN IF NOT EXISTS snapshot_ten_thiet_bi text,
  ADD COLUMN IF NOT EXISTS snapshot_he_thong     text,
  ADD COLUMN IF NOT EXISTS snapshot_don_vi       text,
  ADD COLUMN IF NOT EXISTS snapshot_vi_tri       text;

ALTER TABLE public.hong_hoc
  ADD COLUMN IF NOT EXISTS snapshot_ma_thiet_bi  text,
  ADD COLUMN IF NOT EXISTS snapshot_ten_thiet_bi text,
  ADD COLUMN IF NOT EXISTS snapshot_he_thong     text,
  ADD COLUMN IF NOT EXISTS snapshot_don_vi       text,
  ADD COLUMN IF NOT EXISTS snapshot_vi_tri       text;

ALTER TABLE public.ban_giao
  ADD COLUMN IF NOT EXISTS snapshot_ma_thiet_bi  text,
  ADD COLUMN IF NOT EXISTS snapshot_ten_thiet_bi text,
  ADD COLUMN IF NOT EXISTS snapshot_he_thong     text,
  ADD COLUMN IF NOT EXISTS snapshot_don_vi       text,
  ADD COLUMN IF NOT EXISTS snapshot_vi_tri       text;

-- 2) Shared lookup helper -----------------------------------------------------
CREATE OR REPLACE FUNCTION public._mirats_dev_snapshot(_id uuid, _ma text)
RETURNS TABLE(ma text, ten text, he_thong text, don_vi text, vi_tri text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT tb.ma_thiet_bi,
         tb.ten_thiet_bi,
         ht.ten,
         dv.ten,
         COALESCE(NULLIF(tb.vi_tri, ''), vt.ten)
  FROM public.thiet_bi tb
  LEFT JOIN public.dm_he_thong ht ON ht.id = tb.he_thong_id
  LEFT JOIN public.dm_don_vi   dv ON dv.id = COALESCE(tb.don_vi_id, tb.don_vi_quan_ly_id)
  LEFT JOIN public.dm_vi_tri   vt ON vt.id = tb.vi_tri_id
  WHERE (_id IS NOT NULL AND tb.id = _id)
     OR (_id IS NULL AND _ma IS NOT NULL AND tb.ma_thiet_bi = _ma)
  LIMIT 1
$$;

-- 3a) Trigger fn for su_co / bao_tri / ban_giao (keyed by thiet_bi[_id]) ------
CREATE OR REPLACE FUNCTION public._mirats_snap_tb()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE s record;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.snapshot_ma_thiet_bi  IS NOT NULL THEN NEW.snapshot_ma_thiet_bi  := OLD.snapshot_ma_thiet_bi;  END IF;
    IF OLD.snapshot_ten_thiet_bi IS NOT NULL THEN NEW.snapshot_ten_thiet_bi := OLD.snapshot_ten_thiet_bi; END IF;
    IF OLD.snapshot_he_thong     IS NOT NULL THEN NEW.snapshot_he_thong     := OLD.snapshot_he_thong;     END IF;
    IF OLD.snapshot_don_vi       IS NOT NULL THEN NEW.snapshot_don_vi       := OLD.snapshot_don_vi;       END IF;
    IF OLD.snapshot_vi_tri       IS NOT NULL THEN NEW.snapshot_vi_tri       := OLD.snapshot_vi_tri;       END IF;
  END IF;

  IF NEW.snapshot_ma_thiet_bi IS NULL OR NEW.snapshot_ten_thiet_bi IS NULL
     OR NEW.snapshot_he_thong IS NULL OR NEW.snapshot_don_vi IS NULL OR NEW.snapshot_vi_tri IS NULL THEN
    SELECT * INTO s FROM public._mirats_dev_snapshot(NEW.thiet_bi_id, NEW.thiet_bi);
    NEW.snapshot_ma_thiet_bi  := COALESCE(NEW.snapshot_ma_thiet_bi,  s.ma, NEW.thiet_bi);
    NEW.snapshot_ten_thiet_bi := COALESCE(NEW.snapshot_ten_thiet_bi, s.ten);
    NEW.snapshot_he_thong     := COALESCE(NEW.snapshot_he_thong,     s.he_thong);
    NEW.snapshot_don_vi       := COALESCE(NEW.snapshot_don_vi,       s.don_vi);
    NEW.snapshot_vi_tri       := COALESCE(NEW.snapshot_vi_tri,       s.vi_tri);
  END IF;
  RETURN NEW;
END $$;

-- 3b) Trigger fn for hong_hoc (keyed by thiet_bi_hong[_id]) ------------------
CREATE OR REPLACE FUNCTION public._mirats_snap_hong_hoc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE s record;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.snapshot_ma_thiet_bi  IS NOT NULL THEN NEW.snapshot_ma_thiet_bi  := OLD.snapshot_ma_thiet_bi;  END IF;
    IF OLD.snapshot_ten_thiet_bi IS NOT NULL THEN NEW.snapshot_ten_thiet_bi := OLD.snapshot_ten_thiet_bi; END IF;
    IF OLD.snapshot_he_thong     IS NOT NULL THEN NEW.snapshot_he_thong     := OLD.snapshot_he_thong;     END IF;
    IF OLD.snapshot_don_vi       IS NOT NULL THEN NEW.snapshot_don_vi       := OLD.snapshot_don_vi;       END IF;
    IF OLD.snapshot_vi_tri       IS NOT NULL THEN NEW.snapshot_vi_tri       := OLD.snapshot_vi_tri;       END IF;
  END IF;

  IF NEW.snapshot_ma_thiet_bi IS NULL OR NEW.snapshot_ten_thiet_bi IS NULL
     OR NEW.snapshot_he_thong IS NULL OR NEW.snapshot_don_vi IS NULL OR NEW.snapshot_vi_tri IS NULL THEN
    SELECT * INTO s FROM public._mirats_dev_snapshot(NEW.thiet_bi_hong_id, NEW.thiet_bi_hong);
    NEW.snapshot_ma_thiet_bi  := COALESCE(NEW.snapshot_ma_thiet_bi,  s.ma, NEW.thiet_bi_hong);
    NEW.snapshot_ten_thiet_bi := COALESCE(NEW.snapshot_ten_thiet_bi, s.ten);
    NEW.snapshot_he_thong     := COALESCE(NEW.snapshot_he_thong,     s.he_thong);
    NEW.snapshot_don_vi       := COALESCE(NEW.snapshot_don_vi,       s.don_vi);
    NEW.snapshot_vi_tri       := COALESCE(NEW.snapshot_vi_tri,       s.vi_tri);
  END IF;
  RETURN NEW;
END $$;

-- 4) Attach triggers ---------------------------------------------------------
DROP TRIGGER IF EXISTS trg_snap_su_co   ON public.su_co;
CREATE TRIGGER trg_snap_su_co   BEFORE INSERT OR UPDATE ON public.su_co
  FOR EACH ROW EXECUTE FUNCTION public._mirats_snap_tb();

DROP TRIGGER IF EXISTS trg_snap_bao_tri ON public.bao_tri;
CREATE TRIGGER trg_snap_bao_tri BEFORE INSERT OR UPDATE ON public.bao_tri
  FOR EACH ROW EXECUTE FUNCTION public._mirats_snap_tb();

DROP TRIGGER IF EXISTS trg_snap_ban_giao ON public.ban_giao;
CREATE TRIGGER trg_snap_ban_giao BEFORE INSERT OR UPDATE ON public.ban_giao
  FOR EACH ROW EXECUTE FUNCTION public._mirats_snap_tb();

DROP TRIGGER IF EXISTS trg_snap_hong_hoc ON public.hong_hoc;
CREATE TRIGGER trg_snap_hong_hoc BEFORE INSERT OR UPDATE ON public.hong_hoc
  FOR EACH ROW EXECUTE FUNCTION public._mirats_snap_hong_hoc();

-- 5) Backfill existing rows (correlated subqueries; fill-if-null) -------------
UPDATE public.su_co r SET
  snapshot_ma_thiet_bi  = COALESCE(r.snapshot_ma_thiet_bi,  (SELECT ma       FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi)), r.thiet_bi),
  snapshot_ten_thiet_bi = COALESCE(r.snapshot_ten_thiet_bi, (SELECT ten      FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi))),
  snapshot_he_thong     = COALESCE(r.snapshot_he_thong,     (SELECT he_thong FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi)), r.he_thong),
  snapshot_don_vi       = COALESCE(r.snapshot_don_vi,       (SELECT don_vi   FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi)), r.don_vi),
  snapshot_vi_tri       = COALESCE(r.snapshot_vi_tri,       (SELECT vi_tri   FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi)))
WHERE r.snapshot_ma_thiet_bi IS NULL OR r.snapshot_ten_thiet_bi IS NULL
   OR r.snapshot_he_thong IS NULL OR r.snapshot_don_vi IS NULL OR r.snapshot_vi_tri IS NULL;

UPDATE public.bao_tri r SET
  snapshot_ma_thiet_bi  = COALESCE(r.snapshot_ma_thiet_bi,  (SELECT ma       FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi)), r.thiet_bi),
  snapshot_ten_thiet_bi = COALESCE(r.snapshot_ten_thiet_bi, (SELECT ten      FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi))),
  snapshot_he_thong     = COALESCE(r.snapshot_he_thong,     (SELECT he_thong FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi)), r.he_thong),
  snapshot_don_vi       = COALESCE(r.snapshot_don_vi,       (SELECT don_vi   FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi)), r.don_vi),
  snapshot_vi_tri       = COALESCE(r.snapshot_vi_tri,       (SELECT vi_tri   FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi)))
WHERE r.snapshot_ma_thiet_bi IS NULL OR r.snapshot_ten_thiet_bi IS NULL
   OR r.snapshot_he_thong IS NULL OR r.snapshot_don_vi IS NULL OR r.snapshot_vi_tri IS NULL;

UPDATE public.ban_giao r SET
  snapshot_ma_thiet_bi  = COALESCE(r.snapshot_ma_thiet_bi,  (SELECT ma       FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi)), r.thiet_bi),
  snapshot_ten_thiet_bi = COALESCE(r.snapshot_ten_thiet_bi, (SELECT ten      FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi))),
  snapshot_he_thong     = COALESCE(r.snapshot_he_thong,     (SELECT he_thong FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi))),
  snapshot_don_vi       = COALESCE(r.snapshot_don_vi,       (SELECT don_vi   FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi))),
  snapshot_vi_tri       = COALESCE(r.snapshot_vi_tri,       (SELECT vi_tri   FROM public._mirats_dev_snapshot(r.thiet_bi_id, r.thiet_bi)))
WHERE r.snapshot_ma_thiet_bi IS NULL OR r.snapshot_ten_thiet_bi IS NULL
   OR r.snapshot_he_thong IS NULL OR r.snapshot_don_vi IS NULL OR r.snapshot_vi_tri IS NULL;

UPDATE public.hong_hoc r SET
  snapshot_ma_thiet_bi  = COALESCE(r.snapshot_ma_thiet_bi,  (SELECT ma       FROM public._mirats_dev_snapshot(r.thiet_bi_hong_id, r.thiet_bi_hong)), r.thiet_bi_hong),
  snapshot_ten_thiet_bi = COALESCE(r.snapshot_ten_thiet_bi, (SELECT ten      FROM public._mirats_dev_snapshot(r.thiet_bi_hong_id, r.thiet_bi_hong))),
  snapshot_he_thong     = COALESCE(r.snapshot_he_thong,     (SELECT he_thong FROM public._mirats_dev_snapshot(r.thiet_bi_hong_id, r.thiet_bi_hong))),
  snapshot_don_vi       = COALESCE(r.snapshot_don_vi,       (SELECT don_vi   FROM public._mirats_dev_snapshot(r.thiet_bi_hong_id, r.thiet_bi_hong))),
  snapshot_vi_tri       = COALESCE(r.snapshot_vi_tri,       (SELECT vi_tri   FROM public._mirats_dev_snapshot(r.thiet_bi_hong_id, r.thiet_bi_hong)))
WHERE r.snapshot_ma_thiet_bi IS NULL OR r.snapshot_ten_thiet_bi IS NULL
   OR r.snapshot_he_thong IS NULL OR r.snapshot_don_vi IS NULL OR r.snapshot_vi_tri IS NULL;
