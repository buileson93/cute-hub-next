
-- ============================================================================
-- Task 46: Unified search index for global ⌘K search
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.search_index (
  loai       text NOT NULL,           -- 'thiet_bi' | 'su_co' | 'van_de' | ...
  id         text NOT NULL,           -- id của thực thể gốc (uuid hoặc slug tĩnh)
  ma         text,                    -- mã (ma_thiet_bi, ma_su_co, ...) — dùng để boost
  tieu_de    text NOT NULL,
  noi_dung   text,
  route      text NOT NULL,           -- đường dẫn điều hướng
  tsv        tsvector,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (loai, id)
);

CREATE INDEX IF NOT EXISTS search_index_tsv_idx    ON public.search_index USING GIN (tsv);
CREATE INDEX IF NOT EXISTS search_index_ma_trgm    ON public.search_index USING GIN (public.f_unaccent(coalesce(ma,'')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS search_index_tieude_trgm ON public.search_index USING GIN (public.f_unaccent(tieu_de) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS search_index_loai_idx   ON public.search_index (loai);

GRANT SELECT ON public.search_index TO authenticated;
GRANT ALL    ON public.search_index TO service_role;

ALTER TABLE public.search_index ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read search_index" ON public.search_index;
CREATE POLICY "auth read search_index" ON public.search_index
  FOR SELECT TO authenticated USING (true);

-- Helper: build tsvector từ tiêu đề (weight A) + nội dung (weight B)
CREATE OR REPLACE FUNCTION public._search_tsv(_tieu_de text, _noi_dung text)
RETURNS tsvector
LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path = public, pg_catalog
AS $$
  SELECT setweight(to_tsvector('simple', public.f_unaccent(coalesce(_tieu_de,''))), 'A')
      || setweight(to_tsvector('simple', public.f_unaccent(coalesce(_noi_dung,''))), 'B');
$$;

-- Trigger chung: đọc TG_ARGV[0] = loai + template route, tự extract cột theo bảng
CREATE OR REPLACE FUNCTION public.sync_search_index()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loai text := TG_ARGV[0];
  v_id   text;
  v_ma   text;
  v_tieu text;
  v_noi  text;
  v_route text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.search_index WHERE loai = v_loai AND id = OLD.id::text;
    RETURN OLD;
  END IF;

  v_id := NEW.id::text;

  CASE v_loai
    WHEN 'thiet_bi' THEN
      v_ma   := NEW.ma_thiet_bi;
      v_tieu := coalesce(NEW.ten_thiet_bi, NEW.ma_thiet_bi);
      v_noi  := concat_ws(' ', NEW.ma_serial, NEW.model, NEW.nha_san_xuat, NEW.vi_tri, NEW.ghi_chu);
      v_route := '/thiet-bi/' || coalesce(NEW.ma_thiet_bi, v_id);
    WHEN 'su_co' THEN
      v_ma   := NEW.ma_su_co;
      v_tieu := coalesce(NEW.ma_su_co, 'Sự cố');
      v_noi  := concat_ws(' ', NEW.snapshot_ma_thiet_bi, NEW.snapshot_ten_thiet_bi, NEW.ghi_chu_duyet);
      v_route := '/su-co/' || v_id;
    WHEN 'van_de' THEN
      v_ma   := NEW.ma_van_de;
      v_tieu := coalesce(NEW.tieu_de, NEW.ma_van_de);
      v_noi  := NEW.mo_ta;
      v_route := '/van-de/' || v_id;
    WHEN 'cong_viec_bao_tri' THEN
      v_ma   := NEW.ma_cong_viec;
      v_tieu := coalesce(NEW.ma_cong_viec, 'Công việc bảo dưỡng');
      v_noi  := concat_ws(' ', NEW.mo_ta, NEW.ghi_chu);
      v_route := '/bao-duong/cong-viec/' || v_id;
    WHEN 'bao_tri' THEN
      v_ma   := NEW.ma_bao_tri;
      v_tieu := coalesce(NEW.ma_bao_tri, 'Bảo dưỡng');
      v_noi  := concat_ws(' ', NEW.snapshot_ma_thiet_bi, NEW.snapshot_ten_thiet_bi, NEW.mo_ta_cong_viec, NEW.ghi_chu_duyet);
      v_route := '/bao-duong/' || v_id;
    WHEN 'hong_hoc' THEN
      v_ma   := NEW.ma_hong_hoc;
      v_tieu := coalesce(NEW.ma_hong_hoc, 'Hỏng hóc');
      v_noi  := concat_ws(' ', NEW.snapshot_ma_thiet_bi, NEW.snapshot_ten_thiet_bi, NEW.mo_ta_hong_hoc);
      v_route := '/hong-hoc/' || v_id;
    WHEN 'ban_giao' THEN
      v_ma   := NEW.ma_ban_giao;
      v_tieu := coalesce(NEW.ma_ban_giao, 'Bàn giao');
      v_noi  := concat_ws(' ', NEW.snapshot_ma_thiet_bi, NEW.snapshot_ten_thiet_bi, NEW.ghi_chu, NEW.ghi_chu_duyet);
      v_route := '/ban-giao/' || v_id;
    WHEN 'giay_phep_khai_thac' THEN
      v_ma   := NEW.so_san_xuat;
      v_tieu := coalesce(NEW.ten_he_thong_theo_gp, NEW.so_san_xuat, 'Giấy phép');
      v_noi  := NEW.ma_dia_chi;
      v_route := '/giay-phep/' || v_id;
    WHEN 'vat_tu' THEN
      v_ma   := NEW.ma_vat_tu;
      v_tieu := coalesce(NEW.ten, NEW.ma_vat_tu);
      v_noi  := NEW.ghi_chu;
      v_route := '/kho/vat-tu/' || v_id;
    WHEN 'dm_he_thong' THEN
      v_ma   := NEW.so_san_xuat_gp;
      v_tieu := coalesce(NEW.ten, 'Hệ thống');
      v_noi  := concat_ws(' ', NEW.mo_ta, NEW.ten_he_thong_theo_gp, NEW.ma_dia_chi_kt_gp, NEW.ma_tai_san_bravo);
      v_route := '/he-thong/' || v_id;
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv, updated_at)
  VALUES (v_loai, v_id, v_ma, v_tieu, v_noi, v_route,
          public._search_tsv(coalesce(v_ma,'') || ' ' || v_tieu, v_noi), now())
  ON CONFLICT (loai, id) DO UPDATE
    SET ma = EXCLUDED.ma,
        tieu_de = EXCLUDED.tieu_de,
        noi_dung = EXCLUDED.noi_dung,
        route = EXCLUDED.route,
        tsv = EXCLUDED.tsv,
        updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach triggers
DO $$
DECLARE
  r record;
  pairs text[][] := ARRAY[
    ARRAY['thiet_bi','thiet_bi'],
    ARRAY['su_co','su_co'],
    ARRAY['van_de','van_de'],
    ARRAY['cong_viec_bao_tri','cong_viec_bao_tri'],
    ARRAY['bao_tri','bao_tri'],
    ARRAY['hong_hoc','hong_hoc'],
    ARRAY['ban_giao','ban_giao'],
    ARRAY['giay_phep_khai_thac','giay_phep_khai_thac'],
    ARRAY['vat_tu','vat_tu'],
    ARRAY['dm_he_thong','dm_he_thong']
  ];
  tbl text;
  loai text;
BEGIN
  FOR i IN 1 .. array_length(pairs, 1) LOOP
    tbl  := pairs[i][1];
    loai := pairs[i][2];
    EXECUTE format('DROP TRIGGER IF EXISTS trg_search_index_%1$s ON public.%1$I', tbl);
    EXECUTE format('CREATE TRIGGER trg_search_index_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.sync_search_index(%2$L)', tbl, loai);
  END LOOP;
END$$;

-- Backfill helper (rebuild search_index từ đầu)
CREATE OR REPLACE FUNCTION public.rebuild_search_index()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int := 0;
BEGIN
  DELETE FROM public.search_index;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'thiet_bi', t.id::text, t.ma_thiet_bi,
         coalesce(t.ten_thiet_bi, t.ma_thiet_bi),
         concat_ws(' ', t.ma_serial, t.model, t.nha_san_xuat, t.vi_tri, t.ghi_chu),
         '/thiet-bi/' || coalesce(t.ma_thiet_bi, t.id::text),
         public._search_tsv(coalesce(t.ma_thiet_bi,'') || ' ' || coalesce(t.ten_thiet_bi, t.ma_thiet_bi,''),
                            concat_ws(' ', t.ma_serial, t.model, t.nha_san_xuat, t.vi_tri, t.ghi_chu))
  FROM public.thiet_bi t;
  GET DIAGNOSTICS n = ROW_COUNT;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'su_co', s.id::text, s.ma_su_co,
         coalesce(s.ma_su_co,'Sự cố'),
         concat_ws(' ', s.snapshot_ma_thiet_bi, s.snapshot_ten_thiet_bi, s.ghi_chu_duyet),
         '/su-co/' || s.id::text,
         public._search_tsv(coalesce(s.ma_su_co,''), concat_ws(' ', s.snapshot_ma_thiet_bi, s.snapshot_ten_thiet_bi, s.ghi_chu_duyet))
  FROM public.su_co s;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'van_de', v.id::text, v.ma_van_de,
         coalesce(v.tieu_de, v.ma_van_de),
         v.mo_ta,
         '/van-de/' || v.id::text,
         public._search_tsv(coalesce(v.ma_van_de,'') || ' ' || coalesce(v.tieu_de,''), v.mo_ta)
  FROM public.van_de v;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'cong_viec_bao_tri', c.id::text, c.ma_cong_viec,
         coalesce(c.ma_cong_viec,'Công việc bảo dưỡng'),
         concat_ws(' ', c.mo_ta, c.ghi_chu),
         '/bao-duong/cong-viec/' || c.id::text,
         public._search_tsv(coalesce(c.ma_cong_viec,''), concat_ws(' ', c.mo_ta, c.ghi_chu))
  FROM public.cong_viec_bao_tri c;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'bao_tri', b.id::text, b.ma_bao_tri,
         coalesce(b.ma_bao_tri,'Bảo dưỡng'),
         concat_ws(' ', b.snapshot_ma_thiet_bi, b.snapshot_ten_thiet_bi, b.mo_ta_cong_viec, b.ghi_chu_duyet),
         '/bao-duong/' || b.id::text,
         public._search_tsv(coalesce(b.ma_bao_tri,''), concat_ws(' ', b.snapshot_ma_thiet_bi, b.snapshot_ten_thiet_bi, b.mo_ta_cong_viec))
  FROM public.bao_tri b;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'hong_hoc', h.id::text, h.ma_hong_hoc,
         coalesce(h.ma_hong_hoc,'Hỏng hóc'),
         concat_ws(' ', h.snapshot_ma_thiet_bi, h.snapshot_ten_thiet_bi, h.mo_ta_hong_hoc),
         '/hong-hoc/' || h.id::text,
         public._search_tsv(coalesce(h.ma_hong_hoc,''), concat_ws(' ', h.snapshot_ma_thiet_bi, h.snapshot_ten_thiet_bi, h.mo_ta_hong_hoc))
  FROM public.hong_hoc h;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'ban_giao', bg.id::text, bg.ma_ban_giao,
         coalesce(bg.ma_ban_giao,'Bàn giao'),
         concat_ws(' ', bg.snapshot_ma_thiet_bi, bg.snapshot_ten_thiet_bi, bg.ghi_chu),
         '/ban-giao/' || bg.id::text,
         public._search_tsv(coalesce(bg.ma_ban_giao,''), concat_ws(' ', bg.snapshot_ma_thiet_bi, bg.snapshot_ten_thiet_bi, bg.ghi_chu))
  FROM public.ban_giao bg;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'giay_phep_khai_thac', g.id::text, g.so_san_xuat,
         coalesce(g.ten_he_thong_theo_gp, g.so_san_xuat, 'Giấy phép'),
         g.ma_dia_chi,
         '/giay-phep/' || g.id::text,
         public._search_tsv(coalesce(g.so_san_xuat,'') || ' ' || coalesce(g.ten_he_thong_theo_gp,''), g.ma_dia_chi)
  FROM public.giay_phep_khai_thac g;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'vat_tu', vt.id::text, vt.ma_vat_tu,
         coalesce(vt.ten, vt.ma_vat_tu),
         vt.ghi_chu,
         '/kho/vat-tu/' || vt.id::text,
         public._search_tsv(coalesce(vt.ma_vat_tu,'') || ' ' || coalesce(vt.ten,''), vt.ghi_chu)
  FROM public.vat_tu vt;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'dm_he_thong', d.id::text, d.so_san_xuat_gp,
         coalesce(d.ten,'Hệ thống'),
         concat_ws(' ', d.mo_ta, d.ten_he_thong_theo_gp, d.ma_dia_chi_kt_gp, d.ma_tai_san_bravo),
         '/he-thong/' || d.id::text,
         public._search_tsv(coalesce(d.ten,''), concat_ws(' ', d.mo_ta, d.ten_he_thong_theo_gp, d.ma_dia_chi_kt_gp))
  FROM public.dm_he_thong d;

  -- Nội dung tĩnh website (trang chức năng)
  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv) VALUES
    ('trang','dashboard',      NULL,'Tổng quan','Overview KPI cảnh báo','/', public._search_tsv('Tổng quan Overview','KPI cảnh báo dashboard')),
    ('trang','he-thong',       NULL,'Hệ thống','Cây hệ thống danh sách','/he-thong', public._search_tsv('Hệ thống','cây hệ thống danh sách thiết bị')),
    ('trang','thiet-bi',       NULL,'Thiết bị','Danh sách thiết bị','/thiet-bi', public._search_tsv('Thiết bị danh mục','danh sách thiết bị')),
    ('trang','giay-phep',      NULL,'Giấy phép khai thác','Quản lý giấy phép','/giay-phep', public._search_tsv('Giấy phép khai thác','giấy phép sắp hết hạn')),
    ('trang','bao-duong',      NULL,'Bảo dưỡng','Kế hoạch phiếu bảo dưỡng','/bao-duong', public._search_tsv('Bảo dưỡng','kế hoạch phiếu bảo dưỡng công việc')),
    ('trang','su-co',          NULL,'Sự cố','Danh sách sự cố báo cáo ban đầu','/su-co', public._search_tsv('Sự cố','báo cáo ban đầu sự cố')),
    ('trang','van-de',         NULL,'Vấn đề','Danh sách vấn đề RCA','/van-de', public._search_tsv('Vấn đề','RCA phân tích nguyên nhân')),
    ('trang','kho',            NULL,'Kho','Vật tư giao dịch tồn kho','/kho', public._search_tsv('Kho vật tư','giao dịch tồn kho xuất nhập')),
    ('trang','so-ly-lich',     NULL,'Sổ lý lịch','Lịch sử thiết bị hệ thống','/so-ly-lich', public._search_tsv('Sổ lý lịch','lịch sử thiết bị hệ thống')),
    ('trang','quan-tri',       NULL,'Quản trị','Người dùng phân quyền','/quan-tri', public._search_tsv('Quản trị','người dùng phân quyền vai trò')),
    ('trang','so-do-he-thong', NULL,'Sơ đồ hệ thống','Network overview FigJam','/so-do', public._search_tsv('Sơ đồ hệ thống','network overview figjam mindmap')),
    ('trang','kiem-ke',        NULL,'Kiểm kê','Kiểm kê định kỳ QR','/kiem-ke', public._search_tsv('Kiểm kê','kiểm kê định kỳ mã QR'))
  ON CONFLICT (loai, id) DO UPDATE SET
    tieu_de = EXCLUDED.tieu_de, noi_dung = EXCLUDED.noi_dung, route = EXCLUDED.route, tsv = EXCLUDED.tsv, updated_at = now();

  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rebuild_search_index() TO authenticated;

-- Backfill lần đầu
SELECT public.rebuild_search_index();

-- ============================================================================
-- RPC: tim_kiem_toan_cuc
-- ============================================================================
CREATE OR REPLACE FUNCTION public.tim_kiem_toan_cuc(
  _q text,
  _loai text DEFAULT NULL,
  _gioi_han int DEFAULT 30
)
RETURNS TABLE(
  loai text,
  id text,
  tieu_de text,
  mota_ngan text,
  route text,
  hang real
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_q text := public.f_unaccent(coalesce(_q,''));
  v_clean text;
  v_tsq tsquery;
  v_tokens text[];
BEGIN
  IF length(trim(v_q)) = 0 THEN RETURN; END IF;

  -- Loại ký tự nguy hiểm, chỉ giữ [a-z0-9\s]
  v_clean := lower(regexp_replace(v_q, '[^a-zA-Z0-9\s]', ' ', 'g'));
  v_tokens := regexp_split_to_array(trim(regexp_replace(v_clean, '\s+', ' ', 'g')), ' ');
  IF array_length(v_tokens,1) IS NULL THEN RETURN; END IF;

  BEGIN
    v_tsq := to_tsquery('simple', array_to_string(
      array(SELECT t || ':*' FROM unnest(v_tokens) t WHERE length(t) > 0),
      ' & '
    ));
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;

  RETURN QUERY
  SELECT s.loai, s.id, s.tieu_de,
         left(coalesce(s.noi_dung,''), 160) AS mota_ngan,
         s.route,
         (
           ts_rank(s.tsv, v_tsq)
           + CASE WHEN public.f_unaccent(coalesce(s.ma,'')) ILIKE v_clean || '%' THEN 0.5 ELSE 0 END
           + CASE WHEN public.f_unaccent(s.tieu_de)         ILIKE v_clean || '%' THEN 0.3 ELSE 0 END
           + CASE WHEN s.loai = 'trang' THEN 0.05 ELSE 0 END
         )::real AS hang
  FROM public.search_index s
  WHERE s.tsv @@ v_tsq
    AND (_loai IS NULL OR s.loai = _loai)
  ORDER BY hang DESC, s.tieu_de
  LIMIT least(coalesce(_gioi_han, 30), 100);
END;
$$;

REVOKE ALL ON FUNCTION public.tim_kiem_toan_cuc(text, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tim_kiem_toan_cuc(text, text, int) TO authenticated;
