// ============================================================================
// Danh mục Nhãn tài sản — CRUD + phân trang phía server.
// Không còn nhóm; `ma` do DB tự sinh ngẫu nhiên (DT_XXXXXXXX).
// ============================================================================

import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { ListToolbar } from "@/components/mirats/ListToolbar";
import { FormDialog } from "@/components/mirats/FormDialog";
import { ConfirmDialog } from "@/components/mirats/ConfirmDialog";
import { PageHeader } from "@/components/mirats/PageHeader";

import { useListControls } from "@/lib/mirats/ui/use-list-controls";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { fetchDacTinhPage, type DacTinhPageParams } from "@/lib/mirats/dac-tinh-query";
import { MauChip, MauSwatchPicker } from "@/components/mirats/MauChip";

export const Route = createFileRoute("/_app/danh-muc/dac-tinh")({
  head: () => ({
    meta: [
      { title: "Nhãn tài sản — Danh mục MIRATS" },
      { name: "description", content: "Danh mục nhãn tài sản (tag) đa trị của model." },
    ],
  }),
  component: DacTinhPage,
});

interface Row {
  id: string;
  ma: string;
  ten: string;
  mo_ta: string | null;
  thu_tu: number | null;
  mau: string | null;
  so_dung: number;
}

async function fetchPage(params: DacTinhPageParams): Promise<{ rows: Omit<Row, "so_dung">[]; tong: number }> {
  const { rows, tong } = await fetchDacTinhPage(supabase as never, params);
  return {
    rows: rows.map((r) => ({
      id: r.id,
      ma: r.ma,
      ten: r.ten,
      mo_ta: r.mo_ta ?? null,
      thu_tu: r.thu_tu ?? null,
      mau: (r as { mau?: string | null }).mau ?? null,
    })),
    tong,
  };
}

async function fetchSoDung(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from("dm_model_dac_tinh").select("dac_tinh_id");
  if (error) throw error;
  const m = new Map<string, number>();
  for (const r of data ?? []) {
    const id = (r as { dac_tinh_id: string }).dac_tinh_id;
    m.set(id, (m.get(id) ?? 0) + 1);
  }
  return m;
}

async function fetchModelsByTag(dacTinhId: string): Promise<Array<{ id: string; ma: string | null; ten: string; p_n: string | null }>> {
  const { data, error } = await supabase
    .from("dm_model_dac_tinh")
    .select("dm_model:model_id(id, ma, ten, p_n)")
    .eq("dac_tinh_id", dacTinhId);
  if (error) throw error;
  type Joined = { dm_model: { id: string; ma: string | null; ten: string; p_n: string | null } | null };
  return ((data ?? []) as unknown as Joined[])
    .map((r) => r.dm_model)
    .filter((m): m is NonNullable<Joined["dm_model"]> => !!m)
    .sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
}

interface FormValues { ten: string; mo_ta: string; thu_tu: string; mau: string | null; }
const EMPTY: FormValues = { ten: "", mo_ta: "", thu_tu: "", mau: "xam" };

const schema = z.object({
  ten: z.string().trim().min(1, "Tên không được để trống"),
  mo_ta: z.string().max(500, "Mô tả tối đa 500 ký tự").optional().default(""),
  thu_tu: z.string().trim().refine((v) => v === "" || /^-?\d+$/.test(v), "Thứ tự phải là số nguyên"),
  mau: z.string().nullable(),
});

function DacTinhPage() {
  const qc = useQueryClient();
  const { hasRole } = useSession();
  const canWrite = hasRole("admin") || hasRole("phong_kt");

  const controls = useListControls({
    kichThuoc: 25,
    sort: { field: "thu_tu", dir: "asc" },
  });
  const { state } = controls;

  const pageParams: DacTinhPageParams = {
    trang: state.trang,
    kichThuoc: state.kichThuoc,
    q: state.q ?? "",
    sortField: state.sort?.field ?? "",
    sortDir: state.sort?.dir ?? "asc",
  };

  const pageQ = useQuery({
    queryKey: ["dm_dac_tinh_page", pageParams],
    queryFn: () => fetchPage(pageParams),
    placeholderData: keepPreviousData,
  });
  const soDungQ = useQuery({
    queryKey: ["dm_dac_tinh_so_dung"],
    queryFn: fetchSoDung,
    staleTime: 30_000,
  });

  const rows: Row[] = React.useMemo(() => {
    const base = pageQ.data?.rows ?? [];
    const m = soDungQ.data;
    return base.map((r) => ({ ...r, so_dung: m?.get(r.id) ?? 0 }));
  }, [pageQ.data, soDungQ.data]);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [delTarget, setDelTarget] = React.useState<Row | null>(null);
  const [usageTarget, setUsageTarget] = React.useState<Row | null>(null);

  function openAdd() { setEditing(null); setValues(EMPTY); setFormOpen(true); }
  function openEdit(row: Row) {
    setEditing(row);
    setValues({
      ten: row.ten,
      mo_ta: row.mo_ta ?? "",
      thu_tu: row.thu_tu != null ? String(row.thu_tu) : "",
      mau: row.mau ?? null,
    });
    setFormOpen(true);
  }

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["dm_dac_tinh_page"] });
    qc.invalidateQueries({ queryKey: ["dm_dac_tinh_so_dung"] });
    qc.invalidateQueries({ queryKey: ["dm_dac_tinh_all"] });
  };
  const saveMut = useMutation({
    mutationFn: async (v: FormValues) => {
      if (!canWrite) throw new Error("Bạn không có quyền chỉnh sửa danh mục nhãn tài sản.");
      const payload = {
        ten: v.ten.trim(),
        mo_ta: v.mo_ta.trim() || null,
        thu_tu: v.thu_tu.trim() === "" ? null : Number.parseInt(v.thu_tu.trim(), 10),
        mau: v.mau ?? null,
      };
      if (editing) {
        const { error } = await supabase.from("dm_dac_tinh").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        // KHÔNG gửi `ma` — trigger DB tự sinh mã ngẫu nhiên DT_XXXXXXXX.
        const { error } = await supabase.from("dm_dac_tinh").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: invalidateAll,
  });
  const deleteMut = useMutation({
    mutationFn: async (row: Row) => {
      if (!canWrite) throw new Error("Bạn không có quyền xoá nhãn tài sản.");
      if (row.so_dung > 0) throw new Error(`Nhãn tài sản đang được ${row.so_dung} model sử dụng — không thể xoá`);
      const { error } = await supabase.from("dm_dac_tinh").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const columns: StdColumn<Row>[] = [
    {
      key: "ma", label: "Mã", sortable: true,
      value: (r) => r.ma,
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.ma}</span>,
    },
    {
      key: "ten", label: "Tên", sortable: true,
      value: (r) => r.ten,
      cell: (r) => <MauChip ten={r.ten} mau={r.mau} />,
    },
    {
      key: "thu_tu", label: "Thứ tự", sortable: true, align: "right",
      value: (r) => r.thu_tu ?? "",
      sortValue: (r) => (r.thu_tu ?? Number.POSITIVE_INFINITY) as number,
      cell: (r) => <span className="tabular-nums text-muted-foreground">{r.thu_tu ?? "—"}</span>,
    },
    {
      key: "mo_ta", label: "Mô tả",
      value: (r) => r.mo_ta ?? "",
      cell: (r) => <span className="line-clamp-2 text-sm text-muted-foreground">{r.mo_ta ?? "—"}</span>,
    },
    {
      key: "so_dung", label: "Đang dùng", align: "right",
      value: (r) => r.so_dung,
      sortValue: (r) => r.so_dung,
      cell: (r) => (
        <Button
          variant={r.so_dung > 0 ? "outline" : "ghost"}
          size="sm"
          className="h-7 gap-1.5"
          disabled={r.so_dung === 0}
          onClick={() => setUsageTarget(r)}
          title={r.so_dung > 0 ? "Xem các mẫu đang dùng nhãn tài sản này" : "Chưa mẫu nào dùng"}
        >
          <Users className="h-3.5 w-3.5" />
          {r.so_dung > 0 ? `${r.so_dung} mẫu` : "0"}
        </Button>
      ),
    },
    {
      key: "actions", label: "", align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" disabled={!canWrite} onClick={() => openEdit(r)} aria-label={`Sửa ${r.ten}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm" variant="ghost"
            disabled={!canWrite || r.so_dung > 0}
            onClick={() => setDelTarget(r)}
            aria-label={`Xoá ${r.ten}`}
            title={r.so_dung > 0 ? "Đang được mẫu sử dụng" : undefined}
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  const tong = pageQ.data?.tong ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <PageHeader
        icon={Sparkles}
        title="Nhãn tài sản"
        subtitle="tag đa trị — mã tự sinh, không mang ý nghĩa"
        actions={
          canWrite ? (
            <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Thêm nhãn tài sản</Button>
          ) : null
        }
      />


      <ListToolbar controls={controls} filters={[]} placeholder="Tìm theo mã / tên / mô tả…" />

      <StandardTable<Row>
        tableKey="dm_dac_tinh"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        requireFilterToShow={false}
        hideReorderToggle
        emptyText="Chưa có nhãn tài sản nào khớp bộ lọc."
        trangThai={{ dangTai: pageQ.isFetching, loi: pageQ.error ? String(pageQ.error) : null }}
        pagination={{ controls, tong }}
      />


      <UsageDialog target={usageTarget} onClose={() => setUsageTarget(null)} />

      <FormDialog<FormValues, { mode: "create" | "update"; ten: string }>
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? `Sửa nhãn tài sản · ${editing.ten}` : "Thêm nhãn tài sản"}
        description="Nhãn tài sản là lớp phân loại phụ đa trị áp dụng cho Model. Mã được sinh tự động."
        values={values}
        schema={schema}
        renderForm={({ errors, disabled }) => (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {editing && (
              <div className="space-y-1 md:col-span-2">
                <Label>Mã (tự sinh)</Label>
                <Input value={editing.ma} readOnly disabled className="font-mono" />
              </div>
            )}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="dt-ten">Tên *</Label>
              <Input id="dt-ten" value={values.ten} onChange={(e) => setValues((v) => ({ ...v, ten: e.target.value }))} disabled={disabled} placeholder="VD: Máy thu, Máy phát, VHF…" />
              {errors.ten && <p className="text-xs text-red-600">{errors.ten}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="dt-thutu">Thứ tự</Label>
              <Input id="dt-thutu" value={values.thu_tu} onChange={(e) => setValues((v) => ({ ...v, thu_tu: e.target.value }))} disabled={disabled} placeholder="Để trống nếu chưa cần sắp" />
              {errors.thu_tu && <p className="text-xs text-red-600">{errors.thu_tu}</p>}
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Màu hiển thị</Label>
              <div className="flex flex-wrap items-center gap-3">
                <MauSwatchPicker
                  value={values.mau}
                  onChange={(mau) => setValues((v) => ({ ...v, mau }))}
                  disabled={disabled || !canWrite}
                />
                <MauChip ten={values.ten || "Xem trước"} mau={values.mau} />
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="dt-mota">Mô tả</Label>
              <Textarea id="dt-mota" rows={2} value={values.mo_ta} onChange={(e) => setValues((v) => ({ ...v, mo_ta: e.target.value }))} disabled={disabled} />
              {errors.mo_ta && <p className="text-xs text-red-600">{errors.mo_ta}</p>}
            </div>
          </div>
        )}
        previewTacDong={(v) => ({ mode: editing ? "update" : "create", ten: v.ten.trim() })}
        renderPreview={(p) => (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            {p.mode === "create" ? "Sẽ tạo mới" : "Sẽ cập nhật"} nhãn tài sản{" "}
            <span className="font-medium">{p.ten}</span>{p.mode === "create" && " (mã sẽ được sinh tự động)"}.
          </div>
        )}
        onConfirm={async (v) => { await saveMut.mutateAsync(v); }}
        submitLabel={editing ? "Lưu thay đổi" : "Tạo mới"}
        successMessage={editing ? "Đã cập nhật nhãn tài sản" : "Đã tạo nhãn tài sản"}
      />

      <ConfirmDialog
        open={!!delTarget}
        onOpenChange={(o) => !o && setDelTarget(null)}
        title="Xoá nhãn tài sản"
        danger
        description={
          delTarget ? (
            delTarget.so_dung > 0 ? (
              <div className="flex items-center gap-2 text-red-600">
                <Loader2 className="h-4 w-4 shrink-0" />
                Không thể xoá — nhãn tài sản <b>{delTarget.ten}</b> đang được <b>{delTarget.so_dung}</b> model sử dụng.
              </div>
            ) : (
              <>Xoá nhãn tài sản <b>{delTarget.ten}</b>? Hành động này không thể hoàn tác.</>
            )
          ) : ""
        }
        confirmLabel="Xoá"
        onConfirm={async () => { if (!delTarget) return; await deleteMut.mutateAsync(delTarget); setDelTarget(null); }}
        successMessage="Đã xoá nhãn tài sản"
      />
    </div>
  );
}

function UsageDialog({ target, onClose }: { target: Row | null; onClose: () => void }) {
  const q = useQuery({
    queryKey: ["dm_dac_tinh_usage", target?.id],
    enabled: !!target?.id,
    queryFn: () => fetchModelsByTag(target!.id),
  });
  const models = q.data ?? [];
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Mẫu đang dùng nhãn tài sản{" "}
            {target && <span className="font-medium">{target.ten}</span>}
          </DialogTitle>
          <DialogDescription>
            Tổng: <b>{target?.so_dung ?? 0}</b> mẫu. Bỏ gán ở từng Mẫu trước khi xoá nhãn tài sản.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[420px] overflow-auto rounded border">
          {q.isLoading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
            </div>
          ) : models.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Chưa mẫu nào dùng nhãn tài sản này.</div>
          ) : (
            <ul className="divide-y">
              {models.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium">{m.ten}</span>
                  {m.p_n && <span className="font-mono text-xs text-muted-foreground">P/N: {m.p_n}</span>}
                  {m.ma && <span className="font-mono text-xs text-muted-foreground">{m.ma}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
