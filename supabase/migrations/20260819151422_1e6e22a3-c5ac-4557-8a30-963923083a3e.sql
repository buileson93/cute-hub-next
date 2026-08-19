DO $$ BEGIN
    CREATE TYPE public.project_event_type AS ENUM (
      'project_created', 'project_updated',
      'milestone_created', 'milestone_updated', 'milestone_deleted',
      'task_created', 'task_updated', 'task_status_changed', 'task_completed',
      'canvas_published', 'pitch_created',
      'document_uploaded', 'document_linked',
      'delivery_update', 'operations_update'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.du_an_su_kien (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    du_an_id uuid REFERENCES public.du_an(id) ON DELETE CASCADE,
    event_type public.project_event_type NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    title text NOT NULL,
    summary text,
    actor_id uuid REFERENCES auth.users(id),
    occurred_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    source text DEFAULT 'web',
    external_request_id text,
    created_at timestamptz DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_du_an_su_kien_project_date ON public.du_an_su_kien(du_an_id, occurred_at DESC);

-- RLS & Grants
ALTER TABLE public.du_an_su_kien ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.du_an_su_kien TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.du_an_su_kien TO authenticated;
GRANT ALL ON public.du_an_su_kien TO service_role;

-- Policies
CREATE POLICY "Users can view events for projects they have access to"
ON public.du_an_su_kien
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.du_an WHERE id = du_an_su_kien.du_an_id
  )
);

CREATE POLICY "Users can insert events"
ON public.du_an_su_kien
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Event logging function for triggers
CREATE OR REPLACE FUNCTION public.fn_log_project_event()
RETURNS TRIGGER AS $$
DECLARE
    v_du_an_id uuid;
    v_event_type public.project_event_type;
    v_title text;
    v_summary text;
    v_actor_id uuid;
BEGIN
    v_actor_id := auth.uid();
    
    IF TG_TABLE_NAME = 'du_an' THEN
        v_du_an_id := NEW.id;
        IF TG_OP = 'INSERT' THEN
            v_event_type := 'project_created';
            v_title := 'Dự án đã được tạo';
        ELSE
            v_event_type := 'project_updated';
            v_title := 'Thông tin dự án đã cập nhật';
        END IF;
    ELSIF TG_TABLE_NAME = 'du_an_moc' THEN
        v_du_an_id := NEW.du_an_id;
        IF TG_OP = 'INSERT' THEN
            v_event_type := 'milestone_created';
            v_title := 'Mốc dự án mới: ' || NEW.ten;
        ELSIF TG_OP = 'DELETE' THEN
            v_du_an_id := OLD.du_an_id;
            v_event_type := 'milestone_deleted';
            v_title := 'Đã xóa mốc: ' || OLD.ten;
        ELSE
            v_event_type := 'milestone_updated';
            v_title := 'Cập nhật mốc: ' || NEW.ten;
        END IF;
    ELSIF TG_TABLE_NAME = 'du_an_cong_viec' THEN
        v_du_an_id := NEW.du_an_id;
        IF TG_OP = 'INSERT' THEN
            v_event_type := 'task_created';
            v_title := 'Công việc mới: ' || NEW.ten;
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.trang_thai != OLD.trang_thai THEN
                IF NEW.trang_thai = 'hoan_thanh' THEN
                    v_event_type := 'task_completed';
                    v_title := 'Hoàn thành công việc: ' || NEW.ten;
                ELSE
                    v_event_type := 'task_status_changed';
                    v_title := 'Đổi trạng thái công việc: ' || NEW.ten;
                END IF;
            ELSE
                v_event_type := 'task_updated';
                v_title := 'Cập nhật công việc: ' || NEW.ten;
            END IF;
        END IF;
    END IF;

    IF v_event_type IS NOT NULL THEN
        INSERT INTO public.du_an_su_kien (
            du_an_id, event_type, entity_type, entity_id, title, actor_id, source
        ) VALUES (
            v_du_an_id, v_event_type, TG_TABLE_NAME, 
            CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
            v_title, v_actor_id, 'automation'
        );
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trg_log_project_event ON public.du_an;
CREATE TRIGGER trg_log_project_event AFTER INSERT OR UPDATE ON public.du_an FOR EACH ROW EXECUTE FUNCTION public.fn_log_project_event();

DROP TRIGGER IF EXISTS trg_log_milestone_event ON public.du_an_moc;
CREATE TRIGGER trg_log_milestone_event AFTER INSERT OR UPDATE OR DELETE ON public.du_an_moc FOR EACH ROW EXECUTE FUNCTION public.fn_log_project_event();

DROP TRIGGER IF EXISTS trg_log_task_event ON public.du_an_cong_viec;
CREATE TRIGGER trg_log_task_event AFTER INSERT OR UPDATE ON public.du_an_cong_viec FOR EACH ROW EXECUTE FUNCTION public.fn_log_project_event();
