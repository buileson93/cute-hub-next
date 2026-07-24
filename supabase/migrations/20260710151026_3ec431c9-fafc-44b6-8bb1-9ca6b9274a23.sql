-- Đồng bộ cột text (cache hiển thị) từ khóa ngoại nhà sản xuất / nhà cung cấp / model.
-- Bảo đảm mọi giao diện cũ đọc cột text (danh sách, tìm kiếm, xuất CSV, AI) luôn khớp
-- với chỉnh sửa mới qua khóa ngoại ở Edit Mode sơ đồ tư duy.
CREATE OR REPLACE FUNCTION public.thiet_bi_sync_ref_text()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.nha_san_xuat_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.nha_san_xuat_id IS DISTINCT FROM OLD.nha_san_xuat_id) THEN
    NEW.nha_san_xuat := (SELECT ten FROM public.dm_nha_san_xuat WHERE id = NEW.nha_san_xuat_id);
  END IF;

  IF NEW.nha_cung_cap_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.nha_cung_cap_id IS DISTINCT FROM OLD.nha_cung_cap_id) THEN
    NEW.nha_cung_cap := (SELECT ten FROM public.dm_nha_cung_cap WHERE id = NEW.nha_cung_cap_id);
  END IF;

  IF NEW.model_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.model_id IS DISTINCT FROM OLD.model_id) THEN
    NEW.model := (SELECT ten FROM public.dm_model WHERE id = NEW.model_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_thiet_bi_sync_ref_text ON public.thiet_bi;
CREATE TRIGGER trg_thiet_bi_sync_ref_text
  BEFORE INSERT OR UPDATE OF nha_san_xuat_id, nha_cung_cap_id, model_id
  ON public.thiet_bi
  FOR EACH ROW
  EXECUTE FUNCTION public.thiet_bi_sync_ref_text();

-- Đồng bộ lại các bản ghi hiện có để xóa 68 dòng lệch + điền tên model.
UPDATE public.thiet_bi t
SET nha_san_xuat = d.ten
FROM public.dm_nha_san_xuat d
WHERE t.nha_san_xuat_id = d.id
  AND COALESCE(t.nha_san_xuat,'') IS DISTINCT FROM COALESCE(d.ten,'');

UPDATE public.thiet_bi t
SET nha_cung_cap = d.ten
FROM public.dm_nha_cung_cap d
WHERE t.nha_cung_cap_id = d.id
  AND COALESCE(t.nha_cung_cap,'') IS DISTINCT FROM COALESCE(d.ten,'');

UPDATE public.thiet_bi t
SET model = m.ten
FROM public.dm_model m
WHERE t.model_id = m.id
  AND COALESCE(t.model,'') IS DISTINCT FROM COALESCE(m.ten,'');