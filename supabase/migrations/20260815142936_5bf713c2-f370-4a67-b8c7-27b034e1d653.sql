
-- 1. Cập nhật bảng thiet_bi_tep_dinh_kem
ALTER TABLE public.thiet_bi_tep_dinh_kem 
ADD COLUMN IF NOT EXISTS search_tsv tsvector GENERATED ALWAYS AS (
  to_tsvector('simple', public.f_unaccent(coalesce(file_name, '')) || ' ' || public.f_unaccent(coalesce(mo_ta, '')))
) STORED;

CREATE INDEX IF NOT EXISTS idx_thiet_bi_tep_search ON public.thiet_bi_tep_dinh_kem USING gin(search_tsv);

-- 2. Cập nhật bảng model_tai_lieu
ALTER TABLE public.model_tai_lieu
ADD COLUMN IF NOT EXISTS search_tsv tsvector GENERATED ALWAYS AS (
  to_tsvector('simple', public.f_unaccent(coalesce(file_name, '')) || ' ' || public.f_unaccent(coalesce(mo_ta, '')))
) STORED;

CREATE INDEX IF NOT EXISTS idx_model_tai_lieu_search ON public.model_tai_lieu USING gin(search_tsv);

-- 3. Nâng cấp hàm global_search
CREATE OR REPLACE FUNCTION public.global_search(_q text, _limit integer DEFAULT 20) 
RETURNS TABLE(entity text, id uuid, title text, subtitle text, score real)
LANGUAGE plpgsql STABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_q text := public.f_unaccent(coalesce(_q, ''));
  v_tsq tsquery;
BEGIN
  IF length(trim(v_q)) = 0 THEN
    RETURN;
  END IF;

  -- prefix tsquery: split words + :*
  v_tsq := to_tsquery('simple',
    regexp_replace(
      trim(regexp_replace(v_q, '[^a-zA-Z0-9\s]', ' ', 'g')),
      '\s+', ':* & ', 'g'
    ) || ':*'
  );

  RETURN QUERY
  SELECT * FROM (
    SELECT 'thiet_bi'::text,
           t.id,
           coalesce(t.ten_thiet_bi, t.ma_thiet_bi)::text,
           t.ma_thiet_bi::text,
           (ts_rank(t.search_tsv, v_tsq) + similarity(public.f_unaccent(coalesce(t.ten_thiet_bi, '')), v_q) * 0.5)::real AS score
    FROM public.thiet_bi t
    WHERE t.search_tsv @@ v_tsq

    UNION ALL
    SELECT 'giay_phep',
           g.id,
           coalesce(g.so_giay_phep, g.ma_giay_phep)::text,
           g.ma_giay_phep::text,
           (ts_rank(g.search_tsv, v_tsq) + similarity(public.f_unaccent(coalesce(g.so_giay_phep, '')), v_q) * 0.5)::real
    FROM public.giay_phep g
    WHERE g.search_tsv @@ v_tsq

    UNION ALL
    SELECT 'form_submission',
           f.id,
           coalesce(f.tieu_de, f.template_code)::text,
           f.template_code::text,
           (ts_rank(f.search_tsv, v_tsq) + similarity(public.f_unaccent(coalesce(f.tieu_de, '')), v_q) * 0.5)::real
    FROM public.form_submission f
    WHERE f.search_tsv @@ v_tsq

    UNION ALL
    SELECT 'tai_lieu'::text,
           d.id,
           d.file_name::text,
           (SELECT ma_thiet_bi FROM public.thiet_bi WHERE id = d.thiet_bi_id)::text,
           (ts_rank(d.search_tsv, v_tsq) + similarity(public.f_unaccent(coalesce(d.file_name, '')), v_q) * 0.5)::real
    FROM public.thiet_bi_tep_dinh_kem d
    WHERE d.search_tsv @@ v_tsq

    UNION ALL
    SELECT 'tai_lieu'::text,
           mt.id,
           mt.file_name::text,
           (SELECT ten FROM public.dm_model WHERE id = mt.model_id)::text,
           (ts_rank(mt.search_tsv, v_tsq) + similarity(public.f_unaccent(coalesce(mt.file_name, '')), v_q) * 0.5)::real
    FROM public.model_tai_lieu mt
    WHERE mt.search_tsv @@ v_tsq
  ) s
  ORDER BY s.score DESC
  LIMIT least(coalesce(_limit, 20), 100);
END;
$$;
