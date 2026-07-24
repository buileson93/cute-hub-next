
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Immutable unaccent wrapper (unaccent is stable, need immutable for indexes)
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
SET search_path = public, pg_catalog
AS $$ SELECT public.unaccent('public.unaccent', $1) $$;

-- ============ thiet_bi ============
ALTER TABLE public.thiet_bi
  ADD COLUMN IF NOT EXISTS search_text text
    GENERATED ALWAYS AS (
      public.f_unaccent(
        coalesce(ma_thiet_bi,'')||' '||coalesce(ten_thiet_bi,'')||' '||
        coalesce(ma_serial,'')||' '||coalesce(model,'')||' '||
        coalesce(nha_san_xuat,'')||' '||coalesce(nha_cung_cap,'')||' '||
        coalesce(vi_tri,'')||' '||coalesce(ghi_chu,'')
      )
    ) STORED,
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      to_tsvector('simple', public.f_unaccent(
        coalesce(ma_thiet_bi,'')||' '||coalesce(ten_thiet_bi,'')||' '||
        coalesce(ma_serial,'')||' '||coalesce(model,'')||' '||
        coalesce(nha_san_xuat,'')||' '||coalesce(nha_cung_cap,'')||' '||
        coalesce(vi_tri,'')||' '||coalesce(ghi_chu,'')
      ))
    ) STORED;

CREATE INDEX IF NOT EXISTS thiet_bi_search_tsv_idx ON public.thiet_bi USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS thiet_bi_search_trgm_idx ON public.thiet_bi USING GIN (search_text gin_trgm_ops);

-- ============ giay_phep ============
ALTER TABLE public.giay_phep
  ADD COLUMN IF NOT EXISTS search_text text
    GENERATED ALWAYS AS (
      public.f_unaccent(
        coalesce(ma_giay_phep,'')||' '||coalesce(so_giay_phep,'')||' '||coalesce(ghi_chu,'')
      )
    ) STORED,
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      to_tsvector('simple', public.f_unaccent(
        coalesce(ma_giay_phep,'')||' '||coalesce(so_giay_phep,'')||' '||coalesce(ghi_chu,'')
      ))
    ) STORED;

CREATE INDEX IF NOT EXISTS giay_phep_search_tsv_idx ON public.giay_phep USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS giay_phep_search_trgm_idx ON public.giay_phep USING GIN (search_text gin_trgm_ops);

-- ============ form_submission ============
ALTER TABLE public.form_submission
  ADD COLUMN IF NOT EXISTS search_text text
    GENERATED ALWAYS AS (
      public.f_unaccent(
        coalesce(tieu_de,'')||' '||coalesce(template_code,'')||' '||
        coalesce(ky_bao_cao,'')||' '||coalesce(review_note,'')
      )
    ) STORED,
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      to_tsvector('simple', public.f_unaccent(
        coalesce(tieu_de,'')||' '||coalesce(template_code,'')||' '||
        coalesce(ky_bao_cao,'')||' '||coalesce(review_note,'')
      ))
    ) STORED;

CREATE INDEX IF NOT EXISTS form_submission_search_tsv_idx ON public.form_submission USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS form_submission_search_trgm_idx ON public.form_submission USING GIN (search_text gin_trgm_ops);

-- ============ Global search RPC ============
CREATE OR REPLACE FUNCTION public.global_search(_q text, _limit int DEFAULT 20)
RETURNS TABLE(
  entity text,
  id uuid,
  title text,
  subtitle text,
  score real
)
LANGUAGE plpgsql
STABLE SECURITY INVOKER
SET search_path = public
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
           (ts_rank(t.search_tsv, v_tsq) + similarity(t.search_text, v_q))::real AS score
    FROM public.thiet_bi t
    WHERE t.search_tsv @@ v_tsq OR t.search_text % v_q

    UNION ALL
    SELECT 'giay_phep',
           g.id,
           coalesce(g.so_giay_phep, g.ma_giay_phep)::text,
           g.ma_giay_phep::text,
           (ts_rank(g.search_tsv, v_tsq) + similarity(g.search_text, v_q))::real
    FROM public.giay_phep g
    WHERE g.search_tsv @@ v_tsq OR g.search_text % v_q

    UNION ALL
    SELECT 'form_submission',
           f.id,
           coalesce(f.tieu_de, f.template_code)::text,
           f.template_code::text,
           (ts_rank(f.search_tsv, v_tsq) + similarity(f.search_text, v_q))::real
    FROM public.form_submission f
    WHERE f.search_tsv @@ v_tsq OR f.search_text % v_q
  ) s
  ORDER BY s.score DESC
  LIMIT least(coalesce(_limit, 20), 100);
END;
$$;

GRANT EXECUTE ON FUNCTION public.global_search(text, int) TO authenticated;
