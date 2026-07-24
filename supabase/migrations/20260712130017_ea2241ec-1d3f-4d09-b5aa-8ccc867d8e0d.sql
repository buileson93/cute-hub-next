-- ============================================================================
-- T15 — TOPOLOGY: kết nối giữa các thiết bị là NGUỒN CHUẨN (source-of-truth).
-- Trước T15: sơ đồ (`so_do_he_thong.du_lieu`) chỉ là blob trình bày ReactFlow;
-- cạnh nối chỉ tham chiếu id node, KHÔNG ràng buộc endpoint thật -> không có
-- topology nghiệp vụ. Sau T15: bảng `thiet_bi_ket_noi` giữ kết nối thật với
-- endpoint là thiết bị có FK (không thể tạo kết nối tới endpoint không tồn tại).
-- Sơ đồ vẫn giữ tọa độ/kiểu dáng; xoá node sơ đồ KHÔNG xoá kết nối/thiết bị.
-- ============================================================================

-- 1. Bảng topology: một dòng = một kết nối vật lý/logic giữa hai thiết bị.
CREATE TABLE IF NOT EXISTS public.thiet_bi_ket_noi (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tu_thiet_bi_id      uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  den_thiet_bi_id     uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  tu_cong             text,                       -- cổng/interface đầu nguồn (vd eth0, PORT-1)
  den_cong            text,                       -- cổng/interface đầu đích
  loai                text NOT NULL DEFAULT 'CAP',-- CAP | LOGIC | MACH | KHAC
  ten_mach            text,                       -- tên mạch/circuit (nếu có)
  mo_ta               text,
  don_vi_id_snapshot  uuid,                       -- đóng băng đơn vị lúc tạo (RLS)
  created_by          uuid DEFAULT auth.uid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Chống tự nối chính nó & trùng lặp (cùng cặp cổng + loại).
CREATE UNIQUE INDEX IF NOT EXISTS uq_thiet_bi_ket_noi
  ON public.thiet_bi_ket_noi (
    tu_thiet_bi_id, den_thiet_bi_id,
    COALESCE(tu_cong, ''), COALESCE(den_cong, ''), loai
  );
CREATE INDEX IF NOT EXISTS idx_tbkn_tu  ON public.thiet_bi_ket_noi (tu_thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_tbkn_den ON public.thiet_bi_ket_noi (den_thiet_bi_id);

-- 2. GRANT (Data API không tự cấp quyền cho public schema).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi_ket_noi TO authenticated;
GRANT ALL ON public.thiet_bi_ket_noi TO service_role;

-- 3. Trigger: chặn tự-nối, đóng băng đơn vị snapshot, cập nhật updated_at.
CREATE OR REPLACE FUNCTION public.trg_tbkn_before()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tu_thiet_bi_id = NEW.den_thiet_bi_id THEN
    RAISE EXCEPTION 'Không thể tạo kết nối từ một thiết bị tới chính nó';
  END IF;
  IF NEW.don_vi_id_snapshot IS NULL THEN
    SELECT COALESCE(t.don_vi_quan_ly_id, t.don_vi_id) INTO NEW.don_vi_id_snapshot
    FROM public.thiet_bi t WHERE t.id = NEW.tu_thiet_bi_id;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tbkn_before ON public.thiet_bi_ket_noi;
CREATE TRIGGER tbkn_before
  BEFORE INSERT OR UPDATE ON public.thiet_bi_ket_noi
  FOR EACH ROW EXECUTE FUNCTION public.trg_tbkn_before();

-- 4. Trigger audit: mọi thay đổi topology ghi vào audit_log.
CREATE OR REPLACE FUNCTION public.trg_tbkn_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (
    auth.uid(),
    TG_OP,
    'thiet_bi_ket_noi',
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS tbkn_audit ON public.thiet_bi_ket_noi;
CREATE TRIGGER tbkn_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.thiet_bi_ket_noi
  FOR EACH ROW EXECUTE FUNCTION public.trg_tbkn_audit();

-- 5. RLS: xem theo đơn vị (giống su_co); sửa/xoá cần quyền quản lý thiết bị.
ALTER TABLE public.thiet_bi_ket_noi ENABLE ROW LEVEL SECURITY;

CREATE POLICY tbkn_select ON public.thiet_bi_ket_noi
  FOR SELECT
  USING (
    is_active_user(auth.uid()) AND (
      can_manage_equipment(auth.uid())
      OR can_view_thiet_bi(tu_thiet_bi_id, auth.uid())
      OR can_view_thiet_bi(den_thiet_bi_id, auth.uid())
      OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(auth.uid()))
    )
  );

-- Người dùng active tạo kết nối khi xem được CẢ HAI endpoint (endpoint hợp lệ).
CREATE POLICY tbkn_insert ON public.thiet_bi_ket_noi
  FOR INSERT
  WITH CHECK (
    is_active_user(auth.uid())
    AND can_view_thiet_bi(tu_thiet_bi_id, auth.uid())
    AND can_view_thiet_bi(den_thiet_bi_id, auth.uid())
  );

CREATE POLICY tbkn_write_manager ON public.thiet_bi_ket_noi
  FOR ALL
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

-- 6. Read model hiển thị: gắn mã/tên thiết bị + đơn vị cho UI (tôn trọng RLS).
CREATE OR REPLACE VIEW public.v_thiet_bi_ket_noi
WITH (security_invoker = on) AS
SELECT
  k.id, k.tu_thiet_bi_id, k.den_thiet_bi_id, k.tu_cong, k.den_cong,
  k.loai, k.ten_mach, k.mo_ta, k.don_vi_id_snapshot,
  k.created_by, k.created_at, k.updated_at,
  t1.ma_thiet_bi                         AS tu_ma,
  COALESCE(t1.ten_thiet_bi, t1.ma_thiet_bi) AS tu_ten,
  t2.ma_thiet_bi                         AS den_ma,
  COALESCE(t2.ten_thiet_bi, t2.ma_thiet_bi) AS den_ten,
  dv.ma                                  AS don_vi_ma,
  dv.ten                                 AS don_vi_ten
FROM public.thiet_bi_ket_noi k
JOIN public.thiet_bi t1 ON t1.id = k.tu_thiet_bi_id
JOIN public.thiet_bi t2 ON t2.id = k.den_thiet_bi_id
LEFT JOIN public.dm_don_vi dv ON dv.id = k.don_vi_id_snapshot;

GRANT SELECT ON public.v_thiet_bi_ket_noi TO authenticated, service_role;

-- 7. Adapter: nhập kết nối từ sơ đồ cũ vào topology, BÁO CÁO node/link không ánh xạ.
--    Không sửa/không xoá sơ đồ; chỉ đọc du_lieu và tạo kết nối thật khi 2 đầu là
--    thiết bị có mã hợp lệ. Trả về số đã ánh xạ / không ánh xạ + chi tiết.
CREATE OR REPLACE FUNCTION public.topology_import_tu_so_do(p_so_do_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_data    jsonb;
  v_edge    jsonb;
  v_src_ma  text; v_tgt_ma text;
  v_src_id  uuid; v_tgt_id uuid;
  v_mapped  int := 0; v_unmapped int := 0; v_created int := 0;
  v_details jsonb := '[]'::jsonb;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền nhập topology từ sơ đồ';
  END IF;

  SELECT du_lieu INTO v_data FROM public.so_do_he_thong WHERE id = p_so_do_id;
  IF v_data IS NULL THEN
    RETURN jsonb_build_object('mapped',0,'unmapped',0,'created',0,'details','[]'::jsonb);
  END IF;

  FOR v_edge IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'edges','[]'::jsonb))
  LOOP
    SELECT (n->'data'->>'ref') INTO v_src_ma
      FROM jsonb_array_elements(COALESCE(v_data->'nodes','[]'::jsonb)) n
      WHERE n->>'id' = v_edge->>'source' AND n->'data'->>'kind' = 'thiet_bi' LIMIT 1;
    SELECT (n->'data'->>'ref') INTO v_tgt_ma
      FROM jsonb_array_elements(COALESCE(v_data->'nodes','[]'::jsonb)) n
      WHERE n->>'id' = v_edge->>'target' AND n->'data'->>'kind' = 'thiet_bi' LIMIT 1;

    v_src_id := NULL; v_tgt_id := NULL;
    IF v_src_ma IS NOT NULL THEN SELECT id INTO v_src_id FROM public.thiet_bi WHERE ma_thiet_bi = v_src_ma LIMIT 1; END IF;
    IF v_tgt_ma IS NOT NULL THEN SELECT id INTO v_tgt_id FROM public.thiet_bi WHERE ma_thiet_bi = v_tgt_ma LIMIT 1; END IF;

    IF v_src_id IS NOT NULL AND v_tgt_id IS NOT NULL AND v_src_id <> v_tgt_id THEN
      v_mapped := v_mapped + 1;
      IF NOT EXISTS (
        SELECT 1 FROM public.thiet_bi_ket_noi
        WHERE tu_thiet_bi_id = v_src_id AND den_thiet_bi_id = v_tgt_id AND loai = 'CAP'
          AND COALESCE(tu_cong,'') = '' AND COALESCE(den_cong,'') = ''
      ) THEN
        INSERT INTO public.thiet_bi_ket_noi(tu_thiet_bi_id, den_thiet_bi_id, loai, mo_ta)
        VALUES (v_src_id, v_tgt_id, 'CAP', 'Nhập từ sơ đồ');
        v_created := v_created + 1;
      END IF;
    ELSE
      v_unmapped := v_unmapped + 1;
      v_details := v_details || jsonb_build_object(
        'edge', v_edge->>'id',
        'source', v_edge->>'source',
        'target', v_edge->>'target',
        'ly_do', 'Một hoặc cả hai đầu không phải thiết bị có mã hợp lệ'
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('mapped',v_mapped,'unmapped',v_unmapped,'created',v_created,'details',v_details);
END;
$$;

GRANT EXECUTE ON FUNCTION public.topology_import_tu_so_do(uuid) TO authenticated, service_role;