-- Ràng buộc serial thiết bị không được trùng (cho phép để trống/NULL nhiều lần).
-- Dùng trigger thay cho unique index để: dữ liệu trùng cũ vẫn tồn tại (sửa dần),
-- nhưng mọi INSERT/UPDATE serial mới bị chặn nếu trùng với thiết bị khác.

CREATE OR REPLACE FUNCTION public.tb_serial_khong_trung()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_serial text;
  v_trung text;
BEGIN
  -- Chuẩn hoá: trim khoảng trắng; chuỗi rỗng coi như NULL.
  v_serial := NULLIF(btrim(COALESCE(NEW.ma_serial, '')), '');
  NEW.ma_serial := v_serial;

  -- Ô trống thì bỏ qua kiểm tra.
  IF v_serial IS NULL THEN
    RETURN NEW;
  END IF;

  -- Chỉ kiểm tra khi có thay đổi serial (INSERT hoặc UPDATE đổi serial).
  IF TG_OP = 'UPDATE'
     AND NULLIF(btrim(COALESCE(OLD.ma_serial, '')), '') IS NOT DISTINCT FROM v_serial THEN
    RETURN NEW;
  END IF;

  -- So khớp không phân biệt hoa/thường, bỏ khoảng trắng thừa hai đầu.
  SELECT ma_thiet_bi INTO v_trung
  FROM public.thiet_bi
  WHERE id <> NEW.id
    AND lower(btrim(ma_serial)) = lower(v_serial)
  LIMIT 1;

  IF v_trung IS NOT NULL THEN
    RAISE EXCEPTION 'Số serial "%" đã tồn tại ở thiết bị %', v_serial, v_trung
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tb_serial_khong_trung ON public.thiet_bi;
CREATE TRIGGER trg_tb_serial_khong_trung
  BEFORE INSERT OR UPDATE OF ma_serial ON public.thiet_bi
  FOR EACH ROW
  EXECUTE FUNCTION public.tb_serial_khong_trung();