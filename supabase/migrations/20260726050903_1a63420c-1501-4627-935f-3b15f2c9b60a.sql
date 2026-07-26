
-- 1) form_check_item: thêm metadata chỉ số
ALTER TABLE public.form_check_item
  ADD COLUMN IF NOT EXISTS metric_key text,
  ADD COLUMN IF NOT EXISTS nguong_min numeric,
  ADD COLUMN IF NOT EXISTS nguong_max numeric,
  ADD COLUMN IF NOT EXISTS nguong_op  text,
  ADD COLUMN IF NOT EXISTS chu_ky     text;

CREATE INDEX IF NOT EXISTS idx_form_check_item_metric_key
  ON public.form_check_item(metric_key) WHERE metric_key IS NOT NULL;

-- 2) form_submission_item_result: thêm cột phân tích
ALTER TABLE public.form_submission_item_result
  ADD COLUMN IF NOT EXISTS metric_key    text,
  ADD COLUMN IF NOT EXISTS nguong_min    numeric,
  ADD COLUMN IF NOT EXISTS nguong_max    numeric,
  ADD COLUMN IF NOT EXISTS nguong_op     text,
  ADD COLUMN IF NOT EXISTS thanh_phan_id uuid,
  ADD COLUMN IF NOT EXISTS thiet_bi_id   uuid,
  ADD COLUMN IF NOT EXISTS he_thong_id   uuid,
  ADD COLUMN IF NOT EXISTS don_vi_id     uuid,
  ADD COLUMN IF NOT EXISTS submitted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS auto_ket_qua  boolean NOT NULL DEFAULT false;

-- FKs (không CASCADE nặng)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fsir_thanh_phan_fk') THEN
    ALTER TABLE public.form_submission_item_result
      ADD CONSTRAINT fsir_thanh_phan_fk FOREIGN KEY (thanh_phan_id)
      REFERENCES public.he_thong_thanh_phan(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fsir_thiet_bi_fk') THEN
    ALTER TABLE public.form_submission_item_result
      ADD CONSTRAINT fsir_thiet_bi_fk FOREIGN KEY (thiet_bi_id)
      REFERENCES public.thiet_bi(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fsir_he_thong_fk') THEN
    ALTER TABLE public.form_submission_item_result
      ADD CONSTRAINT fsir_he_thong_fk FOREIGN KEY (he_thong_id)
      REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_fsir_metric_time
  ON public.form_submission_item_result(metric_key, submitted_at DESC)
  WHERE metric_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fsir_thanh_phan_metric
  ON public.form_submission_item_result(thanh_phan_id, metric_key)
  WHERE thanh_phan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fsir_he_thong_metric
  ON public.form_submission_item_result(he_thong_id, metric_key)
  WHERE he_thong_id IS NOT NULL;

-- 3) Trigger enrich BEFORE INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.fsir_enrich()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.form_check_item%ROWTYPE;
  v_sub  public.form_submission%ROWTYPE;
  v_op   text;
  v_ok   boolean;
BEGIN
  -- Lấy metadata từ form_check_item (theo template + item_code)
  SELECT fci.* INTO v_item
  FROM public.form_check_item fci
  JOIN public.form_submission s ON s.id = NEW.submission_id
  WHERE fci.template_id = s.template_id AND fci.item_code = NEW.item_code
  LIMIT 1;

  IF FOUND THEN
    NEW.metric_key := COALESCE(NEW.metric_key, v_item.metric_key);
    NEW.nguong_min := COALESCE(NEW.nguong_min, v_item.nguong_min);
    NEW.nguong_max := COALESCE(NEW.nguong_max, v_item.nguong_max);
    NEW.nguong_op  := COALESCE(NEW.nguong_op,  v_item.nguong_op);
    NEW.don_vi     := COALESCE(NEW.don_vi,     v_item.don_vi);
    NEW.tieu_chuan := COALESCE(NEW.tieu_chuan, v_item.tieu_chuan);
  END IF;

  -- Kế thừa liên kết từ submission
  SELECT * INTO v_sub FROM public.form_submission WHERE id = NEW.submission_id;
  IF FOUND THEN
    NEW.thiet_bi_id  := COALESCE(NEW.thiet_bi_id,  v_sub.thiet_bi_id);
    NEW.he_thong_id  := COALESCE(NEW.he_thong_id,  v_sub.he_thong_id);
    NEW.don_vi_id    := COALESCE(NEW.don_vi_id,    v_sub.don_vi_id);
    NEW.submitted_at := COALESCE(NEW.submitted_at, v_sub.submitted_at, v_sub.created_at);
  END IF;

  -- Tự chấm Đạt/Không đạt nếu có giá trị số + ngưỡng và chưa có ket_qua
  IF NEW.ket_qua IS NULL
     AND NEW.result_kind = 'so'
     AND NEW.gia_tri_so IS NOT NULL
     AND (NEW.nguong_min IS NOT NULL OR NEW.nguong_max IS NOT NULL) THEN
    v_op := COALESCE(NEW.nguong_op, 'between');
    v_ok := CASE v_op
      WHEN 'ge' THEN NEW.nguong_min IS NULL OR NEW.gia_tri_so >= NEW.nguong_min
      WHEN 'le' THEN NEW.nguong_max IS NULL OR NEW.gia_tri_so <= NEW.nguong_max
      WHEN 'eq' THEN NEW.nguong_min IS NOT NULL AND NEW.gia_tri_so = NEW.nguong_min
      ELSE (NEW.nguong_min IS NULL OR NEW.gia_tri_so >= NEW.nguong_min)
       AND (NEW.nguong_max IS NULL OR NEW.gia_tri_so <= NEW.nguong_max)
    END;
    NEW.ket_qua := CASE WHEN v_ok THEN 'dat'::form_ket_qua ELSE 'khong_dat'::form_ket_qua END;
    NEW.auto_ket_qua := true;
  END IF;

  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_fsir_enrich ON public.form_submission_item_result;
CREATE TRIGGER trg_fsir_enrich
  BEFORE INSERT OR UPDATE ON public.form_submission_item_result
  FOR EACH ROW EXECUTE FUNCTION public.fsir_enrich();

-- 4) View chuỗi thời gian chỉ số
CREATE OR REPLACE VIEW public.v_metric_timeseries AS
SELECT
  r.id,
  r.submission_id,
  r.metric_key,
  r.section_code,
  r.item_code,
  r.ten,
  r.result_kind,
  r.gia_tri_so,
  r.gia_tri_text,
  r.don_vi,
  r.tieu_chuan,
  r.nguong_min,
  r.nguong_max,
  r.nguong_op,
  r.ket_qua,
  r.auto_ket_qua,
  r.thanh_phan_id,
  r.thiet_bi_id,
  r.he_thong_id,
  r.don_vi_id,
  COALESCE(r.submitted_at, r.created_at) AS thoi_diem,
  s.template_code,
  s.template_version,
  s.status
FROM public.form_submission_item_result r
JOIN public.form_submission s ON s.id = r.submission_id
WHERE r.metric_key IS NOT NULL;

GRANT SELECT ON public.v_metric_timeseries TO authenticated;

-- 5) RPC tóm tắt chỉ số
CREATE OR REPLACE FUNCTION public.metric_summary(
  _metric_key text,
  _from timestamptz DEFAULT NULL,
  _to   timestamptz DEFAULT NULL,
  _he_thong_id uuid DEFAULT NULL
)
RETURNS TABLE(
  n_samples   bigint,
  n_dat       bigint,
  n_khong_dat bigint,
  pct_dat     numeric,
  gt_min      numeric,
  gt_max      numeric,
  gt_avg      numeric,
  gt_p95      numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE ket_qua = 'dat')::bigint,
    COUNT(*) FILTER (WHERE ket_qua = 'khong_dat')::bigint,
    ROUND(100.0 * COUNT(*) FILTER (WHERE ket_qua = 'dat')
      / NULLIF(COUNT(*) FILTER (WHERE ket_qua IN ('dat','khong_dat')), 0), 2),
    MIN(gia_tri_so),
    MAX(gia_tri_so),
    ROUND(AVG(gia_tri_so)::numeric, 4),
    percentile_cont(0.95) WITHIN GROUP (ORDER BY gia_tri_so)::numeric
  FROM public.v_metric_timeseries
  WHERE metric_key = _metric_key
    AND (_from IS NULL OR thoi_diem >= _from)
    AND (_to   IS NULL OR thoi_diem <= _to)
    AND (_he_thong_id IS NULL OR he_thong_id = _he_thong_id);
$$;

GRANT EXECUTE ON FUNCTION public.metric_summary(text, timestamptz, timestamptz, uuid) TO authenticated;

-- 6) Backfill nhẹ (không đụng chạm dữ liệu lịch sử nặng)
UPDATE public.form_submission_item_result r
SET submitted_at = COALESCE(s.submitted_at, s.created_at),
    he_thong_id  = COALESCE(r.he_thong_id, s.he_thong_id),
    thiet_bi_id  = COALESCE(r.thiet_bi_id, s.thiet_bi_id),
    don_vi_id    = COALESCE(r.don_vi_id, s.don_vi_id)
FROM public.form_submission s
WHERE s.id = r.submission_id
  AND r.submitted_at IS NULL;
