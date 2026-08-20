import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package, Plus, Search, ImageUp, Loader2, Pencil, Trash2, Factory, Tag, Boxes, X,
  LayoutGrid, List as ListIcon, Info, MapPin, Building2, GitMerge, ChevronRight, Layers, AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";
import { StandardTable } from "@/components/mirats/StandardTable";
import { CardGridSkeleton } from "@/components/mirats/Skeletons";
import { CatalogTools } from "@/components/mirats/CatalogTools";
import { ModelTaiLieu } from "@/components/mirats/ModelTaiLieu";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";


import { ImageCropDialog } from "@/components/mirats/ImageCropDialog";
import { ModelDacTinhIODialog } from "@/components/mirats/ModelDacTinhIODialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";
import { useSession } from "@/hooks/use-session";
import { normalize } from "@/lib/mirats/global-search";
import { sortDacTinh, diffModelDacTinh } from "@/lib/mirats/dac-tinh";
import { invalidateTaxonomy } from "@/lib/mirats/db-taxonomy";
import { updateEntityRow } from "@/lib/mirats/rename-entity";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/danh-muc/model")({
  validateSearch: (s: Record<string, unknown>): { q?: string; edit?: string; filter?: "thieu-loai" } => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q : undefined,
    edit: typeof s.edit === "string" && s.edit.trim() ? s.edit : undefined,
    filter: s.filter === "thieu-loai" ? "thieu-loai" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Model — Danh mục MIRATS" },
      { name: "description", content: "Danh mục model: hình ảnh minh hoạ, nhà sản xuất, chủng loại và số tài sản đang dùng." },

    ],
  }),
  component: ModelCatalogPage,
});

const BUCKET = "model-anh";
const URL_TTL = 315360000; // ~10 năm

type ModelRow = {
  id: string;
  ma: string | null;
  ten: string;
  p_n: string | null;
  mo_ta: string | null;
  hinh_anh: string | null;
  active: boolean;
  nha_san_xuat_id: string | null;
  loai_thiet_bi_id: string | null;
  field_set_id: string | null;
  nhaSanXuat: string;
  loaiThietBi: string;
  fieldSetTen: string;
  imgUrl: string;
  soThietBi: number;
};

type DmRef = { id: string; ten: string };

/** URL Google tìm kiếm sản phẩm theo tên mẫu + P/N + nhà sản xuất. */
function googleSearchUrl(m: ModelRow) {
  const q = [m.nhaSanXuat, m.ten, m.p_n].filter(Boolean).join(" ").trim();
  // `igu=1` giúp Google không bị chặn khi Lovable preview đang chạy trong iframe.
  return `https://www.google.com/search?igu=1&q=${encodeURIComponent(q)}`;
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

/** Tạo mã danh mục từ tên (bỏ dấu, viết hoa, thay ký tự đặc biệt). */
function slug(name: string): string {
  const s = normalize(name).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return s.slice(0, 40) || "MODEL_" + Date.now().toString(36).toUpperCase();
}

/** Tìm danh mục theo tên (không phân biệt hoa/thường, dấu) hoặc tạo mới. */
async function resolveDmId(table: "dm_nha_san_xuat" | "dm_loai_thiet_bi", name: string): Promise<string | null> {
  const t = name.trim();
  if (!t) return null;
  const { data: found } = await supabase.from(table).select("id,ten").limit(2000);
  const hit = (found ?? []).find((r) => normalize((r as DmRef).ten) === normalize(t));
  if (hit) return (hit as DmRef).id;
  const { data: ins, error } = await supabase
    .from(table)
    .insert({ ma: slug(t), ten: t, active: true })
    .select("id")
    .single();
  if (error) throw error;
  return (ins as { id: string }).id;
}

function ModelCatalogPage() {
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const qc = useQueryClient();
  const { q: qParam, edit: editParam, filter: filterParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(qParam ?? "");
  const [nsxFilter, setNsxFilter] = useState<string>("");
  const [loaiFilter, setLoaiFilter] = useState<string>("");
  const [tenFilter, setTenFilter] = useState<string>("");
  const [pnFilter, setPnFilter] = useState<string>("");
  const [editing, setEditing] = useState<ModelRow | "new" | null>(null);
  const [dacTinhIOOpen, setDacTinhIOOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [infoModel, setInfoModel] = useState<ModelRow | null>(null);
  const [mergeList, setMergeList] = useState<ModelRow[] | null>(null);
  const [googleLink, setGoogleLink] = useState<{ model: ModelRow; url: string } | null>(null);

  async function showGoogleSearch(e: MouseEvent<HTMLElement>, m: ModelRow) {
    e.stopPropagation();
    const url = googleSearchUrl(m);
    setGoogleLink({ model: m, url });
    try {
      await copyTextToClipboard(url);
      toast.success("Đã sao chép link tìm kiếm Google");
    } catch {
      toast.message("Đã tạo link tìm kiếm", { description: "Copy thủ công nếu Chrome chặn clipboard trong preview." });
    }
  }

  // Danh sách nhà sản xuất & chủng loại (cho combobox tạo/sửa).
  const { data: refs } = useQuery({
    queryKey: ["model_refs"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [nsx, ltb, fs] = await Promise.all([
        supabase.from("dm_nha_san_xuat").select("id,ten").order("ten"),
        supabase.from("dm_loai_thiet_bi").select("id,ten").order("ten"),
        supabase.from("field_set").select("id,ten").order("ten"),
      ]);
      return {
        nsx: (nsx.data ?? []) as DmRef[],
        ltb: (ltb.data ?? []) as DmRef[],
        fs: (fs.data ?? []) as DmRef[],
      };
    },
  });

  const { data: models, isLoading, error } = useQuery({
    queryKey: ["model_catalog"],
    queryFn: async (): Promise<ModelRow[]> => {
      const { data, error } = await supabase
        .from("dm_model")
        .select("id,ma,ten,p_n,mo_ta,hinh_anh,active,nha_san_xuat_id,loai_thiet_bi_id,field_set_id,dm_nha_san_xuat(ten),dm_loai_thiet_bi(ten),field_set(ten)")
        .order("ten");
      if (error) throw error;
      const rows = (data ?? []) as Record<string, any>[];

      // Đếm số tài sản theo model_id — phân trang 1000/lần vì
      // `thiet_bi` đã vượt/tiệm cận 1000 dòng, mặc định PostgREST sẽ cắt.
      const counts = new Map<string, number>();
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data: tb } = await supabase
          .from("thiet_bi")
          .select("model_id")
          .not("model_id", "is", null)
          .range(from, from + PAGE - 1);
        const batch = (tb ?? []) as { model_id: string }[];
        for (const t of batch) {
          counts.set(t.model_id, (counts.get(t.model_id) ?? 0) + 1);
        }
        if (batch.length < PAGE) break;
      }


      // Ký URL ảnh hàng loạt.
      const paths = rows.map((r) => r.hinh_anh).filter(Boolean) as string[];
      const urlMap = new Map<string, string>();
      if (paths.length) {
        const { data: signed } = await storage.from(BUCKET).createSignedUrls(paths, URL_TTL);
        for (const s of signed ?? []) if (s.path && s.signedUrl) urlMap.set(s.path, s.signedUrl);
      }

      return rows.map((r) => ({
        id: r.id,
        ma: r.ma,
        ten: r.ten,
        p_n: r.p_n,
        mo_ta: r.mo_ta,
        hinh_anh: r.hinh_anh,
        active: r.active,
        nha_san_xuat_id: r.nha_san_xuat_id,
        loai_thiet_bi_id: r.loai_thiet_bi_id,
        field_set_id: r.field_set_id,
        nhaSanXuat: r.dm_nha_san_xuat?.ten ?? "",
        loaiThietBi: r.dm_loai_thiet_bi?.ten ?? "",
        fieldSetTen: r.field_set?.ten ?? "",
        imgUrl: r.hinh_anh ? urlMap.get(r.hinh_anh) ?? "" : "",
        soThietBi: counts.get(r.id) ?? 0,
      }));
    },
  });

  // Mở thẳng hộp thoại sửa mẫu khi được điều hướng kèm ?edit=<id> (từ sidebar cây).
  const openedEditRef = useRef<string | null>(null);
  useEffect(() => {
    if (!editParam || !models || openedEditRef.current === editParam) return;
    const m = models.find((x) => x.id === editParam);
    if (m) {
      openedEditRef.current = editParam;
      setEditing(m);
    }
  }, [editParam, models]);



  // Filter thu hẹp dần: NSX → Chủng loại → Tên mẫu → P/N.
  // Mỗi filter sau chỉ hiện các giá trị còn lại sau khi đã áp dụng các filter trước.
  const all = models ?? [];
  const afterNsx = useMemo(
    () => all.filter((m) => !nsxFilter || (m.nhaSanXuat || "(Chưa có NSX)") === nsxFilter),
    [all, nsxFilter],
  );
  const afterLoai = useMemo(
    () => afterNsx.filter((m) => !loaiFilter || (m.loaiThietBi || "(Chưa phân loại)") === loaiFilter),
    [afterNsx, loaiFilter],
  );
  const afterTen = useMemo(
    () => afterLoai.filter((m) => !tenFilter || m.ten === tenFilter),
    [afterLoai, tenFilter],
  );
  const afterPn = useMemo(
    () => afterTen.filter((m) => !pnFilter || (m.p_n ?? "(Không P/N)") === pnFilter),
    [afterTen, pnFilter],
  );

  function buildOpts(list: ModelRow[], get: (m: ModelRow) => string, empty: string) {
    const set = new Map<string, number>();
    for (const m of list) {
      const k = get(m) || empty;
      set.set(k, (set.get(k) ?? 0) + 1);
    }
    return Array.from(set.entries()).sort((a, b) => a[0].localeCompare(b[0], "vi"));
  }
  const nsxOptions = useMemo(() => buildOpts(all, (m) => m.nhaSanXuat, "(Chưa có NSX)"), [all]);
  const loaiOptions = useMemo(() => buildOpts(afterNsx, (m) => m.loaiThietBi, "(Chưa phân loại)"), [afterNsx]);
  const tenOptions = useMemo(() => buildOpts(afterLoai, (m) => m.ten, "(Không tên)"), [afterLoai]);
  const pnOptions = useMemo(() => buildOpts(afterTen, (m) => m.p_n ?? "", "(Không P/N)"), [afterTen]);

  // Nếu giá trị filter con không còn hợp lệ sau khi filter cha đổi → tự reset.
  useEffect(() => { if (loaiFilter && !loaiOptions.some(([k]) => k === loaiFilter)) setLoaiFilter(""); }, [loaiOptions, loaiFilter]);
  useEffect(() => { if (tenFilter && !tenOptions.some(([k]) => k === tenFilter)) setTenFilter(""); }, [tenOptions, tenFilter]);
  useEffect(() => { if (pnFilter && !pnOptions.some(([k]) => k === pnFilter)) setPnFilter(""); }, [pnOptions, pnFilter]);

  const thieuLoaiCount = useMemo(
    () => (models ?? []).filter((m) => !m.loai_thiet_bi_id).length,
    [models],
  );

  const filtered = useMemo(() => {
    const nq = normalize(q);
    return afterPn.filter((m) => {
      if (filterParam === "thieu-loai" && m.loai_thiet_bi_id) return false;
      if (!nq) return true;
      return (
        normalize(m.ten).includes(nq) ||
        normalize(m.p_n ?? "").includes(nq) ||
        normalize(m.nhaSanXuat).includes(nq) ||
        normalize(m.loaiThietBi).includes(nq)
      );
    });
  }, [afterPn, q, filterParam]);

  const delMut = useMutation({
    mutationFn: async (m: ModelRow) => {
      if (m.soThietBi > 0) throw new Error(`Không thể xoá: còn ${m.soThietBi} tài sản đang dùng mẫu này.`);
      if (m.hinh_anh) await storage.from(BUCKET).remove([m.hinh_anh]);
      // DB-level guard qua RPC dm_xoa_an_toan (Task 11).
      const { error } = await supabase.rpc("dm_xoa_an_toan" as never, { _bang: "dm_model", _id: m.id } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["model_catalog"] });
      invalidateTaxonomy(qc);
      toast.success("Đã xoá model.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Xoá hàng loạt các mẫu đã tích chọn (bỏ qua mẫu còn tài sản đang dùng).
  const bulkDelMut = useMutation({
    mutationFn: async (list: ModelRow[]) => {
      const removable = list.filter((m) => m.soThietBi === 0);
      const blocked = list.length - removable.length;
      if (removable.length === 0) throw new Error("Các mẫu đã chọn đều còn tài sản đang dùng — không thể xoá.");
      const paths = removable.map((m) => m.hinh_anh).filter((p): p is string => !!p);
      if (paths.length) await storage.from(BUCKET).remove(paths);
      for (const m of removable) {
        const { error } = await supabase.rpc("dm_xoa_an_toan" as never, { _bang: "dm_model", _id: m.id } as never);
        if (error) throw error;
      }
      return { deleted: removable.length, blocked };
    },
    onSuccess: ({ deleted, blocked }) => {
      qc.invalidateQueries({ queryKey: ["model_catalog"] });
      invalidateTaxonomy(qc);
      toast.success(`Đã xoá ${deleted} model${blocked > 0 ? ` · bỏ qua ${blocked} mẫu còn tài sản đang dùng` : ""}.`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Gộp các mẫu đã chọn thành một mẫu đích (giữ liên kết tài sản qua RPC gop_model).
  const mergeMut = useMutation({
    mutationFn: async ({ target, sources }: { target: ModelRow; sources: ModelRow[] }) => {
      const srcIds = sources.map((s) => s.id).filter((id) => id !== target.id);
      if (srcIds.length === 0) throw new Error("Không có mẫu nguồn để gộp.");
      // Dọn ảnh của các mẫu nguồn (mẫu đích giữ ảnh của nó).
      const paths = sources.filter((s) => s.id !== target.id && s.hinh_anh).map((s) => s.hinh_anh!) as string[];
      const { error } = await supabase.rpc("gop_model", { p_source_ids: srcIds, p_target_id: target.id });
      if (error) throw error;
      if (paths.length) await storage.from(BUCKET).remove(paths);
      return srcIds.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["model_catalog"] });
      qc.invalidateQueries({ queryKey: ["catalog-tools", "dm_model"] });
      invalidateTaxonomy(qc);
      setMergeList(null);
      toast.success(`Đã gộp ${n} mẫu vào mẫu đích. Tài sản liên quan đã được chuyển sang mẫu đích.`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className={`space-y-4 ${UI_DENSITY.PAGE_PADDING}`}>
      <PageHeader
        icon={Package}
        title="Model"
        subtitle="Quản lý mẫu tài sản & hình ảnh"
        help="Gắn hình ảnh minh hoạ, nhà sản xuất và chủng loại. Tài sản chọn model để kế thừa thông tin."
        actions={
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <CatalogTools
                config={{
                  table: "dm_model",
                  rpc: "gop_model",
                  labelSingular: "model",
                  slugPrefix: "MODEL",
                  textCols: [
                    { key: "p_n", header: "P/N" },
                    { key: "mo_ta", header: "Mô tả" },
                  ],
                  refs: [
                    { col: "nha_san_xuat_id", refTable: "dm_nha_san_xuat", csvKey: "nha_san_xuat", header: "Nhà sản xuất" },
                    { col: "loai_thiet_bi_id", refTable: "dm_loai_thiet_bi", csvKey: "loai_thiet_bi", header: "Chủng loại" },
                  ],
                  counts: [{ key: "tb", header: "Tài sản", rels: [{ table: "thiet_bi", col: "model_id" }] }],
                }}
              />
              <Button variant="outline" onClick={() => setDacTinhIOOpen(true)} className="gap-1.5">
                <Tag className="h-4 w-4" /> Nhãn tài sản · Nhập/Xuất
              </Button>
              <Button onClick={() => setEditing("new")} variant="default" className="gap-1.5 shadow-none">
                <Plus className="h-4 w-4" /> Thêm mẫu
              </Button>
            </div>
          ) : null
        }
      />


      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mẫu, số model, nhà sản xuất…" className="pl-8" />
        </div>
        <Combobox
          className="w-full sm:w-48"
          value={nsxFilter || "__all__"}
          onChange={(v) => setNsxFilter(v === "__all__" ? "" : v)}
          placeholder="Tất cả NSX"
          searchPlaceholder="Tìm nhà sản xuất…"
          options={[{ value: "__all__", label: `Tất cả NSX (${all.length})` }, ...nsxOptions.map(([name, n]) => ({ value: name, label: `${name} (${n})` }))]}
        />
        <Combobox
          className="w-full sm:w-48"
          value={loaiFilter || "__all__"}
          onChange={(v) => setLoaiFilter(v === "__all__" ? "" : v)}
          placeholder="Tất cả chủng loại"
          searchPlaceholder="Tìm chủng loại…"
          options={[{ value: "__all__", label: `Tất cả chủng loại (${afterNsx.length})` }, ...loaiOptions.map(([name, n]) => ({ value: name, label: `${name} (${n})` }))]}
        />
        <Combobox
          className="w-full sm:w-48"
          value={tenFilter || "__all__"}
          onChange={(v) => setTenFilter(v === "__all__" ? "" : v)}
          placeholder="Tất cả tên mẫu"
          searchPlaceholder="Tìm tên mẫu…"
          options={[{ value: "__all__", label: `Tất cả tên mẫu (${afterLoai.length})` }, ...tenOptions.map(([name, n]) => ({ value: name, label: `${name} (${n})` }))]}
        />
        <Combobox
          className="w-full sm:w-44"
          value={pnFilter || "__all__"}
          onChange={(v) => setPnFilter(v === "__all__" ? "" : v)}
          placeholder="Tất cả P/N"
          searchPlaceholder="Tìm P/N…"
          options={[{ value: "__all__", label: `Tất cả P/N (${afterTen.length})` }, ...pnOptions.map(([name, n]) => ({ value: name, label: `${name} (${n})` }))]}
        />
        {(nsxFilter || loaiFilter || tenFilter || pnFilter) && (
          <Button
            variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground"
            onClick={() => { setNsxFilter(""); setLoaiFilter(""); setTenFilter(""); setPnFilter(""); }}
            title="Bỏ tất cả filter"
          >
            <X className="h-3.5 w-3.5" /> Bỏ filter
          </Button>
        )}
        {(thieuLoaiCount > 0 || filterParam === "thieu-loai") && (
          <Button
            variant={filterParam === "thieu-loai" ? "default" : "outline"}
            size="sm"
            className={cn("h-9 gap-1.5", filterParam === "thieu-loai" && "bg-amber-600 hover:bg-amber-700")}
            onClick={() => navigate({ search: (s: { q?: string; edit?: string; filter?: "thieu-loai" }) => ({ ...s, filter: filterParam === "thieu-loai" ? undefined : "thieu-loai" as const }) })}
            title="Các mẫu tự tạo khi nhập liệu, chưa khai chủng loại"
          >
            <AlertTriangle className="h-4 w-4" />
            Thiếu chủng loại <Badge variant="secondary" className="ml-1">{thieuLoaiCount}</Badge>
            {filterParam === "thieu-loai" && <X className="ml-1 h-3 w-3" />}
          </Button>
        )}
        <div className="ml-auto inline-flex overflow-hidden rounded-md border">
          <button
            onClick={() => setViewMode("table")}
            className={cn("flex items-center gap-1 px-2.5 py-1 text-xs transition-colors", viewMode === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            title="Dạng bảng"
          >
            <ListIcon className="h-3.5 w-3.5" /> Bảng
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn("flex items-center gap-1 px-2.5 py-1 text-xs transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            title="Dạng lưới"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Lưới
          </button>
        </div>
      </div>

      {isLoading && viewMode === "grid" && (
        <CardGridSkeleton items={10} />
      )}
      {error && <p className="text-sm text-destructive">Lỗi tải dữ liệu: {(error as Error).message}</p>}

      {!isLoading && !error && viewMode === "grid" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((m) => (
              <ModelCard key={m.id} m={m} canManage={canManage} onGoogleSearch={showGoogleSearch} onInfo={() => setInfoModel(m)} onEdit={() => setEditing(m)} onDelete={() => delMut.mutate(m)} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Không có model phù hợp.</p>
          )}
        </>
      )}

      {!error && viewMode === "table" && (
        <StandardTable<ModelRow>
          tableKey="catalog:dm_model"
          trangThai={{ dangTai: isLoading }}
          rows={filtered}
          getRowId={(m) => m.id}
          rowClassName={(m) => (!m.active ? "opacity-60" : "")}
          emptyText="Không có model phù hợp."
          countUnit="mẫu"
          requireFilterToShow={false}
          selectable={canManage}
          bulkActions={({ selectedRows, clear }) => (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                disabled={selectedRows.length < 2}
                onClick={() => {
                  if (selectedRows.length < 2) { toast.error("Chọn ít nhất 2 mẫu để gộp."); return; }
                  setMergeList(selectedRows);
                }}
                title="Gộp các mẫu đã chọn thành một"
              >
                <GitMerge className="h-3.5 w-3.5" /> Gộp đã chọn
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 gap-1.5"
                disabled={bulkDelMut.isPending}
                onClick={() => {
                  const removable = selectedRows.filter((m) => m.soThietBi === 0).length;
                  if (removable === 0) { toast.error("Các mẫu đã chọn đều còn tài sản đang dùng — không thể xoá."); return; }
                  if (!confirm(`Xoá ${removable} model đã chọn? Thao tác không thể hoàn tác.`)) return;
                  bulkDelMut.mutate(selectedRows, { onSuccess: () => clear() });
                }}
              >
                {bulkDelMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Xoá đã chọn
              </Button>
            </div>
          )}
          columns={[
            { key: "anh", label: "Ảnh", minW: "min-w-[56px]", cell: (m) => <ModelThumb m={m} /> },
            { key: "ten", label: "Tên mẫu", minW: "min-w-[200px]", filter: "text", value: (m) => m.ten,
              cell: (m) => <span className="font-medium">{m.ten}</span> },
            { key: "p_n", label: "P/N", minW: "min-w-[130px]", filter: "text", value: (m) => m.p_n ?? "",
              cell: (m) => <span className="font-mono text-xs text-muted-foreground">{m.p_n || "—"}</span> },
            { key: "nhaSanXuat", label: "Nhà sản xuất", minW: "min-w-[160px]", filter: "cat", value: (m) => m.nhaSanXuat,
              cell: (m) => m.nhaSanXuat
                ? <NsxLink name={m.nhaSanXuat} className="text-sm" />
                : <span className="text-muted-foreground">—</span> },
            { key: "loaiThietBi", label: "Chủng loại", minW: "min-w-[150px]", filter: "cat", value: (m) => m.loaiThietBi,
              cell: (m) => m.loaiThietBi
                ? <LtbLink name={m.loaiThietBi} className="text-sm" />
                : <span className="text-muted-foreground">—</span> },
            { key: "soThietBi", label: "Số TB", align: "center", value: (m) => m.soThietBi,
              cell: (m) => m.soThietBi > 0
                ? <Badge variant="secondary" className="gap-1 text-[10px]"><Boxes className="h-3 w-3" /> {m.soThietBi}</Badge>
                : <span className="text-muted-foreground">0</span> },
            { key: "info", label: "", align: "center" as const,
              cell: (m: ModelRow) => (
                <div className="flex items-center justify-center gap-0.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground transition-colors hover:text-primary" onClick={(e) => showGoogleSearch(e, m)} title="Tạo link tìm sản phẩm trên Google" aria-label="Tìm trên Google">
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                  <HoverCard openDelay={120} closeDelay={60}>
                    <HoverCardTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground transition-colors hover:text-primary" onClick={() => setInfoModel(m)} title="Xem thông số & tài sản đang dùng mẫu này" aria-label="Thông tin mẫu">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent side="left" align="start" className="w-72 overflow-hidden p-0">
                      <ModelUsageHoverCard m={m} />
                    </HoverCardContent>
                  </HoverCard>
                </div>
              ),
            },
            ...(canManage ? [{
              key: "actions", label: "", align: "right" as const,
              cell: (m: ModelRow) => (
                <div className="flex justify-end gap-1 whitespace-nowrap">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(m)} title="Sửa" aria-label="Sửa mẫu">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => delMut.mutate(m)} title="Xoá" aria-label="Xoá mẫu">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ),
            }] : []),
          ]}
        />
      )}


      {editing && (
        <ModelDialog
          value={editing === "new" ? null : editing}
          nsxList={refs?.nsx ?? []}
          ltbList={refs?.ltb ?? []}
          fsList={refs?.fs ?? []}
          canManage={canManage}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["model_catalog"] });
            qc.invalidateQueries({ queryKey: ["model_refs"] });
            invalidateTaxonomy(qc);
          }}
        />
      )}

      {infoModel && (
        <ModelUsageDialog model={infoModel} onClose={() => setInfoModel(null)} />
      )}

      {mergeList && (
        <MergeModelsDialog
          models={mergeList}
          pending={mergeMut.isPending}
          onClose={() => setMergeList(null)}
          onMerge={(target) => mergeMut.mutate({ target, sources: mergeList })}
        />
      )}

      {googleLink && (
        <GoogleSearchLinkDialog
          model={googleLink.model}
          url={googleLink.url}
          onClose={() => setGoogleLink(null)}
        />
      )}
      <ModelDacTinhIODialog open={dacTinhIOOpen} onOpenChange={setDacTinhIOOpen} canManage={canManage} />
    </div>
  );
}

function GoogleSearchLinkDialog({ model, url, onClose }: { model: ModelRow; url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await copyTextToClipboard(url);
      setCopied(true);
      toast.success("Đã sao chép link tìm kiếm Google");
    } catch {
      toast.error("Chrome đang chặn clipboard — hãy bôi đen link để copy thủ công.");
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tìm mẫu trên Google</DialogTitle>
          <DialogDescription>
            {model.ten}{model.p_n ? ` · ${model.p_n}` : ""}{model.nhaSanXuat ? ` · ${model.nhaSanXuat}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Google/Chrome có thể chặn mở trực tiếp từ khung preview. Link bên dưới dùng được khi dán vào tab mới.
          </p>
          <Input value={url} readOnly onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={copy}>{copied ? "Đã copy" : "Copy link"}</Button>
          <Button asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">Mở tab mới</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModelCard({ m, canManage, onGoogleSearch, onInfo, onEdit, onDelete }: { m: ModelRow; canManage: boolean; onGoogleSearch: (e: MouseEvent<HTMLElement>, m: ModelRow) => void; onInfo: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className={cn("group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", !m.active && "opacity-60")}>
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-muted/20 via-muted/40 to-muted/60 [perspective:800px]">
        {m.imgUrl ? (
          <img
            src={m.imgUrl}
            alt={m.ten}
            className="h-full w-full object-contain p-2 transition-all duration-500 ease-out will-change-transform group-hover:[transform:translateY(-4px)_scale(1.12)] group-hover:drop-shadow-[0_16px_18px_rgba(0,0,0,0.35)]"
            loading="lazy"
          />
        ) : (
          <Package className="h-10 w-10 text-muted-foreground/40 transition-transform duration-500 group-hover:scale-110" />
        )}
        {m.soThietBi > 0 && (
          <Badge variant="secondary" className="absolute right-1.5 top-1.5 gap-1 text-[10px]">
            <Boxes className="h-3 w-3" /> {m.soThietBi}
          </Badge>
        )}
        <div className="absolute left-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="icon" variant="secondary" aria-label="Tìm trên Google"
            className="h-7 w-7"
            onClick={(e) => onGoogleSearch(e, m)}
            title="Tạo link tìm sản phẩm trên Google"
            aria-label="Tìm trên Google"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <HoverCard openDelay={120} closeDelay={60}>
            <HoverCardTrigger asChild>
              <Button
                size="icon" variant="secondary" aria-label="Thông tin mẫu"
                className="h-7 w-7"
                onClick={onInfo} title="Xem thông số & tài sản đang dùng mẫu này" aria-label="Thông tin mẫu">
                <Info className="h-3.5 w-3.5" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent side="right" align="start" className="w-72 overflow-hidden p-0">
              <ModelUsageHoverCard m={m} />
            </HoverCardContent>
          </HoverCard>
        </div>
        {canManage && (
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="icon" variant="secondary" className="h-7 w-7" onClick={onEdit} title="Sửa" aria-label="Sửa mẫu">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="secondary" className="h-7 w-7" onClick={onDelete} title="Xoá" aria-label="Xoá mẫu">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      <CardContent className="space-y-1 p-2.5">
        <p className="truncate text-sm font-medium" title={m.ten}>{m.ten}</p>
        {m.p_n && <p className="truncate font-mono text-xs text-muted-foreground">{m.p_n}</p>}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {m.nhaSanXuat && (
            <NsxLink name={m.nhaSanXuat} className="rounded bg-muted px-1.5 py-0.5 text-[10px]" />
          )}
          {m.loaiThietBi && (
            <LtbLink name={m.loaiThietBi} className="rounded bg-muted px-1.5 py-0.5 text-[10px]" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ModelThumb({ m }: { m: ModelRow }) {
  if (!m.imgUrl) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted/40">
        <Package className="h-4 w-4 text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <HoverCard openDelay={80} closeDelay={40}>
      <HoverCardTrigger asChild>
        <img
          src={m.imgUrl}
          alt={m.ten}
          loading="lazy"
          className="h-10 w-10 cursor-zoom-in rounded border bg-muted/40 object-contain p-0.5"
        />
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-64 p-2">
        <img src={m.imgUrl} alt={m.ten} className="max-h-64 w-full rounded object-contain" />
        <p className="mt-1.5 truncate text-center text-xs font-medium">{m.ten}</p>
      </HoverCardContent>
    </HoverCard>
  );
}

/** Hyperlink nhảy tới danh mục nhà sản xuất (lọc sẵn theo tên). */
function NsxLink({ name, className }: { name: string; className?: string }) {
  return (
    <Link
      to="/danh-muc/nha-san-xuat"
      search={{ q: name }}
      onClick={(e) => e.stopPropagation()}
      title={`Xem nhà sản xuất: ${name}`}
      className={cn(
        "group/lnk inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary",
        className,
      )}
    >
      <Factory className="h-3 w-3 transition-transform group-hover/lnk:scale-110" />
      <span className="underline-offset-2 group-hover/lnk:underline">{name}</span>
    </Link>
  );
}

/** Hyperlink nhảy tới danh mục chủng loại (lọc sẵn theo tên). */
function LtbLink({ name, className }: { name: string; className?: string }) {
  return (
    <Link
      to="/danh-muc/loai-thiet-bi"
      search={{ q: name }}
      onClick={(e) => e.stopPropagation()}
      title={`Xem chủng loại: ${name}`}
      className={cn(
        "group/lnk inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary",
        className,
      )}
    >
      <Tag className="h-3 w-3 transition-transform group-hover/lnk:scale-110" />
      <span className="underline-offset-2 group-hover/lnk:underline">{name}</span>
    </Link>
  );
}

/** Thẻ hover xem nhanh thông số & minh hoạ của một model. */
function ModelInfoCard({ m }: { m: ModelRow }) {
  return (
    <div className="animate-in fade-in-0 zoom-in-95 duration-150">
      <div className="flex gap-3 border-b bg-muted/40 p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border bg-background">
          {m.imgUrl
            ? <img src={m.imgUrl} alt={m.ten} className="h-full w-full object-contain p-1" loading="lazy" />
            : <Package className="h-7 w-7 text-muted-foreground/40" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug">{m.ten}</p>
          {m.p_n && <p className="mt-0.5 font-mono text-xs text-muted-foreground">P/N: {m.p_n}</p>}
          <Badge variant="secondary" className="mt-1 gap-1 text-[10px]">
            <Boxes className="h-3 w-3" /> {m.soThietBi} tài sản
          </Badge>
        </div>
      </div>
      <div className="space-y-1.5 p-3 text-xs">
        {m.nhaSanXuat && (
          <div className="flex gap-2">
            <span className="w-24 shrink-0 text-muted-foreground">Nhà sản xuất</span>
            <span className="min-w-0 flex-1 break-words font-medium">{m.nhaSanXuat}</span>
          </div>
        )}
        {m.loaiThietBi && (
          <div className="flex gap-2">
            <span className="w-24 shrink-0 text-muted-foreground">Chủng loại</span>
            <span className="min-w-0 flex-1 break-words font-medium">{m.loaiThietBi}</span>
          </div>
        )}
        {m.fieldSetTen && (
          <div className="flex gap-2">
            <span className="w-24 shrink-0 text-muted-foreground">Bộ trường</span>
            <span className="min-w-0 flex-1 break-words font-medium">{m.fieldSetTen}</span>
          </div>
        )}
        {m.mo_ta && <p className="line-clamp-3 pt-1 text-muted-foreground">{m.mo_ta}</p>}
        <p className="flex items-center gap-1 pt-1 text-[11px] font-medium text-primary">
          Bấm để xem tài sản đang dùng mẫu này <ChevronRight className="h-3 w-3" />
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hover: xem nhanh tài sản đang dùng mẫu (không cần số serial & mã tài sản).
// ---------------------------------------------------------------------------
function ModelUsageHoverCard({ m }: { m: ModelRow }) {
  const { data, isLoading } = useQuery({
    queryKey: ["model_usage", m.id],
    queryFn: async (): Promise<UsageRow[]> => {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select("id,ma_thiet_bi,ten_thiet_bi,ma_serial,vi_tri_id,don_vi_quan_ly_id,don_vi_id,he_thong_id,dm_vi_tri:vi_tri_id(ten),qly:don_vi_quan_ly_id(ten),dv:don_vi_id(ten),ht:he_thong_id(ten)")
        .eq("model_id", m.id)
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
    staleTime: 30_000,
  });

  const rows = data ?? [];

  return (
    <div className="animate-in fade-in-0 zoom-in-95 duration-150">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <Boxes className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-snug">{m.ten}</p>
          <p className="text-[11px] text-muted-foreground">{m.soThietBi} tài sản đang dùng mẫu</p>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto p-2 text-xs">
        {isLoading && (
          <div className="flex items-center gap-2 px-1 py-3 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải…
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <p className="px-1 py-3 text-center text-muted-foreground">Chưa có tài sản nào dùng mẫu này.</p>
        )}
        {!isLoading && rows.length > 0 && (
          <div className="space-y-1">
            {rows.slice(0, 10).map((r) => (
              <div key={r.id} className="rounded border bg-muted/30 px-2 py-1.5">
                <p className="truncate font-medium">{r.ten || "(Không tên)"}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
                  {r.donVi && (
                    <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {r.donVi}</span>
                  )}
                  {r.heThong && (
                    <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {r.heThong}</span>
                  )}
                  {r.viTri && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.viTri}</span>
                  )}
                </div>
              </div>
            ))}
            {rows.length > 10 && (
              <p className="px-1 pt-0.5 text-[11px] text-muted-foreground">…và {rows.length - 10} tài sản khác</p>
            )}
          </div>
        )}
        <p className="flex items-center gap-1 px-1 pt-1.5 text-[11px] font-medium text-primary">
          Bấm để xem đầy đủ <ChevronRight className="h-3 w-3" />
        </p>
      </div>
    </div>
  );
}
type UsageRow = { id: string; ma: string; ten: string; serial: string; viTri: string; donVi: string; heThong: string };

function ModelUsageDialog({ model, onClose }: { model: ModelRow; onClose: () => void }) {
  const { hasRole } = useSession();
  const canEdit = hasRole("admin") || hasRole("phong_kt");
  const { data, isLoading, error } = useQuery({
    queryKey: ["model_usage", model.id],
    queryFn: async (): Promise<UsageRow[]> => {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select("id,ma_thiet_bi,ten_thiet_bi,ma_serial,vi_tri_id,don_vi_quan_ly_id,don_vi_id,he_thong_id,dm_vi_tri:vi_tri_id(ten),qly:don_vi_quan_ly_id(ten),dv:don_vi_id(ten),ht:he_thong_id(ten)")
        .eq("model_id", model.id)
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

  // Nhóm theo đơn vị để dễ nhìn "đơn vị nào đang dùng".
  const byUnit = useMemo(() => {
    const m = new Map<string, UsageRow[]>();
    for (const r of data ?? []) {
      const k = r.donVi || "(Chưa gán đơn vị)";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0], "vi"));
  }, [data]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" /> Tài sản đang dùng mẫu
          </DialogTitle>
          <DialogDescription>
            {model.ten}{model.p_n ? ` · ${model.p_n}` : ""} — {data?.length ?? 0} tài sản
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
          <p className="py-8 text-center text-sm text-muted-foreground">Chưa có tài sản nào dùng mẫu này.</p>
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
                          <span className="font-mono text-xs text-muted-foreground">{r.ma || "—"}</span>
                          <span className="font-medium">{r.ten || "(Không tên)"}</span>
                          {r.serial && <span className="font-mono text-[11px] text-muted-foreground">S/N: {r.serial}</span>}
                          {r.heThong && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Layers className="h-3 w-3" /> {r.heThong}
                            </span>
                          )}
                          {r.viTri && (
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

// ---------------------------------------------------------------------------
// Hộp thoại: Gộp nhiều mẫu đã chọn thành một mẫu đích.
// ---------------------------------------------------------------------------
function MergeModelsDialog({
  models, pending, onClose, onMerge,
}: {
  models: ModelRow[];
  pending: boolean;
  onClose: () => void;
  onMerge: (target: ModelRow) => void;
}) {
  // Mặc định chọn mẫu có nhiều tài sản nhất làm mẫu giữ lại.
  const [targetId, setTargetId] = useState<string>(
    () => [...models].sort((a, b) => b.soThietBi - a.soThietBi)[0]?.id ?? "",
  );
  const target = models.find((m) => m.id === targetId) ?? null;
  const totalTb = models.reduce((s, m) => s + m.soThietBi, 0);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" /> Gộp {models.length} model
          </DialogTitle>
          <DialogDescription>
            Chọn mẫu <b>giữ lại</b>. Toàn bộ {totalTb} tài sản của các mẫu còn lại sẽ được chuyển sang mẫu này, sau đó các mẫu trùng sẽ bị xoá.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-3">
          <div className="space-y-1.5">
            {models.map((m) => (
              <label
                key={m.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded border px-3 py-2 text-sm transition-colors",
                  m.id === targetId ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                <input
                  type="radio"
                  name="merge-target"
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                  checked={m.id === targetId}
                  onChange={() => setTargetId(m.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{m.ten}{m.p_n ? <span className="ml-1 font-mono text-xs text-muted-foreground">· {m.p_n}</span> : null}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.nhaSanXuat || "—"} · {m.loaiThietBi || "Chưa phân loại"}</p>
                </div>
                <Badge variant="secondary" className="gap-1 text-[10px]"><Boxes className="h-3 w-3" /> {m.soThietBi}</Badge>
                {m.id === targetId && <Badge className="text-[10px]">Giữ lại</Badge>}
              </label>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Huỷ</Button>
          <Button onClick={() => target && onMerge(target)} disabled={pending || !target} className="gap-1.5">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
            Gộp vào mẫu này
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}






function ModelDialog({
  value,
  nsxList,
  ltbList,
  fsList,
  canManage,
  onClose,
  onSaved,
}: {
  value: ModelRow | null;
  nsxList: DmRef[];
  ltbList: DmRef[];
  fsList: DmRef[];
  canManage: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [ten, setTen] = useState(value?.ten ?? "");
  const [pn, setPn] = useState(value?.p_n ?? "");
  const [nsx, setNsx] = useState(value?.nhaSanXuat ?? "");
  const [ltb, setLtb] = useState(value?.loaiThietBi ?? "");
  const [fieldSetId, setFieldSetId] = useState(value?.field_set_id ?? "");
  const [moTa, setMoTa] = useState(value?.mo_ta ?? "");
  const [active, setActive] = useState(value?.active ?? true);
  const [preview, setPreview] = useState(value?.imgUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [extraLtb, setExtraLtb] = useState<DmRef[]>([]);
  const [addingLtb, setAddingLtb] = useState(false);
  const [newLtb, setNewLtb] = useState("");
  const [creatingLtb, setCreatingLtb] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropOpen, setCropOpen] = useState(false);

  // Nhãn tài sản (tag) đa chọn — layer THÊM, không đụng loại_thiet_bi_id.
  const { data: dacTinhAll } = useQuery({
    queryKey: ["dm_dac_tinh_all"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_dac_tinh")
        .select("id,ma,ten,thu_tu")
        .order("thu_tu", { nullsFirst: false })
        .order("ma");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; ma: string; ten: string; thu_tu: number | null }>;
    },
  });
  const { data: initialSelected } = useQuery({
    queryKey: ["dm_model_dac_tinh", value?.id],
    enabled: !!value?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_model_dac_tinh")
        .select("dac_tinh_id")
        .eq("model_id", value!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.dac_tinh_id as string);
    },
  });
  const [dacTinhIds, setDacTinhIds] = useState<string[]>([]);
  const [prevDacTinhIds, setPrevDacTinhIds] = useState<string[]>([]);
  useEffect(() => {
    if (initialSelected) {
      setDacTinhIds(initialSelected);
      setPrevDacTinhIds(initialSelected);
    }
  }, [initialSelected]);

  const dacTinhSorted = useMemo(() => {
    const items = (dacTinhAll ?? []).map((d) => ({
      id: d.id,
      ma: d.ma,
      ten: d.ten,
      thu_tu: d.thu_tu ?? undefined,
    }));
    return sortDacTinh(items) as Array<{ id: string; ma: string; ten: string; thu_tu?: number }>;
  }, [dacTinhAll]);

  function toggleDacTinh(id: string) {
    setDacTinhIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  const nsxOpts: ComboOption[] = useMemo(
    () => nsxList.map((r) => ({ value: r.ten, label: r.ten })),
    [nsxList],
  );
  const ltbOpts: ComboOption[] = useMemo(
    () => [...ltbList, ...extraLtb].map((r) => ({ value: r.ten, label: r.ten })),
    [ltbList, extraLtb],
  );

  async function createLtb() {
    const name = newLtb.trim();
    if (!name) return;
    const exists = [...ltbList, ...extraLtb].some((r) => r.ten.toLowerCase() === name.toLowerCase());
    if (exists) {
      setLtb(name);
      setAddingLtb(false);
      setNewLtb("");
      return;
    }
    setCreatingLtb(true);
    try {
      const { data, error } = await supabase
        .from("dm_loai_thiet_bi")
        .insert({ ma: slug(name), ten: name })
        .select("id,ten")
        .single();
      if (error) throw error;
      setExtraLtb((p) => [...p, { id: data.id, ten: data.ten } as DmRef]);
      setLtb(data.ten);
      setAddingLtb(false);
      setNewLtb("");
      qc.invalidateQueries({ queryKey: ["model_refs"] });
      toast.success("Đã thêm chủng loại.");
    } catch (e) {
      toast.error("Không tạo được chủng loại: " + (e as Error).message);
    } finally {
      setCreatingLtb(false);
    }
  }

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP…).");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tối đa 5MB.");
      return;
    }
    setFile(f);
  }

  async function save() {
    if (!ten.trim()) {
      toast.error("Vui lòng nhập tên mẫu.");
      return;
    }
    setSaving(true);
    try {
      const nsxId = nsx.trim() ? await resolveDmId("dm_nha_san_xuat", nsx) : null;
      const ltbId = ltb.trim() ? await resolveDmId("dm_loai_thiet_bi", ltb) : null;

      // Tải ảnh mới lên (nếu có).
      let hinhAnh = value?.hinh_anh ?? null;
      if (file) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${Date.now()}_${safe}`;
        const up = await storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
        if (up.error) throw up.error;
        if (value?.hinh_anh) await storage.from(BUCKET).remove([value.hinh_anh]).catch(() => {});
        hinhAnh = path;
      }

      const payload = {
        ten: ten.trim(),
        p_n: pn.trim() || null,
        mo_ta: moTa.trim() || null,
        nha_san_xuat_id: nsxId,
        loai_thiet_bi_id: ltbId,
        field_set_id: fieldSetId || null,
        hinh_anh: hinhAnh,
        active,
      };

      let modelId = value?.id ?? "";
      if (value) {
        // P10 — Track C: dùng chung updateEntityRow (route qua renameEntity semantics).
        await updateEntityRow({ kind: "md", id: value.id, patch: payload as never });
      } else {
        const { data: ins, error } = await supabase
          .from("dm_model")
          .insert({ ...payload, ma: slug(pn || ten) })
          .select("id")
          .single();
        if (error) throw error;
        modelId = (ins as { id: string }).id;
      }

      // Đồng bộ nhãn tài sản (M:N).
      // Guard 2 lớp:
      //   (a) UI đã disable checkbox khi !canManage → diff LUÔN rỗng.
      //   (b) Phòng khi ai đó dựng lại state qua devtools/RPC: nếu diff KHÁC rỗng
      //       mà không có quyền, dừng lại và báo lỗi rõ ràng (RLS ở CSDL vẫn là
      //       hàng rào cuối, nhưng ta ném sớm để không tốn round-trip).
      if (modelId) {
        const { toInsert, toDelete } = diffModelDacTinh(prevDacTinhIds, dacTinhIds);
        const coThayDoi = toInsert.length > 0 || toDelete.length > 0;
        if (coThayDoi && !canManage) {
          throw new Error("Bạn không có quyền chỉnh sửa nhãn tài sản của model.");
        }
        if (coThayDoi) {
          if (toDelete.length > 0) {
            const { error } = await supabase
              .from("dm_model_dac_tinh")
              .delete()
              .eq("model_id", modelId)
              .in("dac_tinh_id", toDelete);
            if (error) throw error;
          }
          if (toInsert.length > 0) {
            const { error } = await supabase
              .from("dm_model_dac_tinh")
              .insert(toInsert.map((dac_tinh_id) => ({ model_id: modelId, dac_tinh_id })));
            if (error) throw error;
          }
        }
      }

      toast.success(value ? "Đã cập nhật model." : "Đã thêm model.");
      onSaved();
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{value ? "Sửa model" : "Thêm model"}</DialogTitle>
          <DialogDescription>
            Mẫu (model) mô tả một chủng loại chuẩn. Tài sản chọn mẫu để kế thừa hình ảnh, nhà sản xuất và loại.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ảnh */}
          <div className="flex items-center gap-3">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
              {preview ? (
                <img src={preview} alt="preview" className="h-full w-full object-contain p-1" />
              ) : (
                <Package className="h-8 w-8 text-muted-foreground/40" />
              )}
            </div>
            <div className="space-y-1.5">
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setCropOpen(true)}>
                <ImageUp className="h-4 w-4" /> Chọn ảnh
              </Button>
              <ImageCropDialog
                open={cropOpen}
                onOpenChange={setCropOpen}
                title="Chọn & cắt ảnh model"
                maxMb={5}
                outSize={800}
                onConfirm={(f) => { setFile(f); }}
              />
              {preview && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-muted-foreground"
                  onClick={() => {
                    setFile(null);
                    setPreview("");
                  }}
                >
                  <X className="h-4 w-4" /> Bỏ ảnh
                </Button>
              )}
              <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP, SVG · tối đa 5MB · nên dùng ảnh nền trắng, vuông.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Tên mẫu *</Label>
              <Input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="VD: HP Z620 Workstation" />
            </div>
            <div className="space-y-1.5">
              <Label>P/N (Part number)</Label>
              <Input value={pn} onChange={(e) => setPn(e.target.value)} placeholder="VD: 671396-001" />
              <p className="text-[11px] text-muted-foreground">Tài sản chọn mẫu này sẽ tự kế thừa P/N.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Nhà sản xuất</Label>
              <Combobox
                options={nsxOpts}
                value={nsx}
                onChange={setNsx}
                allowCustom
                placeholder="Chọn / nhập…"
                searchPlaceholder="Tìm nhà sản xuất…"
                emptyText="Nhấn Enter để tạo mới"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Chủng loại</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Combobox
                    options={ltbOpts}
                    value={ltb}
                    onChange={setLtb}
                    allowCustom
                    placeholder="Chọn / nhập loại…"
                    searchPlaceholder="Tìm chủng loại…"
                    emptyText="Nhấn Enter để tạo mới"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Khai chủng loại mới"
                  className="shrink-0"
                  title="Khai chủng loại mới"
                  onClick={() => {
                    setNewLtb(ltb.trim());
                    setAddingLtb((v) => !v);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {addingLtb && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                  <Input
                    autoFocus
                    value={newLtb}
                    onChange={(e) => setNewLtb(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); createLtb(); }
                    }}
                    placeholder="Tên chủng loại mới…"
                    className="h-8"
                  />
                  <Button type="button" size="sm" onClick={createLtb} disabled={creatingLtb || !newLtb.trim()} className="gap-1.5">
                    {creatingLtb && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Tạo
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Bộ thuộc tính (field set)</Label>
              <Select value={fieldSetId || "__none__"} onValueChange={(v) => setFieldSetId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Không áp dụng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Không áp dụng —</SelectItem>
                  {fsList.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.ten}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Tài sản chọn mẫu này sẽ tự kế thừa chủng loại, nhà sản xuất và bộ thuộc tính.
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Mô tả</Label>
              <Textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={2} placeholder="Ghi chú kỹ thuật, thông số chung…" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Nhãn tài sản (đa chọn)</Label>
                <Link to="/danh-muc/dac-tinh" className="text-[11px] text-primary hover:underline">Quản lý</Link>
              </div>
              {dacTinhSorted.length === 0 ? (
                <div className="rounded-md border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                  Chưa có nhãn tài sản nào. Thêm ở <Link to="/danh-muc/dac-tinh" className="text-primary hover:underline">Danh mục › Nhãn tài sản</Link>.
                </div>
              ) : (
                <div className="rounded-md border bg-muted/20 p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {dacTinhSorted.map((d) => {
                      const id = (d as { id: string }).id;
                      const on = dacTinhIds.includes(id);
                      return (
                        <button
                          type="button"
                          key={id}
                          disabled={!canManage}
                          onClick={() => toggleDacTinh(id)}
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                            on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
                            !canManage && "cursor-not-allowed opacity-60",
                          )}
                        >
                          {d.ten} <span className="opacity-60">({d.ma})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Tài sản của mẫu này sẽ tự kế thừa nhãn tài sản qua view <code>v_thiet_bi_dac_tinh</code>. Không thay thế Chủng loại.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={active} onCheckedChange={setActive} id="model-active" />
              <Label htmlFor="model-active" className="cursor-pointer">Đang sử dụng</Label>
            </div>
          </div>

          {/* Tài liệu đính kèm — chỉ khả dụng sau khi mẫu đã được lưu */}
          <div className="border-t pt-4">
            {value ? (
              <ModelTaiLieu modelId={value.id} />
            ) : (
              <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                Lưu model trước, sau đó mở lại để tải lên tài liệu (datasheet, hướng dẫn, sơ đồ…).
              </p>
            )}
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
