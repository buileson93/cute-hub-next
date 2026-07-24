-- ============================================================================
-- Task 6 — Cảnh báo hết hạn: tính ngày theo giờ VN + job sinh notification idempotent.
-- ============================================================================

-- 1) View sắp hết hạn: tính số ngày còn lại theo NGÀY LỊCH giờ Asia/Ho_Chi_Minh
--    (thay CURRENT_DATE chạy theo UTC của máy chủ). Giữ security_invoker để tôn trọng RLS.
CREATE OR REPLACE VIEW public.v_sap_het_han
WITH (security_invoker = true) AS
SELECT 'bao_hanh'::text AS loai,
    t.id AS thiet_bi_id,
    COALESCE(t.ten_thiet_bi, t.ma_thiet_bi) AS ten,
    t.han_bao_hanh AS ngay_het_han,
    (t.han_bao_hanh - (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS so_ngay_con_lai
   FROM thiet_bi t
  WHERE t.han_bao_hanh IS NOT NULL
UNION ALL
 SELECT 'giay_phep'::text AS loai,
    v.thiet_bi_id,
    COALESCE(v.so_giay_phep, v.ten_doi_tuong) AS ten,
    v.ngay_het_han,
    (v.ngay_het_han - (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS so_ngay_con_lai
   FROM v_giay_phep v
  WHERE v.ngay_het_han IS NOT NULL AND v.bi_thay_the = false;

-- 2) Bảng log chống trùng notification hết hạn: mỗi (mục + ngưỡng) chỉ báo 1 lần.
CREATE TABLE IF NOT EXISTS public.canh_bao_het_han_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  khoa text NOT NULL,
  loai text NOT NULL,
  thiet_bi_id uuid,
  ngay_het_han date NOT NULL,
  nguong int NOT NULL,
  so_nguoi_nhan int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_canh_bao_het_han_log_khoa
  ON public.canh_bao_het_han_log(khoa);

GRANT SELECT ON public.canh_bao_het_han_log TO authenticated;
GRANT ALL ON public.canh_bao_het_han_log TO service_role;

ALTER TABLE public.canh_bao_het_han_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS canh_bao_log_read ON public.canh_bao_het_han_log;
CREATE POLICY canh_bao_log_read ON public.canh_bao_het_han_log
  FOR SELECT TO authenticated
  USING (public.can_manage_equipment(auth.uid()));
-- Không có policy INSERT/UPDATE/DELETE cho authenticated: chỉ ghi qua RPC (SECURITY DEFINER) / service_role.

-- 3) RPC idempotent: quét view, gán ngưỡng 30/60/90 (giờ VN), ghi log chống trùng
--    và gửi notification cho người quản lý thiết bị (admin + phong_kt đang active).
CREATE OR REPLACE FUNCTION public.sinh_canh_bao_het_han()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today  date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  r        record;
  v_nguong int;
  v_khoa   text;
  v_tao    int := 0;
  v_notif  int := 0;
  v_recips int;
BEGIN
  -- Cho phép cron/service_role (auth.uid() null) hoặc người quản lý thiết bị.
  IF auth.uid() IS NOT NULL AND NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền sinh cảnh báo hết hạn';
  END IF;

  FOR r IN
    SELECT loai, thiet_bi_id, ten, ngay_het_han,
           (ngay_het_han - v_today) AS so_ngay
    FROM public.v_sap_het_han
    WHERE (ngay_het_han - v_today) BETWEEN 0 AND 90
  LOOP
    v_nguong := CASE WHEN r.so_ngay <= 30 THEN 30
                     WHEN r.so_ngay <= 60 THEN 60
                     ELSE 90 END;
    v_khoa := r.loai || '|' || COALESCE(r.thiet_bi_id::text, '-') || '|'
              || to_char(r.ngay_het_han, 'YYYY-MM-DD') || '|' || v_nguong;

    INSERT INTO public.canh_bao_het_han_log(khoa, loai, thiet_bi_id, ngay_het_han, nguong)
    VALUES (v_khoa, r.loai, r.thiet_bi_id, r.ngay_het_han, v_nguong)
    ON CONFLICT (khoa) DO NOTHING;

    IF NOT FOUND THEN
      CONTINUE;  -- đã báo ngưỡng này trước đó → không tạo trùng
    END IF;
    v_tao := v_tao + 1;

    INSERT INTO public.notifications(user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
    SELECT p.id,
           'he_thong'::notification_loai,
           CASE r.loai WHEN 'bao_hanh' THEN 'Sắp hết hạn bảo hành'
                       ELSE 'Sắp hết hạn giấy phép' END,
           COALESCE(r.ten, '(không tên)') || ' còn ' || r.so_ngay
             || ' ngày (hạn ' || to_char(r.ngay_het_han, 'DD/MM/YYYY') || ')',
           '/sap-het-han',
           'sap_het_han',
           r.thiet_bi_id
    FROM public.profiles p
    WHERE p.active = true
      AND public.can_manage_equipment(p.id);
    GET DIAGNOSTICS v_recips = ROW_COUNT;
    v_notif := v_notif + v_recips;

    UPDATE public.canh_bao_het_han_log SET so_nguoi_nhan = v_recips WHERE khoa = v_khoa;
  END LOOP;

  RETURN jsonb_build_object('log_moi', v_tao, 'notification', v_notif,
                            'ngay', to_char(v_today, 'YYYY-MM-DD'));
END $$;

REVOKE ALL ON FUNCTION public.sinh_canh_bao_het_han() FROM public;
GRANT EXECUTE ON FUNCTION public.sinh_canh_bao_het_han() TO authenticated, service_role;