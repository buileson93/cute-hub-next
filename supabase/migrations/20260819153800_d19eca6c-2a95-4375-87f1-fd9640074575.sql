
-- 1. Thêm idempotency_key cho công văn để tránh trùng lặp khi Extension retry
ALTER TABLE public.du_an_cong_van ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;

-- 2. Thêm cột source và flag ẩn thông tin thiết bị cho sự kiện dự án
ALTER TABLE public.du_an_su_kien ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.du_an_su_kien ADD COLUMN IF NOT EXISTS metadata_hidden boolean DEFAULT false;

-- 3. Đảm bảo bảng liên kết công văn hỗ trợ metadata cho loại liên kết (phản hồi, thay thế, bổ sung)
ALTER TABLE public.du_an_cong_van_lien_ket ADD COLUMN IF NOT EXISTS loai_lien_ket text DEFAULT 'lien_quan';

-- 4. Cập nhật function log sự kiện để xử lý source từ metadata
CREATE OR REPLACE FUNCTION public.fn_log_project_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_project_id uuid;
    v_event_type text;
    v_summary text;
    v_actor_id uuid;
    v_source text;
    v_occurred_at timestamptz;
BEGIN
    -- Xác định project_id và actor
    IF TG_TABLE_NAME = 'du_an' THEN
        v_project_id := NEW.id;
        v_event_type := CASE WHEN TG_OP = 'INSERT' THEN 'project_created' ELSE 'project_updated' END;
        v_summary := 'Dự án ' || NEW.ten || ' ' || (CASE WHEN TG_OP = 'INSERT' THEN 'được tạo' ELSE 'được cập nhật' END);
        v_actor_id := auth.uid();
    ELSIF TG_TABLE_NAME = 'du_an_moc' THEN
        v_project_id := NEW.du_an_id;
        v_event_type := CASE WHEN TG_OP = 'INSERT' THEN 'milestone_created' WHEN TG_OP = 'UPDATE' THEN 'milestone_updated' ELSE 'milestone_deleted' END;
        v_summary := 'Mốc ' || NEW.ten || ' ' || (CASE WHEN TG_OP = 'INSERT' THEN 'được tạo' WHEN TG_OP = 'UPDATE' THEN 'được cập nhật' ELSE 'đã xóa' END);
        v_actor_id := auth.uid();
    ELSIF TG_TABLE_NAME = 'du_an_cong_viec' THEN
        v_project_id := NEW.du_an_id;
        v_event_type := CASE WHEN TG_OP = 'INSERT' THEN 'task_created' ELSE 'task_status_changed' END;
        v_summary := 'Công việc ' || NEW.ten || ' ' || (CASE WHEN TG_OP = 'INSERT' THEN 'được tạo' ELSE 'cập nhật trạng thái: ' || NEW.trang_thai END);
        v_actor_id := auth.uid();
    ELSIF TG_TABLE_NAME = 'du_an_cong_van' THEN
        v_project_id := NEW.du_an_id;
        v_event_type := 'document_uploaded';
        v_summary := 'Công văn ' || NEW.so_cong_van || ' được tải lên';
        v_actor_id := COALESCE(auth.uid(), (NEW.metadata->>'actor_user_id')::uuid);
        v_source := NEW.metadata->>'source';
        v_occurred_at := NEW.ngay_ban_hanh;
    END IF;

    IF v_project_id IS NOT NULL THEN
        INSERT INTO public.du_an_su_kien (
            du_an_id, event_type, entity_type, entity_id, title, summary, actor_id, occurred_at, source, metadata
        ) VALUES (
            v_project_id, v_event_type, TG_TABLE_NAME, 
            CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
            v_summary, v_summary, v_actor_id, 
            COALESCE(v_occurred_at, now()), 
            COALESCE(v_source, 'web'),
            CASE WHEN TG_TABLE_NAME = 'du_an_cong_van' THEN NEW.metadata ELSE NULL END
        );
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- 5. Trigger cho du_an_cong_van nếu chưa có
DROP TRIGGER IF EXISTS trg_log_cong_van_event ON public.du_an_cong_van;
CREATE TRIGGER trg_log_cong_van_event 
AFTER INSERT ON public.du_an_cong_van 
FOR EACH ROW EXECUTE FUNCTION public.fn_log_project_event();
