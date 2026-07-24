-- GIN index cho full-text search Tiếng Việt (unaccent + pg_trgm).

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_index_noi_dung_trgm
  ON public.search_index USING gin (noi_dung gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_ten_trgm
  ON public.thiet_bi USING gin (ten gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_ma_trgm
  ON public.thiet_bi USING gin (ma gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dm_he_thong_ten_trgm
  ON public.dm_he_thong USING gin (ten gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dm_model_ten_trgm
  ON public.dm_model USING gin (ten gin_trgm_ops);
