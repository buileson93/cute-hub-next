
-- ============= ENUMS =============
CREATE TYPE public.ticket_loai AS ENUM ('cap_tai_khoan','doi_quyen','reset_mat_khau','bao_loi','khac');
CREATE TYPE public.ticket_trang_thai AS ENUM ('moi','dang_xu_ly','cho_phan_hoi','hoan_thanh','tu_choi','dong');
CREATE TYPE public.ticket_uu_tien AS ENUM ('thap','trung_binh','cao','khan');
CREATE TYPE public.notification_loai AS ENUM ('ticket_moi','ticket_cap_nhat','ticket_binh_luan','tin_nhan_moi','he_thong');

-- ============= TICKETS =============
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loai public.ticket_loai NOT NULL DEFAULT 'khac',
  tieu_de text NOT NULL,
  mo_ta text,
  trang_thai public.ticket_trang_thai NOT NULL DEFAULT 'moi',
  uu_tien public.ticket_uu_tien NOT NULL DEFAULT 'trung_binh',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  don_vi text,
  ket_qua text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE INDEX idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX idx_tickets_trang_thai ON public.tickets(trang_thai);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_select_own_or_admin" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "tickets_insert_self" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "tickets_update_own_or_admin" ON public.tickets
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "tickets_delete_admin" ON public.tickets
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= TICKET COMMENTS =============
CREATE TABLE public.ticket_comment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  noi_dung text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ticket_comment_ticket ON public.ticket_comment(ticket_id, created_at);

GRANT SELECT, INSERT, DELETE ON public.ticket_comment TO authenticated;
GRANT ALL ON public.ticket_comment TO service_role;
ALTER TABLE public.ticket_comment ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_ticket(_ticket_id uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = _ticket_id
      AND (t.created_by = _user OR t.assigned_to = _user OR public.has_role(_user, 'admin'::app_role))
  )
$$;

CREATE POLICY "tc_select" ON public.ticket_comment
  FOR SELECT TO authenticated
  USING (public.can_access_ticket(ticket_id, auth.uid()));

CREATE POLICY "tc_insert" ON public.ticket_comment
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_access_ticket(ticket_id, auth.uid()));

CREATE POLICY "tc_delete_own_or_admin" ON public.ticket_comment
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- ============= NOTIFICATIONS =============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loai public.notification_loai NOT NULL,
  tieu_de text NOT NULL,
  noi_dung text,
  link text,
  ref_type text,
  ref_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============= CONVERSATIONS / MESSAGES =============
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'dm', -- 'dm' | 'group'
  ten text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_participant (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT to_timestamp(0),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX idx_cp_user ON public.conversation_participant(user_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  noi_dung text,
  file_path text,
  file_name text,
  file_size integer,
  file_mime text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participant TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.conversations, public.conversation_participant, public.messages TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conv_participant(_conv uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participant WHERE conversation_id = _conv AND user_id = _user)
$$;

CREATE POLICY "conv_select_participant" ON public.conversations
  FOR SELECT TO authenticated
  USING (public.is_conv_participant(id, auth.uid()));
CREATE POLICY "conv_insert_self" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "conv_update_creator" ON public.conversations
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_conv_participant(id, auth.uid()));

CREATE POLICY "cp_select_own_convs" ON public.conversation_participant
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_conv_participant(conversation_id, auth.uid()));
CREATE POLICY "cp_insert_self_or_creator" ON public.conversation_participant
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
  );
CREATE POLICY "cp_update_own" ON public.conversation_participant
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "cp_delete_own" ON public.conversation_participant
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "msg_select_participant" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conv_participant(conversation_id, auth.uid()));
CREATE POLICY "msg_insert_participant" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conv_participant(conversation_id, auth.uid()));
CREATE POLICY "msg_delete_own" ON public.messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- ============= TRIGGERS: auto-notify =============

-- Ticket new -> notify admins
CREATE OR REPLACE FUNCTION public.notify_ticket_new()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
  SELECT ur.user_id, 'ticket_moi', 'Ticket mới: ' || NEW.tieu_de, COALESCE(NEW.mo_ta,''), '/tickets/' || NEW.id::text, 'ticket', NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin' AND ur.user_id <> NEW.created_by;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_ticket_new AFTER INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_new();

-- Ticket update (status/assign) -> notify creator + assignee
CREATE OR REPLACE FUNCTION public.notify_ticket_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor uuid := auth.uid();
BEGIN
  IF NEW.trang_thai IS DISTINCT FROM OLD.trang_thai OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
    SELECT u, 'ticket_cap_nhat', 'Ticket cập nhật: ' || NEW.tieu_de,
           'Trạng thái: ' || NEW.trang_thai::text, '/tickets/' || NEW.id::text, 'ticket', NEW.id
    FROM (SELECT unnest(ARRAY[NEW.created_by, NEW.assigned_to]) AS u) x
    WHERE x.u IS NOT NULL AND x.u <> COALESCE(v_actor, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_ticket_update AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_update();

-- Ticket comment -> notify other participants
CREATE OR REPLACE FUNCTION public.notify_ticket_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ticket public.tickets;
BEGIN
  SELECT * INTO v_ticket FROM public.tickets WHERE id = NEW.ticket_id;
  INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
  SELECT u, 'ticket_binh_luan', 'Bình luận mới: ' || v_ticket.tieu_de, left(NEW.noi_dung, 200),
         '/tickets/' || v_ticket.id::text, 'ticket', v_ticket.id
  FROM (SELECT unnest(ARRAY[v_ticket.created_by, v_ticket.assigned_to]) AS u) x
  WHERE x.u IS NOT NULL AND x.u <> NEW.user_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_ticket_comment AFTER INSERT ON public.ticket_comment
  FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_comment();

-- Message -> notify other conversation participants
CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sender_name text;
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  SELECT COALESCE(ho_ten, email) INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
  SELECT cp.user_id, 'tin_nhan_moi', COALESCE(v_sender_name, 'Tin nhắn mới'),
         COALESCE(left(NEW.noi_dung, 200), CASE WHEN NEW.file_name IS NOT NULL THEN '[Tệp] ' || NEW.file_name ELSE '' END),
         '/messages/' || NEW.conversation_id::text, 'message', NEW.id
  FROM public.conversation_participant cp
  WHERE cp.conversation_id = NEW.conversation_id AND cp.user_id <> NEW.sender_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_message();

-- ============= REALTIME =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_comment;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
