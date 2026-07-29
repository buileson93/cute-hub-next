import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { LifeBuoy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/backend/client";
import { freshChannel } from "@/lib/realtime/channel";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TicketIcon, User as UserIcon, Clock } from "lucide-react";
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

type TicketRow = {
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
};

export const Route = createFileRoute("/_app/tickets")({
  component: TicketsPage,
});

function TicketsPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [tab, setTab] = useState<"all" | "cua_toi" | "duoc_giao">("all");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as TicketRow[]));

    const ch = freshChannel("tickets-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
        supabase
          .from("tickets")
          .select("*")
          .order("created_at", { ascending: false })
          .then(({ data }) => setRows((data ?? []) as TicketRow[]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  const filtered = rows.filter((r) => {
    if (tab === "cua_toi") return r.created_by === user?.id;
    if (tab === "duoc_giao") return r.assigned_to === user?.id;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <PageHeader
        icon={LifeBuoy}
        title="Yêu cầu hỗ trợ"
        help="Gửi và theo dõi yêu cầu (cấp tài khoản, đổi quyền, báo lỗi…)"
        actions={
          <NewTicketDialog
            open={open}
            onOpenChange={setOpen}
            onCreated={(id) => navigate({ to: `/tickets/${id}` as never })}
          />
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">Tất cả ({rows.length})</TabsTrigger>
          <TabsTrigger value="cua_toi">
            Của tôi ({rows.filter((r) => r.created_by === user?.id).length})
          </TabsTrigger>
          <TabsTrigger value="duoc_giao">
            Được giao ({rows.filter((r) => r.assigned_to === user?.id).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <TicketIcon className="h-10 w-10 text-muted-foreground/40" />
            <div className="text-sm text-muted-foreground">Chưa có yêu cầu nào</div>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Tạo yêu cầu đầu tiên
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/tickets/${t.id}` as never}
                  className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-secondary/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TicketIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold">{t.tieu_de}</div>
                      <Badge variant="outline" className={cn("text-[10px]", TRANG_THAI_COLOR[t.trang_thai])}>
                        {TICKET_TRANG_THAI[t.trang_thai]}
                      </Badge>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          UU_TIEN_COLOR[t.uu_tien],
                        )}
                      >
                        {TICKET_UU_TIEN[t.uu_tien]}
                      </span>
                    </div>
                    {t.mo_ta && (
                      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{t.mo_ta}</div>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        {TICKET_LOAI[t.loai]}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(t.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NewTicketDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const { user } = useSession();
  const [loai, setLoai] = useState<keyof typeof TICKET_LOAI>("cap_tai_khoan");
  const [uu_tien, setUuTien] = useState<keyof typeof TICKET_UU_TIEN>("trung_binh");
  const [tieu_de, setTieuDe] = useState("");
  const [mo_ta, setMoTa] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!user) return;
    const t = tieu_de.trim();
    if (!t) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }
    if (t.length > 200) {
      toast.error("Tiêu đề tối đa 200 ký tự");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("tickets")
      .insert({ loai, uu_tien, tieu_de: t, mo_ta: mo_ta.trim() || null, created_by: user.id })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast.error("Không tạo được yêu cầu", { description: error.message });
      return;
    }
    toast.success("Đã gửi yêu cầu");
    onOpenChange(false);
    setTieuDe("");
    setMoTa("");
    onCreated((data as { id: string }).id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1.5 h-4 w-4" /> Yêu cầu mới
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Loại yêu cầu</label>
              <Select value={loai} onValueChange={(v) => setLoai(v as typeof loai)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TICKET_LOAI).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Mức ưu tiên</label>
              <Select value={uu_tien} onValueChange={(v) => setUuTien(v as typeof uu_tien)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TICKET_UU_TIEN).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Tiêu đề</label>
            <Input
              value={tieu_de}
              onChange={(e) => setTieuDe(e.target.value)}
              maxLength={200}
              placeholder="VD: Cấp tài khoản cho nhân viên mới"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Mô tả chi tiết</label>
            <Textarea
              value={mo_ta}
              onChange={(e) => setMoTa(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="Mô tả rõ tình huống, thời gian, người liên quan…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Đang gửi…" : "Gửi yêu cầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
