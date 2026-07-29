import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { statuses } from "@/lib/mirats/trang-thai";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Bug, Plus, AlertTriangle, ArrowUpRight, Search } from "lucide-react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { toast } from "sonner";
import { formatDT } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  blockingActions,
  canCloseVanDe,
  isActionOpen,
  type RcaAction,
} from "@/lib/mirats/van-de-state";

type CongViecMini = RcaAction & {
  id: string;
  ma_cong_viec: string | null;
  mo_ta: string | null;
};

const TRANG_THAI: Record<string, string> = {
  moi: "Mới",
  dang_phan_tich: "Đang phân tích",
  da_xac_dinh: "Đã xác định nguyên nhân",
  da_khac_phuc: "Đã khắc phục",
  dong: "Đã đóng",
};


const MUC_DO: Record<string, string> = {
  thap: "Thấp",
  trung_binh: "Trung bình",
  cao: "Cao",
  nghiem_trong: "Nghiêm trọng",
};
const MUC_DO_COLOR: Record<string, string> = {
  thap: "bg-secondary text-foreground",
  trung_binh: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  cao: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  nghiem_trong: "bg-destructive/15 text-destructive",
};

type VanDe = {
  id: string;
  ma_van_de: string;
  tieu_de: string;
  mo_ta: string | null;
  nguyen_nhan_goc: string | null;
  bien_phap_khac_phuc: string | null;
  trang_thai: string;
  muc_do: string;
  he_thong_id: string | null;
  thiet_bi_id: string | null;
  he_thong_ten: string | null;
  thiet_bi_ten: string | null;
  don_vi_ten: string | null;
  so_su_co: number;
  so_thay_doi: number;
  created_at: string;
};

type SystemMini = { id: string; ten: string };

export const Route = createFileRoute("/_app/van-de")({
  component: VanDePage,
});

const empty = {
  tieu_de: "",
  mo_ta: "",
  nguyen_nhan_goc: "",
  bien_phap_khac_phuc: "",
  trang_thai: "moi",
  muc_do: "trung_binh",
  he_thong_id: "",
};

function VanDePage() {
  const { hasRole, roles } = useSession();
  const canWrite = hasRole("admin") || hasRole("phong_kt") || hasRole("ktv");
  const [rows, setRows] = useState<VanDe[]>([]);
  const [loading, setLoading] = useState(true);
  const [systems, setSystems] = useState<SystemMini[]>([]);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string>("moi");
  const [actions, setActions] = useState<CongViecMini[]>([]);
  const [linkedSuCo, setLinkedSuCo] = useState<Array<{ ma_su_co: string; hien_tuong: string; trang_thai: string; ngay_phat_hien: string; muc_do: string }>>([]);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  const blocking = useMemo(() => blockingActions(actions), [actions]);

  async function load() {
    setLoading(true);
    try {
      const { fetchAllRows } = await import("@/lib/mirats/paginate");
      const data = await fetchAllRows<unknown>((from, to) =>
        supabase.from("v_van_de").select("*").order("created_at", { ascending: false }).range(from, to) as unknown as PromiseLike<{ data: unknown[] | null; error: unknown }>,
      );
      setRows(data as VanDe[]);
    } catch (e) {
      toast.error("Không tải được danh sách", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    supabase
      .from("dm_he_thong")
      .select("id,ten")
      .order("ten")
      .then(({ data }) => setSystems((data ?? []) as SystemMini[]));
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterStatus !== "all" && r.trang_thai !== filterStatus) return false;
      if (!kw) return true;
      return (
        r.tieu_de.toLowerCase().includes(kw) ||
        r.ma_van_de.toLowerCase().includes(kw) ||
        (r.he_thong_ten ?? "").toLowerCase().includes(kw) ||
        (r.thiet_bi_ten ?? "").toLowerCase().includes(kw)
      );
    });
  }, [rows, q, filterStatus]);

  const stats = useMemo(() => {
    const open = rows.filter((r) => r.trang_thai !== "dong").length;
    const critical = rows.filter((r) => r.muc_do === "nghiem_trong" && r.trang_thai !== "dong").length;
    return { total: rows.length, open, critical };
  }, [rows]);

  function openCreate() {
    setEditId(null);
    setOriginalStatus("moi");
    setActions([]);
    setLinkedSuCo([]);
    setForm({ ...empty });
    setSheetOpen(true);
  }

  async function openEdit(r: VanDe) {
    setEditId(r.id);
    setOriginalStatus(r.trang_thai);
    setActions([]);
    setLinkedSuCo([]);
    setForm({
      tieu_de: r.tieu_de,
      mo_ta: r.mo_ta ?? "",
      nguyen_nhan_goc: r.nguyen_nhan_goc ?? "",
      bien_phap_khac_phuc: r.bien_phap_khac_phuc ?? "",
      trang_thai: r.trang_thai,
      muc_do: r.muc_do,
      he_thong_id: r.he_thong_id ?? "",
    });
    setSheetOpen(true);
    const { data } = await supabase
      .from("cong_viec_bao_tri")
      .select("id,ma_cong_viec,mo_ta,trang_thai,bat_buoc")
      .eq("van_de_id", r.id);
    setActions((data ?? []) as CongViecMini[]);
    const { data: scData } = await supabase
      .from("su_co")
      .select("ma_su_co,hien_tuong,trang_thai,ngay_phat_hien,muc_do")
      .eq("van_de_id", r.id)
      .order("ngay_phat_hien", { ascending: false });
    setLinkedSuCo((scData ?? []) as typeof linkedSuCo);
  }

  async function save() {
    if (!form.tieu_de.trim()) {
      toast.error("Vui lòng nhập tiêu đề vấn đề");
      return;
    }
    // Đóng vấn đề đi qua RPC dong_van_de để áp dụng gate + audit ở DB.
    const isClosing = editId && form.trang_thai === "dong" && originalStatus !== "dong";
    if (isClosing) {
      const check = canCloseVanDe(roles, actions);
      if (!check.ok) {
        toast.error("Không thể đóng vấn đề", { description: check.reason });
        return;
      }
    }
    setSaving(true);
    const payload = {
      tieu_de: form.tieu_de.trim(),
      mo_ta: form.mo_ta.trim() || null,
      nguyen_nhan_goc: form.nguyen_nhan_goc.trim() || null,
      bien_phap_khac_phuc: form.bien_phap_khac_phuc.trim() || null,
      // Khi đang đóng, để RPC đặt trạng thái "dong"; ở đây giữ trạng thái cũ.
      trang_thai: isClosing ? originalStatus : form.trang_thai,
      muc_do: form.muc_do,
      he_thong_id: form.he_thong_id || null,
    };
    const res = editId
      ? await supabase.from("van_de").update(payload).eq("id", editId)
      : await supabase.from("van_de").insert(payload);
    if (res.error) {
      setSaving(false);
      toast.error("Không lưu được", { description: res.error.message });
      return;
    }
    if (isClosing) {
      const { error } = await supabase.rpc("dong_van_de", { p_id: editId });
      if (error) {
        setSaving(false);
        toast.error("Không thể đóng vấn đề", { description: error.message });
        return;
      }
    }
    setSaving(false);
    toast.success(editId ? (isClosing ? "Đã đóng vấn đề" : "Đã cập nhật vấn đề") : "Đã tạo vấn đề");
    setSheetOpen(false);
    load();
  }


  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <PageHeader
        icon={Bug}
        title="Vấn đề (RCA)"
        help="Quản lý nguyên nhân gốc của các sự cố lặp lại và biện pháp khắc phục triệt để."
        actions={
          canWrite ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> Tạo vấn đề
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Tổng số", value: stats.total },
          { label: "Đang mở", value: stats.open },
          { label: "Nghiêm trọng", value: stats.critical },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo mã, tiêu đề, hệ thống…"
            className="pl-8"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {Object.entries(TRANG_THAI).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Đang tải…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Chưa có vấn đề nào. {canWrite && "Nhấn “Tạo vấn đề” để bắt đầu phân tích nguyên nhân gốc."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => canWrite && openEdit(r)}
                className={cn(
                  "flex w-full flex-col gap-2 p-4 text-left transition-colors sm:flex-row sm:items-center",
                  canWrite && "hover:bg-secondary/40",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{r.ma_van_de}</span>
                    <StatusBadge domain="van_de" code={r.trang_thai} className="text-[10px]" />
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", MUC_DO_COLOR[r.muc_do])}>
                      {MUC_DO[r.muc_do] ?? r.muc_do}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-sm font-medium">{r.tieu_de}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                    {r.he_thong_ten && <span>Hệ thống: {r.he_thong_ten}</span>}
                    {r.thiet_bi_ten && <span>Tài sản: {r.thiet_bi_ten}</span>}
                    {r.don_vi_ten && <span>{r.don_vi_ten}</span>}
                    <span>{formatDT(r.created_at)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" /> {r.so_su_co} sự cố
                  </span>
                  <span>{r.so_thay_doi} thay đổi</span>
                  {canWrite && <ArrowUpRight className="h-3.5 w-3.5" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Vấn đề được liên kết với sự cố từ trang{" "}
        <Link to="/su-co" className="underline hover:text-foreground">
          Sự cố kỹ thuật
        </Link>{" "}
        và với các phiếu thay đổi trong{" "}
        <Link to="/bao-tri/cong-viec" className="underline hover:text-foreground">
          Phiếu công việc
        </Link>
        .
      </p>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editId ? "Chỉnh sửa vấn đề" : "Tạo vấn đề mới"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-4 py-4">
            <Field label="Tiêu đề *">
              <Input
                value={form.tieu_de}
                onChange={(e) => setForm((f) => ({ ...f, tieu_de: e.target.value }))}
                placeholder="Ví dụ: Nguồn tài sản UHF hỏng lặp lại"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mức độ">
                <Select value={form.muc_do} onValueChange={(v) => setForm((f) => ({ ...f, muc_do: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MUC_DO).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Trạng thái">
                <Select value={form.trang_thai} onValueChange={(v) => setForm((f) => ({ ...f, trang_thai: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANG_THAI).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {editId && actions.length > 0 && (
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Hành động khắc phục ({actions.length})
                </div>
                <ul className="space-y-1.5">
                  {actions.map((a) => (
                    <li key={a.id} className="flex items-start gap-2 text-[11px]">
                      <span
                        className={cn(
                          "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          isActionOpen(a.trang_thai) ? "bg-amber-500" : "bg-emerald-500",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">
                        {a.ma_cong_viec ?? a.mo_ta ?? "Công việc"}
                      </span>
                      {a.bat_buoc && (
                        <span className="shrink-0 rounded bg-destructive/15 px-1 text-[10px] font-medium text-destructive">
                          Bắt buộc
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {blocking.length > 0 && (
                  <p className="mt-2 text-[11px] text-destructive">
                    Còn {blocking.length} hành động bắt buộc chưa hoàn thành — chưa thể đóng vấn đề.
                  </p>
                )}
              </div>
            )}
            {editId && (
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <div className="mb-2 flex items-center justify-between text-xs font-medium">
                  <span>Sự cố thuộc vấn đề ({linkedSuCo.length})</span>
                  <span className="text-[10px] text-muted-foreground">
                    Đối chiếu với chỉ số <span className="font-mono">so_su_co</span> trên bảng
                  </span>
                </div>
                {linkedSuCo.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    Chưa có sự cố nào gắn vào vấn đề này. Mở phiếu sự cố và chọn vấn đề để liên kết.
                  </p>
                ) : (
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                    {linkedSuCo.map((s) => (
                      <li key={s.ma_su_co} className="flex items-center gap-2 text-[11px]">
                        <Link
                          to="/su-co/$maSuCo"
                          params={{ maSuCo: s.ma_su_co }}
                          className="font-mono text-primary hover:underline shrink-0"
                        >
                          {s.ma_su_co}
                        </Link>
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.hien_tuong}</span>
                        <span className="shrink-0 rounded bg-muted px-1 text-[10px]">{s.trang_thai}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <Field label="Hệ thống liên quan">
              <Select
                value={form.he_thong_id || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, he_thong_id: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Không liên kết" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không liên kết</SelectItem>
                  {systems.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.ten}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Mô tả hiện tượng">
              <Textarea
                rows={3}
                value={form.mo_ta}
                onChange={(e) => setForm((f) => ({ ...f, mo_ta: e.target.value }))}
              />
            </Field>
            <Field label="Nguyên nhân gốc (Root cause)">
              <Textarea
                rows={3}
                value={form.nguyen_nhan_goc}
                onChange={(e) => setForm((f) => ({ ...f, nguyen_nhan_goc: e.target.value }))}
              />
            </Field>
            <Field label="Biện pháp khắc phục triệt để">
              <Textarea
                rows={3}
                value={form.bien_phap_khac_phuc}
                onChange={(e) => setForm((f) => ({ ...f, bien_phap_khac_phuc: e.target.value }))}
              />
            </Field>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Hủy
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Đang lưu…" : editId ? "Lưu thay đổi" : "Tạo vấn đề"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
