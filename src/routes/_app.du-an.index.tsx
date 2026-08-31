import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Search, FolderKanban, Calendar, User as UserIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/du-an/")({
  head: () => ({
    meta: [
      { title: "Dự án & Tiến độ — MIRATS" },
      {
        name: "description",
        content:
          "Quản lý dự án theo mốc công việc, phân công tổ trưởng và theo dõi tiến độ Gantt/Kanban.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DuAnListPage,
});

const TRANG_THAI: Record<string, { label: string; tone: string }> = {
  moi: { label: "Mới", tone: "bg-muted text-slate-700 border-border" },
  dang_thuc_hien: { label: "Đang thực hiện", tone: "bg-sky-100 text-sky-700 border-sky-200" },
  tam_dung: { label: "Tạm dừng", tone: "bg-amber-100 text-amber-700 border-amber-200" },
  hoan_thanh: { label: "Hoàn thành", tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  huy: { label: "Huỷ", tone: "bg-rose-100 text-rose-700 border-rose-200" },
};

type DuAn = {
  id: string;
  ma: string | null;
  ten: string;
  mo_ta: string | null;
  don_vi_id: string | null;
  nguoi_tao_id: string;
  quan_ly_id: string;
  ngay_bat_dau: string | null;
  ngay_ket_thuc_du_kien: string | null;
  trang_thai: string;
  tien_do: number;
  created_at: string;
};

function DuAnListPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { session, hasRole } = useSession();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_desc" | "ten_asc" | "tien_do_desc" | "han_asc">(
    "created_desc",
  );
  const [openCreate, setOpenCreate] = useState(false);

  const canCreate = hasRole("admin") || hasRole("quan_ly_du_an");

  const {
    data: duAns,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["du-an-list"],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("du_an")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      return (data ?? []) as DuAn[];
    },
    enabled: !!session,
  });

  const { data: donVis } = useQuery({
    queryKey: ["dm-don-vi"],
    queryFn: async () => {
      const { data } = await supabase.from("dm_don_vi").select("id, ten").order("thu_tu");
      return data ?? [];
    },
  });
  const donViMap = useMemo(
    () => Object.fromEntries((donVis ?? []).map((d) => [d.id, d.ten])),
    [donVis],
  );

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let list = duAns ?? [];
    if (kw) {
      list = list.filter((d) => [d.ten, d.ma, d.mo_ta].some((v) => v?.toLowerCase().includes(kw)));
    }
    if (status !== "all") list = list.filter((d) => d.trang_thai === status);
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "ten_asc":
          return a.ten.localeCompare(b.ten, "vi");
        case "tien_do_desc":
          return b.tien_do - a.tien_do;
        case "han_asc":
          return (a.ngay_ket_thuc_du_kien ?? "9999").localeCompare(
            b.ngay_ket_thuc_du_kien ?? "9999",
          );
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });
    return sorted;
  }, [duAns, q, status, sortBy]);

  const isFiltering = !!q.trim() || status !== "all";

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-indigo-600" /> Dự án & Tiến độ
                </CardTitle>
                <CardDescription>
                  Người quản lý tạo dự án và các mốc công việc chính. Tổ trưởng bổ sung công việc
                  con và cập nhật tiến độ.
                </CardDescription>
              </div>
              {canCreate && (
                <Button onClick={() => setOpenCreate(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Tạo dự án
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search
                  className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm dự án…"
                  aria-label="Tìm dự án"
                  className="pl-9"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[170px]" aria-label="Lọc theo trạng thái">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.entries(TRANG_THAI).map(([v, t]) => (
                    <SelectItem key={v} value={v}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[180px]" aria-label="Sắp xếp">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">Mới tạo trước</SelectItem>
                  <SelectItem value="ten_asc">Tên A→Z</SelectItem>
                  <SelectItem value="tien_do_desc">Tiến độ cao trước</SelectItem>
                  <SelectItem value="han_asc">Hạn gần nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center gap-2 p-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang tải…
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center text-sm space-y-3">
              <div className="text-destructive">
                Không tải được danh sách dự án: {(error as Error).message}
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              {isFiltering
                ? "Không có dự án khớp bộ lọc. Thử xoá từ khoá hoặc chọn lại trạng thái."
                : `Chưa có dự án nào. ${canCreate ? "Nhấn “Tạo dự án” để bắt đầu." : ""}`}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((d) => {
              const tt = TRANG_THAI[d.trang_thai] ?? TRANG_THAI.moi;
              return (
                <div
                  key={d.id}
                  onClick={() =>
                    nav({
                      to: "/du-an/$id",
                      params: { id: d.id },
                      search: { view: "kanban", q: "" } as any,
                    })
                  }
                  className="block cursor-pointer"
                >
                  <Card className="hover:shadow-md hover:border-indigo-300 transition h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-tight">{d.ten}</CardTitle>
                        <Badge variant="outline" className={cn(tt.tone, "shrink-0")}>
                          {tt.label}
                        </Badge>
                      </div>
                      {d.ma && <div className="text-[11px] font-mono text-slate-400">{d.ma}</div>}
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {d.mo_ta && <p className="text-xs text-muted-foreground line-clamp-2">{d.mo_ta}</p>}
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {d.ngay_bat_dau ?? "—"} → {d.ngay_ket_thuc_du_kien ?? "—"}
                        </span>
                      </div>
                      {d.don_vi_id && (
                        <div className="text-[11px] text-muted-foreground">
                          Đơn vị: {donViMap[d.don_vi_id] ?? "—"}
                        </div>
                      )}
                      <div className="pt-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                          <span>Tiến độ</span>
                          <span>{d.tien_do}%</span>
                        </div>
                        <Progress value={d.tien_do} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateDuAnDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        donVis={donVis ?? []}
        onDone={(newId) => {
          qc.invalidateQueries({ queryKey: ["du-an-list"] });
          nav({
            to: "/du-an/$id",
            params: { id: newId },
            search: { view: "kanban", q: "" } as any,
          });
        }}
      />
    </>
  );
}

function CreateDuAnDialog({
  open,
  onOpenChange,
  donVis,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  donVis: { id: string; ten: string }[];
  onDone: (newId: string) => void;
}) {
  const { session } = useSession();
  const [form, setForm] = useState({
    ma: "",
    ten: "",
    mo_ta: "",
    don_vi_id: "",
    ngay_bat_dau: "",
    ngay_ket_thuc_du_kien: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error("Chưa đăng nhập");
      if (!form.ten.trim()) throw new Error("Cần nhập tên dự án");
      if (
        form.ngay_bat_dau &&
        form.ngay_ket_thuc_du_kien &&
        form.ngay_ket_thuc_du_kien < form.ngay_bat_dau
      ) {
        throw new Error("Ngày kết thúc dự kiến phải sau ngày bắt đầu");
      }
      const payload = {
        ma: form.ma.trim() || null,
        ten: form.ten.trim(),
        mo_ta: form.mo_ta.trim() || null,
        don_vi_id: form.don_vi_id || null,
        ngay_bat_dau: form.ngay_bat_dau || null,
        ngay_ket_thuc_du_kien: form.ngay_ket_thuc_du_kien || null,
        nguoi_tao_id: session.user.id,
        quan_ly_id: session.user.id,
      };
      const { data, error } = await supabase.from("du_an").insert(payload).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (created) => {
      toast.success("Đã tạo dự án thành công");
      onOpenChange(false);
      setForm({
        ma: "",
        ten: "",
        mo_ta: "",
        don_vi_id: "",
        ngay_bat_dau: "",
        ngay_ket_thuc_du_kien: "",
      });
      onDone(created.id as string);
    },
    onError: (e: Error) => toast.error("Tạo dự án thất bại: " + e.message),

  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo dự án mới</DialogTitle>
          <DialogDescription>Bạn tự động trở thành người quản lý dự án.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-3">
            <div>
              <Label>Mã dự án</Label>
              <Input
                value={form.ma}
                onChange={(e) => setForm({ ...form, ma: e.target.value })}
                placeholder="VD: DA-2026-01"
              />
            </div>
            <div className="col-span-2">
              <Label>Tên dự án *</Label>
              <Input value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea
              rows={2}
              value={form.mo_ta}
              onChange={(e) => setForm({ ...form, mo_ta: e.target.value })}
            />
          </div>
          <div>
            <Label>Đơn vị</Label>
            <Combobox
              value={form.don_vi_id || ""}
              onChange={(v) => setForm({ ...form, don_vi_id: v })}
              placeholder="— chọn —"
              searchPlaceholder="Tìm đơn vị…"
              options={donVis.map((d) => ({ value: d.id, label: d.ten }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Bắt đầu</Label>
              <Input
                type="date"
                value={form.ngay_bat_dau}
                onChange={(e) => setForm({ ...form, ngay_bat_dau: e.target.value })}
              />
            </div>
            <div>
              <Label>Kết thúc dự kiến</Label>
              <Input
                type="date"
                value={form.ngay_ket_thuc_du_kien}
                onChange={(e) => setForm({ ...form, ngay_ket_thuc_du_kien: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Tạo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
