// ============================================================================
// Bảng danh mục dùng chung cho các bảng dm_* đơn giản (ma / ten / mo_ta /
// thu_tu / active). Cung cấp: tìm kiếm, thêm, sửa, xoá và đếm số tài sản đang
// dùng (nếu khai `usageColumn` — cột khoá ngoại tương ứng trong `thiet_bi`).
//
// Mô hình quan hệ theo phong cách Snipe-IT: mỗi danh mục là một bảng riêng và
// tài sản (asset) trỏ tới bằng khoá ngoại — thay cho nhập chữ tự do.
// ============================================================================

import { useMemo, useState, useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { useSearch, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, Pencil, Trash2, Boxes, List, Network, ChevronRight, ChevronDown, ImageUp, X, Factory, GitMerge, Info, MapPin, Building2, Layers, Download } from "lucide-react";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { toCsv } from "@/lib/mirats/import-config";

import { ScrollArea } from "@/components/ui/scroll-area";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { EmptyState } from "@/components/mirats/EmptyState";
import { PageHeader } from "@/components/mirats/PageHeader";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { CodeBadge } from "@/components/mirats/CodeBadge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";
import { useSession } from "@/hooks/use-session";
import { normalize } from "@/lib/mirats/global-search";
import { invalidateTaxonomy } from "@/lib/mirats/db-taxonomy";
import { updateEntityRow, type RenameKind } from "@/lib/mirats/rename-entity";
import { compressImage } from "@/lib/mirats/image-compress";
import {
  findNearDuplicates,
  validateRequired,
  REQUIRED_SCHEMAS,
  type NearDuplicateHit,
} from "@/lib/mirats/danh-muc-quality";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MauChip, MauSwatchPicker } from "@/components/mirats/MauChip";

/** Bảng danh mục dm_* được hỗ trợ bởi component này. */
export type CatalogTableName =
  | "dm_nha_san_xuat"
  | "dm_nha_cung_cap"
  | "dm_loai_thiet_bi"
  | "dm_don_vi"
  | "dm_vi_tri";

/** Cột khoá ngoại trong `thiet_bi` để đếm số tài sản đang dùng. */
type UsageColumn =
  | "nha_san_xuat_id"
  | "nha_cung_cap_id"
  | "loai_thiet_bi_id"
  | "don_vi_id"
  | "vi_tri_id";

type Row = {
  id: string;
  ma: string | null;
  ten: string;
  mo_ta: string | null;
  thu_tu: number | null;
  active: boolean;
  soThietBi: number;
  parent_id: string | null;
  trang_web: string | null;
  xuat_xu: string | null;
  ghi_chu: string | null;
  logo: string | null;
  mau: string | null;
};

/** Danh mục hỗ trợ quan hệ cấp cha–con (đơn vị trực thuộc / Đội). */
type ParentOption = { id: string; ma: string | null; ten: string };

/** Tạo mã danh mục từ tên (bỏ dấu, viết hoa, thay ký tự đặc biệt). */
function slug(name: string): string {
  const s = normalize(name).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return s.slice(0, 40) || "DM_" + Date.now().toString(36).toUpperCase();
}

/** Bucket lưu logo nhà sản xuất (ảnh đã nén). */
const LOGO_BUCKET = "nha-san-xuat-logo";

/** Sinh màu pastel ổn định từ chuỗi (dùng cho badge tên danh mục). */
function hashPastel(s: string): { backgroundColor: string; color: string } {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return {
    backgroundColor: `hsl(${hue} 75% 92%)`,
    color: `hsl(${hue} 55% 28%)`,
  };
}

export function CatalogTable({
  table,
  usageColumn,
  title,
  singular,
  description,
  icon: Icon,
  namePlaceholder,
  hiddenCols = [],
  extraRowActions,
  headerActions,
  mergeRpc,
  nameBadge = false,
}: {
  table: CatalogTableName;
  usageColumn: UsageColumn;
  title: string;
  singular: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  namePlaceholder: string;
  /** Khoá cột cần ẩn khỏi bảng danh sách (vd: "mo_ta", "active"). Ẩn "ma" cũng ẩn mã trong sơ đồ cây. */
  hiddenCols?: string[];
  /** Nút hành động bổ sung cho mỗi dòng (vd: xem ảnh vị trí). Luôn hiển thị. */
  extraRowActions?: (r: { id: string; ma: string | null; ten: string }) => ReactNode;
  /** Nút hành động ở tiêu đề (vd: gộp trùng, nhập/xuất hàng loạt). */
  headerActions?: ReactNode;
  /** Tên RPC gộp mục đã chọn (nhận p_source_ids, p_target_id). Bật nút "Gộp đã chọn". */
  mergeRpc?: string;
  /** Hiển thị tên dưới dạng badge có màu (hash từ id) — dùng cho chủng loại. */
  nameBadge?: boolean;
}) {
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const supportsParent = table === "dm_don_vi" || table === "dm_vi_tri";
  const supportsWebsite = table === "dm_nha_san_xuat";
  const supportsGhiChu = table === "dm_nha_san_xuat";
  const supportsXuatXu = table === "dm_nha_san_xuat";
  const supportsLogo = table === "dm_nha_san_xuat";
  const supportsMau = table === "dm_loai_thiet_bi";
  const qc = useQueryClient();
  // Cho phép điều hướng kèm ?q=… để lọc sẵn (hyperlink từ trang khác nhảy tới).
  const initialQ = (useSearch({ strict: false }) as { q?: string }).q ?? "";
  const [q, setQ] = useState(initialQ);
  const [view, setView] = useState<"list" | "tree">(supportsParent ? "tree" : "list");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [mergeList, setMergeList] = useState<Row[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickMerge, setPickMerge] = useState(false);
  const [usageRow, setUsageRow] = useState<Row | null>(null);
  const hideCode = hiddenCols.includes("ma");

  const { data: rows, isLoading, error } = useQuery({
    queryKey: ["catalog", table],
    queryFn: async (): Promise<Row[]> => {
      const cols =
        (supportsParent ? "id,ma,ten,mo_ta,thu_tu,active,parent_id" : "id,ma,ten,mo_ta,thu_tu,active") +
        (supportsWebsite ? ",trang_web" : "") +
        (supportsXuatXu ? ",xuat_xu" : "") +
        (supportsGhiChu ? ",ghi_chu" : "") +
        (supportsLogo ? ",logo" : "") +
        (supportsMau ? ",mau" : "");
      const { data, error } = await supabase
        .from(table)
        .select(cols)
        .order("thu_tu", { ascending: true })
        .order("ten", { ascending: true });
      if (error) throw error;

      // Đếm số tài sản theo khoá ngoại — phân trang 1000/lần vì
      // `thiet_bi` đã vượt/tiệm cận 1000 dòng, mặc định PostgREST sẽ cắt.
      const counts = new Map<string, number>();
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data: tb } = await supabase
          .from("thiet_bi")
          .select(usageColumn)
          .not(usageColumn, "is", null)
          .range(from, from + PAGE - 1);
        const batch = (tb ?? []) as Record<string, string>[];
        for (const t of batch) {
          const id = t[usageColumn];
          if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
        }
        if (batch.length < PAGE) break;
      }


      return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        ma: (r.ma as string) ?? null,
        ten: r.ten as string,
        mo_ta: (r.mo_ta as string) ?? null,
        thu_tu: (r.thu_tu as number) ?? null,
        active: r.active as boolean,
        soThietBi: counts.get(r.id as string) ?? 0,
        parent_id: (r.parent_id as string) ?? null,
        trang_web: (r.trang_web as string) ?? null,
        xuat_xu: (r.xuat_xu as string) ?? null,
        ghi_chu: (r.ghi_chu as string) ?? null,
        logo: (r.logo as string) ?? null,
        mau: (r.mau as string) ?? null,
      }));
    },
  });


  const filtered = useMemo(() => {
    const nq = normalize(q);
    const all = rows ?? [];
    if (!nq) return all;
    const matched = all.filter(
      (r) => normalize(r.ten).includes(nq) || normalize(r.ma ?? "").includes(nq) || normalize(r.mo_ta ?? "").includes(nq),
    );
    if (!supportsParent) return matched;
    // Trong chế độ cây: giữ luôn tổ tiên của mỗi mục khớp để chúng hiển thị được.
    const byId = new Map(all.map((r) => [r.id, r] as const));
    const keep = new Set<string>();
    for (const m of matched) {
      let cur: Row | undefined = m;
      while (cur && !keep.has(cur.id)) {
        keep.add(cur.id);
        cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
      }
    }
    return all.filter((r) => keep.has(r.id));
  }, [rows, q, supportsParent]);

  // Bản đồ id → tên đơn vị cấp trên (dùng để hiển thị cột "Trực thuộc").
  const parentNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows ?? []) m.set(r.id, r.ten);
    return m;
  }, [rows]);

  // Danh sách đơn vị có thể chọn làm cấp trên (loại trừ chính nó khi sửa).
  const parentOptions = useMemo<ParentOption[]>(
    () => (rows ?? []).map((r) => ({ id: r.id, ma: r.ma, ten: r.ten })),
    [rows],
  );

  // Cây cha–con: bản đồ parent_id → danh sách con (đã lọc theo tìm kiếm).
  const childrenMap = useMemo(() => {
    const m = new Map<string | null, Row[]>();
    for (const r of filtered) {
      const key = r.parent_id ?? null;
      const arr = m.get(key) ?? [];
      arr.push(r);
      m.set(key, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => (a.thu_tu ?? 999) - (b.thu_tu ?? 999) || a.ten.localeCompare(b.ten, "vi"));
    }
    return m;
  }, [filtered]);

  // Tạo URL xem tạm (signed) cho các logo nhà sản xuất.
  const logoPaths = useMemo(
    () => (rows ?? []).map((r) => r.logo).filter((p): p is string => !!p),
    [rows],
  );
  const { data: logoUrlMap } = useQuery({
    queryKey: ["catalog-logos", table, logoPaths],
    enabled: supportsLogo && logoPaths.length > 0,
    queryFn: async () => {
      const { data } = await storage.from(LOGO_BUCKET).createSignedUrls(logoPaths, 3600);
      const m = new Map<string, string>();
      for (const s of data ?? []) if (s.path && s.signedUrl) m.set(s.path, s.signedUrl);
      return m;
    },
  });






  const delMut = useMutation({
    mutationFn: async (r: Row) => {
      if (r.soThietBi > 0) throw new Error(`Không thể xoá: còn ${r.soThietBi} tài sản đang dùng "${r.ten}".`);
      // DB-level guard: RPC dm_xoa_an_toan chặn xoá nếu còn tham chiếu (áp dụng cho
      // các bảng NSX/NCC/loại/model). Các danh mục khác dùng delete thường.
      const rpcTables = new Set(["dm_nha_san_xuat", "dm_nha_cung_cap", "dm_loai_thiet_bi"]);
      if (rpcTables.has(table)) {
        const { error } = await supabase.rpc("dm_xoa_an_toan" as never, { _bang: table, _id: r.id } as never);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).delete().eq("id", r.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", table] });
      invalidateTaxonomy(qc);
      toast.success(`Đã xoá ${singular.toLowerCase()}.`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Xoá hàng loạt các mục đã tích chọn (bỏ qua mục còn tài sản đang dùng).
  const bulkDelMut = useMutation({
    mutationFn: async (rows: Row[]) => {
      const removable = rows.filter((r) => r.soThietBi === 0);
      const blocked = rows.length - removable.length;
      if (removable.length === 0) throw new Error("Các mục đã chọn đều còn tài sản đang dùng — không thể xoá.");
      const rpcTables = new Set(["dm_nha_san_xuat", "dm_nha_cung_cap", "dm_loai_thiet_bi"]);
      if (rpcTables.has(table)) {
        // Gọi RPC lần lượt để trả về lỗi rõ ràng nếu bất kỳ mục nào bị chặn ở DB.
        for (const r of removable) {
          const { error } = await supabase.rpc("dm_xoa_an_toan" as never, { _bang: table, _id: r.id } as never);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from(table).delete().in("id", removable.map((r) => r.id));
        if (error) throw error;
      }
      return { deleted: removable.length, blocked };
    },
    onSuccess: ({ deleted, blocked }) => {
      qc.invalidateQueries({ queryKey: ["catalog", table] });
      invalidateTaxonomy(qc);
      toast.success(`Đã xoá ${deleted} ${singular.toLowerCase()}${blocked > 0 ? ` · bỏ qua ${blocked} mục còn tài sản đang dùng` : ""}.`);
    },
    onError: (e) => toast.error((e as Error).message),
  });


  // Gộp các mục đã chọn vào một mục đích. Ưu tiên RPC chung `merge_danh_muc`
  // (entity = tên bảng dm_*); fallback RPC per-table nếu caller còn truyền `mergeRpc`.
  const mergeMut = useMutation({
    mutationFn: async ({ target, sources }: { target: Row; sources: Row[] }) => {
      const srcIds = sources.map((s) => s.id).filter((id) => id !== target.id);
      if (srcIds.length === 0) throw new Error("Không có mục nguồn để gộp.");
      if (mergeRpc) {
        const { error } = await supabase.rpc(mergeRpc as never, { p_source_ids: srcIds, p_target_id: target.id } as never);
        if (error) throw error;
      } else {
        for (const dropId of srcIds) {
          const { error } = await supabase.rpc("merge_danh_muc", {
            p_entity: table,
            p_keep_id: target.id,
            p_drop_id: dropId,
          });
          if (error) throw error;
        }
      }
      return srcIds.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["catalog", table] });
      invalidateTaxonomy(qc);
      setMergeList(null);
      toast.success(`Đã gộp ${n} ${singular.toLowerCase()} vào mục giữ lại. Có thể hoàn tác trong 24 giờ.`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const tong = rows?.length ?? 0;


  return (
    <div className={`space-y-4 ${UI_DENSITY.PAGE_PADDING}`}>
      <PageHeader
        icon={Icon}
        title={title}
        subtitle={`${tong} mục`}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {headerActions}
            {canManage && (
              <AppTooltip noiDung="Gộp các mục trùng lặp (giữ nguyên liên kết)">
                <Button size="sm" variant="outline" onClick={() => setPickMerge(true)} className="h-8 w-8 p-0">
                  <GitMerge className="h-4 w-4" />
                  <span className="sr-only">Gộp trùng</span>
                </Button>
              </AppTooltip>
            )}
            {canManage && (
              <AppTooltip noiDung={`Thêm ${singular.toLowerCase()} mới`}>
                <Button size="sm" onClick={() => setEditing("new")} className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Thêm {singular.toLowerCase()}</span>
                </Button>
              </AppTooltip>
            )}
          </div>
        }
      />



      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Tìm ${singular.toLowerCase()}, mã…`} className="pl-8" />
        </div>
        {supportsParent && (
          <div className="inline-flex rounded-md border p-0.5">
            <AppTooltip noiDung="Xem dưới dạng sơ đồ phân cấp">
              <Button size="sm" variant={view === "tree" ? "default" : "ghost"} className="h-8 w-8 p-0"
                onClick={() => setView("tree")}>
                <Network className="h-3.5 w-3.5" />
                <span className="sr-only">Sơ đồ cây</span>
              </Button>
            </AppTooltip>
            <AppTooltip noiDung="Xem dưới dạng bảng danh sách">
              <Button size="sm" variant={view === "list" ? "default" : "ghost"} className="h-8 w-8 p-0"
                onClick={() => setView("list")}>
                <List className="h-3.5 w-3.5" />
                <span className="sr-only">Danh sách</span>
              </Button>
            </AppTooltip>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">Lỗi tải dữ liệu: {(error as Error).message}</p>}

      {!error && supportsParent && view === "tree" && !isLoading && (
        <DonViTree
          rootRows={childrenMap.get(null) ?? []}
          childrenMap={childrenMap}
          canManage={canManage}
          childLabel={singular.toLowerCase()}
          extraRowActions={extraRowActions}
          hideCode={hideCode}
          onEdit={(r) => setEditing(r)}
          onInfo={(r) => setUsageRow(r)}
          onDelete={(r) => delMut.mutate(r)}
          emptyText={`Không có ${singular.toLowerCase()} phù hợp.`}
        />
      )}

      {!error && !(supportsParent && view === "tree") && (

        <StandardTable<Row>
          tableKey={`catalog:${table}`}
          trangThai={{ dangTai: isLoading }}
          rows={filtered}
          requireFilterToShow={false}
          selectable={canManage}
          selected={selectedIds}
          setSelected={setSelectedIds}
          toolbarRight={(ctx) => (
            <AppTooltip noiDung="Tải dữ liệu danh mục hiện tại ra file CSV">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                disabled={ctx.visibleRows.length === 0}
                onClick={() => {
                const cols = ctx.visibleColumns.filter((c) => c.key !== "logo");
                const headers = cols.map((c) => (c.label ?? c.key) as string);
                const rows = ctx.visibleRows.map((r) => {
                  const rec: Record<string, string> = {};
                  cols.forEach((c, i) => {
                    const v = c.value ? c.value(r) : "";
                    rec[headers[i]] = v == null ? "" : String(v);
                  });
                  return rec;
                });
                const csv = toCsv(headers, rows);
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${table.replace(/^dm_/, "").replace(/_/g, "-")}-loc-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(`Đã xuất ${rows.length} dòng theo bộ lọc hiện tại.`);
              }}
              title="Xuất các dòng đang hiển thị theo bộ lọc/tìm kiếm"
            >
              <Download className="h-3.5 w-3.5" /> Xuất theo bộ lọc
            </Button>
          )}

          bulkActions={({ selectedRows, clear }) => (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                disabled={selectedRows.length < 2}
                onClick={() => setMergeList(selectedRows)}
                title="Gộp các mục đã chọn thành một"
              >
                <GitMerge className="h-3.5 w-3.5" /> Gộp đã chọn
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 gap-1.5"
                disabled={bulkDelMut.isPending}
                onClick={() => {
                  const removable = selectedRows.filter((r) => r.soThietBi === 0).length;
                  if (removable === 0) { toast.error("Các mục đã chọn đều còn tài sản đang dùng — không thể xoá."); return; }
                  if (!confirm(`Xoá ${removable} ${singular.toLowerCase()} đã chọn? Thao tác không thể hoàn tác.`)) return;
                  bulkDelMut.mutate(selectedRows, { onSuccess: () => clear() });
                }}
              >
                {bulkDelMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Xoá đã chọn
              </Button>
            </>
          )}
          getRowId={(r) => r.id}
          rowClassName={(r) => (!r.active ? "opacity-50" : "")}
          emptyText={`Không có ${singular.toLowerCase()} phù hợp.`}
          columns={([
            ...(supportsLogo ? [{
              key: "logo", label: "Logo", minW: "min-w-[56px]", align: "center" as const,
              cell: (r: Row) => {
                const url = r.logo ? logoUrlMap?.get(r.logo) : undefined;
                return url
                  ? <img src={url} alt={r.ten} className="mx-auto h-8 w-8 rounded object-contain" loading="lazy" />
                  : <span className="mx-auto flex h-8 w-8 items-center justify-center rounded bg-muted"><Factory className="h-4 w-4 text-muted-foreground/40" /></span>;
              },
            }] : []),
            { key: "ma", label: "Mã", minW: "min-w-[100px]", filter: "text", value: (r) => r.ma ?? "",
              defaultHidden: true,
              cell: (r) => r.ma ? <CodeBadge code={r.ma} /> : <span className="text-muted-foreground">—</span> },
            { key: "ten", label: "Tên", minW: "min-w-[180px]", filter: "text", value: (r) => r.ten,
              cell: (r) => supportsMau
                ? <MauChip ten={r.ten} mau={r.mau} />
                : nameBadge
                  ? <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={hashPastel(r.id || r.ten)}>{r.ten}</span>
                  : <span className="font-medium">{r.ten}</span> },
            { key: "mo_ta", label: "Mô tả", minW: "min-w-[200px]", filter: "text", value: (r) => r.mo_ta ?? "",
              cell: (r) => <span className="block max-w-md truncate text-muted-foreground" title={r.mo_ta ?? ""}>{r.mo_ta ?? "—"}</span> },
            ...(supportsWebsite ? [{
              key: "trang_web", label: "Trang web", minW: "min-w-[160px]", filter: "text" as const,
              value: (r: Row) => r.trang_web ?? "",
              cell: (r: Row) => r.trang_web
                ? <a href={/^https?:\/\//.test(r.trang_web) ? r.trang_web : `https://${r.trang_web}`} target="_blank" rel="noreferrer" className="block max-w-[220px] truncate text-primary hover:underline" onClick={(e) => e.stopPropagation()} title={r.trang_web}>{r.trang_web.replace(/^https?:\/\//, "")}</a>
                : <span className="text-xs text-muted-foreground">—</span>,
            }] : []),
            ...(supportsXuatXu ? [{
              key: "xuat_xu", label: "Xuất xứ", minW: "min-w-[120px]", filter: "cat" as const,
              value: (r: Row) => r.xuat_xu ?? "",
              cell: (r: Row) => r.xuat_xu
                ? <Badge variant="outline" className="text-[11px]">{r.xuat_xu}</Badge>
                : <span className="text-xs text-muted-foreground">—</span>,
            }] : []),
            ...(supportsGhiChu ? [{
              key: "ghi_chu", label: "Ghi chú", minW: "min-w-[200px]", filter: "text" as const,
              value: (r: Row) => r.ghi_chu ?? "",
              cell: (r: Row) => <span className="block max-w-md truncate text-muted-foreground" title={r.ghi_chu ?? ""}>{r.ghi_chu ?? "—"}</span>,
            }] : []),
            ...(supportsParent ? [{
              key: "parent", label: "Trực thuộc", minW: "min-w-[160px]", filter: "cat" as const,
              value: (r: Row) => (r.parent_id ? parentNameMap.get(r.parent_id) ?? "—" : "—"),
              cell: (r: Row) => r.parent_id
                ? <Badge variant="outline" className="text-[11px]">{parentNameMap.get(r.parent_id) ?? "—"}</Badge>
                : <span className="text-xs text-muted-foreground">—</span>,
            }] : []),
            { key: "soThietBi", label: "Tài sản", align: "center", value: (r) => r.soThietBi,
              cell: (r) => r.soThietBi > 0
                ? <button type="button" onClick={() => setUsageRow(r)} title={`Xem ${r.soThietBi} tài sản đang ở "${r.ten}"`} className="inline-flex"><Badge variant="secondary" className="gap-1 text-[11px] transition-colors hover:bg-primary/15"><Boxes className="h-3 w-3" /> {r.soThietBi.toLocaleString("vi-VN")}</Badge></button>
                : <span className="text-xs text-muted-foreground">0</span> },
            { key: "active", label: "Trạng thái", align: "center", filter: "cat", value: (r) => (r.active ? "Đang dùng" : "Ẩn"),
              cell: (r) => r.active
                ? <Badge variant="outline" className="text-[11px]">Đang dùng</Badge>
                : <Badge variant="outline" className="text-[11px] text-muted-foreground">Ẩn</Badge> },
            {
              key: "actions", label: "", align: "right" as const,
              cell: (r: Row) => (
                <div className="flex items-center justify-end gap-0.5 whitespace-nowrap">
                  <AppTooltip noiDung={`Xem ${r.soThietBi} tài sản đang ở "${r.ten}"`}>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setUsageRow(r)}>
                      <Info className="h-3.5 w-3.5" />
                      <span className="sr-only">Chi tiết tài sản</span>
                    </Button>
                  </AppTooltip>
                  {extraRowActions?.(r)}
                  {canManage && (
                    <>
                      <AppTooltip noiDung="Chỉnh sửa thông tin">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Sửa</span>
                        </Button>
                      </AppTooltip>
                      <AppTooltip noiDung="Xoá mục này">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => delMut.mutate(r)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Xoá</span>
                        </Button>
                      </AppTooltip>
                    </>
                  )}
                </div>
              ),
            },
          ] as StdColumn<Row>[]).filter((c) => !hiddenCols.includes(c.key))}
        />
      )}

      {editing && (
        <CatalogDialog
          table={table}
          singular={singular}
          namePlaceholder={namePlaceholder}
          value={editing === "new" ? null : editing}
          siblings={rows ?? []}
          supportsParent={supportsParent}
          supportsWebsite={supportsWebsite}
          supportsGhiChu={supportsGhiChu}
          supportsXuatXu={supportsXuatXu}
          supportsLogo={supportsLogo}
          supportsMau={supportsMau}
          parentOptions={parentOptions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["catalog", table] });
            invalidateTaxonomy(qc);
          }}
        />
      )}

      {pickMerge && (
        <MergePickDialog
          rows={filtered}
          singular={singular}
          onClose={() => setPickMerge(false)}
          onContinue={(sel) => { setPickMerge(false); setMergeList(sel); }}
        />
      )}

      {mergeList && (
        <MergeCatalogDialog
          rows={mergeList}
          singular={singular}
          pending={mergeMut.isPending}
          onClose={() => setMergeList(null)}
          onMerge={(target) => mergeMut.mutate({ target, sources: mergeList })}
        />
      )}

      {usageRow && (
        <CatalogUsageDialog
          usageColumn={usageColumn}
          singular={singular}
          rowId={usageRow.id}
          rowTen={usageRow.ten}
          onClose={() => setUsageRow(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hộp thoại: danh sách tài sản đang gắn với một mục danh mục (theo khoá ngoại
// `usageColumn` trong bảng thiet_bi). Nhóm theo đơn vị để dễ nhìn.
// ---------------------------------------------------------------------------
type UsageDevice = {
  id: string;
  ma: string;
  ten: string;
  serial: string;
  viTri: string;
  donVi: string;
  heThong: string;
};

function CatalogUsageDialog({
  usageColumn,
  singular,
  rowId,
  rowTen,
  onClose,
}: {
  usageColumn: UsageColumn;
  singular: string;
  rowId: string;
  rowTen: string;
  onClose: () => void;
}) {
  const { hasRole } = useSession();
  const canEdit = hasRole("admin") || hasRole("phong_kt");
  const { data, isLoading, error } = useQuery({
    queryKey: ["catalog_usage", usageColumn, rowId],
    queryFn: async (): Promise<UsageDevice[]> => {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select("id,ma_thiet_bi,ten_thiet_bi,ma_serial,vi_tri_id,don_vi_quan_ly_id,don_vi_id,he_thong_id,dm_vi_tri:vi_tri_id(ten),qly:don_vi_quan_ly_id(ten),dv:don_vi_id(ten),ht:he_thong_id(ten)")
        .eq(usageColumn, rowId)
        .order("ma_thiet_bi");
      if (error) throw error;
      return ((data ?? []) as Record<string, any>[]).map((r) => ({
        id: r.id,
        ma: r.ma_thiet_bi ?? "",
        ten: r.ten_thiet_bi ?? "",
        serial: r.ma_serial ?? "",
        viTri: r.dm_vi_tri?.ten ?? "",
        donVi: r.qly?.ten ?? r.dv?.ten ?? "",
        heThong: r.ht?.ten ?? "",
      }));
    },
  });

  const byUnit = useMemo(() => {
    const m = new Map<string, UsageDevice[]>();
    for (const r of data ?? []) {
      const k = r.donVi || "(Chưa gán đơn vị)";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0], "vi"));
  }, [data]);

  const showViTri = usageColumn !== "vi_tri_id";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" /> Tài sản tại {singular.toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            {rowTen} — {data?.length ?? 0} tài sản
            {canEdit && (data?.length ?? 0) > 0 ? " · bấm một tài sản để sửa trường của tài sản đó" : ""}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
          </div>
        )}
        {error && <p className="py-6 text-sm text-destructive">Lỗi tải dữ liệu: {(error as Error).message}</p>}
        {!isLoading && !error && (data?.length ?? 0) === 0 && (
          <EmptyState
            icon={Boxes}
            title={`Chưa có tài sản ở ${singular.toLowerCase()} này`}
            description="Gán tài sản vào danh mục này từ trang Sổ lý lịch tài sản."
          />
        )}
        {!isLoading && !error && (data?.length ?? 0) > 0 && (
          <ScrollArea className="max-h-[60vh] pr-3">
            <div className="space-y-4">
              {byUnit.map(([unit, list]) => (
                <div key={unit}>
                  <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground" /> {unit}
                    <Badge variant="secondary" className="ml-1 text-[10px]">{list.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {list.map((r) => {
                      const inner = (
                        <>
                          <span className="font-medium">{r.ten || "(Không tên)"}</span>

                          {r.serial && <span className="font-mono text-[11px] text-muted-foreground">S/N: {r.serial}</span>}
                          {r.heThong && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Layers className="h-3 w-3" /> {r.heThong}
                            </span>
                          )}
                          {showViTri && r.viTri && (
                            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {r.viTri}
                            </span>
                          )}
                          {canEdit && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        </>
                      );
                      const base = "flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded border bg-muted/30 px-2.5 py-1.5 text-sm";
                      return canEdit && r.ma ? (
                        <Link
                          key={r.id}
                          to="/he-thong/cay"
                          search={{ editTb: r.ma }}
                          onClick={onClose}
                          className={cn(base, "transition-colors hover:border-primary/50 hover:bg-primary/5")}
                          title="Mở trình sửa trường của tài sản này"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div key={r.id} className={base}>{inner}</div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Sơ đồ cây đơn vị — hiển thị phân cấp cha–con dạng mindmap, có thu/mở nhánh. */
function DonViTree({
  rootRows,
  childrenMap,
  canManage,
  childLabel,
  extraRowActions,
  hideCode,
  onEdit,
  onInfo,
  onDelete,
  emptyText,
}: {
  rootRows: Row[];
  childrenMap: Map<string | null, Row[]>;
  canManage: boolean;
  childLabel: string;
  extraRowActions?: (r: { id: string; ma: string | null; ten: string }) => ReactNode;
  hideCode?: boolean;
  onEdit: (r: Row) => void;
  onInfo: (r: Row) => void;
  onDelete: (r: Row) => void;
  emptyText: string;
}) {
  if (rootRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="overflow-auto rounded-lg border bg-card p-3 sm:p-5">
      <div className="space-y-1">
        {rootRows.map((r) => (
          <DonViNode key={r.id} row={r} childrenMap={childrenMap} depth={0}
            canManage={canManage} childLabel={childLabel} extraRowActions={extraRowActions} hideCode={hideCode}
            onEdit={onEdit} onInfo={onInfo} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function DonViNode({
  row, childrenMap, depth, canManage, childLabel, extraRowActions, hideCode, onEdit, onInfo, onDelete,
}: {
  row: Row;
  childrenMap: Map<string | null, Row[]>;
  depth: number;
  canManage: boolean;
  childLabel: string;
  extraRowActions?: (r: { id: string; ma: string | null; ten: string }) => ReactNode;
  hideCode?: boolean;
  onEdit: (r: Row) => void;
  onInfo: (r: Row) => void;
  onDelete: (r: Row) => void;
}) {
  const kids = childrenMap.get(row.id) ?? [];
  const hasKids = kids.length > 0;
  const [open, setOpen] = useState(true);
  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-muted/40"
        style={{ marginLeft: depth * 20 }}
      >
        {hasKids ? (
          <button onClick={() => setOpen((v) => !v)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            title={open ? "Thu gọn" : "Mở rộng"}>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="inline-block h-5 w-5 shrink-0" />
        )}
        <span className={cn("h-2 w-2 shrink-0 rounded-full", depth === 0 ? "bg-primary" : "bg-muted-foreground/40")} />
        <span className={cn("truncate", depth === 0 ? "font-semibold" : "font-medium", !row.active && "opacity-50")}>
          {row.ten}
        </span>
        {row.ma && !hideCode && <CodeBadge code={row.ma} className="mr-0.5" />}
        {row.soThietBi > 0 && (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Boxes className="h-3 w-3" /> {row.soThietBi.toLocaleString("vi-VN")}
          </Badge>
        )}
        {hasKids && (
          <span className="text-[11px] text-muted-foreground">· {kids.length} {childLabel} con</span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <AppTooltip noiDung={`Xem ${row.soThietBi} tài sản đang ở "${row.ten}"`}>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onInfo(row)}>
              <Info className="h-3.5 w-3.5" />
              <span className="sr-only">Chi tiết tài sản</span>
            </Button>
          </AppTooltip>
          {extraRowActions?.(row)}
          {canManage && (
            <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
              <AppTooltip noiDung="Chỉnh sửa thông tin">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(row)}>
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Sửa</span>
                </Button>
              </AppTooltip>
              <AppTooltip noiDung="Xoá mục này">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(row)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Xoá</span>
                </Button>
              </AppTooltip>
            </div>
          )}
        </div>
      </div>
      {hasKids && open && (
        <div className="border-l border-dashed" style={{ marginLeft: depth * 20 + 12 }}>
          {kids.map((k) => (
            <DonViNode key={k.id} row={k} childrenMap={childrenMap} depth={depth + 1}
              canManage={canManage} childLabel={childLabel} extraRowActions={extraRowActions} hideCode={hideCode}
              onEdit={onEdit} onInfo={onInfo} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogDialog({
  table,
  singular,
  namePlaceholder,
  value,
  siblings,
  supportsParent,
  supportsWebsite,
  supportsGhiChu,
  supportsXuatXu,
  supportsLogo,
  supportsMau,
  parentOptions,
  onClose,
  onSaved,
}: {
  table: CatalogTableName;
  singular: string;
  namePlaceholder: string;
  value: Row | null;
  siblings: Row[];
  supportsParent: boolean;
  supportsWebsite: boolean;
  supportsGhiChu: boolean;
  supportsXuatXu: boolean;
  supportsLogo: boolean;
  supportsMau: boolean;
  parentOptions: ParentOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [ten, setTen] = useState(value?.ten ?? "");
  const [ma, setMa] = useState(value?.ma ?? "");
  const [moTa, setMoTa] = useState(value?.mo_ta ?? "");
  const [trangWeb, setTrangWeb] = useState(value?.trang_web ?? "");
  const [ghiChu, setGhiChu] = useState(value?.ghi_chu ?? "");
  const [xuatXu, setXuatXu] = useState(value?.xuat_xu ?? "");
  const [logoPath, setLogoPath] = useState<string | null>(value?.logo ?? null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [active, setActive] = useState(value?.active ?? true);
  const [parentId, setParentId] = useState<string>(value?.parent_id ?? "");
  const [mau, setMau] = useState<string | null>(value?.mau ?? null);
  const [saving, setSaving] = useState(false);
  const [dupAck, setDupAck] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Tìm mục nghi trùng theo tên đã chuẩn hoá (loại chính mình khi đang sửa).
  const dupHits = useMemo<NearDuplicateHit[]>(() => {
    if (!ten.trim()) return [];
    const list = siblings
      .filter((s) => s.id !== value?.id)
      .map((s) => ({ id: s.id, ten: s.ten, active: s.active }));
    return findNearDuplicates(list, ten, { limit: 5 });
  }, [ten, siblings, value?.id]);
  // Reset "đã xác nhận vẫn tạo mới" khi user đổi tên (danh sách trùng đổi).
  useEffect(() => { setDupAck(false); }, [ten]);

  // Loại trừ chính đơn vị đang sửa khỏi danh sách cấp trên (tránh tự trỏ vào mình).
  const chonCapTren = parentOptions.filter((o) => o.id !== value?.id);

  // Nạp URL xem tạm cho logo hiện có (khi sửa).
  useEffect(() => {
    if (!supportsLogo || !value?.logo) return;
    let cancelled = false;
    storage.from(LOGO_BUCKET).createSignedUrl(value.logo, 3600).then(({ data }) => {
      if (!cancelled && data?.signedUrl) setLogoPreview(data.signedUrl);
    });
    return () => { cancelled = true; };
  }, [supportsLogo, value?.logo]);

  // Ảnh preview cho tệp mới chọn.
  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  async function pickLogo(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Ảnh tối đa 10MB.");
      return;
    }
    const compressed = await compressImage(f, { maxSize: 512, quality: 0.82 });
    setLogoFile(compressed);
    setLogoRemoved(false);
  }

  function clearLogo() {
    setLogoFile(null);
    setLogoPreview("");
    setLogoRemoved(true);
  }

  async function save() {
    // N1 — validateRequired theo schema từng bảng danh mục.
    const schema = REQUIRED_SCHEMAS[table];
    if (schema) {
      const draft: Record<string, unknown> = {
        ma: ma.trim() || slug(ten),
        ten: ten.trim(),
      };
      if (supportsParent) draft.don_vi_id = parentId || null;
      const check = validateRequired(draft, schema);
      if (!check.ok) {
        toast.error("Thiếu trường bắt buộc: " + check.missing.map((m) => m.label).join(", "));
        return;
      }
    } else if (!ten.trim()) {
      toast.error("Vui lòng nhập tên.");
      return;
    }
    // N1 — chặn khi có mục trùng gần đúng và user chưa xác nhận "vẫn tạo mới".
    if (!value && dupHits.length > 0 && !dupAck) {
      toast.error("Có mục nghi trùng — vui lòng kiểm tra hoặc bấm \"Vẫn tạo mới\" bên dưới để tiếp tục.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ma: (ma.trim() || slug(ten)).toUpperCase(),
        ten: ten.trim(),
        mo_ta: moTa.trim() || null,
        active,
      };
      if (supportsParent) payload.parent_id = parentId || null;
      if (supportsWebsite) payload.trang_web = trangWeb.trim() || null;
      if (supportsGhiChu) payload.ghi_chu = ghiChu.trim() || null;
      if (supportsXuatXu) payload.xuat_xu = xuatXu.trim() || null;
      if (supportsMau) payload.mau = mau ?? null;


      // Xử lý logo: tải ảnh mới (đã nén) lên storage, xoá ảnh cũ nếu cần.
      if (supportsLogo) {
        let nextLogo: string | null = logoPath;
        if (logoFile) {
          const ext = logoFile.name.split(".").pop() || "webp";
          const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const up = await storage.from(LOGO_BUCKET).upload(path, logoFile, { contentType: logoFile.type });
          if (up.error) throw up.error;
          if (logoPath) await storage.from(LOGO_BUCKET).remove([logoPath]).catch(() => {});
          nextLogo = path;
        } else if (logoRemoved && logoPath) {
          await storage.from(LOGO_BUCKET).remove([logoPath]).catch(() => {});
          nextLogo = null;
        }
        payload.logo = nextLogo;
        setLogoPath(nextLogo);
      }
      if (value) {
        // P10 — Track C: dùng chung `updateEntityRow` (routes qua renameEntity semantics
        // cho cột `ten`) thay cho việc gọi supabase.update trực tiếp.
        const kindByTable: Record<CatalogTableName, RenameKind> = {
          dm_nha_san_xuat: "nsx",
          dm_nha_cung_cap: "ncc",
          dm_loai_thiet_bi: "loai",
          dm_don_vi: "dv",
          dm_vi_tri: "vt",
        };
        await updateEntityRow({ kind: kindByTable[table], id: value.id, patch: payload as never });
      } else {
        const { error } = await supabase.from(table).insert(payload as never);
        if (error) throw error;
      }
      toast.success(value ? `Đã cập nhật ${singular.toLowerCase()}.` : `Đã thêm ${singular.toLowerCase()}.`);
      onSaved();
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }


  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{value ? `Sửa ${singular.toLowerCase()}` : `Thêm ${singular.toLowerCase()}`}</DialogTitle>
          <DialogDescription>
            Danh mục dùng để chọn nhanh khi khai tài sản (dropdown), đảm bảo dữ liệu nhất quán.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tên *</Label>
            <Input value={ten} onChange={(e) => setTen(e.target.value)} placeholder={namePlaceholder} autoFocus />
            {dupHits.length > 0 && (
              <div className="rounded-md border border-amber-300/60 bg-amber-50 p-2 text-xs dark:border-amber-500/30 dark:bg-amber-500/10">
                <div className="mb-1 flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-200">
                  <Info className="h-3.5 w-3.5" /> Có {dupHits.length} mục nghi trùng
                </div>
                <ul className="space-y-0.5 text-amber-900/90 dark:text-amber-100/90">
                  {dupHits.map((h) => (
                    <li key={h.id} className="flex items-center gap-2">
                      <span className="truncate">{h.ten}</span>
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        {h.reason === "exact-normalized" ? "trùng" : h.reason === "contains" ? "chứa" : `${Math.round(h.score * 100)}%`}
                      </Badge>
                    </li>
                  ))}
                </ul>
                {!value && (
                  <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-amber-900 dark:text-amber-100">
                    <input type="checkbox" checked={dupAck} onChange={(e) => setDupAck(e.target.checked)} className="h-3.5 w-3.5" />
                    <span>Vẫn tạo mới (đã kiểm tra, không phải bản trùng)</span>
                  </label>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Mã <span className="text-muted-foreground">(để trống sẽ tự tạo)</span></Label>
            <Input value={ma} onChange={(e) => setMa(e.target.value)} placeholder="VD: HONEYWELL" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={2} placeholder="Ghi chú (không bắt buộc)…" />
          </div>
          {supportsMau && (
            <div className="space-y-1.5">
              <Label>Màu hiển thị</Label>
              <div className="flex flex-wrap items-center gap-3">
                <MauSwatchPicker value={mau} onChange={setMau} />
                <MauChip ten={ten || "Xem trước"} mau={mau} />
              </div>
            </div>
          )}
          {supportsWebsite && (
            <div className="space-y-1.5">
              <Label>Trang web</Label>
              <Input value={trangWeb} onChange={(e) => setTrangWeb(e.target.value)} placeholder="VD: https://www.honeywell.com" type="url" />
            </div>
          )}
          {supportsXuatXu && (
            <div className="space-y-1.5">
              <Label>Xuất xứ</Label>
              <Input value={xuatXu} onChange={(e) => setXuatXu(e.target.value)} placeholder="VD: Mỹ, Đức, Nhật Bản…" />
            </div>
          )}
          {supportsLogo && (
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                    : <Factory className="h-6 w-6 text-muted-foreground/40" />}
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { void pickLogo(e.target.files?.[0]); e.target.value = ""; }}
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                      <ImageUp className="mr-1.5 h-3.5 w-3.5" /> Chọn ảnh
                    </Button>
                    {logoPreview && (
                      <Button type="button" variant="ghost" size="sm" onClick={clearLogo}>
                        <X className="mr-1.5 h-3.5 w-3.5" /> Xoá
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Tự động nén còn 512px để nhẹ.</p>
                </div>
              </div>
            </div>
          )}
          {supportsGhiChu && (
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2} placeholder="Ghi chú thêm (không bắt buộc)…" />
            </div>
          )}
          {supportsParent && (
            <div className="space-y-1.5">
              <Label>Trực thuộc <span className="text-muted-foreground">({singular.toLowerCase()} cấp trên)</span></Label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— Không trực thuộc (cấp cao nhất) —</option>
                {chonCapTren.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.ten}{o.ma ? ` (${o.ma})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} id="cat-active" />
            <Label htmlFor="cat-active" className="cursor-pointer">Đang sử dụng</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Huỷ</Button>
          <Button onClick={save} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Hộp thoại: gộp nhiều mục đã chọn thành một mục giữ lại. */
function MergeCatalogDialog({
  rows, singular, pending, onClose, onMerge,
}: {
  rows: Row[];
  singular: string;
  pending: boolean;
  onClose: () => void;
  onMerge: (target: Row) => void;
}) {
  // Mặc định giữ lại mục có nhiều tài sản nhất.
  const [targetId, setTargetId] = useState<string>(
    () => [...rows].sort((a, b) => b.soThietBi - a.soThietBi)[0]?.id ?? rows[0]?.id,
  );
  const target = rows.find((r) => r.id === targetId);
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" /> Gộp {rows.length} {singular.toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            Chọn mục <b>giữ lại</b>. Toàn bộ tài sản, mục con và hình ảnh của các mục còn lại sẽ chuyển sang mục này, rồi các mục kia bị xoá. Thao tác không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-1.5 overflow-auto py-1">
          {rows.map((r) => (
            <label
              key={r.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                r.id === targetId ? "border-primary bg-primary/5" : "hover:bg-muted/40",
              )}
            >
              <input
                type="radio"
                name="merge-target"
                checked={r.id === targetId}
                onChange={() => setTargetId(r.id)}
                className="accent-primary"
              />
              <span className="truncate font-medium">{r.ten}</span>
              {r.soThietBi > 0 && (
                <Badge variant="secondary" className="ml-auto gap-1 text-[10px]">
                  <Boxes className="h-3 w-3" /> {r.soThietBi.toLocaleString("vi-VN")}
                </Badge>
              )}
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button
            className="gap-1.5"
            disabled={pending || !target}
            onClick={() => target && onMerge(target)}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
            Gộp vào mục giữ lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Hộp thoại: chọn nhiều mục (trùng nhau) để gộp — dùng được ở cả sơ đồ cây. */
function MergePickDialog({
  rows, singular, onClose, onContinue,
}: {
  rows: Row[];
  singular: string;
  onClose: () => void;
  onContinue: (selected: Row[]) => void;
}) {
  const [q, setQ] = useState("");
  const [ids, setIds] = useState<Set<string>>(new Set());
  const filtered = rows.filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return r.ten.toLowerCase().includes(s) || (r.ma ?? "").toLowerCase().includes(s);
  });
  const toggle = (id: string) =>
    setIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const selected = rows.filter((r) => ids.has(r.id));
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" /> Gộp {singular.toLowerCase()} trùng
          </DialogTitle>
          <DialogDescription>
            Chọn từ 2 mục trùng nhau trở lên. Bước tiếp theo bạn sẽ chọn mục <b>giữ lại</b>.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Tìm ${singular.toLowerCase()}, mã…`} className="pl-8" />
        </div>
        <div className="max-h-[50vh] space-y-1.5 overflow-auto py-1">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Không tìm thấy {singular.toLowerCase()}.</p>
          )}
          {filtered.map((r) => (
            <label
              key={r.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                ids.has(r.id) ? "border-primary bg-primary/5" : "hover:bg-muted/40",
              )}
            >
              <input
                type="checkbox"
                checked={ids.has(r.id)}
                onChange={() => toggle(r.id)}
                className="accent-primary"
              />
              <span className="truncate font-medium">{r.ten}</span>
              {r.ma && <CodeBadge code={r.ma} />}
              {r.soThietBi > 0 && (
                <Badge variant="secondary" className="ml-auto gap-1 text-[10px]">
                  <Boxes className="h-3 w-3" /> {r.soThietBi.toLocaleString("vi-VN")}
                </Badge>
              )}
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button
            className="gap-1.5"
            disabled={selected.length < 2}
            onClick={() => onContinue(selected)}
          >
            <GitMerge className="h-4 w-4" /> Tiếp tục ({selected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
