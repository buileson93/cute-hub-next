-- Thêm cột lưu trữ % hoàn thiện để query nhanh (denormalization for dashboard)
ALTER TABLE public.thiet_bi ADD COLUMN IF NOT EXISTS completeness_pct integer DEFAULT 0;
ALTER TABLE public.he_thong ADD COLUMN IF NOT EXISTS completeness_pct integer DEFAULT 0;

-- Function để tính độ hoàn thiện (logic đồng bộ với frontend completeness.ts)
CREATE OR REPLACE FUNCTION public.calculate_completeness(p_entity text, p_row jsonb)
RETURNS integer AS $$
DECLARE
  v_fields text[];
  v_filled_count integer := 0;
  v_field text;
BEGIN
  IF p_entity = 'thiet_bi' THEN
    v_fields := ARRAY['ten_thiet_bi', 'ma_serial', 'model_id', 'trang_thai_id', 'he_thong_id', 'don_vi_id'];
  ELSIF p_entity = 'he_thong' THEN
    v_fields := ARRAY['ten_he_thong', 'ma_he_thong', 'loai_he_thong_id', 'don_vi_id', 'nhom_he_thong_id'];
  ELSE
    RETURN 0;
  END IF;

  FOREACH v_field IN ARRAY v_fields LOOP
    IF (p_row->>v_field) IS NOT NULL AND (p_row->>v_field) != '' THEN
      v_filled_count := v_filled_count + 1;
    END IF;
  END LOOP;

  RETURN ROUND((v_filled_count::float / array_length(v_fields, 1)::float) * 100);
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger tự động cập nhật completeness_pct
CREATE OR REPLACE FUNCTION public.trg_update_completeness()
RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'thiet_bi' THEN
    NEW.completeness_pct := public.calculate_completeness('thiet_bi', to_jsonb(NEW));
  ELSIF TG_TABLE_NAME = 'he_thong' THEN
    NEW.completeness_pct := public.calculate_completeness('he_thong', to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_thiet_bi_completeness ON public.thiet_bi;
CREATE TRIGGER trg_thiet_bi_completeness
  BEFORE INSERT OR UPDATE ON public.thiet_bi
  FOR EACH ROW EXECUTE FUNCTION public.trg_update_completeness();

DROP TRIGGER IF EXISTS trg_he_thong_completeness ON public.he_thong;
CREATE TRIGGER trg_he_thong_completeness
  BEFORE INSERT OR UPDATE ON public.he_thong
  FOR EACH ROW EXECUTE FUNCTION public.trg_update_completeness();

-- Cập nhật dữ liệu hiện tại
UPDATE public.thiet_bi SET completeness_pct = public.calculate_completeness('thiet_bi', to_jsonb(public.thiet_bi));
UPDATE public.he_thong SET completeness_pct = public.calculate_completeness('he_thong', to_jsonb(public.he_thong));

-- RPC lấy thống kê tổng hợp cho Dashboard
CREATE OR REPLACE FUNCTION public.get_completeness_stats()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'avg_thiet_bi', ROUND(AVG(completeness_pct)),
    'avg_he_thong', (SELECT ROUND(AVG(completeness_pct)) FROM public.he_thong),
    'total_tb', COUNT(*),
    'low_pct_tb', COUNT(*) FILTER (WHERE completeness_pct < 50),
    'perfect_tb', COUNT(*) FILTER (WHERE completeness_pct = 100),
    'total_tasks', (SELECT COUNT(*) FROM public.nhiem_vu_nhap_lieu WHERE trang_thai = 'moi'),
    'top_contributors', (
      SELECT jsonb_agg(sub) FROM (
        SELECT user_id, SUM(diem) as total_diem 
        FROM public.dong_gop_diem 
        GROUP BY user_id 
        ORDER BY total_diem DESC 
        LIMIT 5
      ) sub
    )
  ) INTO v_result
  FROM public.thiet_bi;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_completeness_stats() TO authenticated;
