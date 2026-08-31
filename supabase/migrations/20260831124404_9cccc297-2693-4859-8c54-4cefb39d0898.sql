CREATE OR REPLACE FUNCTION public.fn_log_project_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_project_id uuid;
    v_event_type text;
    v_summary text;
    v_actor_id uuid;
    v_source text;
    v_occurred_at timestamptz;
    v_metadata jsonb;
    v_row jsonb;
BEGIN
    v_row := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;

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
        v_metadata := v_row->'metadata';
        v_actor_id := COALESCE(auth.uid(), NULLIF(v_metadata->>'actor_user_id','')::uuid);
        v_source := v_metadata->>'source';
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
            v_metadata
        );
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;