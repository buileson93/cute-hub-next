
-- =====================================================================
-- N6 — Máy trạng thái vòng đời sự cố / hỏng hóc
-- =====================================================================

-- 1) Thêm cột trên su_co + hong_hoc
ALTER TABLE public.su_co
  ADD COLUMN IF NOT EXISTS trang_thai_moi text,
  ADD COLUMN IF NOT EXISTS nguoi_bao_cao_id uuid,
  ADD COLUMN IF NOT EXISTS nguoi_tiep_nhan_id uuid,
  ADD COLUMN IF NOT EXISTS nguoi_xu_ly_chinh_id uuid,
  ADD COLUMN IF NOT EXISTS nguoi_nghiem_thu_id uuid,
  ADD COLUMN IF NOT EXISTS at_bao_cao timestamptz,
  ADD COLUMN IF NOT EXISTS at_tiep_nhan timestamptz,
  ADD COLUMN IF NOT EXISTS at_bat_dau_xu_ly timestamptz,
  ADD COLUMN IF NOT EXISTS at_hoan_thanh timestamptz,
  ADD COLUMN IF NOT EXISTS at_nghiem_thu timestamptz,
  ADD COLUMN IF NOT EXISTS at_huy timestamptz,
  ADD COLUMN IF NOT EXISTS tong_thoi_gian_cho_vat_tu_phut int NOT NULL DEFAULT 0;

ALTER TABLE public.hong_hoc
  ADD COLUMN IF NOT EXISTS trang_thai_moi text,
  ADD COLUMN IF NOT EXISTS nguoi_bao_cao_id uuid,
  ADD COLUMN IF NOT EXISTS nguoi_tiep_nhan_id uuid,
  ADD COLUMN IF NOT EXISTS nguoi_xu_ly_chinh_id uuid,
  ADD COLUMN IF NOT EXISTS nguoi_nghiem_thu_id uuid,
  ADD COLUMN IF NOT EXISTS at_bao_cao timestamptz,
  ADD COLUMN IF NOT EXISTS at_tiep_nhan timestamptz,
  ADD COLUMN IF NOT EXISTS at_bat_dau_xu_ly timestamptz,
  ADD COLUMN IF NOT EXISTS at_hoan_thanh timestamptz,
  ADD COLUMN IF NOT EXISTS at_nghiem_thu timestamptz,
  ADD COLUMN IF NOT EXISTS at_huy timestamptz,
  ADD COLUMN IF NOT EXISTS tong_thoi_gian_cho_vat_tu_phut int NOT NULL DEFAULT 0;

-- 2) Backfill trang_thai_moi từ trang_thai cũ
CREATE OR REPLACE FUNCTION public._n6_normalize(_raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(coalesce(btrim(_raw), ''))
    WHEN '' THEN 'bao_cao'
    WHEN 'moi' THEN 'bao_cao'
    WHEN 'mới' THEN 'bao_cao'
    WHEN 'new' THEN 'bao_cao'
    WHEN 'bao_cao' THEN 'bao_cao'
    WHEN 'tiep_nhan' THEN 'tiep_nhan'
    WHEN 'đã tiếp nhận' THEN 'tiep_nhan'
    WHEN 'dang_xu_ly' THEN 'dang_xu_ly'
    WHEN 'đang xử lý' THEN 'dang_xu_ly'
    WHEN 'in_progress' THEN 'dang_xu_ly'
    WHEN 'cho_vat_tu' THEN 'cho_vat_tu'
    WHEN 'chờ vật tư' THEN 'cho_vat_tu'
    WHEN 'hoan_thanh' THEN 'hoan_thanh'
    WHEN 'hoàn thành xử lý' THEN 'hoan_thanh'
    WHEN 'hoàn thành' THEN 'hoan_thanh'
    WHEN 'da_khac_phuc' THEN 'hoan_thanh'
    WHEN 'đã khắc phục' THEN 'hoan_thanh'
    WHEN 'resolved' THEN 'hoan_thanh'
    WHEN 'nghiem_thu' THEN 'nghiem_thu'
    WHEN 'đã nghiệm thu' THEN 'nghiem_thu'
    WHEN 'dong' THEN 'nghiem_thu'
    WHEN 'đóng' THEN 'nghiem_thu'
    WHEN 'closed' THEN 'nghiem_thu'
    WHEN 'da_dong' THEN 'nghiem_thu'
    WHEN 'huy' THEN 'huy'
    WHEN 'huỷ' THEN 'huy'
    WHEN 'hủy' THEN 'huy'
    WHEN 'cancelled' THEN 'huy'
    ELSE 'bao_cao'
  END;
$$;

UPDATE public.su_co
   SET trang_thai_moi = public._n6_normalize(trang_thai),
       at_bao_cao     = COALESCE(at_bao_cao, ngay_phat_hien, created_at),
       at_hoan_thanh  = COALESCE(at_hoan_thanh, thoi_diem_khac_phuc)
 WHERE trang_thai_moi IS NULL;

UPDATE public.hong_hoc
   SET trang_thai_moi = public._n6_normalize(trang_thai),
       at_bao_cao     = COALESCE(at_bao_cao, created_at),
       at_hoan_thanh  = CASE WHEN ngay_hoan_thanh IS NOT NULL
                              THEN COALESCE(at_hoan_thanh, ngay_hoan_thanh::timestamptz)
                              ELSE at_hoan_thanh END
 WHERE trang_thai_moi IS NULL;

-- Index để lọc theo trạng thái mới
CREATE INDEX IF NOT EXISTS idx_su_co_trang_thai_moi ON public.su_co(trang_thai_moi);
CREATE INDEX IF NOT EXISTS idx_hong_hoc_trang_thai_moi ON public.hong_hoc(trang_thai_moi);

-- 3) Bảng lịch sử chuyển trạng thái (append-only)
CREATE TABLE IF NOT EXISTS public.su_co_lich_su (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doi_tuong_bang text NOT NULL CHECK (doi_tuong_bang IN ('su_co','hong_hoc')),
  doi_tuong_id   uuid NOT NULL,
  buoc           int  NOT NULL,
  tu_trang_thai  text,
  den_trang_thai text NOT NULL,
  nguoi          uuid,
  at             timestamptz NOT NULL DEFAULT now(),
  ghi_chu        text,
  meta           jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (doi_tuong_bang, doi_tuong_id, buoc)
);
CREATE INDEX IF NOT EXISTS idx_su_co_lich_su_obj_at
  ON public.su_co_lich_su (doi_tuong_bang, doi_tuong_id, at DESC);

GRANT SELECT ON public.su_co_lich_su TO authenticated;
GRANT ALL ON public.su_co_lich_su TO service_role;

ALTER TABLE public.su_co_lich_su ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS su_co_lich_su_select ON public.su_co_lich_su;
CREATE POLICY su_co_lich_su_select ON public.su_co_lich_su
  FOR SELECT TO authenticated
  USING (true);   -- đọc rộng; sự cố/hỏng hóc đã có RLS riêng

DROP POLICY IF EXISTS su_co_lich_su_no_write ON public.su_co_lich_su;
CREATE POLICY su_co_lich_su_no_write ON public.su_co_lich_su
  FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

-- 4) Hàm kiểm tra chuyển trạng thái hợp lệ
CREATE OR REPLACE FUNCTION public.su_co_check_transition(_tu text, _den text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _tu IS NULL OR _den IS NULL OR _tu = _den THEN false
    WHEN (_tu,_den) IN (
      ('bao_cao','tiep_nhan'), ('bao_cao','huy'),
      ('tiep_nhan','dang_xu_ly'), ('tiep_nhan','huy'),
      ('dang_xu_ly','cho_vat_tu'), ('dang_xu_ly','hoan_thanh'),
      ('cho_vat_tu','dang_xu_ly'), ('cho_vat_tu','hoan_thanh'),
      ('hoan_thanh','nghiem_thu'), ('hoan_thanh','dang_xu_ly'),
      ('nghiem_thu','dang_xu_ly')
    ) THEN true
    ELSE false
  END;
$$;

GRANT EXECUTE ON FUNCTION public.su_co_check_transition(text,text) TO authenticated, service_role;

-- 5) RPC su_co_transition — chuyển trạng thái theo transaction
CREATE OR REPLACE FUNCTION public.su_co_transition(
  _bang    text,
  _id      uuid,
  _den     text,
  _ghi_chu text DEFAULT NULL,
  _meta    jsonb DEFAULT '{}'::jsonb
)
RETURNS public.su_co_lich_su
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tu           text;
  _uid          uuid := auth.uid();
  _is_admin     boolean;
  _is_phong_kt  boolean;
  _buoc         int;
  _row          public.su_co_lich_su;
  _don_vi_id    uuid;
  _at           timestamptz := now();
  _cho_vat_at   timestamptz;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;
  IF _bang NOT IN ('su_co','hong_hoc') THEN
    RAISE EXCEPTION 'invalid_bang: %', _bang USING ERRCODE = '22023';
  END IF;

  SELECT public.has_role(_uid, 'admin'::app_role),
         public.has_role(_uid, 'phong_kt'::app_role)
    INTO _is_admin, _is_phong_kt;

  IF _bang = 'su_co' THEN
    SELECT s.trang_thai_moi,
           NULLIF(s.don_vi, '')::text
      INTO _tu, _don_vi_id
      FROM public.su_co s
     WHERE s.id = _id
       FOR UPDATE;
  ELSE
    SELECT h.trang_thai_moi, NULL::text
      INTO _tu, _don_vi_id
      FROM public.hong_hoc h
     WHERE h.id = _id
       FOR UPDATE;
  END IF;

  IF _tu IS NULL THEN
    RAISE EXCEPTION 'not_found: % %', _bang, _id USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.su_co_check_transition(_tu, _den) THEN
    RAISE EXCEPTION 'invalid_transition: % -> %', _tu, _den USING ERRCODE = 'P0001';
  END IF;

  -- Guard vai trò theo trạng thái đích
  IF _den IN ('tiep_nhan','dang_xu_ly','cho_vat_tu','hoan_thanh') THEN
    IF NOT (_is_admin OR _is_phong_kt) THEN
      RAISE EXCEPTION 'forbidden: chỉ admin/phong_kt được chuyển sang %', _den USING ERRCODE = '42501';
    END IF;
  ELSIF _den = 'nghiem_thu' THEN
    IF NOT _is_admin AND NOT public.has_role(_uid, 'truong_don_vi'::app_role) THEN
      RAISE EXCEPTION 'forbidden: chỉ admin/truong_don_vi được nghiệm thu' USING ERRCODE = '42501';
    END IF;
    -- Chặn self-approve
    IF _bang = 'su_co' THEN
      PERFORM 1 FROM public.su_co WHERE id = _id AND nguoi_tiep_nhan_id = _uid;
      IF FOUND THEN
        RAISE EXCEPTION 'forbidden_self_approve' USING ERRCODE = '42501';
      END IF;
    ELSE
      PERFORM 1 FROM public.hong_hoc WHERE id = _id AND nguoi_tiep_nhan_id = _uid;
      IF FOUND THEN
        RAISE EXCEPTION 'forbidden_self_approve' USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSIF _den = 'huy' THEN
    IF NOT _is_admin THEN
      -- Người báo cáo được huỷ trong 24h
      IF _bang = 'su_co' THEN
        PERFORM 1 FROM public.su_co
          WHERE id = _id
            AND nguoi_bao_cao_id = _uid
            AND (at_bao_cao IS NULL OR at_bao_cao > now() - interval '24 hours');
      ELSE
        PERFORM 1 FROM public.hong_hoc
          WHERE id = _id
            AND nguoi_bao_cao_id = _uid
            AND (at_bao_cao IS NULL OR at_bao_cao > now() - interval '24 hours');
      END IF;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'forbidden: chỉ admin hoặc người báo cáo (trong 24h) được huỷ' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  -- Cộng dồn thời gian ở cho_vat_tu khi rời trạng thái này
  IF _tu = 'cho_vat_tu' THEN
    IF _bang = 'su_co' THEN
      SELECT COALESCE(
        (SELECT max(at) FROM public.su_co_lich_su
          WHERE doi_tuong_bang='su_co' AND doi_tuong_id=_id AND den_trang_thai='cho_vat_tu'),
        _at) INTO _cho_vat_at;
      UPDATE public.su_co
         SET tong_thoi_gian_cho_vat_tu_phut =
             COALESCE(tong_thoi_gian_cho_vat_tu_phut,0)
             + GREATEST(0, extract(epoch FROM (_at - _cho_vat_at))/60)::int
       WHERE id=_id;
    ELSE
      SELECT COALESCE(
        (SELECT max(at) FROM public.su_co_lich_su
          WHERE doi_tuong_bang='hong_hoc' AND doi_tuong_id=_id AND den_trang_thai='cho_vat_tu'),
        _at) INTO _cho_vat_at;
      UPDATE public.hong_hoc
         SET tong_thoi_gian_cho_vat_tu_phut =
             COALESCE(tong_thoi_gian_cho_vat_tu_phut,0)
             + GREATEST(0, extract(epoch FROM (_at - _cho_vat_at))/60)::int
       WHERE id=_id;
    END IF;
  END IF;

  -- Cập nhật bản ghi gốc: trạng thái, mốc thời gian, người phụ trách
  IF _bang = 'su_co' THEN
    UPDATE public.su_co SET
      trang_thai_moi = _den,
      updated_at     = _at,
      at_tiep_nhan   = CASE WHEN _den='tiep_nhan'   AND at_tiep_nhan   IS NULL THEN _at ELSE at_tiep_nhan   END,
      nguoi_tiep_nhan_id = CASE WHEN _den='tiep_nhan' AND nguoi_tiep_nhan_id IS NULL THEN _uid ELSE nguoi_tiep_nhan_id END,
      at_bat_dau_xu_ly = CASE WHEN _den='dang_xu_ly' AND at_bat_dau_xu_ly IS NULL THEN _at ELSE at_bat_dau_xu_ly END,
      nguoi_xu_ly_chinh_id = CASE WHEN _den='dang_xu_ly' THEN _uid ELSE nguoi_xu_ly_chinh_id END,
      at_hoan_thanh  = CASE WHEN _den='hoan_thanh' THEN _at ELSE at_hoan_thanh END,
      thoi_diem_khac_phuc = CASE WHEN _den='hoan_thanh' AND thoi_diem_khac_phuc IS NULL THEN _at ELSE thoi_diem_khac_phuc END,
      at_nghiem_thu  = CASE WHEN _den='nghiem_thu' THEN _at ELSE at_nghiem_thu END,
      nguoi_nghiem_thu_id = CASE WHEN _den='nghiem_thu' THEN _uid ELSE nguoi_nghiem_thu_id END,
      at_huy         = CASE WHEN _den='huy' THEN _at ELSE at_huy END,
      trang_thai     = CASE
        WHEN _den='bao_cao'    THEN 'Mới'
        WHEN _den='tiep_nhan'  THEN 'Đang xử lý'
        WHEN _den='dang_xu_ly' THEN 'Đang xử lý'
        WHEN _den='cho_vat_tu' THEN 'Đang xử lý'
        WHEN _den='hoan_thanh' THEN 'Đã khắc phục'
        WHEN _den='nghiem_thu' THEN 'Đóng'
        WHEN _den='huy'        THEN 'Đóng'
        ELSE trang_thai END
    WHERE id=_id;
  ELSE
    UPDATE public.hong_hoc SET
      trang_thai_moi = _den,
      updated_at     = _at,
      at_tiep_nhan   = CASE WHEN _den='tiep_nhan'   AND at_tiep_nhan   IS NULL THEN _at ELSE at_tiep_nhan   END,
      nguoi_tiep_nhan_id = CASE WHEN _den='tiep_nhan' AND nguoi_tiep_nhan_id IS NULL THEN _uid ELSE nguoi_tiep_nhan_id END,
      at_bat_dau_xu_ly = CASE WHEN _den='dang_xu_ly' AND at_bat_dau_xu_ly IS NULL THEN _at ELSE at_bat_dau_xu_ly END,
      nguoi_xu_ly_chinh_id = CASE WHEN _den='dang_xu_ly' THEN _uid ELSE nguoi_xu_ly_chinh_id END,
      at_hoan_thanh  = CASE WHEN _den='hoan_thanh' THEN _at ELSE at_hoan_thanh END,
      ngay_hoan_thanh = CASE WHEN _den='hoan_thanh' AND ngay_hoan_thanh IS NULL THEN _at::date ELSE ngay_hoan_thanh END,
      at_nghiem_thu  = CASE WHEN _den='nghiem_thu' THEN _at ELSE at_nghiem_thu END,
      nguoi_nghiem_thu_id = CASE WHEN _den='nghiem_thu' THEN _uid ELSE nguoi_nghiem_thu_id END,
      at_huy         = CASE WHEN _den='huy' THEN _at ELSE at_huy END,
      trang_thai     = CASE
        WHEN _den='hoan_thanh' OR _den='nghiem_thu' THEN 'Hoàn thành'
        WHEN _den='huy' THEN 'Hoàn thành'
        WHEN _den='bao_cao' THEN 'Mới'
        ELSE 'Đang xử lý' END
    WHERE id=_id;
  END IF;

  -- Ghi lịch sử (append-only, bypass RLS vì SECURITY DEFINER)
  SELECT COALESCE(max(buoc),0)+1 INTO _buoc
    FROM public.su_co_lich_su
   WHERE doi_tuong_bang=_bang AND doi_tuong_id=_id;

  INSERT INTO public.su_co_lich_su
    (doi_tuong_bang, doi_tuong_id, buoc, tu_trang_thai, den_trang_thai, nguoi, at, ghi_chu, meta)
  VALUES (_bang, _id, _buoc, _tu, _den, _uid, _at, _ghi_chu, COALESCE(_meta, '{}'::jsonb))
  RETURNING * INTO _row;

  -- Ghi audit_log (best-effort)
  BEGIN
    INSERT INTO public.audit_log (source, action, entity, entity_id, detail)
    VALUES ('n6.su_co.transition', _den, _bang, _id,
            jsonb_build_object('tu', _tu, 'den', _den, 'ghi_chu', _ghi_chu, 'meta', _meta));
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.su_co_transition(text,uuid,text,text,jsonb) TO authenticated, service_role;

-- 6) Seed lịch sử khởi tạo (buoc=1, tu=null, den=trang_thai_moi hiện tại) cho bản ghi cũ chưa có
INSERT INTO public.su_co_lich_su (doi_tuong_bang, doi_tuong_id, buoc, tu_trang_thai, den_trang_thai, nguoi, at, ghi_chu, meta)
SELECT 'su_co', s.id, 1, NULL, s.trang_thai_moi, NULL,
       COALESCE(s.at_bao_cao, s.ngay_phat_hien, s.created_at), 'backfill N6', '{"backfill":true}'::jsonb
  FROM public.su_co s
  LEFT JOIN public.su_co_lich_su l
    ON l.doi_tuong_bang='su_co' AND l.doi_tuong_id=s.id
 WHERE l.id IS NULL AND s.trang_thai_moi IS NOT NULL;

INSERT INTO public.su_co_lich_su (doi_tuong_bang, doi_tuong_id, buoc, tu_trang_thai, den_trang_thai, nguoi, at, ghi_chu, meta)
SELECT 'hong_hoc', h.id, 1, NULL, h.trang_thai_moi, NULL,
       COALESCE(h.at_bao_cao, h.created_at), 'backfill N6', '{"backfill":true}'::jsonb
  FROM public.hong_hoc h
  LEFT JOIN public.su_co_lich_su l
    ON l.doi_tuong_bang='hong_hoc' AND l.doi_tuong_id=h.id
 WHERE l.id IS NULL AND h.trang_thai_moi IS NOT NULL;
