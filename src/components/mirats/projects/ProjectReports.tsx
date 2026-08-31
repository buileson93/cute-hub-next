// ============================================================================
// Báo cáo nghiệm thu dự án — nộp báo cáo, ghi bằng chứng kỹ thuật, lãnh đạo
// phê duyệt / yêu cầu chỉnh sửa kèm ý kiến chỉ đạo.
// Khi duyệt, DB tự đồng bộ công việc liên quan sang hoàn thành 100%.
// ============================================================================
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, FileSignature, Loader2, RotateCcw, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/backend/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type BaoCaoTrangThai = "cho_duyet" | "da_duyet" | "yeu_cau_sua" | "huy";

export type BaoCao = {
  id: string;
  du_an_id: string;
  cong_viec_id: string | null;
  tieu_de: string;
  noi_dung: string | null;
  bang_chung: string | null;
  tep_url: string | null;
  nguoi_nop_id: string;
  trang_thai: BaoCaoTrangThai;
  y_kien_lanh_dao: string | null;
  nguoi_duyet_id: string | null;
  ngay_duyet: string | null;
  created_at: string;
};

export const BAO_CAO_TRANG_THAI: Record<
  BaoCaoTrangThai,
  { label: string; icon: LucideIcon; tone: string }
> = {
  cho_duyet: {
    label: "Chờ duyệt",
    icon: Clock,
    tone: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
  },
  da_duyet: {
    label: "Đã phê duyệt",
    icon: CheckCircle2,
    tone: "border-success/40 bg-success/10 text-success",
  },
  yeu_cau_sua: {
    label: "Yêu cầu chỉnh sửa",
    icon: RotateCcw,
    tone: "border-primary/40 bg-primary/10 text-primary",
  },
  huy: {
    label: "Huỷ bỏ",
    icon: XCircle,
    tone: "border-destructive/40 bg-destructive/10 text-destructive",
  },
};

/** Số báo cáo đang chờ lãnh đạo xử lý — dùng cho badge thông báo. */
export function countPending(reports: readonly Pick<BaoCao, "trang_thai">[]): number {
  return reports.filter((r) => r.trang_thai === "cho_duyet").length;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN");
}

export function ProjectReports({
  duAnId,
  tasks,
  nameOf,
  canManage,
}: {
  duAnId: string;
  tasks: ReadonlyArray<{ id: string; ten: string }>;
  nameOf: (userId: string | null) => string;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [reviewing, setReviewing] = useState<BaoCao | null>(null);

  const {
    data: reports,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["du-an-bao-cao", duAnId],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("du_an_bao_cao")
        .select("*")
        .eq("du_an_id", duAnId)
        .order("created_at", { ascending: false });
      if (err) throw err;
      return (data ?? []) as BaoCao[];
    },
  });

  const taskName = useMemo(
    () => Object.fromEntries(tasks.map((t) => [t.id, t.ten])),
    [tasks],
  ) as Record<string, string | undefined>;

  const pending = countPending(reports ?? []);

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Đang tải báo cáo nghiệm thu">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-sm">
          <p className="text-destructive">
            Không tải được danh sách báo cáo: {(error as Error).message}
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {reports?.length ?? 0} báo cáo
          {pending > 0 ? (
            <Badge
              variant="outline"
              className={cn("ml-2", BAO_CAO_TRANG_THAI.cho_duyet.tone)}
              aria-label={`${pending} báo cáo đang chờ duyệt`}
            >
              {pending} chờ duyệt
            </Badge>
          ) : null}
        </p>
        <Button size="sm" onClick={() => setOpenCreate(true)}>
          <FileSignature className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Nộp báo cáo
        </Button>
      </div>

      {(reports?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Chưa có báo cáo nghiệm thu nào.
        </div>
      ) : (
        <ul className="space-y-2">
          {reports?.map((r) => {
            const meta = BAO_CAO_TRANG_THAI[r.trang_thai];
            const Icon = meta.icon;
            return (
              <li key={r.id}>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {r.tieu_de}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {nameOf(r.nguoi_nop_id)} · {formatDateTime(r.created_at)}
                          {r.cong_viec_id
                            ? ` · Công việc: ${taskName[r.cong_viec_id] ?? "—"}`
                            : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn("gap-1", meta.tone)}>
                        <Icon className="h-3 w-3" aria-hidden="true" />
                        {meta.label}
                      </Badge>
                    </div>

                    {r.noi_dung ? (
                      <p className="whitespace-pre-wrap text-sm text-foreground/90">{r.noi_dung}</p>
                    ) : null}
                    {r.bang_chung ? (
                      <p className="rounded-md bg-muted/50 p-2 text-xs text-foreground/80">
                        <span className="font-medium">Bằng chứng kỹ thuật: </span>
                        {r.bang_chung}
                      </p>
                    ) : null}
                    {r.tep_url ? (
                      <a
                        href={r.tep_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-primary underline underline-offset-2"
                      >
                        Xem tệp đính kèm
                      </a>
                    ) : null}
                    {r.y_kien_lanh_dao ? (
                      <p className="rounded-md border-l-2 border-primary/50 bg-primary/5 p-2 text-xs text-foreground/90">
                        <span className="font-medium">Ý kiến lãnh đạo: </span>
                        {r.y_kien_lanh_dao}
                        {r.nguoi_duyet_id ? ` — ${nameOf(r.nguoi_duyet_id)}` : ""}
                      </p>
                    ) : null}

                    {canManage && r.trang_thai !== "da_duyet" ? (
                      <div className="pt-1">
                        <Button size="sm" variant="outline" onClick={() => setReviewing(r)}>
                          Xử lý phê duyệt
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <CreateReportDialog
        duAnId={duAnId}
        tasks={tasks}
        open={openCreate}
        onOpenChange={setOpenCreate}
        onDone={() => qc.invalidateQueries({ queryKey: ["du-an-bao-cao", duAnId] })}
      />
      <ReviewReportDialog
        report={reviewing}
        onOpenChange={(o) => !o && setReviewing(null)}
        onDone={() => {
          setReviewing(null);
          qc.invalidateQueries({ queryKey: ["du-an-bao-cao", duAnId] });
          qc.invalidateQueries({ queryKey: ["du-an-cong-viec", duAnId] });
          qc.invalidateQueries({ queryKey: ["du-an-detail", duAnId] });
        }}
      />
    </div>
  );
}

function CreateReportDialog({
  duAnId,
  tasks,
  open,
  onOpenChange,
  onDone,
}: {
  duAnId: string;
  tasks: ReadonlyArray<{ id: string; ten: string }>;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    tieu_de: "",
    noi_dung: "",
    bang_chung: "",
    tep_url: "",
    cong_viec_id: "none",
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Phiên đăng nhập đã hết hạn");
      const { error } = await supabase.from("du_an_bao_cao").insert({
        du_an_id: duAnId,
        cong_viec_id: form.cong_viec_id === "none" ? null : form.cong_viec_id,
        tieu_de: form.tieu_de.trim(),
        noi_dung: form.noi_dung.trim() || null,
        bang_chung: form.bang_chung.trim() || null,
        tep_url: form.tep_url.trim() || null,
        nguoi_nop_id: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã nộp báo cáo, chờ lãnh đạo phê duyệt");
      setForm({ tieu_de: "", noi_dung: "", bang_chung: "", tep_url: "", cong_viec_id: "none" });
      onOpenChange(false);
      onDone();
    },
    onError: (e: Error) => toast.error("Nộp báo cáo thất bại: " + e.message),
  });

  const disabled = save.isPending || form.tieu_de.trim().length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nộp báo cáo nghiệm thu</DialogTitle>
          <DialogDescription>
            Gắn báo cáo với một công việc để tự động hoàn thành 100% khi được phê duyệt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bc-tieu-de">Tiêu đề *</Label>
            <Input
              id="bc-tieu-de"
              value={form.tieu_de}
              onChange={(e) => setForm({ ...form, tieu_de: e.target.value })}
              placeholder="Biên bản đo kiểm trạm radar…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bc-cong-viec">Công việc liên quan</Label>
            <Select
              value={form.cong_viec_id}
              onValueChange={(v) => setForm({ ...form, cong_viec_id: v })}
            >
              <SelectTrigger id="bc-cong-viec">
                <SelectValue placeholder="Không gắn công việc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Báo cáo độc lập</SelectItem>
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.ten}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bc-noi-dung">Nội dung</Label>
            <Textarea
              id="bc-noi-dung"
              rows={3}
              value={form.noi_dung}
              onChange={(e) => setForm({ ...form, noi_dung: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bc-bang-chung">Bằng chứng / số liệu đo kiểm</Label>
            <Textarea
              id="bc-bang-chung"
              rows={2}
              value={form.bang_chung}
              onChange={(e) => setForm({ ...form, bang_chung: e.target.value })}
              placeholder="Công suất phát 2.4 kW, tần số 1030 MHz, độ ổn định 99,8%…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bc-tep">Liên kết tệp biên bản</Label>
            <Input
              id="bc-tep"
              value={form.tep_url}
              onChange={(e) => setForm({ ...form, tep_url: e.target.value })}
              placeholder="https://…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Huỷ
          </Button>
          <Button onClick={() => save.mutate()} disabled={disabled}>
            {save.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : null}
            Nộp báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewReportDialog({
  report,
  onOpenChange,
  onDone,
}: {
  report: BaoCao | null;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [yKien, setYKien] = useState("");

  const decide = useMutation({
    mutationFn: async (trang_thai: BaoCaoTrangThai) => {
      if (!report) throw new Error("Không có báo cáo");
      const { error } = await supabase
        .from("du_an_bao_cao")
        .update({ trang_thai, y_kien_lanh_dao: yKien.trim() || null })
        .eq("id", report.id);
      if (error) throw error;
      return trang_thai;
    },
    onSuccess: (st) => {
      toast.success(
        st === "da_duyet"
          ? "Đã phê duyệt — công việc liên quan chuyển sang hoàn thành 100%"
          : "Đã cập nhật trạng thái báo cáo",
      );
      setYKien("");
      onDone();
    },
    onError: (e: Error) => toast.error("Không cập nhật được: " + e.message),
  });

  return (
    <Dialog open={!!report} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Phê duyệt báo cáo</DialogTitle>
          <DialogDescription>{report?.tieu_de}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="bc-y-kien">Ý kiến chỉ đạo</Label>
          <Textarea
            id="bc-y-kien"
            rows={3}
            value={yKien}
            onChange={(e) => setYKien(e.target.value)}
            placeholder="Nhận xét, yêu cầu bổ sung…"
          />
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => decide.mutate("yeu_cau_sua")}
            disabled={decide.isPending}
          >
            Yêu cầu chỉnh sửa
          </Button>
          <Button
            variant="destructive"
            onClick={() => decide.mutate("huy")}
            disabled={decide.isPending}
          >
            Huỷ bỏ
          </Button>
          <Button onClick={() => decide.mutate("da_duyet")} disabled={decide.isPending}>
            {decide.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : null}
            Phê duyệt thông qua
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
