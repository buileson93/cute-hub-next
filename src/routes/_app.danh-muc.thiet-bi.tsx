// ============================================================================
// DANH MỤC › THIẾT BỊ — bảng phẳng liệt kê TẤT CẢ tài sản trong CSDL.
//
// Khác với "Sổ lý lịch" (cây theo hệ thống đang khai thác), trang này coi mọi
// tài sản như một danh mục tài sản: kể cả tài sản ĐỘC LẬP chưa gán hệ thống
// (vật tư dự phòng, công cụ dụng cụ, tài sản đo…). Có bộ lọc riêng để lọc
// nhanh nhóm tài sản độc lập này.
//
// Phạm vi RỘNG HƠN TableView "Vận hành › Hệ Thống": đầy đủ cột (định danh, mẫu,
// loại, nhà SX/CC, trạng thái, cấp phát, vị trí, phân loại, vòng đời…), sắp xếp,
// lọc, chọn cột, tích chọn dòng và XUẤT .xlsx (theo bộ lọc hoặc dòng đang chọn).
// Chỉ đọc + điều hướng — mọi chỉnh sửa vẫn qua trang chi tiết / cây Hệ Thống.
// ============================================================================
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download, HardDrive, Loader2, Package, PackageOpen, PackagePlus, PackageMinus,
  MoreHorizontal, Search, X, History, Tag, Info, Pencil, Plus, Trash2, PackageX, Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";

import { CenterHoverCard } from "@/components/mirats/CenterHoverCard";
import { AssignSystemDialog } from "@/components/mirats/AssignSystemDialog";
import { ThietBiDetailDrawer } from "@/components/mirats/ThietBiDetailDrawer";
import { ThietBiFormDialog } from "@/components/mirats/ThietBiFormDialog";
import { DeviceMovementHistoryDialog } from "@/components/mirats/DeviceMovementHistory";
import { showUndoToast } from "@/components/mirats/UndoToast";
import { useScope } from "@/lib/mirats/scope";
import { useSession } from "@/hooks/use-session";
import { useUserPref } from "@/hooks/use-user-pref";
import { useCayRpc } from "@/lib/mirats/cay-reorg";
import { normalize } from "@/lib/mirats/global-search";
import {
  useDbTaxonomy, useSystemNameOverrides, useDeviceNameOverrides, type DbDevice,
} from "@/lib/mirats/db-taxonomy";
import { isRetiredStatus } from "@/components/mirats/ThietBiLifecycleActions";
import { supabase } from "@/integrations/supabase/client";
import {
  sortDacTinh, matchFilter, type DacTinh, type CheDoLoc,
} from "@/lib/mirats/dac-tinh";
import { MauChip } from "@/components/mirats/MauChip";
import { storage } from "@/lib/storage";
import { cn } from "@/lib/utils";

// Bộ lọc lưu trên URL để "quay lại trang" giữ nguyên trạng thái đã chọn.
// - q, loai, tt: text đơn trị (bỏ khi rỗng / "all")
// - tags: mảng UUID nhãn tài sản (bỏ khi rỗng)
// - mode: chế độ lọc nhãn (any/all/none) — mặc định "any" thì bỏ
// - standalone/retired: bật/tắt hai công tắc bên trên bảng
type TbSearch = {
  q?: string;
  loai?: string;
  tt?: string;
  tags?: string[];
  mode?: CheDoLoc;
  standalone?: boolean;
  retired?: boolean;
};

const TAG_MODES: readonly CheDoLoc[] = ["any", "all", "none"] as const;

export const Route = createFileRoute("/_app/danh-muc/thiet-bi")({
  validateSearch: (s: Record<string, unknown>): TbSearch => {
    const q = typeof s.q === "string" && s.q.trim() ? s.q : undefined;
    const loai = typeof s.loai === "string" && s.loai && s.loai !== "all" ? s.loai : undefined;
    const tt = typeof s.tt === "string" && s.tt && s.tt !== "all" ? s.tt : undefined;
    const rawTags = Array.isArray(s.tags)
      ? (s.tags.filter((x) => typeof x === "string" && x) as string[])
      : typeof s.tags === "string" && s.tags
      ? [s.tags]
      : [];
    const tags = rawTags.length ? Array.from(new Set(rawTags)) : undefined;
    const mode = TAG_MODES.includes(s.mode as CheDoLoc) && s.mode !== "any"
      ? (s.mode as CheDoLoc)
      : undefined;
    const standalone = s.standalone === true || s.standalone === "true" ? true : undefined;
    const retired = s.retired === true || s.retired === "true" ? true : undefined;
    return { q, loai, tt, tags, mode, standalone, retired };
  },
  head: () => ({
    meta: [
      { title: "Danh mục tài sản — MIRATS 2.0" },
      { name: "description", content: "Danh mục toàn bộ tài sản: cả tài sản trong hệ thống lẫn tài sản độc lập (vật tư dự phòng, công cụ dụng cụ)." },
      { property: "og:title", content: "Danh mục tài sản — MIRATS 2.0" },
      { property: "og:description", content: "Danh mục tài sản." },

    ],
  }),
  component: DanhMucThietBiPage,
});

const STANDALONE = "— Độc lập (chưa gán hệ thống) —";

const ttColor: Record<string, string> = {
  "Đang khai thác": "bg-emerald-100 text-emerald-700",
  "Đang sử dụng": "bg-emerald-100 text-emerald-700",
  "Đang hoạt động": "bg-emerald-100 text-emerald-700",
  "Dự phòng": "bg-sky-100 text-sky-700",
  "Đang sửa chữa": "bg-amber-100 text-amber-700",
  "Hỏng": "bg-red-100 text-red-700",
  "Chờ thanh lý": "bg-orange-100 text-orange-700",
  "Đã thanh lý": "bg-slate-200 text-slate-700",
  "Ngừng hoạt động": "bg-slate-200 text-slate-700",
};

/** Thẻ hover cho model (dm_model) đã gán — có ảnh + thông số cơ bản. */
function ModelHoverContent({ d }: { d: DbDevice }) {
  const { data: imgUrl } = useQuery({
    queryKey: ["model_hover_img", d._modelAnh],
    enabled: !!d._modelAnh,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await storage.from("model-anh").createSignedUrl(d._modelAnh, 315360000);
      return data?.signedUrl ?? null;
    },
  });
  const rows: Array<[string, string]> = [];
  const add = (label: string, v?: string | null) => {
    const s = (v ?? "").trim();
    if (s) rows.push([label, s]);
  };
  add("Mã mẫu", d._modelMa);
  add("P/N", d._modelPn);
  add("Nhà sản xuất", d._modelNsxTen);
  add("Chủng loại", d._loaiTbTen);
  add("Mô tả", d._modelMoTa);
  return (
    <>
      <div className="border-b bg-muted/40 px-3 py-2">
        <div className="flex items-start gap-1.5 text-sm font-semibold">
          <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="break-words">{d._modelTen || "(Chưa gán model)"}</span>
        </div>
      </div>
      <div className="flex items-center justify-center border-b bg-muted/20 p-2">
        {imgUrl ? (
          <img src={imgUrl} alt={d._modelTen} className="max-h-40 w-auto rounded object-contain" />
        ) : (
          <div className="flex h-24 w-full items-center justify-center rounded bg-muted/40 text-[11px] text-muted-foreground">
            Chưa có hình ảnh
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        {rows.length ? rows.map(([l, v]) => (
          <div key={l} className="flex gap-2 text-xs">
            <span className="w-24 shrink-0 text-muted-foreground">{l}</span>
            <span className="min-w-0 flex-1 break-words font-medium">{v}</span>
          </div>
        )) : <div className="text-xs text-muted-foreground">Chưa có thông tin chi tiết cho mẫu này.</div>}
      </div>
    </>
  );
}

const CAP_PHAT_LABEL: Record<string, string> = {
  san_sang: "Sẵn sàng",
  da_cap_phat: "Đã cấp phát",
};

const num = (v: number | null) => (v == null ? "" : String(v));

function DanhMucThietBiPage() {
  const { scopeAll, donViCode } = useScope();
  const { data: taxo, isLoading, error } = useDbTaxonomy();
  const { data: nameOv } = useSystemNameOverrides();
  const { data: devNameOv } = useDeviceNameOverrides();
  
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const isAdmin = hasRole("admin");
  // Chế độ chỉnh sửa: BẬT mới hiện nút "Thêm tài sản" và các nút xoá.
  // Persist theo user để lần sau vào trang giữ nguyên lựa chọn.
  const [editMode, setEditMode] = useUserPref<boolean>("danh-muc-tb:edit-mode", false);
  const editOn = canManage && editMode;
  const { submit, submitMany, hoanTac } = useCayRpc();
  const qc = useQueryClient();

  const [exporting, setExporting] = useState(false);

  // ---- Bộ lọc lưu trên URL: rời trang & quay lại vẫn giữ đúng lựa chọn ----
  const sp = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const patchSearch = useCallback(
    (patch: Partial<TbSearch> | ((prev: TbSearch) => Partial<TbSearch>)) => {
      navigate({
        // `replace: true` để gõ tìm kiếm không phình history.
        replace: true,
        search: (prev: TbSearch) => {
          const p = typeof patch === "function" ? patch(prev) : patch;
          return { ...prev, ...p };
        },
      });
    },
    [navigate],
  );

  const onlyStandalone = sp.standalone ?? false;
  const showRetired = sp.retired ?? false;
  const search = sp.q ?? "";
  const filterLoai = sp.loai ?? "all";
  const filterTt = sp.tt ?? "all";
  const tagSelected = useMemo(() => sp.tags ?? [], [sp.tags]);
  const tagMode: CheDoLoc = sp.mode ?? "any";

  const setOnlyStandalone = useCallback(
    (v: boolean) => patchSearch({ standalone: v ? true : undefined }),
    [patchSearch],
  );
  const setShowRetired = useCallback(
    (v: boolean) => patchSearch({ retired: v ? true : undefined }),
    [patchSearch],
  );
  const setSearch = useCallback(
    (v: string) => patchSearch({ q: v.trim() ? v : undefined }),
    [patchSearch],
  );
  const setFilterLoai = useCallback(
    (v: string) => patchSearch({ loai: v && v !== "all" ? v : undefined }),
    [patchSearch],
  );
  const setFilterTt = useCallback(
    (v: string) => patchSearch({ tt: v && v !== "all" ? v : undefined }),
    [patchSearch],
  );
  const setTagSelected = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) =>
      patchSearch((prev) => {
        const cur = prev.tags ?? [];
        const next = typeof updater === "function" ? updater(cur) : updater;
        // Loại trùng, giữ thứ tự chọn của người dùng.
        const uniq = Array.from(new Set(next));
        return { tags: uniq.length ? uniq : undefined };
      }),
    [patchSearch],
  );
  const setTagMode = useCallback(
    (v: CheDoLoc) => patchSearch({ mode: v === "any" ? undefined : v }),
    [patchSearch],
  );

  // ---- Nhãn tài sản: danh mục dm_dac_tinh + map tài sản → nhãn tài sản (v_thiet_bi_dac_tinh) ----
  const { data: dacTinhList } = useQuery({
    queryKey: ["dm_dac_tinh_all"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_dac_tinh")
        .select("id, ma, ten, thu_tu, mau")
        .order("thu_tu", { nullsFirst: false }).order("ma");
      if (error) throw error;
      return (data ?? []) as Array<DacTinh & { id: string }>;
    },
  });
  const { data: tbTagRows } = useQuery({
    queryKey: ["v_thiet_bi_dac_tinh_all"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_thiet_bi_dac_tinh")
        .select("thiet_bi_id, dac_tinh_id");
      if (error) throw error;
      return (data ?? []) as Array<{ thiet_bi_id: string; dac_tinh_id: string }>;
    },
  });
  // Map id nhãn tài sản → object (để render chip).
  const dacTinhById = useMemo(() => {
    const m = new Map<string, DacTinh & { id: string }>();
    for (const t of dacTinhList ?? []) m.set(t.id, t);
    return m;
  }, [dacTinhList]);
  // Map tài sản.id → mảng id nhãn tài sản.
  const tagsByDevice = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const r of tbTagRows ?? []) {
      const arr = m.get(r.thiet_bi_id) ?? [];
      arr.push(r.dac_tinh_id);
      m.set(r.thiet_bi_id, arr);
    }
    return m;
  }, [tbTagRows]);
  const tagsSorted = useMemo(
    () => sortDacTinh((dacTinhList ?? []) as DacTinh[]) as Array<DacTinh & { id: string }>,
    [dacTinhList],
  );

  // ---- Màu Chủng loại: map ten → mau (chip màu shelf.nu-style) ----
  const { data: loaiMauList } = useQuery({
    queryKey: ["dm_loai_thiet_bi_mau"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("dm_loai_thiet_bi").select("id, ten, mau");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; ten: string; mau: string | null }>;
    },
  });
  const loaiMauByTen = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const r of loaiMauList ?? []) if (r.ten) m.set(r.ten, r.mau);
    return m;
  }, [loaiMauList]);


  // Gán / gỡ tài sản khỏi hệ thống.
  const [assignTargets, setAssignTargets] = useState<DbDevice[] | null>(null);
  const [removeTargets, setRemoveTargets] = useState<DbDevice[] | null>(null);

  // Ngăn (drawer) chi tiết tài sản khi bấm vào một dòng.
  const [detailDevice, setDetailDevice] = useState<DbDevice | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Dialog Thêm/Sửa tài sản trực tiếp trong trang Danh mục.
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [formDevice, setFormDevice] = useState<DbDevice | null>(null);
  const openDetail = useCallback((d: DbDevice) => { setDetailDevice(d); setDetailOpen(true); }, []);
  const openCreate = useCallback(() => { setFormDevice(null); setFormMode("create"); }, []);
  const openEdit = useCallback((d: DbDevice) => { setFormDevice(d); setFormMode("edit"); }, []);

  // Xoá tài sản: 2 chế độ — "Ngừng khai thác" (giữ lịch sử) và "Xoá vĩnh viễn"
  // (chỉ dùng cho bản ghi nhập nhầm, chưa phát sinh lịch sử; chỉ admin).
  const [deleteTargets, setDeleteTargets] = useState<DbDevice[] | null>(null);
  const [deleteKind, setDeleteKind] = useState<"retire" | "purge">("retire");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteThanhLy, setDeleteThanhLy] = useState(false);
  const closeDelete = useCallback(() => {
    setDeleteTargets(null); setDeleteReason(""); setDeleteThanhLy(false); setDeleteKind("retire");
  }, []);

  const retireMut = useMutation({
    mutationFn: async (mas: string[]) => {
      const { data, error } = await supabase.rpc("ngung_khai_thac_thiet_bi", {
        _mas: mas, _ly_do: deleteReason || undefined, _thanh_ly: deleteThanhLy,
      });
      if (error) throw error;
      return data as { trang_thai: string };
    },
    onSuccess: (_d, mas) => {
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      qc.invalidateQueries({ queryKey: ["change_log"] });
      toast.success(`Đã ngừng khai thác ${mas.length} tài sản — lịch sử được giữ nguyên`);
      closeDelete();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không thực hiện được"),
  });
  const purgeMut = useMutation({
    mutationFn: async (mas: string[]) => {
      const { data, error } = await supabase.rpc("purge_thiet_bi", { _mas: mas });
      if (error) throw error;
      return data as { so_da_xoa: number | null; so_bo_qua: number | null };
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      qc.invalidateQueries({ queryKey: ["change_log"] });
      const daXoa = d?.so_da_xoa ?? 0;
      const boQua = d?.so_bo_qua ?? 0;
      if (daXoa > 0) toast.success(`Đã xoá vĩnh viễn ${daXoa} bản ghi${boQua ? ` — bỏ qua ${boQua} bản ghi đã có lịch sử` : ""}`);
      else toast.error("Không xoá được: tài sản đã có lịch sử. Hãy dùng “Ngừng khai thác”.");
      closeDelete();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không xoá được"),
  });
  const deleteBusy = retireMut.isPending || purgeMut.isPending;

  const htName = (id: string | undefined, fallback: string) => (id && nameOv?.get(id)) || fallback;
  const tbName = useCallback(
    (d: DbDevice) => devNameOv?.get(d.ma_thiet_bi) || d.ten,
    [devNameOv],
  );

  // Tra mã hệ thống theo id (để cột "he_thong" khi XUẤT là MÃ hợp lệ, nạp lại được).
  const htMaById = useMemo(
    () => new Map((taxo?.htList ?? []).map((h) => [h.id, h.ma])),
    [taxo],
  );

  // Danh mục lọc nhanh (chủng loại / trạng thái) từ dữ liệu hiện có.
  const loaiOptions = useMemo(
    () => Array.from(new Set((taxo?.devices ?? []).map((d) => d._loaiTbTen).filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi")),
    [taxo],
  );
  const ttOptions = useMemo(
    () => Array.from(new Set((taxo?.devices ?? []).map((d) => d.trang_thai).filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi")),
    [taxo],
  );

  const devices = useMemo(() => {
    let all = taxo?.devices ?? [];
    if (!scopeAll) all = all.filter((d) => !donViCode || d.don_vi === donViCode);
    if (!showRetired) all = all.filter((d) => !isRetiredStatus(d.trang_thai));
    if (onlyStandalone) all = all.filter((d) => !d._htId);
    if (filterLoai !== "all") all = all.filter((d) => d._loaiTbTen === filterLoai);
    if (filterTt !== "all") all = all.filter((d) => d.trang_thai === filterTt);
    if (tagSelected.length) {
      all = all.filter((d) =>
        matchFilter(tagsByDevice.get(d.id) ?? [], tagSelected, tagMode),
      );
    }
    const nq = normalize(search).trim();
    if (nq) {
      all = all.filter((d) =>
        normalize(tbName(d)).includes(nq) ||
        normalize(d.ma_thiet_bi).includes(nq) ||
        normalize(d.serial ?? "").includes(nq) ||
        normalize(d._loaiTbTen ?? "").includes(nq) ||
        normalize(d.trang_thai ?? "").includes(nq),
      );
    }
    return all;
  }, [taxo, scopeAll, donViCode, showRetired, onlyStandalone, filterLoai, filterTt, search, tbName, tagsByDevice, tagSelected, tagMode]);

  const standaloneCount = useMemo(
    () => (taxo?.devices ?? []).filter((d) => !d._htId).length,
    [taxo],
  );

  // Danh sách hệ thống để chọn khi gán.
  const assignSystems = useMemo(
    () => (taxo?.htList ?? []).map((h) => ({ id: h.id, ma: h.ma, ten: h.ten })),
    [taxo],
  );

  // Resolver cho hộp thoại Lịch sử: UUID hệ thống → tên, mã tài sản → tên.
  const systemNameById = useCallback(
    (id: string | null) => {
      if (!id) return "Độc lập";
      return htName(id, (taxo?.htList ?? []).find((h) => h.id === id)?.ten || id);
    },
    [taxo, nameOv], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const deviceNameByMa = useCallback(
    (ma: string) => {
      const d = (taxo?.devices ?? []).find((x) => x.ma_thiet_bi === ma);
      return d ? tbName(d) : ma;
    },
    [taxo, tbName],
  );
  const hasActiveFilter = search.trim() !== "" || filterLoai !== "all" || filterTt !== "all" || tagSelected.length > 0;
  const clearFilters = useCallback(
    () => patchSearch({ q: undefined, loai: undefined, tt: undefined, tags: undefined, mode: undefined }),
    [patchSearch],
  );

  // Hoàn tác các thay đổi vừa áp dụng (đảo ngược thứ tự để an toàn).
  const rollbackIds = useCallback(async (ids: string[]) => {
    for (const id of [...ids].reverse()) {
      await hoanTac.mutateAsync({ id, silent: true });
    }
    toast.success(`Đã hoàn tác ${ids.length} thay đổi`);
  }, [hoanTac]);

  // Áp dụng danh sách thay đổi rồi hiển thị nút Hoàn tác có thời hạn (nếu admin
  // áp dụng ngay). Nếu chỉ ở trạng thái chờ duyệt thì báo bình thường.
  const applyWithUndo = useCallback(async (
    items: Array<{ loai: "move_device"; he_thong_id: string; mo_ta: string; payload: Record<string, unknown> }>,
    undoMessage: (n: number) => string,
  ) => {
    if (!items.length) return;
    try {
      if (items.length === 1) {
        const res = await submit.mutateAsync({ ...items[0], _silent: true });
        if (res?.applied && res.id) {
          showUndoToast({ message: undoMessage(1), onUndo: () => rollbackIds([res.id]) });
        } else {
          toast.success("Đã gửi, chờ admin duyệt");
        }
      } else {
        const res = await submitMany.mutateAsync({ items, silent: true });
        if (res.appliedIds.length) {
          showUndoToast({ message: undoMessage(res.appliedIds.length), onUndo: () => rollbackIds(res.appliedIds) });
        }
        if (res.applied < res.total) {
          toast.success(`Đã gửi ${res.total - res.applied} thay đổi, chờ admin duyệt`);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không lưu được thay đổi");
    }
  }, [submit, submitMany, rollbackIds]);

  // Gửi gán tài sản vào hệ thống đích.
  const doAssign = useCallback((devs: DbDevice[], htId: string, htLabel: string) => {
    if (!devs.length) return;
    void applyWithUndo(
      devs.map((d) => ({
        loai: "move_device" as const,
        he_thong_id: "",
        mo_ta: `Gán tài sản "${d.ten}" vào hệ thống ${htLabel}`,
        payload: { device_ma: d.ma_thiet_bi, to_ht_id: htId },
      })),
      (n) => `Đã gán ${n} tài sản vào ${htLabel}`,
    );
  }, [applyWithUndo]);

  // Gửi gỡ tài sản khỏi hệ thống (trở thành độc lập).
  const doRemove = useCallback((devs: DbDevice[]) => {
    const inSystem = devs.filter((d) => d._htId);
    if (!inSystem.length) { toast.error("Không có tài sản nào đang thuộc hệ thống để gỡ"); return; }
    void applyWithUndo(
      inSystem.map((d) => ({
        loai: "move_device" as const,
        he_thong_id: "",
        mo_ta: `Gỡ tài sản "${d.ten}" khỏi hệ thống (thành độc lập)`,
        payload: { device_ma: d.ma_thiet_bi, detach: true },
      })),
      (n) => `Đã gỡ ${n} tài sản khỏi hệ thống`,
    );
  }, [applyWithUndo]);


  const columns = useMemo<StdColumn<DbDevice>[]>(() => [
    // ---- Định danh ----
    {
      key: "tb", label: "Tài sản", group: "Tài sản vật lý · Định danh", minW: "min-w-[220px]", filter: "text", sticky: true,
      value: (d) => tbName(d),
      cell: (d) => (
        <div className="flex w-[220px] max-w-[220px] items-center gap-2">
          <HardDrive className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium" title={tbName(d)}>{tbName(d)}</div>
            <div className="truncate font-mono text-[11px] text-muted-foreground" title={d.ma_thiet_bi ?? undefined}>{d.ma_thiet_bi}</div>
          </div>
        </div>
      ),
    },
    { key: "serial", label: "Số serial", group: "Tài sản vật lý · Định danh", minW: "min-w-[120px]", filter: "text", value: (d) => d.serial },
    { key: "bravo", label: "Mã Bravo", group: "Tài sản vật lý · Định danh", minW: "min-w-[120px]", filter: "text", value: (d) => d._maBravo, defaultHidden: true },
    { key: "thanhphan", label: "Thành phần", group: "Thành phần hệ thống · Vai trò", minW: "min-w-[140px]", filter: "text", value: (d) => d._thanhPhan, defaultHidden: true },
    // ---- Mẫu & loại ----
    {
      key: "mau", label: "Model", group: "Tài sản vật lý · Mẫu & loại", minW: "min-w-[180px]", filter: "text",
      value: (d) => d._modelTen,
      cell: (d) => d._modelTen ? (
        <div className="w-[180px] max-w-[180px]">
          <CenterHoverCard
            openDelay={250} closeDelay={100} contentClassName="p-0"
            trigger={<span className="block cursor-help truncate underline decoration-dotted underline-offset-2" title={d._modelTen}>{d._modelTen}</span>}
          >
            <ModelHoverContent d={d} />
          </CenterHoverCard>
        </div>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "loai", label: "Chủng loại", group: "Tài sản vật lý · Mẫu & loại", minW: "min-w-[150px]", filter: "cat",
      value: (d) => d._loaiTbTen,
      cell: (d) => d._loaiTbTen
        ? <MauChip ten={d._loaiTbTen} mau={loaiMauByTen.get(d._loaiTbTen) ?? null} />
        : <span className="text-muted-foreground">—</span>,
    },
    // Nhãn tài sản đa trị (kế thừa từ Mẫu qua v_thiet_bi_dac_tinh). Không dùng filter cột — bộ lọc đa trị nằm ở thanh trên.
    {
      key: "dacTinh", label: "Nhãn tài sản", group: "Tài sản vật lý · Nhãn tài sản", minW: "min-w-[240px]",
      // Sort THEO SỐ LƯỢNG (không sort chuỗi) — nhãn tài sản là đa trị.
      sortValue: (d) => (tagsByDevice.get(d.id) ?? []).length,
      value: (d) => (tagsByDevice.get(d.id) ?? [])
        .map((tid) => dacTinhById.get(tid)?.ma).filter(Boolean).join(" "),
      cell: (d) => {
        const ids = tagsByDevice.get(d.id) ?? [];
        if (!ids.length) return <span className="text-muted-foreground">—</span>;
        const items = ids
          .map((id) => dacTinhById.get(id))
          .filter((t): t is DacTinh & { id: string } => !!t);
        const sorted = sortDacTinh(items as DacTinh[]) as Array<DacTinh & { id: string }>;
        return (
          <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
            {sorted.map((t) => {
              const active = tagSelected.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTagSelected((prev) =>
                    prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id],
                  )}
                  className={cn(
                    "rounded-full transition-opacity hover:opacity-80 focus:outline-none",
                    active && "ring-2 ring-primary/70 ring-offset-1",
                  )}
                  title={`${active ? "Bỏ khỏi bộ lọc" : "Thêm vào bộ lọc"}: ${t.ten}`}
                  aria-pressed={active}
                >
                  <MauChip ten={t.ten} mau={t.mau ?? null} />
                </button>
              );
            })}
          </div>
        );
      },
    },
    { key: "pn", label: "P/N", group: "Tài sản vật lý · Mẫu & loại", minW: "min-w-[120px]", filter: "text", value: (d) => d.p_n, defaultHidden: true },
    // ---- Nhà cung cấp ----
    { key: "nsx", label: "Nhà sản xuất", group: "Tài sản vật lý · Nhà cung cấp", minW: "min-w-[140px]", filter: "cat", value: (d) => d.nha_san_xuat, defaultHidden: true },
    { key: "ncc", label: "Nhà cung cấp", group: "Tài sản vật lý · Nhà cung cấp", minW: "min-w-[140px]", filter: "cat", value: (d) => d.nha_cung_cap, defaultHidden: true },
    // ---- Trạng thái & cấp phát ----
    {
      key: "tt", label: "Trạng thái", group: "Thành phần hệ thống · Trạng thái", filter: "cat", value: (d) => d.trang_thai,
      cell: (d) => d.trang_thai ? (
        <Badge variant="secondary" className={cn("font-medium", ttColor[d.trang_thai] ?? "")}>{d.trang_thai}</Badge>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "capphat", label: "Cấp phát", group: "Thành phần hệ thống · Trạng thái", filter: "cat",
      value: (d) => CAP_PHAT_LABEL[d._capPhatTrangThai] ?? d._capPhatTrangThai,
      defaultHidden: true,
    },
    { key: "nguoigiu", label: "Người giữ", group: "Thành phần hệ thống · Trạng thái", minW: "min-w-[140px]", filter: "text", value: (d) => d._nguoiGiu, defaultHidden: true },
    // ---- Vị trí & đơn vị ----
    {
      key: "ht", label: "Hệ thống", group: "Hệ thống", minW: "min-w-[200px]", filter: "cat",
      value: (d) => (d._htId ? htName(d._htId, d._htTen) : STANDALONE),
      cell: (d) => d._htId ? (
        <span className="truncate">{htName(d._htId, d._htTen)}</span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-600">
          <PackageOpen className="h-3 w-3" /> Độc lập
        </span>
      ),
    },
    { key: "dv", label: "Đơn vị", group: "Hệ thống", minW: "min-w-[110px]", filter: "cat", value: (d) => d.don_vi },
    { key: "vt", label: "Vị trí", group: "Thành phần hệ thống · Vị trí", minW: "min-w-[140px]", filter: "text", value: (d) => d._viTriTen || d.vi_tri, defaultHidden: true },
    { key: "noiql", label: "Nơi quản lý", group: "Hệ thống", minW: "min-w-[140px]", filter: "text", value: (d) => d._noiQuanLy, defaultHidden: true },
    // ---- Phân loại ----
    { key: "phanloai", label: "Phân loại", group: "Hệ thống · Phân loại", minW: "min-w-[150px]", filter: "cat", value: (d) => d._plTen, defaultHidden: true },
    { key: "nhom", label: "Nhóm hệ thống", group: "Hệ thống · Phân loại", minW: "min-w-[150px]", filter: "cat", value: (d) => d._nhTen, defaultHidden: true },
    
    // ---- Vòng đời ----
    { key: "namsx", label: "Năm sản xuất", group: "Tài sản vật lý · Vòng đời", align: "right", filter: "text", value: (d) => num(d._namSanXuat), defaultHidden: true },
    { key: "namkt", label: "Năm khai thác", group: "Tài sản vật lý · Vòng đời", align: "right", filter: "text", value: (d) => num(d._namKhaiThac), defaultHidden: true },
    {
      key: "tuoitho", label: "Tỷ lệ tuổi thọ (%)", group: "Tài sản vật lý · Vòng đời", align: "right",
      value: (d) => num(d._tyLeTuoiTho), sortValue: (d) => d._tyLeTuoiTho ?? -1, defaultHidden: true,
    },
    { key: "ngaymua", label: "Ngày mua", group: "Tài sản vật lý · Vòng đời", minW: "min-w-[120px]", filter: "text", value: (d) => d.ngay_mua, defaultHidden: true },
    { key: "baohanh", label: "Hạn bảo hành", group: "Tài sản vật lý · Vòng đời", minW: "min-w-[120px]", filter: "text", value: (d) => d.han_bao_hanh, defaultHidden: true },
    // ---- Ghi chú ----
    { key: "ghichu", label: "Ghi chú", group: "Tài sản vật lý · Ghi chú", minW: "min-w-[200px]", filter: "text", value: (d) => d.ghi_chu ?? "", defaultHidden: true },
    // ---- Thao tác (icons inline theo phong cách "Model") — chỉ admin / phòng KT ----
    ...(canManage ? [{
      key: "actions", label: "", group: "Thao tác", minW: "min-w-[150px]", align: "right" as const, sortable: false,
      cell: (d: DbDevice) => (
        <div className="flex items-center justify-end gap-0.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <Button
            size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => openDetail(d)} title="Xem chi tiết tài sản"
          >
            <Info className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => openEdit(d)} title="Sửa thông tin tài sản"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => setAssignTargets([d])}
            title={d._htId ? "Chuyển sang hệ thống khác" : "Gán vào hệ thống"}
          >
            <PackagePlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon" variant="ghost" className="h-7 w-7 text-amber-600 hover:text-amber-700 disabled:opacity-30"
            disabled={!d._htId}
            onClick={() => setRemoveTargets([d])}
            title={d._htId ? "Gỡ khỏi hệ thống" : "Tài sản đang độc lập"}
          >
            <PackageMinus className="h-3.5 w-3.5" />
          </Button>
          {editOn && (
            <Button
              size="icon" variant="ghost"
              className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => { setDeleteTargets([d]); setDeleteKind("retire"); }}
              title="Xoá / Ngừng khai thác tài sản"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    } as StdColumn<DbDevice>] : []),
  ], [nameOv, tbName, canManage, editOn, tagsByDevice, dacTinhById, tagSelected, openDetail]);

  // ---- Xuất .xlsx (theo bộ lọc hiện tại hoặc dòng đang chọn) ----
  // Ánh xạ khoá cột (giao diện) → trường CSDL + cách lấy giá trị, để file nạp lại được.
  // "ma_thiet_bi" LUÔN được xuất (khoá cập nhật) dù cột có ẩn hay không.
  const EXPORT_MAP = useMemo<Record<string, { h: string; get: (d: DbDevice) => string }>>(() => ({
    tb: { h: "ten_thiet_bi", get: (d) => tbName(d) },
    serial: { h: "ma_serial", get: (d) => d.serial },
    bravo: { h: "ma_tai_san_bravo", get: (d) => d._maBravo },
    thanhphan: { h: "thanh_phan", get: (d) => d._thanhPhan },
    mau: { h: "model", get: (d) => d._modelTen },
    loai: { h: "loai_thiet_bi", get: (d) => d._loaiTbTen },
    pn: { h: "p_n", get: (d) => d.p_n },
    nsx: { h: "nha_san_xuat", get: (d) => d.nha_san_xuat },
    ncc: { h: "nha_cung_cap", get: (d) => d.nha_cung_cap },
    tt: { h: "trang_thai", get: (d) => d.trang_thai },
    ht: { h: "he_thong", get: (d) => htMaById.get(d._htId) ?? "" },
    dv: { h: "don_vi", get: (d) => d.don_vi },
    vt: { h: "vi_tri", get: (d) => d._viTriTen || d.vi_tri },
    noiql: { h: "noi_quan_ly", get: (d) => d._noiQuanLy },
    phanloai: { h: "phan_loai", get: (d) => d._phanLoai },
    namsx: { h: "nam_san_xuat", get: (d) => num(d._namSanXuat) },
    namkt: { h: "nam_dua_vao_khai_thac", get: (d) => num(d._namKhaiThac) },
    tuoitho: { h: "ty_le_tuoi_tho", get: (d) => num(d._tyLeTuoiTho) },
    ngaymua: { h: "ngay_mua", get: (d) => d.ngay_mua },
    baohanh: { h: "han_bao_hanh", get: (d) => d.han_bao_hanh },
    ghichu: { h: "ghi_chu", get: (d) => d.ghi_chu ?? "" },
  }), [tbName, htMaById]);

  // Trường xuất khi KHÔNG có cài đặt cột (đầy đủ để đối chiếu).
  const FULL_EXPORT_KEYS = useMemo(() => [
    "tb", "ht", "dv", "tt", "mau", "loai", "serial", "pn", "bravo", "nsx", "ncc",
    "vt", "namsx", "namkt", "tuoitho", "ngaymua", "baohanh", "phanloai", "noiql", "thanhphan", "ghichu",
  ], []);

  /** Xuất theo cài đặt cột đang bật (đúng thứ tự). ma_thiet_bi luôn đứng đầu. */
  const exportRows = useCallback(async (source: DbDevice[], visibleColumns?: StdColumn<DbDevice>[]) => {
    if (!source.length) { toast.error("Không có tài sản nào để xuất"); return; }
    // Lấy danh sách khoá cột theo cài đặt hiển thị; nếu không có thì dùng bộ đầy đủ.
    const keys = (visibleColumns?.length ? visibleColumns.map((c) => c.key) : FULL_EXPORT_KEYS)
      .filter((k) => EXPORT_MAP[k]);
    const fields = [
      { h: "ma_thiet_bi", get: (d: DbDevice) => d.ma_thiet_bi },
      ...keys.map((k) => EXPORT_MAP[k]),
    ];
    const headers = fields.map((f) => f.h);
    const rows = source.map((d) => fields.map((f) => f.get(d)));
    setExporting(true);
    try {
      const { exportDeviceTemplateXlsx } = await import("@/lib/mirats/export-template");
      await exportDeviceTemplateXlsx({
        headers,
        rows,
        fileName: `danh-muc-thiet-bi-${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
      toast.success(`Đã xuất ${rows.length} tài sản · ${headers.length} cột (theo cài đặt cột đang hiển thị). File có sheet ① Hướng dẫn, ② Nhập liệu (dropdown) và ③ Model.`);
    } catch (e) {
      toast.error("Không xuất được file: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setExporting(false);
    }
  }, [EXPORT_MAP, FULL_EXPORT_KEYS]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải danh mục tài sản…
      </div>
    );
  }
  if (error) {
    return <div className="p-8 text-center text-sm text-destructive">Không tải được dữ liệu tài sản.</div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={HardDrive}
        title="Danh mục tài sản"
        subtitle={
          `${devices.length.toLocaleString("vi-VN")} tài sản` +
          (standaloneCount > 0
            ? ` · ${standaloneCount.toLocaleString("vi-VN")} độc lập chưa gán hệ thống`
            : "")
        }
        help="Toàn bộ tài sản trong CSDL — gồm cả tài sản đang trong hệ thống khai thác và tài sản độc lập (vật tư dự phòng, công cụ dụng cụ, tài sản đo) chưa gán vào hệ thống nào."
        actions={
          canManage ? (
            <Button size="sm" className="h-9 gap-1.5" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Thêm tài sản
            </Button>
          ) : null
        }
      />



      <Card>
        <CardContent className="p-3">
          {/* Thanh tìm kiếm & lọc nhanh */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, mã, S/N, loại, trạng thái…"
                className="h-9 pl-8"
              />
            </div>
            <Select value={filterLoai} onValueChange={setFilterLoai}>
              <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Chủng loại" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {loaiOptions.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterTt} onValueChange={setFilterTt}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {ttOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Lọc theo Nhãn tài sản (đa trị) — song song với "Chủng loại" (đơn trị). */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Nhãn tài sản
                  {tagSelected.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                      {tagMode === "any" ? "bất kỳ" : tagMode === "all" ? "đủ" : "trừ"} · {tagSelected.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[320px] p-0">
                <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                  <span className="text-xs font-semibold">Chế độ</span>
                  <Select value={tagMode} onValueChange={(v) => setTagMode(v as CheDoLoc)}>
                    <SelectTrigger className="h-7 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Có bất kỳ (any)</SelectItem>
                      <SelectItem value="all">Có tất cả (all)</SelectItem>
                      <SelectItem value="none">Không có (none)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="max-h-[320px] overflow-auto p-2">
                  <div className="space-y-1">
                    {tagsSorted.map((t) => {
                      const id = t.id;
                      const checked = tagSelected.includes(id);
                      return (
                        <label key={id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-muted/50">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              setTagSelected((prev) => c ? [...prev, id] : prev.filter((x) => x !== id));
                            }}
                          />
                          <span className="text-xs">{t.ten}</span>
                          <span className="ml-auto font-mono text-[10px] text-muted-foreground">{t.ma}</span>
                        </label>
                      );
                    })}
                  </div>
                  {!(dacTinhList ?? []).length && (
                    <div className="p-4 text-center text-xs text-muted-foreground">Chưa có nhãn tài sản nào trong danh mục.</div>
                  )}
                </div>
                {tagSelected.length > 0 && (
                  <div className="flex items-center justify-between border-t px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">Đã chọn {tagSelected.length}</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setTagSelected([])}>
                      Bỏ chọn tất cả
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            {hasActiveFilter && (
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" /> Xoá lọc
              </Button>
            )}
          </div>
          {tagSelected.length > 0 && (
            <div className="mb-2 flex items-start gap-1.5 rounded border border-dashed bg-muted/30 px-2 py-1.5 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                Nhãn tài sản là đa trị: khi <b>gom nhóm theo nhãn tài sản</b>, một tài sản có thể vào nhiều nhóm (nhân dòng) — hãy dùng <b>đếm distinct</b> theo mã tài sản; đếm theo tag có thể lớn hơn tổng tài sản.
              </span>
            </div>
          )}

          <StandardTable
            tableKey="danh-muc-thiet-bi"
            columns={columns}
            rows={devices}
            getRowId={(d) => d.ma_thiet_bi}
            requireFilterToShow={false}
            countUnit="tài sản"
            selectable
            onRowClick={(d) => openDetail(d)}
            rowClassName={() => "cursor-pointer"}
            emptyText="Không có tài sản phù hợp."
            toolbarLeft={
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="only-standalone" checked={onlyStandalone} onCheckedChange={setOnlyStandalone} />
                  <Label htmlFor="only-standalone" className="cursor-pointer text-sm">Chỉ tài sản độc lập</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="show-retired" checked={showRetired} onCheckedChange={setShowRetired} />
                  <Label htmlFor="show-retired" className="cursor-pointer text-sm">Kể cả đã nghỉ khai thác</Label>
                </div>
              </div>
            }
            toolbarRight={({ visibleRows, visibleColumns }) => (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm" className="h-8 gap-1.5"
                  onClick={() => setHistoryOpen(true)}
                  title="Xem lịch sử gán / chuyển / gỡ tài sản khỏi hệ thống"
                >
                  <History className="h-3.5 w-3.5" /> Lịch sử
                </Button>
                <Button
                  variant="outline" size="sm" className="h-8 gap-1.5"
                  disabled={exporting || visibleRows.length === 0}
                  onClick={() => exportRows(visibleRows, visibleColumns)}
                  title="Xuất các tài sản đang hiển thị theo bộ lọc & cài đặt cột hiện tại"
                >
                  {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Xuất .xlsx
                </Button>
              </div>
            )}
            bulkActions={({ selectedRows, visibleColumns, clear }) => (
              <div className="flex flex-wrap items-center gap-2">
                {canManage && (
                  <>
                    <Button
                      size="sm" variant="outline" className="h-8 gap-1.5"
                      onClick={() => setAssignTargets(selectedRows)}
                    >
                      <PackagePlus className="h-3.5 w-3.5" /> Gán vào hệ thống
                    </Button>
                    <Button
                      size="sm" variant="outline" className="h-8 gap-1.5 text-amber-600"
                      disabled={!selectedRows.some((d) => d._htId)}
                      onClick={() => setRemoveTargets(selectedRows)}
                    >
                      <PackageMinus className="h-3.5 w-3.5" /> Gỡ khỏi hệ thống
                    </Button>
                  </>
                )}
                <Button
                  size="sm" className="h-8 gap-1.5"
                  disabled={exporting}
                  onClick={async () => { await exportRows(selectedRows, visibleColumns); clear(); }}
                >
                  <Download className="h-3.5 w-3.5" /> Xuất {selectedRows.length} dòng
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Ngăn chi tiết tài sản (bấm vào một dòng) — luôn lấy bản ghi mới nhất */}
      <ThietBiDetailDrawer
        device={detailDevice ? (taxo?.devices ?? []).find((d) => d.ma_thiet_bi === detailDevice.ma_thiet_bi) ?? detailDevice : null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canManage={canManage}
        deviceName={tbName}
        systemLabel={(d) => htName(d._htId, d._htTen)}
        systemNameById={systemNameById}
        onAssign={(d) => setAssignTargets([d])}
        onRemove={(d) => setRemoveTargets([d])}
        onEdit={(d) => { setDetailOpen(false); openEdit(d); }}
      />

      {/* Dialog Thêm mới / Sửa nhanh tài sản — CRUD ngay trong Danh mục. */}
      <ThietBiFormDialog
        open={formMode !== null}
        onOpenChange={(o) => { if (!o) setFormMode(null); }}
        mode={formMode ?? "create"}
        device={formDevice}
      />

      {/* Hộp thoại lịch sử gán / chuyển / gỡ tài sản (ai làm, lúc nào, trước → sau) */}
      <DeviceMovementHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        systemName={systemNameById}
        deviceName={deviceNameByMa}
      />

      {/* Dialog chọn hệ thống để gán */}
      <AssignSystemDialog
        open={!!assignTargets}
        onOpenChange={(o) => !o && setAssignTargets(null)}
        systems={assignSystems}
        systemName={(id, fb) => htName(id, fb)}
        count={assignTargets?.length ?? 0}
        onConfirm={(htId, htLabel) => {
          if (assignTargets) doAssign(assignTargets, htId, htLabel);
          setAssignTargets(null);
        }}
      />

      {/* Xác nhận gỡ khỏi hệ thống */}
      <AlertDialog open={!!removeTargets} onOpenChange={(o) => !o && setRemoveTargets(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ khỏi hệ thống?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const inSys = (removeTargets ?? []).filter((d) => d._htId);
                return (
                  <>
                    Gỡ <b>{inSys.length}</b> tài sản khỏi hệ thống hiện tại. Tài sản sẽ trở thành <b>độc lập</b> (vẫn giữ phân loại).
                    {canManage && hasRole("admin") ? " Thay đổi áp dụng ngay và có thể hoàn tác." : " Thay đổi sẽ chờ admin duyệt."}
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removeTargets) doRemove(removeTargets);
                setRemoveTargets(null);
              }}
            >
              Gỡ khỏi hệ thống
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
