-- Hoàn thành phiếu công việc bảo dưỡng: TẤT CẢ trong MỘT giao dịch.
--  1) Kiểm tra vai trò (can_manage_equipment) + đơn vị (can_view_thiet_bi).
--  2) Chỉ cho chuyển trạng thái MO/DANG_LAM -> HOAN_THANH (chặn hoàn thành lại).
--  3) Đặt ngày hoàn thành = CURRENT_DATE.
--  4) Liên kết biên bản (bao_tri + form_submission), kiểm tra khớp thiết bị.
--  5) Cập nhật kỳ bảo dưỡng kế tiếp của thiết bị theo chu kỳ chính sách.
--  Bất kỳ lỗi nào giữa chừng đều làm ROLLBACK toàn bộ (một lời gọi hàm là nguyên tử).
CREATE OR REPLACE FUNCTION public.hoan_thanh_cong_viec_bao_tri(
  _id uuid,
  _bao_tri_id uuid DEFAULT NULL::uuid,
  _form_submission_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tb uuid;
  v_cs uuid;
  v_tt text;
  v_chu_ky integer;
  v_bt_tb uuid;
BEGIN
  -- (1) Vai trò
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền cập nhật phiếu công việc bảo dưỡng'
      USING ERRCODE = '42501';
  END IF;

  -- (2) Khóa phiếu + lấy trạng thái hiện tại
  SELECT thiet_bi_id, chinh_sach_id, trang_thai
    INTO v_tb, v_cs, v_tt
    FROM public.cong_viec_bao_tri
   WHERE id = _id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu công việc' USING ERRCODE = 'P0002';
  END IF;

  -- Đơn vị: quản lý phải xem được thiết bị của phiếu (nếu phiếu gắn thiết bị)
  IF v_tb IS NOT NULL AND NOT public.can_view_thiet_bi(v_tb, auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền thao tác trên đơn vị của thiết bị này'
      USING ERRCODE = '42501';
  END IF;

  -- (3) Chuyển trạng thái hợp lệ
  IF v_tt NOT IN ('MO', 'DANG_LAM') THEN
    RAISE EXCEPTION 'Phiếu ở trạng thái % không thể hoàn thành', v_tt
      USING ERRCODE = 'P0001';
  END IF;

  -- (4) Liên kết biên bản: bao_tri phải tồn tại & khớp thiết bị của phiếu
  IF _bao_tri_id IS NOT NULL THEN
    SELECT thiet_bi_id INTO v_bt_tb FROM public.bao_tri WHERE id = _bao_tri_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Biên bản bảo dưỡng không tồn tại' USING ERRCODE = 'P0002';
    END IF;
    IF v_tb IS NOT NULL AND v_bt_tb IS NOT NULL AND v_bt_tb <> v_tb THEN
      RAISE EXCEPTION 'Biên bản không thuộc thiết bị của phiếu' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF _form_submission_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.form_submission WHERE id = _form_submission_id) THEN
    RAISE EXCEPTION 'Phiếu biểu mẫu (biên bản) không tồn tại' USING ERRCODE = 'P0002';
  END IF;

  -- Cập nhật phiếu: trạng thái + ngày hoàn thành + liên kết biên bản
  UPDATE public.cong_viec_bao_tri
     SET trang_thai = 'HOAN_THANH',
         ngay_hoan_thanh = CURRENT_DATE,
         bao_tri_id = COALESCE(_bao_tri_id, bao_tri_id)
   WHERE id = _id;

  -- Gắn form_submission vào biên bản bao_tri (nếu có cả hai)
  IF _bao_tri_id IS NOT NULL AND _form_submission_id IS NOT NULL THEN
    UPDATE public.bao_tri
       SET form_submission_id = _form_submission_id
     WHERE id = _bao_tri_id;
  END IF;

  -- (5) Kỳ bảo dưỡng kế tiếp
  SELECT chu_ky_ngay INTO v_chu_ky FROM public.bao_tri_chinh_sach WHERE id = v_cs;

  IF v_tb IS NOT NULL THEN
    UPDATE public.thiet_bi
       SET ngay_bao_tri_gan_nhat = CURRENT_DATE,
           ngay_bao_tri_ke_tiep = CASE
             WHEN v_chu_ky IS NOT NULL AND v_chu_ky > 0
             THEN CURRENT_DATE + v_chu_ky
             ELSE ngay_bao_tri_ke_tiep END
     WHERE id = v_tb;
  END IF;
END;
$function$;