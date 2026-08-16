import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/backend/client";
import { freshChannel } from "@/lib/realtime/channel";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, User as UserIcon, AlertTriangle, Clock, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { formatDT, timeAgo } from "@/lib/time";
import {
  TICKET_LOAI,
  TICKET_TRANG_THAI,
  TICKET_UU_TIEN,
  TRANG_THAI_COLOR,
  UU_TIEN_COLOR,
} from "@/lib/tickets/labels";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  loai: keyof typeof TICKET_LOAI;
  tieu_de: string;
  mo_ta: string | null;
  trang_thai: keyof typeof TICKET_TRANG_THAI;
  uu_tien: keyof typeof TICKET_UU_TIEN;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  ket_qua: string | null;
  su_co_id: string | null;
  sla_han: string | null;
  first_response_at: string | null;
  closed_at: string | null;
};

type Comment = {
  id: string;
  ticket_id: string;
  user_id: string;
  noi_dung: string;
  created_at: string;
};

type ProfileMini = { id: string; ho_ten: string | null; email: string };

export const Route = createFileRoute("/_app/tickets/$id")({
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { id } = useParams({ from: "/_app/tickets/$id" });
  const { user, hasRole } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileMini>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [suCoMa, setSuCoMa] = useState<string | null>(null);
  const canManage = hasRole("admin") || (ticket && ticket.assigned_to === user?.id);

  async function loadProfiles(userIds: string[]) {
    const missing = userIds.filter((id) => id && !profiles[id]);
    if (missing.length === 0) return;
    const { data } = await supabase.from("profiles").select("id,ho_ten,email").in("id", missing);
    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const p of data as ProfileMini[]) next[p.id] = p;
        return next;
      });
    }
  }

  useEffect(() => {
    supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setTicket(data as Ticket | null);
        if (data) {
          loadProfiles([data.created_by, data.assigned_to].filter(Boolean) as string[]);
          if (data.su_co_id) {
            supabase
              .from("su_co")
              .select("ma_su_co")
              .eq("id", data.su_co_id)
              .maybeSingle()
              .then(({ data: sc }) => setSuCoMa((sc as { ma_su_co: string } | null)?.ma_su_co ?? null));
          }
        }
      });
    supabase
      .from("ticket_comment")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const list = (data ?? []) as Comment[];
        setComments(list);
        loadProfiles(list.map((c) => c.user_id));
      });

    const ch = freshChannel(`ticket:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_comment", filter: `ticket_id=eq.${id}` },
        (payload) => {
          const c = payload.new as Comment;
          setComments((prev) => (prev.find((x) => x.id === c.id) ? prev : [...prev, c]));
          loadProfiles([c.user_id]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tickets", filter: `id=eq.${id}` },
        (payload) => setTicket(payload.new as Ticket),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function send() {
    if (!user || !input.trim()) return;
    setSending(true);
    const { error } = await supabase.from("ticket_comment").insert({
      ticket_id: id,
      user_id: user.id,
      noi_dung: input.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Không gửi được", { description: error.message });
      return;
    }
    setInput("");
  }

  async function updateStatus(trang_thai: keyof typeof TICKET_TRANG_THAI) {
    const { error } = await supabase.from("tickets").update({ trang_thai }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Đã cập nhật trạng thái");
  }

  async function claim() {
    if (!user) return;
    const { error } = await supabase.from("tickets").update({ assigned_to: user.id, trang_thai: "dang_xu_ly" }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Đã nhận xử lý");
  }

  async function promote() {
    setPromoting(true);
    const { data, error } = await supabase.rpc("promote_ticket_to_su_co", { p_ticket_id: id });
    setPromoting(false);
    if (error) {
      toast.error("Không chuyển được", { description: error.message });
      return;
    }
    toast.success("Đã chuyển thành sự cố");
    if (data) {
      setTicket((t) => (t ? { ...t, su_co_id: data as string } : t));
      const { data: sc } = await supabase.from("su_co").select("ma_su_co").eq("id", data as string).maybeSingle();
      setSuCoMa((sc as { ma_su_co: string } | null)?.ma_su_co ?? null);
    }
  }

  if (!ticket) {
    return <div className="p-8 text-sm text-muted-foreground">Đang tải…</div>;
  }

  const creator = profiles[ticket.created_by];
  const assignee = ticket.assigned_to ? profiles[ticket.assigned_to] : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
      </Link>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn(TRANG_THAI_COLOR[ticket.trang_thai])}>
                {TICKET_TRANG_THAI[ticket.trang_thai]}
              </Badge>
              <span className={cn("rounded px-1.5 py-0.5 text-meta font-medium", UU_TIEN_COLOR[ticket.uu_tien])}>
                {TICKET_UU_TIEN[ticket.uu_tien]}
              </span>
              <span className="text-xs text-muted-foreground">{TICKET_LOAI[ticket.loai]}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight">{ticket.tieu_de}</h1>
            {ticket.mo_ta && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{ticket.mo_ta}</p>}
          </div>

          <div className="flex flex-col items-end gap-2">
            {(hasRole("admin") || canManage) && (
              <Select value={ticket.trang_thai} onValueChange={(v) => updateStatus(v as keyof typeof TICKET_TRANG_THAI)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TICKET_TRANG_THAI).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasRole("admin") && !ticket.assigned_to && (
              <Button size="sm" variant="outline" onClick={claim}>
                Nhận xử lý
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
          <div>
            <span className="text-meta uppercase tracking-wide">Người tạo</span>
            <div className="mt-0.5 flex items-center gap-1.5 text-foreground">
              <UserIcon className="h-3 w-3" /> {creator?.ho_ten ?? creator?.email ?? "…"}
            </div>
          </div>
          <div>
            <span className="text-meta uppercase tracking-wide">Người xử lý</span>
            <div className="mt-0.5 text-foreground">{assignee?.ho_ten ?? assignee?.email ?? "Chưa gán"}</div>
          </div>
          <div>
            <span className="text-meta uppercase tracking-wide">Tạo lúc</span>
            <div className="mt-0.5 text-foreground">{formatDT(ticket.created_at)}</div>
          </div>
          {ticket.sla_han && (
            <div>
              <span className="text-meta uppercase tracking-wide">Hạn SLA</span>
              <div
                className={cn(
                  "mt-0.5 flex items-center gap-1",
                  !ticket.closed_at && new Date(ticket.sla_han) < new Date()
                    ? "font-semibold text-destructive"
                    : "text-foreground",
                )}
              >
                <Clock className="h-3 w-3" /> {formatDT(ticket.sla_han)}
                {!ticket.closed_at && new Date(ticket.sla_han) < new Date() && " · Quá hạn"}
              </div>
            </div>
          )}
        </div>

        {/* Escalation → Sự cố */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {ticket.su_co_id ? (
            suCoMa ? (
              <Link
                to="/su-co/$maSuCo"
                params={{ maSuCo: suCoMa }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/70"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Đã liên kết sự cố · Xem chi tiết
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Đã liên kết sự cố
              </span>
            )
          ) : (
            (hasRole("admin") || hasRole("phong_kt")) && (
              <Button size="sm" variant="outline" onClick={promote} disabled={promoting}>
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                {promoting ? "Đang chuyển…" : "Chuyển thành sự cố"}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3 text-sm font-semibold">
          Trao đổi ({comments.length})
        </div>
        <div className="max-h-[500px] space-y-4 overflow-y-auto p-5">
          {comments.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Chưa có bình luận nào. Hãy trao đổi thông tin để xử lý nhanh hơn.
            </div>
          ) : (
            comments.map((c) => {
              const p = profiles[c.user_id];
              const mine = c.user_id === user?.id;
              return (
                <div key={c.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-meta font-semibold",
                      mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
                    )}
                  >
                    {(p?.ho_ten ?? p?.email ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className={cn("min-w-0 max-w-[80%]", mine && "text-right")}>
                    <div className="text-meta text-muted-foreground">
                      {p?.ho_ten ?? p?.email ?? "…"} · {timeAgo(c.created_at)}
                    </div>
                    <div
                      className={cn(
                        "mt-1 inline-block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                        mine ? "bg-primary text-primary-foreground" : "bg-secondary",
                      )}
                    >
                      {c.noi_dung}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Viết bình luận…"
              rows={2}
              maxLength={2000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button onClick={send} disabled={sending || !input.trim()} className="self-end">
              <Send className="mr-1.5 h-3.5 w-3.5" /> Gửi
            </Button>
          </div>
          <div className="mt-1 text-meta text-muted-foreground">Ctrl/⌘ + Enter để gửi nhanh</div>
        </div>
      </div>
    </div>
  );
}
