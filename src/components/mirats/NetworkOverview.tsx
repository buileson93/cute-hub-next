// ============================================================================
// NetworkOverview — VIEW TỔNG QUAN MẠNG kiểu Obsidian (Prompt 6, tinh gọn).
//
// Renderer nhẹ RIÊNG: react-force-graph-2d (canvas). Phong cách Obsidian:
//   - Node = ĐIỂM nhỏ; nhãn ẨN mặc định, chỉ hiện khi hover/focus hoặc zoom
//     vượt "ngưỡng mờ chữ" (text fade threshold).
//   - Hover 1 điểm -> highlight hàng xóm, làm mờ phần còn lại (đọc & focus).
//   - Chống chồng lấn bằng lực va chạm (forceCollide) + tách lực trung tâm/
//     đẩy/liên kết/độ dài (panel Forces như Obsidian).
//
// Drill-in 1 hệ thống -> điều hướng sang SƠ ĐỒ HỆ THỐNG (React Flow) hiện có.
// TÁI DÙNG graph-core.ts + graph-cluster.ts. Dữ liệu đọc TỪ DB.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { forceCollide, forceX, forceY, forceRadial } from "d3-force";
import { NodeNoteDrawer } from "./NodeNoteDrawer";
import { listNotedNodeIds } from "@/lib/node-notes.functions";
import {
  Search, ArrowLeft, Building2, Network, ArrowRight, ArrowLeftRight,
  ZoomIn, ZoomOut, Maximize2, Minimize2, AlertTriangle, Boxes, Cpu, ChevronRight,
  ChevronDown, Pencil, SlidersHorizontal, Filter as FilterIcon, Eye, Waves,
  RotateCcw, Crosshair, ImageDown, FileDown, PanelRightClose, PanelRightOpen,
  Bookmark, BookmarkCheck, Info, Keyboard, Home, Undo2, Redo2, FileText, StickyNote,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { chipHslTheoKhoa, egoGraph, filterGraph, highlightNeighbors, type CoreGraph } from "@/lib/mirats/graph-core";
import {
  expandOrgGraph, orgLevelGraph,
  type ClusterNode, type OrgInfo,
} from "@/lib/mirats/graph-cluster";
import {
  useToChuc, useDoThiToanCanh, useDoThiHeThong, useHeThongChiTiet,
  useLienKetCuaHeThong, usePhanTichTacDong, useLoaiLienKet,
  useHeThongPickList, useUpdateLienKet, useThemKheLienKet, useXoaKheLienKet, LOP_LABEL,
  type ToanCanhNode,
} from "@/lib/mirats/lien-ket";
import {
  LOAI_LIEN_KET_LABEL, LOAI_LIEN_KET_MAU,
  type DoThiRow, type LoaiLienKetMa,
} from "@/lib/mirats/system-graph";
import { LienKetForm } from "@/components/mirats/LienKetForm";
// (đã tích hợp bung thành phần trực tiếp trên canvas — không dùng SystemInternalGraph ở đây)

// ---------------------------------------------------------------------------
// Wrapper client-only cho react-force-graph-2d (import động, tránh SSR window).
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FGType = any;

function useForceGraphComponent(): FGType | null {
  const [Comp, setComp] = useState<FGType | null>(null);
  useEffect(() => {
    let alive = true;
    import("react-force-graph-2d").then((m) => {
      if (alive) setComp(() => m.default);
    });
    return () => { alive = false; };
  }, []);
  return Comp;
}

// ---------------------------------------------------------------------------
interface FGNode {
  id: string;
  ten: string;
  la_cum: boolean;
  la_thanh_phan?: boolean;   // node cấp 3 = 1 thành phần bên trong hệ thống cha
  parent_id?: string | null; // id hệ thống cha (khi la_thanh_phan)
  ben_ngoai: boolean;
  mau: string;
  bac: number;
  so_thanh_vien?: number;
  to_chuc?: string | null;
  don_vi?: string | null;
  thiet_bi_ma?: string | null;
  thiet_bi_ten?: string | null;
  x?: number; y?: number;
  vx?: number; vy?: number;
}
interface FGLink {
  id: string;
  source: string | FGNode;
  target: string | FGNode;
  mau: string;
  huong: string;
  trong_so?: number;
  la_cum: boolean;
  trang_thai: string;
  loai_ten?: string | null;
  lop?: string | null;
  giao_thuc?: string | null;
  giao_dien?: string | null;
  cong?: number;
}

const LEGEND: Array<{ ma: LoaiLienKetMa; label: string }> = [
  { ma: "DAU_NOI_VAT_LY", label: LOAI_LIEN_KET_LABEL.DAU_NOI_VAT_LY },
  { ma: "LUONG_TIN_HIEU", label: LOAI_LIEN_KET_LABEL.LUONG_TIN_HIEU },
  { ma: "PHU_THUOC_DICH_VU", label: LOAI_LIEN_KET_LABEL.PHU_THUOC_DICH_VU },
  { ma: "DU_PHONG", label: LOAI_LIEN_KET_LABEL.DU_PHONG },
];

// Giá trị mặc định của bảng điều khiển vật lý / hiển thị.
// Gọn hơn (điểm nhỏ, cụm sát nhau) để đọc nhanh và không chiếm chỗ như trước.
const DEFAULTS = {
  centerForce: 0.09,
  repelForce: 120,
  linkForce: 0.4,
  linkDistance: 42,
  textFade: 1.3,
  nodeSize: 1,
  linkThickness: 1,
  showArrows: false,
};

function idOf(x: string | FGNode): string {
  return typeof x === "string" ? x : x.id;
}

// Làm sáng/tối một màu CSS bất kỳ (hex, rgb, hsl…) theo hệ số [-1, 1].
// Dùng cho hiệu ứng radial-gradient "bóng cầu" trên node.
function shade(color: string, amount: number): string {
  // hex #rgb / #rrggbb
  const hex = color.trim();
  if (hex.startsWith("#")) {
    let h = hex.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const f = amount < 0 ? 1 + amount : 1 - amount;
    const mix = (x: number) => Math.round(amount < 0 ? x * f : x + (255 - x) * amount);
    const to = (x: number) => mix(x).toString(16).padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`;
  }
  // hsl(H S% L%) — chỉnh L
  const m = /hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i.exec(hex);
  if (m) {
    const H = +m[1], S = +m[2]; let L = +m[3];
    L = Math.max(0, Math.min(100, L + amount * 100));
    return `hsl(${H} ${S}% ${L}%)`;
  }
  return color;
}


export function NetworkOverview({ canManage }: { canManage: boolean }) {
  const ForceGraph = useForceGraphComponent();

  const qc = useQueryClient();
  const { toChucList } = useToChuc();
  const { nodes: canhNodes } = useDoThiToanCanh();
  const { rows: edgeRows } = useDoThiHeThong();
  const { loaiList } = useLoaiLienKet();
  const { heThongList } = useHeThongPickList();
  const updMut = useUpdateLienKet();

  // ---- Realtime: đồng bộ tức thì khi hệ thống / liên kết thay đổi ----
  useEffect(() => {
    const ch = supabase
      .channel("net-overview-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "lien_ket_he_thong" }, () => {
        qc.invalidateQueries({ queryKey: ["v_do_thi_he_thong"] });
        qc.invalidateQueries({ queryKey: ["lien_ket_he_thong_cua"] });
        qc.invalidateQueries({ queryKey: ["v_do_thi_toan_canh"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_he_thong" }, () => {
        qc.invalidateQueries({ queryKey: ["v_do_thi_toan_canh"] });
        qc.invalidateQueries({ queryKey: ["v_do_thi_he_thong"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "he_thong_thanh_phan" }, () => {
        qc.invalidateQueries({ queryKey: ["v_do_thi_toan_canh"] });
        qc.invalidateQueries({ queryKey: ["thanh_phan_cua_he_thong"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "lien_ket_khe" }, () => {
        qc.invalidateQueries({ queryKey: ["v_do_thi_toan_canh"] });
        qc.invalidateQueries({ queryKey: ["lien_ket_khe"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "node_note" }, () => {
        qc.invalidateQueries({ queryKey: ["node_note"] });
        qc.invalidateQueries({ queryKey: ["node_note_search"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };

  }, [qc]);

  // ---- Trạng thái semantic-zoom / drill ----
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [localMode, setLocalMode] = useState(false);
  const [egoRadius, setEgoRadius] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverLinkId, setHoverLinkId] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const [impactFor, setImpactFor] = useState<string | null>(null);
  const [editEdgeRow, setEditEdgeRow] = useState<DoThiRow | null>(null);
  // Cột thông tin bên phải: mặc định thu gọn để không chiếm chỗ, tự bung khi chọn 1 điểm.
  const [sideOpen, setSideOpen] = useState(false);
  // Ghi chú node (Obsidian-style) — drawer riêng, đọc/ghi bảng node_note.
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<{ type: "he_thong" | "thanh_phan"; id: string; ten: string } | null>(null);
  // Bung inline: bung một hệ thống ngay trên canvas toàn cảnh — các thành phần
  // của nó sẽ hiện quanh nó, cạnh liên kết khe kéo sang thành phần hệ thống khác.
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set());
  const [legendOpen, setLegendOpen] = useState(true);
  // Bật/tắt lực gom cụm thành phần quanh hệ thống cha (toàn cục ↔ chi tiết).
  const [clusterOn, setClusterOn] = useState(true);
  // Chế độ nối: click 2 thành phần để tạo liên kết khe, lưu vào DB.
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [connectDialog, setConnectDialog] = useState<{ srcId: string; dstId: string; srcTen: string; dstTen: string; heThongNguon: string } | null>(null);
  const [connectLoaiId, setConnectLoaiId] = useState<string>("");
  const [connectGdN, setConnectGdN] = useState("");
  const [connectGdD, setConnectGdD] = useState("");
  const [connectGhiChu, setConnectGhiChu] = useState("");
  const themKheMut = useThemKheLienKet();
  const xoaKheMut = useXoaKheLienKet();
  // Ngăn Undo/Redo cho các liên kết khe vừa tạo trên chế độ Nối.
  type KheAction = {
    id: string; he_thong_id: string;
    payload: {
      he_thong_id: string; khe_nguon_id: string; khe_dich_id: string;
      loai_lien_ket_id: string; don_vi_id_snapshot: string | null;
      giao_dien_nguon: string | null; giao_dien_dich: string | null; ghi_chu: string | null;
    };
  };
  const [undoStack, setUndoStack] = useState<KheAction[]>([]);
  const [redoStack, setRedoStack] = useState<KheAction[]>([]);
  // Focus theo yêu cầu (search / auto-expand): giữ id đợi tới khi node có toạ độ rồi centerAt.
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  // Nhấp nháy node vừa chọn từ tìm kiếm (đánh dấu vàng trong ~2.4s).
  const [markedId, setMarkedId] = useState<string | null>(null);
  const markedTimerRef = useRef<number | null>(null);
  // Kết quả tìm kiếm mở popover dưới ô Tìm.
  const [searchOpen, setSearchOpen] = useState(false);
  // Lọc phạm vi tìm kiếm: tất cả | chỉ hệ thống | chỉ thành phần | chỉ khớp mã.
  const [searchScope, setSearchScope] = useState<"all" | "he_thong" | "thanh_phan" | "ma">("all");



  // ---- Trình chiếu: toàn màn hình + laser pointer ----
  const [isFull, setIsFull] = useState(false);
  const [laser, setLaser] = useState(false);
  const laserRef = useRef<HTMLDivElement>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);
  const laserTrailRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const laserPosRef = useRef<{ x: number; y: number } | null>(null);

  // ---- Bộ lọc ----
  const [q, setQ] = useState("");
  const [fOrg, setFOrg] = useState("");
  const [fDonVi, setFDonVi] = useState("");
  const [fPhamVi, setFPhamVi] = useState("");
  const [fLoai, setFLoai] = useState("");
  const [fLop, setFLop] = useState("");
  const [fGiaoThuc, setFGiaoThuc] = useState("");
  const [fGiaoDien, setFGiaoDien] = useState("");
  const [hideNgung, setHideNgung] = useState(true);

  // ---- Panel điều khiển (Obsidian) ----
  const [panelOpen, setPanelOpen] = useState(false);
  const [centerForce, setCenterForce] = useState(DEFAULTS.centerForce);
  const [repelForce, setRepelForce] = useState(DEFAULTS.repelForce);
  const [linkForce, setLinkForce] = useState(DEFAULTS.linkForce);
  const [linkDistance, setLinkDistance] = useState(DEFAULTS.linkDistance);
  const [textFade, setTextFade] = useState(DEFAULTS.textFade);
  const [nodeSize, setNodeSize] = useState(DEFAULTS.nodeSize);
  const [linkThickness, setLinkThickness] = useState(DEFAULTS.linkThickness);
  const [showArrows, setShowArrows] = useState(DEFAULTS.showArrows);

  const resetForces = () => {
    setCenterForce(DEFAULTS.centerForce);
    setRepelForce(DEFAULTS.repelForce);
    setLinkForce(DEFAULTS.linkForce);
    setLinkDistance(DEFAULTS.linkDistance);
  };

  const { impact } = usePhanTichTacDong(impactFor ?? undefined);
  const impactIds = useMemo(() => new Set(impact.map((i) => i.he_thong_id)), [impact]);

  // Chọn 1 điểm -> tự bung cột thông tin bên phải.
  useEffect(() => { if (selectedId) setSideOpen(true); }, [selectedId]);

  const orgs: OrgInfo[] = useMemo(
    () => toChucList.map((o) => ({
      id: o.id, cha_id: o.to_chuc_cha_id, ten: o.ten, mau_sac: o.mau_sac, loai: o.loai,
    })),
    [toChucList],
  );

  // Danh mục toàn bộ thành phần hệ thống — nạp cache lâu để phục vụ tìm kiếm nhanh.
  const { data: allComponents } = useQuery({
    queryKey: ["net-all-thanh-phan"],
    staleTime: 60_000,
    queryFn: async () => {
      // Phân trang 1000/lần — bảng `he_thong_thanh_phan` đã vượt 1000 dòng,
      // nếu để mặc định PostgREST sẽ cắt và ô tìm nhanh thiếu thành phần.
      const PAGE = 1000;
      const out: Array<{ id: string; ma_thanh_phan: string; ten: string; he_thong_id: string }> = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("he_thong_thanh_phan")
          .select("id, ma_thanh_phan, ten, he_thong_id")
          .is("hieu_luc_den", null)
          .is("deleted_at" as never, null)
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const batch = (data ?? []) as Array<{ id: string; ma_thanh_phan: string; ten: string; he_thong_id: string }>;
        out.push(...batch);
        if (batch.length < PAGE) break;
      }
      return out;
    },
  });


  // Danh sách node đã có ghi chú (dùng để chấm dấu 📝 nhỏ trên sơ đồ).
  const listNotedFn = useServerFn(listNotedNodeIds);
  const { data: notedRows } = useQuery({
    queryKey: ["noted_node_ids"],
    staleTime: 30_000,
    queryFn: () => listNotedFn(),
  });
  const notedSet = useMemo(() => {
    const s = new Set<string>();
    for (const r of notedRows ?? []) s.add(r.key);
    return s;
  }, [notedRows]);

  const baseGraph = useMemo(() => {
    const nodeMap = new Map<string, ClusterNode>();
    for (const n of canhNodes as ToanCanhNode[]) {
      nodeMap.set(n.id, {
        id: n.id,
        ten: n.ten,
        nhom: n.nhom_ten,
        don_vi: n.don_vi_ten,
        ben_ngoai: n.ben_ngoai,
        to_chuc: n.to_chuc_ten,
        to_chuc_id: n.to_chuc_id,
        meta: {
          bac: n.bac_lien_ket,
          mau: n.to_chuc_mau ?? chipHslTheoKhoa(n.to_chuc_ten) ?? "#64748b",
          ma: n.ma,
          pham_vi: n.pham_vi_quan_ly,
        },
      });
    }
    const edges = edgeRows.map((r) => ({
      id: r.id,
      nguon: r.nguon_id,
      dich: r.dich_id,
      loai: r.loai_ma as string,
      loai_ten: r.loai_ten,
      lop: r.lop as string,
      huong: r.huong as string,
      trang_thai: r.trang_thai as string,
      giao_thuc: r.giao_thuc ?? null,
      giao_dien_nguon: r.giao_dien_nguon ?? null,
      giao_dien_dich: r.giao_dien_dich ?? null,
      mau_sac: r.mau_sac ?? LOAI_LIEN_KET_MAU[r.loai_ma as LoaiLienKetMa] ?? "#94a3b8",
      co_huong: r.co_huong,
      hai_chieu: r.huong === "hai_chieu",
    }));
    return { nodes: [...nodeMap.values()], edges };
  }, [canhNodes, edgeRows]);

  // Danh sách giá trị phân biệt để lọc (đơn vị / giao thức / giao diện).
  const donViOptions = useMemo(() => {
    const s = new Set<string>();
    for (const n of canhNodes as ToanCanhNode[]) if (n.don_vi_ten) s.add(n.don_vi_ten);
    return [...s].sort();
  }, [canhNodes]);
  const giaoThucOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of edgeRows) if (r.giao_thuc) s.add(r.giao_thuc);
    return [...s].sort();
  }, [edgeRows]);
  const giaoDienOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of edgeRows) {
      if (r.giao_dien_nguon) s.add(r.giao_dien_nguon);
      if (r.giao_dien_dich) s.add(r.giao_dien_dich);
    }
    return [...s].sort();
  }, [edgeRows]);

  const filteredBase = useMemo(() => {
    const g = filterGraph(
      baseGraph as CoreGraph,
      { lop: fLop ? [fLop] : null, loai: fLoai ? [fLoai] : null, hideNgung },
    );
    let nodes = g.nodes as ClusterNode[];
    if (fOrg) nodes = nodes.filter((n) => n.to_chuc_id === fOrg);
    if (fDonVi) nodes = nodes.filter((n) => n.don_vi === fDonVi);
    if (fPhamVi) nodes = nodes.filter((n) => (n.meta?.pham_vi as string) === fPhamVi);
    const keep = new Set(nodes.map((n) => n.id));
    let edges = g.edges.filter((e) => keep.has(e.nguon) && keep.has(e.dich));
    if (fGiaoThuc) edges = edges.filter((e) => (e as { giao_thuc?: string | null }).giao_thuc === fGiaoThuc);
    if (fGiaoDien) edges = edges.filter((e) => {
      const gn = (e as { giao_dien_nguon?: string | null }).giao_dien_nguon;
      const gd = (e as { giao_dien_dich?: string | null }).giao_dien_dich;
      return gn === fGiaoDien || gd === fGiaoDien;
    });
    return { nodes, edges };
  }, [baseGraph, fLop, fLoai, hideNgung, fOrg, fDonVi, fPhamVi, fGiaoThuc, fGiaoDien]);


  // ---- Dữ liệu nội bộ cho các hệ thống đang được bung inline ----
  // Trả về danh sách thành phần (có tài sản đang gắn) và các liên kết khe (kể cả
  // các cạnh nối sang thành phần của hệ thống khác — cho phép kéo dây liên tầng).
  const expandedIds = useMemo(() => [...expandedSystems].sort(), [expandedSystems]);
  const { data: innerData } = useQuery({
    queryKey: ["net-inline-inner", expandedIds],
    enabled: expandedIds.length > 0,
    staleTime: 15_000,
    queryFn: async () => {
      const { fetchAllRows } = await import("@/lib/mirats/paginate");
      const tps = await fetchAllRows<{ id: string; ma_thanh_phan: string; ten: string; he_thong_id: string }>(
        (from, to) => supabase
          .from("he_thong_thanh_phan")
          .select("id, ma_thanh_phan, ten, he_thong_id")
          .in("he_thong_id", expandedIds)
          .is("hieu_luc_den", null)
          .is("deleted_at" as never, null)
          .range(from, to),
      );
      const compIds = tps.map((t) => t.id);
      const gan = new Map<string, { ten: string | null; ma: string | null }>();
      if (compIds.length) {
        const g = await fetchAllRows<{ thanh_phan_id: string; thiet_bi: { ten_thiet_bi: string | null; ma_thiet_bi: string | null } | null }>(
          (from, to) => supabase
            .from("gan_chuc_nang")
            .select("thanh_phan_id, thiet_bi:thiet_bi_id(ten_thiet_bi, ma_thiet_bi)")
            .in("thanh_phan_id", compIds)
            .is("den_ngay", null)
            .range(from, to) as never,
        );
        for (const r of g) {
          gan.set(r.thanh_phan_id, {
            ten: r.thiet_bi?.ten_thiet_bi ?? null,
            ma: r.thiet_bi?.ma_thiet_bi ?? null,
          });
        }
      }
      // Liên kết khe: giữ tất cả cạnh có ít nhất một đầu nằm trong tập thành phần đang bung.
      // Cạnh nối sang thành phần của hệ thống CHƯA bung sẽ chỉ vào node hệ thống cha (fallback ở bước dựng).
      let khe: any[] = [];
      if (compIds.length) {
        khe = await fetchAllRows<any>(
          (from, to) => supabase
            .from("lien_ket_khe")
            .select("id, khe_nguon_id, khe_dich_id, loai:loai_lien_ket_id(ten, mau_sac), giao_dien_nguon, giao_dien_dich")
            .or(`khe_nguon_id.in.(${compIds.join(",")}),khe_dich_id.in.(${compIds.join(",")})`)
            .is("hieu_luc_den", null)
            .range(from, to),
        );
      }
      // Với các thành phần "đối tác" nằm ngoài tập bung, tra hệ thống cha để rơi cạnh về node hệ thống.
      const otherIds = new Set<string>();
      const compById = new Map<string, { id: string; he_thong_id: string }>(tps.map((t) => [t.id, t]));
      for (const l of khe) {
        if (!compById.has(l.khe_nguon_id)) otherIds.add(l.khe_nguon_id);
        if (!compById.has(l.khe_dich_id)) otherIds.add(l.khe_dich_id);
      }
      if (otherIds.size) {
        const ot = await fetchAllRows<{ id: string; he_thong_id: string }>(
          (from, to) => supabase
            .from("he_thong_thanh_phan")
            .select("id, he_thong_id")
            .in("id", [...otherIds])
            .range(from, to),
        );
        for (const r of ot) compById.set(r.id, { id: r.id, he_thong_id: r.he_thong_id });
      }
      return {
        components: tps.map((t) => ({
          id: t.id, ma: t.ma_thanh_phan, ten: t.ten, he_thong_id: t.he_thong_id,
          thiet_bi: gan.get(t.id) ?? null,
        })),
        khe,
        compParent: compById,
      };
    },
  });

  // -------------------------------------------------------------------------
  // Nhận diện "họ" (family) trong các thành phần của cùng 1 hệ thống bung.
  // Ví dụ AWOS Đà Nẵng có 2 nhóm: đầu 35 và đầu 17. Các thành phần cùng đầu
  // được gom cùng một cung tròn và cùng tông màu để dễ nhận diện thị giác
  // (học từ Obsidian: điểm cùng nhóm bung ra theo hình tròn quanh cha).
  // -------------------------------------------------------------------------
  const familyKeyOf = useCallback((ten: string, ma: string | null): string => {
    const src = `${ma ?? ""} ${ten ?? ""}`.toUpperCase();
    // 1) Đầu đường CHC / heading băng tần: 01..36 (kèm L/C/R nếu có)
    const rh = src.match(/\b(0[1-9]|[12][0-9]|3[0-6])[LRC]?\b/);
    if (rh) return rh[0];
    // 2) Nhãn kỹ thuật phổ biến (kênh, hướng, khối)
    const dir = src.match(
      /\b(TX|RX|PSR|SSR|LOC|GP|DME|VOR|NDB|ILS|COM|VHF|UHF|HF|APP|TWR|ACC|MSSR|RSR|ATIS|CH\d+|CH[A-Z]|BLK\d+|BAY\d+|OP-A|OP-B|A\/B|A|B)\b/,
    );
    if (dir) return dir[0].replace(/\s+/g, "");
    // 3) Số thứ tự trong ngoặc / sau #
    const num = src.match(/#\s*(\d+)/) || src.match(/\((\d+)\)/);
    if (num) return `#${num[1]}`;
    // 4) Fallback: token chữ-số ngắn đầu tiên
    const tok = src.match(/\b[A-Z0-9]{2,4}\b/);
    return tok ? tok[0] : "MISC";
  }, []);

  const familyColor = useCallback((key: string, parentId: string): string => {
    const s = `${parentId}::${key}`;
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    // Chia vành hue để 2-6 họ trong cùng hệ thống lệch nhau ~60°, tránh trùng màu.
    const hue = h % 360;
    return `hsl(${hue}, 68%, 58%)`;
  }, []);

  // compLayout: map compId -> { angle (rad), R (radius quanh cha), color, family }.
  // Dùng cho cả tô màu node và lực radial trong useEffect vật lý.
  // BỐ CỤC "QUẢ CẦU MÀU" — Vogel sunflower phyllotaxis:
  //   r_i = R_max · √((i + 0.5) / N),  θ_i = i · goldenAngle  (137.508°)
  //   Đây là thuật toán chuẩn để rải điểm đều trên đĩa tròn (bao đóng gói),
  //   không có "đường sọc" và mật độ đồng đều — nhìn như một quả cầu chấm màu.
  // Kết hợp SẮP THEO HỌ (family) để cùng họ tụ thành mảng màu liền kề.
  const compLayout = useMemo(() => {
    const out = new Map<string, { angle: number; R: number; color: string; family: string; parent_id: string }>();
    if (!innerData || !expandedIds.length) return out;
    const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.39996 rad = 137.508°
    const byParent = new Map<string, { id: string; ten: string; ma: string | null }[]>();
    for (const c of innerData.components) {
      const arr = byParent.get(c.he_thong_id) ?? [];
      arr.push({ id: c.id, ten: c.ten, ma: c.ma });
      byParent.set(c.he_thong_id, arr);
    }
    for (const [parentId, comps] of byParent) {
      // Sort ổn định theo (family, ten) để phối màu liền dải, không nhảy giữa render.
      const decorated = comps.map((c) => ({ c, fam: familyKeyOf(c.ten, c.ma) }));
      decorated.sort((a, b) => (a.fam === b.fam ? a.c.ten.localeCompare(b.c.ten) : a.fam.localeCompare(b.fam)));
      const N = decorated.length;
      // Bán kính đĩa: đủ chỗ để không đè lên nút cha, mở rộng theo √N.
      const Rmax = Math.max(34, Math.min(180, 22 + 10 * Math.sqrt(N)));
      decorated.forEach(({ c, fam }, i) => {
        // Vogel spiral: bán kính căn bậc hai để mật độ đồng đều trên đĩa.
        const r = Rmax * Math.sqrt((i + 0.5) / Math.max(1, N));
        const angle = i * GOLDEN;
        out.set(c.id, {
          angle,
          R: r,
          color: familyColor(fam, parentId),
          family: fam,
          parent_id: parentId,
        });
      });
    }
    return out;
  }, [innerData, expandedIds, familyKeyOf, familyColor]);


  const displayGraph = useMemo(() => {
    let g: { nodes: ClusterNode[]; edges: any[] };
    if (localMode && selectedId && !selectedId.startsWith("org:")) {
      g = egoGraph(filteredBase as CoreGraph, selectedId, egoRadius) as any;
    } else if (expandedOrg) {
      g = expandOrgGraph(filteredBase, orgs, expandedOrg);
    } else {
      g = orgLevelGraph(filteredBase, orgs);
    }
    // Bung inline: thêm nodes = thành phần + edges = liên kết khe. Cạnh nối sang
    // thành phần ngoài tập bung được "gập" về node hệ thống cha để giữ toàn cục
    // trên cùng 1 graph.
    if (innerData && expandedIds.length) {
      const alive = new Set(g.nodes.map((n) => n.id));
      const extraNodes: ClusterNode[] = [];
      for (const c of innerData.components) {
        if (!alive.has(c.he_thong_id)) continue; // hệ thống cha đang bị gộp cụm → không hiện thành phần
        const lay = compLayout.get(c.id);
        extraNodes.push({
          id: c.id,
          ten: c.ma ? `${c.ma} · ${c.ten}` : c.ten,
          nhom: null, don_vi: null, ben_ngoai: false, to_chuc: null,
          to_chuc_id: null,
          meta: {
            la_thanh_phan: true,
            parent_id: c.he_thong_id,
            thiet_bi_ma: c.thiet_bi?.ma ?? null,
            thiet_bi_ten: c.thiet_bi?.ten ?? null,
            // Màu theo "họ" trong hệ thống cha (Obsidian-style).
            mau: lay?.color ?? "#0ea5e9",
            family: lay?.family ?? null,
          },
        } as ClusterNode);
      }
      const compNodeIds = new Set(extraNodes.map((n) => n.id));
      const extraEdges: any[] = [];
      const seenCollapsedPair = new Set<string>();
      for (const l of innerData.khe) {
        // Đầu nguồn/đích: nếu thành phần đó là node đang hiện thì dùng chính nó,
        // nếu không thì fallback về hệ thống cha (nếu hệ thống cha còn hiện trên canvas).
        const resolve = (compId: string): string | null => {
          if (compNodeIds.has(compId)) return compId;
          const pid = innerData.compParent.get(compId)?.he_thong_id;
          return pid && alive.has(pid) ? pid : null;
        };
        const a = resolve(l.khe_nguon_id);
        const b = resolve(l.khe_dich_id);
        if (!a || !b || a === b) continue;
        // Nếu cả 2 đầu đã "gập" về hệ thống, tránh trùng với cạnh liên kết hệ thống cấp trên.
        if (!compNodeIds.has(a) && !compNodeIds.has(b)) {
          const key = a < b ? `${a}|${b}` : `${b}|${a}`;
          if (seenCollapsedPair.has(key)) continue;
          seenCollapsedPair.add(key);
        }
        extraEdges.push({
          id: `khe:${l.id}`,
          nguon: a, dich: b,
          loai: null, loai_ten: l.loai?.ten ?? "Liên kết khe",
          lop: "component", huong: "hai_chieu", trang_thai: "hoat_dong",
          giao_thuc: null,
          giao_dien_nguon: l.giao_dien_nguon ?? null,
          giao_dien_dich: l.giao_dien_dich ?? null,
          mau_sac: l.loai?.mau_sac ?? "#0ea5e9",
          co_huong: false,
        });
      }
      return { nodes: [...g.nodes, ...extraNodes], edges: [...g.edges, ...extraEdges] };
    }
    return g;
  }, [filteredBase, orgs, expandedOrg, localMode, selectedId, egoRadius, innerData, expandedIds, compLayout]);


  // Highlight theo hover (ưu tiên) hoặc node đang chọn.
  const focusId = hoverId ?? selectedId;
  const hl = useMemo(() => {
    if (!focusId) return null;
    return highlightNeighbors(displayGraph as CoreGraph, focusId, 1);
  }, [displayGraph, focusId]);

  // ---- Dữ liệu react-force-graph, giữ object để không random lại vị trí ----
  const nodeCache = useRef(new Map<string, FGNode>());
  const fgData = useMemo(() => {
    const alive = new Set(displayGraph.nodes.map((n) => n.id));
    for (const key of [...nodeCache.current.keys()]) {
      if (!alive.has(key)) nodeCache.current.delete(key);
    }
    const parentPos = new Map<string, { x: number; y: number }>();
    // Đầu tiên tính vị trí sẵn có của node hệ thống cha để "khai sinh" thành phần quanh nó.
    for (const n of displayGraph.nodes) {
      const cached = nodeCache.current.get(n.id);
      if (cached && cached.x != null && cached.y != null) parentPos.set(n.id, { x: cached.x, y: cached.y });
    }
    const nodes: FGNode[] = displayGraph.nodes.map((n) => {
      const cached = nodeCache.current.get(n.id) ?? ({} as FGNode);
      const laCum = !!(n.meta?.la_cum);
      const laTP = !!(n.meta?.la_thanh_phan);
      const pid = (n.meta?.parent_id as string | undefined) ?? null;
      // Khởi tạo vị trí quanh cha (nếu chưa có) — tránh "văng" ra tâm gốc gây rối.
      if (laTP && (cached.x == null || cached.y == null) && pid && parentPos.has(pid)) {
        const p = parentPos.get(pid)!;
        const ang = Math.random() * Math.PI * 2;
        const r = 24 + Math.random() * 16;
        cached.x = p.x + Math.cos(ang) * r;
        cached.y = p.y + Math.sin(ang) * r;
      }
      Object.assign(cached, {
        id: n.id,
        ten: n.ten,
        la_cum: laCum,
        la_thanh_phan: laTP,
        parent_id: pid,
        ben_ngoai: n.ben_ngoai ?? false,
        mau: (n.meta?.mau as string) ?? (n.meta?.mau_sac as string) ?? chipHslTheoKhoa(n.to_chuc ?? null) ?? "#64748b",
        bac: laCum ? (n.meta?.so_thanh_vien as number) ?? 1 : (n.meta?.bac as number) ?? 1,
        so_thanh_vien: n.meta?.so_thanh_vien as number | undefined,
        to_chuc: n.to_chuc,
        don_vi: n.don_vi,
        thiet_bi_ma: (n.meta?.thiet_bi_ma as string | null) ?? null,
        thiet_bi_ten: (n.meta?.thiet_bi_ten as string | null) ?? null,
      });
      nodeCache.current.set(n.id, cached);
      return cached;
    });
    const links: FGLink[] = displayGraph.edges.map((e) => ({
      id: e.id,
      source: e.nguon,
      target: e.dich,
      mau: (e as { mau_sac?: string }).mau_sac ?? "#94a3b8",
      huong: (e as { huong?: string }).huong ?? "hai_chieu",
      trong_so: (e as { trong_so?: number }).trong_so,
      la_cum: e.id.startsWith("cum:"),
      trang_thai: (e as { trang_thai?: string }).trang_thai ?? "hoat_dong",
      loai_ten: (e as { loai_ten?: string | null }).loai_ten ?? null,
      lop: (e as { lop?: string | null }).lop ?? null,
      giao_thuc: (e as { giao_thuc?: string | null }).giao_thuc ?? null,
      giao_dien: [(e as { giao_dien_nguon?: string | null }).giao_dien_nguon, (e as { giao_dien_dich?: string | null }).giao_dien_dich].filter(Boolean).join(" → ") || null,
    }));
    // Tách các cạnh SONG SONG (nhiều liên kết giữa cùng cặp hệ thống, vd VHF↔VCCS
    // có tới 3 loại) thành các cung cong khác nhau để không đè lên nhau một vạch.
    const byPair = new Map<string, FGLink[]>();
    for (const l of links) {
      const a = idOf(l.source), b = idOf(l.target);
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      (byPair.get(key) ?? byPair.set(key, []).get(key)!).push(l);
    }
    for (const group of byPair.values()) {
      if (group.length <= 1) { group[0].cong = 0; continue; }
      // Rải cung: 0, ±0.18, ±0.36… để nhiều cạnh xòe ra hai bên.
      group.forEach((l, i) => {
        const step = 0.2;
        const offset = (i - (group.length - 1) / 2) * step;
        l.cong = offset;
      });
    }
    return { nodes, links };
  }, [displayGraph]);

  // ---- ForceGraph ref + kích thước ----
  const fgRef = useRef<FGType>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  // Chỉ tự canh khung (zoomToFit) MỘT lần cho mỗi lần bố cục ổn định; đổi tầng /
  // lọc thì cho canh lại từ đầu để không bị "văng" ra quá to.
  const didFit = useRef(false);
  // Chỉ refit khi TẦNG hoặc BỘ LỌC đổi — không refit mỗi lần bung thêm 1 hệ thống
  // để tránh giật khung khi mở nhiều hệ thống liên tiếp.
  useEffect(() => { didFit.current = false; }, [expandedOrg, localMode, egoRadius, filteredBase]);


  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: Math.max(460, el.clientHeight) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Bán kính điểm: nhỏ gọn theo phong cách Obsidian (điểm chấm, không phải quả bóng).
  const nodeRadius = useCallback((n: FGNode) => {
    if (n.la_thanh_phan) return Math.max(1.4, 2.0 * nodeSize);
    const base = n.la_cum ? 3.6 : 2.2;
    const k = n.la_cum ? 1.9 : 1.05;
    return Math.max(1.8, Math.min(n.la_cum ? 13 : 8, base + Math.sqrt(n.bac) * k)) * nodeSize;
  }, [nodeSize]);

  // ---- Áp lực vật lý (Obsidian-like) ----
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("charge")?.strength(-repelForce);
    fg.d3Force("link")?.distance((l: FGLink) => {
      // Cạnh khe → ngắn hơn để thành phần "bao" quanh hệ thống cha.
      if (typeof l.id === "string" && l.id.startsWith("khe:")) return Math.max(14, linkDistance * 0.45);
      return linkDistance;
    }).strength(linkForce);

    // Bố cục VÒNG ĐỒNG TÂM cho hệ thống (Obsidian-style): mỗi tổ chức nằm
    // trên một vòng bán kính riêng; thành phần vẫn được kéo về hệ thống cha.
    const orgRing = new Map<string, number>();
    const orgs = Array.from(new Set(
      (fgData.nodes as FGNode[])
        .filter((n) => !n.la_thanh_phan && !n.la_cum)
        .map((n) => n.to_chuc ?? "__none")
    ));
    orgs.sort();
    const baseR = 220;
    const stepR = 140;
    orgs.forEach((o, i) => orgRing.set(o, baseR + i * stepR));

    let fx = fg.d3Force("x");
    if (!fx) { fx = forceX(0); fg.d3Force("x", fx); }
    fx.strength((n: FGNode) => (n.la_thanh_phan || !n.la_cum ? 0 : centerForce));
    let fy = fg.d3Force("y");
    if (!fy) { fy = forceY(0); fg.d3Force("y", fy); }
    fy.strength((n: FGNode) => (n.la_thanh_phan || !n.la_cum ? 0 : centerForce));

    // Lực xuyên tâm: kéo mỗi hệ thống về vòng thuộc tổ chức của nó.
    const fr = forceRadial<FGNode>(
      (n) => n.la_thanh_phan || n.la_cum ? 0 : (orgRing.get(n.to_chuc ?? "__none") ?? baseR),
      0, 0,
    ).strength((n: FGNode) => (!n.la_thanh_phan && !n.la_cum ? Math.max(0.05, centerForce * 0.6) : 0));
    fg.d3Force("radial", fr);

    fg.d3Force("collide", forceCollide((n: FGNode) => nodeRadius(n) + (n.la_thanh_phan ? 2 : 6)).strength(1).iterations(3));

    // Lực GỘP CỤM RADIAL THEO HỌ (Obsidian-style):
    // - Mỗi thành phần có toạ độ mục tiêu = (cha.x + R·cos θ, cha.y + R·sin θ)
    //   trong đó θ được chia đều theo "họ" (family) đã tính ở compLayout.
    // - Cùng họ ⇒ cùng cung + cùng tông màu ⇒ dễ nhận diện thị giác.
    if (clusterOn) {
      const radialFamily = (alpha: number) => {
        const nodes = fgData.nodes as FGNode[];
        const byId = new Map(nodes.map((n) => [n.id, n]));
        for (const n of nodes) {
          if (!n.la_thanh_phan || !n.parent_id) continue;
          const p = byId.get(n.parent_id);
          if (!p || p.x == null || p.y == null || n.x == null || n.y == null) continue;
          const lay = compLayout.get(n.id);
          const tx = lay ? p.x + lay.R * Math.cos(lay.angle) : p.x;
          const ty = lay ? p.y + lay.R * Math.sin(lay.angle) : p.y;
          // Kéo về mục tiêu — hệ số 0.22 đủ giữ hình tròn nhưng vẫn linh hoạt khi liên kết khe kéo lệch.
          const k = 0.22 * alpha;
          (n as any).vx = ((n as any).vx ?? 0) + (tx - n.x) * k;
          (n as any).vy = ((n as any).vy ?? 0) + (ty - n.y) * k;
        }
      };
      fg.d3Force("cluster", radialFamily);
    } else {
      // Tắt gom cụm: thành phần bay tự do theo vật lý (chế độ chi tiết).
      fg.d3Force("cluster", null);
    }

    fg.d3ReheatSimulation?.();
  }, [centerForce, repelForce, linkForce, linkDistance, nodeRadius, fgData, clusterOn, compLayout]);


  // ---- Vẽ node: ĐIỂM nhỏ; nhãn chỉ hiện khi hover/focus hoặc zoom > ngưỡng ----
  const paintNode = useCallback((node: FGNode, ctx: CanvasRenderingContext2D, scale: number) => {
    const r = nodeRadius(node);
    const inFocus = hl ? hl.nodes.has(node.id) : true;
    const isFocusNode = node.id === focusId;
    const isImpact = impactIds.has(node.id);
    ctx.globalAlpha = inFocus ? 1 : 0.12;

    ctx.beginPath();
    ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI);
    // Tô "bóng cầu": radial gradient nhẹ để mỗi chấm trông giống một hạt cầu 3D,
    // khi bung nhiều thành phần cùng cụm nhìn tổng thể giống quả cầu đầy màu.
    if (!isImpact && r > 1.6) {
      const cx = (node.x ?? 0) - r * 0.35;
      const cy = (node.y ?? 0) - r * 0.35;
      const g = ctx.createRadialGradient(cx, cy, r * 0.05, node.x ?? 0, node.y ?? 0, r * 1.05);
      g.addColorStop(0, "rgba(255,255,255,0.55)");
      g.addColorStop(0.35, node.mau);
      g.addColorStop(1, shade(node.mau, -0.25));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = isImpact ? "#dc2626" : node.mau;
    }
    ctx.fill();

    if (node.ben_ngoai) {
      ctx.setLineDash([2.5, 2]);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (isFocusNode || node.id === selectedId) {
      ctx.strokeStyle = "hsl(var(--primary))";
      ctx.lineWidth = 2 / scale + 0.5;
      ctx.stroke();
    }

    // Vòng nhấn khi hover/chọn (Obsidian glow nhẹ).
    if (isFocusNode) {
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, r + 3 / scale, 0, 2 * Math.PI);
      ctx.strokeStyle = "hsla(var(--primary), 0.35)";
      ctx.lineWidth = 1.5 / scale;
      ctx.stroke();
    }
    // Vòng đánh dấu NGUỒN ở chế độ Nối liên kết.
    if (node.id === connectSourceId) {
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, r + 5 / scale, 0, 2 * Math.PI);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    }

    // Vòng đánh dấu MARKED (kết quả tìm kiếm vừa chọn) — nhấp nháy vàng theo pha thời gian.
    if (node.id === markedId) {
      const t = (performance.now() % 1200) / 1200; // 0..1
      const pulse = 3 + Math.sin(t * Math.PI * 2) * 2; // 1..5
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, r + (5 + pulse) / scale, 0, 2 * Math.PI);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.5 / scale;
      ctx.stroke();
    }

    // Xem trước NGUỒN/ĐÍCH khi hộp thoại "Tạo liên kết khe" đang mở — nháy 2 vòng theo pha.
    if (connectDialog && (node.id === connectDialog.srcId || node.id === connectDialog.dstId)) {
      const t = (performance.now() % 1400) / 1400;
      const pulse = 2 + Math.sin(t * Math.PI * 2) * 2.5;
      const isSrc = node.id === connectDialog.srcId;
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, r + (6 + pulse) / scale, 0, 2 * Math.PI);
      ctx.strokeStyle = isSrc ? "#22c55e" : "#f43f5e";
      ctx.lineWidth = 2.5 / scale;
      ctx.stroke();
      // Vòng ngoài mờ.
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, r + (11 + pulse) / scale, 0, 2 * Math.PI);
      ctx.strokeStyle = isSrc ? "rgba(34,197,94,0.35)" : "rgba(244,63,94,0.35)";
      ctx.lineWidth = 1.2 / scale;
      ctx.stroke();
    }

    // Chấm nhỏ 📝 ở góc phải-trên: đánh dấu node đã có ghi chú Markdown.
    if (!node.la_cum && !node.id.startsWith("org:")) {
      const key = `${node.la_thanh_phan ? "thanh_phan" : "he_thong"}:${node.id}`;
      if (notedSet.has(key)) {
        const off = r * 0.72;
        const dot = Math.max(1.6 / scale, r * 0.32);
        ctx.beginPath();
        ctx.arc((node.x ?? 0) + off, (node.y ?? 0) - off, dot, 0, 2 * Math.PI);
        ctx.fillStyle = "#f59e0b"; // amber — dễ thấy trên nền tối/sáng
        ctx.fill();
        ctx.lineWidth = 1 / scale;
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  }, [nodeRadius, hl, focusId, selectedId, impactIds, connectSourceId, markedId, connectDialog, notedSet]);

  // ---- Vẽ NHÃN ở lớp trên cùng (sau links + nodes) để đường nối không che chữ ----
  const paintLabels = useCallback((ctx: CanvasRenderingContext2D, scale: number) => {
    const nodes = (fgData.nodes ?? []) as FGNode[];
    if (!nodes.length) return;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // Vẽ node có nhãn sau cùng để nhãn của node đang focus nằm trên tất cả.
    for (const node of nodes) {
      const isFocusNode = node.id === focusId;
      const inFocus = hl ? hl.nodes.has(node.id) : true;
      const showLabel = isFocusNode || (hl && hl.nodes.has(node.id) && focusId) || node.la_cum || scale >= textFade;
      if (!showLabel) continue;

      let labelAlpha = 1;
      if (!isFocusNode && !node.la_cum && !(hl && focusId)) {
        labelAlpha = Math.min(1, Math.max(0, (scale - textFade) / 0.4 + 0.15));
      }
      // Rút gọn tên dài để nhãn thanh mảnh, không tràn qua các node lân cận.
      const rawLabel = node.la_cum
        ? `${node.ten}${node.so_thanh_vien ? ` (${node.so_thanh_vien})` : ""}`
        : node.ten;
      const maxLen = node.la_cum ? 40 : 22;
      const label = rawLabel.length > maxLen ? rawLabel.slice(0, maxLen - 1) + "…" : rawLabel;
      const fs = Math.max(3, (node.la_cum ? 12 : 10) / scale);
      // Font Inter thanh mảnh: 300 cho thành phần, 500 cho cụm/hệ thống.
      ctx.font = `${node.la_cum ? 500 : 300} ${fs}px Inter, "SF Pro Text", system-ui, sans-serif`;

      const x = node.x ?? 0;
      const y = (node.y ?? 0) + nodeRadius(node) + 2;
      const alpha = (inFocus ? 1 : 0.14) * labelAlpha;
      ctx.globalAlpha = alpha;
      // Halo mảnh, bán trong suốt — không tạo "khung xám" quanh chữ.
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.lineWidth = Math.max(1.2 / scale, fs * 0.12);
      ctx.strokeStyle = "hsl(var(--background) / 0.55)";
      ctx.strokeText(label, x, y);
      ctx.fillStyle = "hsl(var(--foreground))";
      ctx.fillText(label, x, y);
    }
    ctx.globalAlpha = 1;

  }, [fgData, nodeRadius, hl, focusId, textFade]);


  const linkColor = useCallback((l: FGLink) => {
    if (hoverLinkId && l.id === hoverLinkId) return l.mau;
    if (hl && !hl.edges.has(l.id)) return "hsla(215, 16%, 65%, 0.08)";
    if (impactFor && impactIds.has(idOf(l.source)) && impactIds.has(idOf(l.target))) return "#dc2626";
    return l.mau;
  }, [hl, impactFor, impactIds, hoverLinkId]);

  const linkWidth = useCallback((l: FGLink) => {
    const base = l.trong_so && l.trong_so > 1 ? Math.min(6, 1 + l.trong_so) : l.trang_thai === "ngung" ? 0.5 : 1.1;
    let boosted = base;
    if (hl && hl.edges.has(l.id)) boosted += 0.8;
    if (hoverLinkId && l.id === hoverLinkId) boosted += 1.4;
    return boosted * linkThickness;
  }, [hl, linkThickness, hoverLinkId]);


  // ---- Click / double-click ----
  const lastClick = useRef<{ id: string; t: number }>({ id: "", t: 0 });
  const onNodeClick = useCallback((node: FGNode) => {
    // Chế độ NỐI: click 2 thành phần để tạo liên kết khe (ghi DB).
    if (connectMode) {
      if (!node.la_thanh_phan) {
        // Chặn khi đích là node hệ thống (đầu bên kia CHƯA bung) — tránh "gập" sai
        // vào hệ thống cha và ghi nhầm nguồn/đích trong DB.
        if (connectSourceId) {
          toast.warning(
            !node.la_cum && node.parent_id == null
              ? `Hệ thống "${node.ten}" chưa bung — hãy nhấp đúp để bung trước khi chọn thành phần đích.`
              : "Chỉ được nối giữa 2 thành phần đã bung. Nhấp đúp hệ thống để bung.",
          );
        } else {
          toast.info("Chế độ nối: chỉ nối được giữa 2 thành phần hệ thống đã bung.");
        }
        return;
      }
      if (!node.parent_id || !expandedSystems.has(node.parent_id)) {
        toast.warning("Thành phần này không thuộc hệ thống đang bung. Hãy bung hệ thống cha trước.");
        return;
      }
      if (!connectSourceId) {
        setConnectSourceId(node.id);
        toast.message(`Đã chọn NGUỒN: ${node.ten}. Chọn thành phần ĐÍCH để nối.`);
        return;
      }
      if (connectSourceId === node.id) {
        setConnectSourceId(null);
        toast.info("Đã bỏ chọn nguồn.");
        return;
      }
      const src = fgData.nodes.find((n) => n.id === connectSourceId) as FGNode | undefined;
      if (!src || !src.la_thanh_phan || !src.parent_id) { setConnectSourceId(null); return; }
      if (!expandedSystems.has(src.parent_id)) {
        toast.warning("Hệ thống nguồn đã bị thu — vui lòng chọn lại nguồn.");
        setConnectSourceId(null);
        return;
      }
      // Chặn trùng liên kết đã có (cùng chiều) trong khe đã tải.
      const dupe = (innerData?.khe ?? []).some(
        (l: { khe_nguon_id: string; khe_dich_id: string }) =>
          l.khe_nguon_id === src.id && l.khe_dich_id === node.id,
      );
      if (dupe) {
        toast.warning("Đã tồn tại liên kết khe từ nguồn → đích này.");
        return;
      }
      setConnectDialog({
        srcId: src.id, dstId: node.id,
        srcTen: src.ten, dstTen: node.ten,
        heThongNguon: src.parent_id,
      });
      setConnectLoaiId(loaiList[0]?.id ?? "");
      setConnectGdN(""); setConnectGdD(""); setConnectGhiChu("");
      return;
    }
    const now = Date.now();
    const isDouble = lastClick.current.id === node.id && now - lastClick.current.t < 320;
    lastClick.current = { id: node.id, t: now };
    if (isDouble) {
      if (node.la_cum) {
        setExpandedOrg(node.id.replace(/^org:/, ""));
        setLocalMode(false);
        setSelectedId(null);
      } else if (node.la_thanh_phan) {
        // Không bung tiếp — thành phần là lá.
      } else {
        // Bung/thu inline các thành phần của hệ thống này ngay trên canvas toàn cảnh.
        setExpandedSystems((prev) => {
          const next = new Set(prev);
          if (next.has(node.id)) next.delete(node.id);
          else next.add(node.id);
          return next;
        });
      }
      return;
    }
    // Click đơn: chọn + zoom tới vị trí + highlight láng giềng + mở panel chi tiết.
    setSelectedId(node.id);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 700);
      const cur = fgRef.current.zoom?.() ?? 1;
      fgRef.current.zoom(Math.max(cur, 2.2), 700);
    }
  }, [connectMode, connectSourceId, fgData, loaiList, expandedSystems, innerData]);

  const onLinkClick = useCallback((l: FGLink) => {
    if (l.la_cum) {
      toast.info(`Cụm gộp ${l.trong_so ?? 1} liên kết giữa hai tổ chức — bung tổ chức để xem chi tiết.`);
      return;
    }
    const row = edgeRows.find((r) => r.id === l.id);
    if (row) setEditEdgeRow(row);
  }, [edgeRows]);

  // ---- Tìm kiếm toàn cục: hệ thống + thành phần (mã/tên) ----
  type SearchHit =
    | { kind: "he_thong"; id: string; label: string; sub: string }
    | { kind: "thanh_phan"; id: string; label: string; sub: string; parent_id: string };
  const searchResults = useMemo<SearchHit[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out: SearchHit[] = [];
    const has = (s: string | null | undefined) => (s ?? "").toLowerCase().includes(term);
    const wantSys = searchScope === "all" || searchScope === "he_thong" || searchScope === "ma";
    const wantCmp = searchScope === "all" || searchScope === "thanh_phan" || searchScope === "ma";
    // "ma": chỉ khớp trên trường mã (bỏ qua tên).
    const matchSys = (h: { ten: string; ma: string | null }) =>
      searchScope === "ma" ? has(h.ma) : (has(h.ten) || has(h.ma));
    const matchCmp = (c: { ten: string; ma_thanh_phan: string }) =>
      searchScope === "ma" ? has(c.ma_thanh_phan) : (has(c.ten) || has(c.ma_thanh_phan));
    if (wantSys) {
      for (const h of heThongList) {
        if (matchSys(h)) {
          out.push({ kind: "he_thong", id: h.id, label: h.ten, sub: h.ma ?? "" });
          if (out.length >= 14) return out;
        }
      }
    }
    if (wantCmp) {
      for (const c of (allComponents ?? [])) {
        if (matchCmp(c)) {
          out.push({ kind: "thanh_phan", id: c.id, label: c.ten, sub: c.ma_thanh_phan, parent_id: c.he_thong_id });
          if (out.length >= 14) return out;
        }
      }
    }
    return out;
  }, [q, heThongList, allComponents, searchScope]);

  const markNode = useCallback((id: string) => {
    setMarkedId(id);
    if (markedTimerRef.current) window.clearTimeout(markedTimerRef.current);
    // Giữ nháy ~5s để kể cả khi vừa bung thêm hệ thống, người dùng vẫn thấy node được chọn.
    markedTimerRef.current = window.setTimeout(() => setMarkedId(null), 5000);
  }, []);

  const pickSearchHit = useCallback((h: SearchHit) => {
    setSearchOpen(false);
    if (h.kind === "he_thong") {
      setSelectedId(h.id);
      setPendingFocusId(h.id);
      markNode(h.id);
    } else {
      setExpandedSystems((prev) => {
        if (prev.has(h.parent_id)) return prev;
        const next = new Set(prev); next.add(h.parent_id); return next;
      });
      setSelectedId(h.id);
      setPendingFocusId(h.id);
      markNode(h.id);
    }
  }, [markNode]);

  const doSearch = useCallback(() => {
    if (searchResults.length) pickSearchHit(searchResults[0]);
    else if (q.trim()) toast.info("Không tìm thấy kết quả khớp.");
  }, [searchResults, pickSearchHit, q]);

  // ---- Undo/Redo cho các liên kết khe vừa tạo (chỉ tác động lên khe do user tạo trong phiên) ----
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
  const undoConnect = useCallback(() => {
    setUndoStack((s) => {
      if (!s.length) return s;
      const last = s[s.length - 1];
      xoaKheMut.mutate({ id: last.id, he_thong_id: last.he_thong_id }, {
        onSuccess: () => {
          setRedoStack((r) => [...r, last]);
          toast.success("Đã hoàn tác liên kết khe");
        },
        onError: (e: unknown) => {
          const m = e instanceof Error ? e.message : String(e);
          toast.error(`Không hoàn tác được: ${m}`);
          // Khôi phục lại stack.
          setUndoStack((cur) => [...cur, last]);
        },
      });
      return s.slice(0, -1);
    });
  }, [xoaKheMut]);
  const redoConnect = useCallback(() => {
    setRedoStack((r) => {
      if (!r.length) return r;
      const last = r[r.length - 1];
      themKheMut.mutate(last.payload, {
        onSuccess: (data: { id: string } | undefined) => {
          const newId = data?.id ?? last.id;
          setUndoStack((s) => [...s, { ...last, id: newId }]);
          toast.success("Đã tạo lại liên kết khe");
        },
        onError: (e: unknown) => {
          const m = e instanceof Error ? e.message : String(e);
          toast.error(`Không làm lại được: ${m}`);
          setRedoStack((cur) => [...cur, last]);
        },
      });
      return r.slice(0, -1);
    });
  }, [themKheMut]);





  // Chuyển động mượt: dùng cùng một thời lượng cho zoom/fit/center để không "giật" khi trình chiếu.
  const ANIM_MS = 700;
  const zoomBy = (f: number) => fgRef.current?.zoom((fgRef.current?.zoom() ?? 1) * f, ANIM_MS);
  const fit = () => fgRef.current?.zoomToFit(ANIM_MS, 60);

  // ---- Lưu / khôi phục khung nhìn (localStorage, per-tier) ----
  const viewKey = useMemo(
    () => `mirats.netview.${expandedOrg ? `org:${expandedOrg}` : localMode ? `ego:${selectedId ?? ""}` : "root"}`,
    [expandedOrg, localMode, selectedId],
  );
  const [hasSavedView, setHasSavedView] = useState(false);
  useEffect(() => {
    try { setHasSavedView(!!localStorage.getItem(viewKey)); } catch { setHasSavedView(false); }
  }, [viewKey]);
  const saveView = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    try {
      const zoom = fg.zoom?.() ?? 1;
      const c = (fg as any).centerAt?.() ?? { x: 0, y: 0 };
      localStorage.setItem(viewKey, JSON.stringify({ zoom, x: c.x ?? 0, y: c.y ?? 0 }));
      setHasSavedView(true);
      toast.success("Đã lưu khung nhìn hiện tại.");
    } catch { toast.error("Không lưu được khung nhìn."); }
  }, [viewKey]);
  const restoreView = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    try {
      const raw = localStorage.getItem(viewKey);
      if (!raw) { toast.info("Chưa có khung nhìn được lưu ở tầng này."); return; }
      const v = JSON.parse(raw) as { zoom: number; x: number; y: number };
      fg.centerAt(v.x, v.y, ANIM_MS);
      fg.zoom(v.zoom, ANIM_MS);
    } catch { toast.error("Không khôi phục được khung nhìn."); }
  }, [viewKey]);

  // ---- Reset khung nhìn: xoá bookmark tầng hiện tại + fit-to-content ----
  const resetView = useCallback(() => {
    const fg = fgRef.current;
    try { localStorage.removeItem(viewKey); } catch { /* ignore */ }
    setHasSavedView(false);
    fg?.zoomToFit(ANIM_MS, 60);
    toast.success("Đã đặt lại khung nhìn & xoá bookmark tầng này.");
  }, [viewKey]);

  const focusSelected = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const n = selectedId ? fgData.nodes.find((x) => x.id === selectedId) : null;
    if (!n || n.x == null || n.y == null) { toast.info("Chưa chọn điểm nào để focus."); return; }
    fg.centerAt(n.x, n.y, ANIM_MS);
    fg.zoom(Math.max(fg.zoom?.() ?? 1, 2.6), ANIM_MS);
  }, [selectedId, fgData]);

  // Đợi node xuất hiện & có toạ độ (sau khi bung hệ thống cha) rồi mới focus/fit.
  // Sau khi center xong, gia hạn nháy đánh dấu thêm ~2.5s để người dùng chắc chắn thấy node.
  useEffect(() => {
    if (!pendingFocusId) return;
    let tries = 0;
    const iv = window.setInterval(() => {
      tries++;
      const n = (fgData.nodes as FGNode[]).find((x) => x.id === pendingFocusId);
      const fg = fgRef.current;
      if (n && n.x != null && n.y != null && fg) {
        fg.centerAt(n.x, n.y, ANIM_MS);
        fg.zoom(Math.max(fg.zoom?.() ?? 1, 2.6), ANIM_MS);
        // Gia hạn nháy vàng sau khi đã canh giữa xong.
        markNode(pendingFocusId);
        setPendingFocusId(null);
        window.clearInterval(iv);
      } else if (tries > 60) {
        setPendingFocusId(null);
        window.clearInterval(iv);
      }
    }, 120);
    return () => window.clearInterval(iv);
  }, [pendingFocusId, fgData, markNode]);

  // Vòng lặp rAF nhỏ để canvas được repaint trong lúc có hiệu ứng nháy
  // (kết quả tìm kiếm, xem trước liên kết khe sắp tạo).
  useEffect(() => {
    if (!markedId && !connectDialog) return;
    let raf = 0;
    const tick = () => { fgRef.current?.refresh?.(); raf = window.requestAnimationFrame(tick); };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [markedId, connectDialog]);







  // ---- Toàn màn hình (Fullscreen API trên wrapper) ----
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toggleFull = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => toast.error("Trình duyệt không cho bật toàn màn hình."));
  }, []);
  useEffect(() => {
    const onFs = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // rAF: vẽ vệt laser mờ dần lên canvas overlay (nhẹ, không setState mỗi frame).
  useEffect(() => {
    if (!laser) return;
    const canvas = laserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const TRAIL_MS = 500;
    const draw = () => {
      const now = performance.now();
      const arr = laserTrailRef.current;
      while (arr.length && now - arr[0].t > TRAIL_MS) arr.shift();
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      if (arr.length > 1) {
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        for (let i = 1; i < arr.length; i++) {
          const p0 = arr[i - 1]; const p1 = arr[i];
          const a = Math.max(0, 1 - (now - p1.t) / TRAIL_MS);
          ctx.strokeStyle = `rgba(239,68,68,${0.45 * a})`;
          ctx.lineWidth = 6 * a + 1;
          ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      laserTrailRef.current = [];
      laserPosRef.current = null;
    };
  }, [laser]);

  // ---- Phím tắt trình chiếu ----
  // +/= zoom in, - zoom out, 0 fit, f focus điểm đang chọn, l chú giải,
  // r reset khung nhìn, s lưu, b khôi phục, p laser, Esc bỏ chọn / thoát fullscreen, ? bảng phím tắt.
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "+": case "=": zoomBy(1.3); break;
        case "-": case "_": zoomBy(0.77); break;
        case "0": fit(); break;
        case "f": case "F": focusSelected(); break;
        case "l": case "L": setLegendOpen((v) => !v); break;
        case "r": case "R": resetView(); break;
        case "s": case "S": saveView(); break;
        case "b": case "B": restoreView(); break;
        case "p": case "P": setLaser((v) => !v); break;
        case "n": case "N": {
          // Mở drawer ghi chú cho node đang chọn.
          if (!selectedId || selectedId.startsWith("org:")) return;
          const n = fgData.nodes.find((x) => x.id === selectedId);
          if (!n) return;
          setNoteTarget({
            type: n.la_thanh_phan ? "thanh_phan" : "he_thong",
            id: n.id,
            ten: n.ten,
          });
          setNoteOpen(true);
          break;
        }
        case "?": setShortcutsOpen((v) => !v); break;
        case "Escape":
          if (document.fullscreenElement) return; // để browser tự thoát fullscreen
          setSelectedId(null);
          setShortcutsOpen(false);
          break;
        default: return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusSelected, resetView, saveView, restoreView, selectedId, fgData]);


  // ---- Xuất PNG (nền trong suốt, đúng tỉ lệ canvas hiện tại) ----
  const exportPNG = useCallback(() => {
    const cv = containerRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!cv) { toast.error("Chưa sẵn sàng để xuất."); return; }
    const url = cv.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = `so-do-mang-${Date.now()}.png`; a.click();
    toast.success("Đã xuất PNG (nền trong suốt).");
  }, []);

  // ---- Xuất SVG vector (nền trong suốt, theo bố cục hiện tại) ----
  const exportSVG = useCallback(() => {
    const ns = fgData.nodes.filter((n) => n.x != null && n.y != null);
    if (ns.length === 0) { toast.error("Chưa có dữ liệu để xuất."); return; }
    const xs = ns.map((n) => n.x as number), ys = ns.map((n) => n.y as number);
    const pad = 40;
    const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
    const w = Math.max(...xs) - minX + pad, h = Math.max(...ys) - minY + pad;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const pos = new Map(fgData.nodes.map((n) => [n.id, { x: n.x as number, y: n.y as number }]));
    const lineEls = fgData.links.map((l) => {
      const s = pos.get(idOf(l.source)), t = pos.get(idOf(l.target));
      if (!s || !t) return "";
      return `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" stroke="${l.mau}" stroke-width="${(linkWidth(l)).toFixed(2)}" stroke-opacity="0.85"/>`;
    }).join("");
    const nodeEls = ns.map((n) => {
      const r = nodeRadius(n);
      return `<circle cx="${n.x}" cy="${n.y}" r="${r.toFixed(2)}" fill="${n.mau}"/>` +
        `<text x="${n.x}" y="${(n.y as number) + r + 10}" font-family="Inter, sans-serif" font-size="9" text-anchor="middle" fill="#334155">${esc(n.ten)}</text>`;
    }).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${w} ${h}" width="${Math.round(w)}" height="${Math.round(h)}">${lineEls}${nodeEls}</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `so-do-mang-${Date.now()}.svg`; a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Đã xuất SVG (nền trong suốt).");
  }, [fgData, linkWidth, nodeRadius]);

  // Tooltip: nội dung theo node / link đang hover.
  const hoverNode = hoverId ? fgData.nodes.find((n) => n.id === hoverId) : null;
  const hoverLink = hoverLinkId ? fgData.links.find((l) => l.id === hoverLinkId) : null;

  const tier = expandedSystems.size > 0 ? 3 : localMode ? 3 : expandedOrg ? 2 : 1;
  const expandedOrgName = orgs.find((o) => o.id === expandedOrg)?.ten;
  const back = () => {
    if (expandedSystems.size > 0) { setExpandedSystems(new Set()); didFit.current = false; return; }
    if (localMode) { setLocalMode(false); didFit.current = false; return; }
    if (expandedOrg) { setExpandedOrg(null); setSelectedId(null); didFit.current = false; }
  };


  return (
    <div className={`grid grid-cols-1 gap-3 ${sideOpen ? "lg:grid-cols-[1fr_320px]" : ""}`}>
      {/* ---------------- Cột trái: đồ thị ---------------- */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Thanh trên: breadcrumb + tìm kiếm + zoom */}
          <div className="flex flex-wrap items-center gap-2 border-b p-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>Tổ chức</span>
              {expandedOrgName && (<><ChevronRight className="h-3 w-3" /><span className="font-medium text-foreground">{expandedOrgName}</span></>)}
              {expandedSystems.size > 0 && (<><ChevronRight className="h-3 w-3" /><span className="font-medium text-foreground">Bung {expandedSystems.size} hệ thống · thành phần</span></>)}
              {localMode && selectedId && (<><ChevronRight className="h-3 w-3" /><span className="font-medium text-foreground">Ego bậc {egoRadius}</span></>)}
            </div>
            {(expandedOrg || localMode || expandedSystems.size > 0) && (
              <Button size="sm" variant="ghost" onClick={back}><ArrowLeft className="mr-1 h-4 w-4" />Lùi tầng</Button>
            )}
            <div className="ml-auto flex items-center gap-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
                  onKeyDown={(e) => { if (e.key === "Enter") doSearch(); if (e.key === "Escape") setSearchOpen(false); }}
                  placeholder="Tìm hệ thống/thành phần…" className="h-8 w-56 pl-7 text-xs"
                />
                {searchOpen && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-auto rounded-md border bg-popover shadow-lg">
                    {searchResults.map((h) => (
                      <button
                        key={`${h.kind}:${h.id}`} type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSearchHit(h)}
                        className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span className="flex items-center gap-1.5">
                          {h.kind === "he_thong"
                            ? <Boxes className="h-3.5 w-3.5 text-indigo-500" />
                            : <Cpu className="h-3.5 w-3.5 text-sky-500" />}
                          <span className="truncate font-medium">{h.label}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{h.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value as typeof searchScope)}
                className="h-8 rounded-md border bg-background px-1.5 text-xs"
                title="Phạm vi tìm kiếm"
              >
                <option value="all">Tất cả</option>
                <option value="he_thong">Hệ thống</option>
                <option value="thanh_phan">Thành phần</option>
                <option value="ma">Chỉ mã</option>
              </select>
              <Button
                size="icon" variant={clusterOn ? "default" : "outline"} className="h-8 w-8"
                onClick={() => setClusterOn((v) => !v)}
                aria-label={clusterOn ? "Đang gom cụm — bấm để tách chi tiết" : "Đang tách chi tiết — bấm để gom cụm"}
                title={clusterOn ? "Gom cụm theo tầng: đang BẬT" : "Gom cụm theo tầng: đang TẮT"}
              >
                <Boxes className="h-4 w-4" />
              </Button>
              <Button
                size="icon" variant={connectMode ? "default" : "outline"} className="h-8 w-8"
                onClick={() => { setConnectMode((v) => !v); setConnectSourceId(null); }}
                aria-label="Chế độ nối thành phần"
                title="Chế độ NỐI: chọn 2 thành phần đã bung để tạo liên kết khe (ghi DB)"
                disabled={!canManage}
              >
                <Network className="h-4 w-4" />
              </Button>
              {canManage && (
                <>
                  <Button
                    size="icon" variant="outline" className="h-8 w-8"
                    onClick={undoConnect}
                    disabled={!canUndo || xoaKheMut.isPending}
                    aria-label="Hoàn tác liên kết vừa tạo"
                    title="Hoàn tác liên kết khe vừa tạo trong phiên"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon" variant="outline" className="h-8 w-8"
                    onClick={redoConnect}
                    disabled={!canRedo || themKheMut.isPending}
                    aria-label="Làm lại liên kết đã hoàn tác"
                    title="Làm lại liên kết khe đã hoàn tác"
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </>
              )}


              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => zoomBy(1.3)} aria-label="Phóng to"><ZoomIn className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => zoomBy(0.77)} aria-label="Thu nhỏ"><ZoomOut className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={fit} aria-label="Vừa khung (0)"><Maximize2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={resetView} aria-label="Reset khung nhìn & xoá bookmark tầng này (R)"><Home className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={saveView} aria-label="Lưu khung nhìn (S)"><Bookmark className="h-4 w-4" /></Button>
              <Button
                size="icon" variant={hasSavedView ? "default" : "outline"} className="h-8 w-8"
                onClick={restoreView} disabled={!hasSavedView} aria-label="Khôi phục khung nhìn (B)"
              >
                <BookmarkCheck className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setShortcutsOpen(true)} aria-label="Phím tắt (?)"><Keyboard className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={exportPNG} aria-label="Xuất PNG"><ImageDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={exportSVG} aria-label="Xuất SVG"><FileDown className="h-4 w-4" /></Button>
              <Button
                size="icon" variant={laser ? "default" : "outline"} className="h-8 w-8"
                onClick={() => setLaser((v) => !v)} aria-label="Con trỏ laser"
              >
                <Crosshair className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={toggleFull} aria-label="Toàn màn hình">
                {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4 rotate-45" />}
              </Button>
              <Button
                size="icon" variant={panelOpen ? "default" : "outline"} className="h-8 w-8"
                onClick={() => setPanelOpen((v) => !v)} aria-label="Bảng điều khiển"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              <Button
                size="icon" variant={sideOpen ? "default" : "outline"} className="h-8 w-8"
                onClick={() => setSideOpen((v) => !v)} aria-label="Cột thông tin"
              >
                {sideOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Canvas + panel nổi kiểu Obsidian */}
          <div
            ref={(el) => { containerRef.current = el; wrapperRef.current = el; }}
            className={`relative w-full bg-[hsl(var(--muted)/0.25)] ${isFull ? "h-dvh" : "h-[600px]"} ${laser ? "cursor-none" : ""}`}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - r.left, y = e.clientY - r.top;
              // Laser: cập nhật trực tiếp qua ref (không setState) để tránh re-render mỗi pixel.
              if (laser && laserRef.current) {
                laserRef.current.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
                laserPosRef.current = { x, y };
                const arr = laserTrailRef.current;
                const now = performance.now();
                const last = arr[arr.length - 1];
                if (!last || (x - last.x) * (x - last.x) + (y - last.y) * (y - last.y) > 4) {
                  arr.push({ x, y, t: now });
                  if (arr.length > 60) arr.shift();
                }
              }
              // Tooltip: chỉ setState khi đang rê trên 1 điểm/cạnh — giảm mạnh CPU khi di chuột.
              if (hoverId || hoverLinkId) setTip({ x, y });
            }}
          >
            {ForceGraph ? (
              <ForceGraph
                ref={fgRef}
                width={dims.w}
                height={dims.h}
                graphData={fgData}
                nodeId="id"
                nodeRelSize={4}
                nodeCanvasObject={paintNode}
                onRenderFramePost={paintLabels}
                enableNodeDrag={!laser}
                enableZoomInteraction={!laser}
                enablePanInteraction={!laser}
                enableZoomPanInteraction={!laser}
                nodePointerAreaPaint={(n: FGNode, color: string, ctx: CanvasRenderingContext2D) => {
                  const r = nodeRadius(n) + 3;
                  ctx.fillStyle = color; ctx.beginPath();
                  ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, 2 * Math.PI); ctx.fill();
                }}
                linkColor={linkColor}
                linkWidth={linkWidth}
                linkCurvature={(l: FGLink) => l.cong ?? 0}
                linkDirectionalArrowLength={(l: FGLink) => (showArrows && !l.la_cum && l.huong !== "hai_chieu" ? 3 : 0)}
                linkDirectionalArrowRelPos={1}
                onNodeHover={(n: FGNode | null) => setHoverId(n?.id ?? null)}
                onLinkHover={(l: FGLink | null) => setHoverLinkId(l?.id ?? null)}
                onNodeClick={onNodeClick}
                onLinkClick={onLinkClick}
                onBackgroundClick={() => setSelectedId(null)}
                onEngineStop={() => { if (!didFit.current) { fgRef.current?.zoomToFit(900, 70); didFit.current = true; } }}
                cooldownTicks={55}
                cooldownTime={4000}
                warmupTicks={12}
                d3VelocityDecay={0.5}
                d3AlphaDecay={0.06}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Đang tải sơ đồ…</div>
            )}

            {/* Tooltip Obsidian: hiện khi hover node hoặc cạnh */}
            {tip && (hoverNode || hoverLink) && (
              <div
                className="pointer-events-none absolute z-20 max-w-[280px] rounded-md border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
                style={{
                  left: Math.min(tip.x + 14, dims.w - 280),
                  top: Math.min(tip.y + 14, dims.h - 120),
                }}
              >
                {hoverNode ? (
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground">{hoverNode.ten}</div>
                    {hoverNode.la_thanh_phan && (
                      <div className="text-muted-foreground">
                        Thành phần hệ thống
                        {hoverNode.thiet_bi_ma && <> · TB: <span className="font-mono">{hoverNode.thiet_bi_ma}</span></>}
                      </div>
                    )}
                    {!hoverNode.la_thanh_phan && hoverNode.don_vi && <div className="text-muted-foreground">Đơn vị: {hoverNode.don_vi}</div>}
                    {!hoverNode.la_thanh_phan && <div className="text-muted-foreground">Phạm vi: {hoverNode.ben_ngoai ? "Bên ngoài" : "Nội bộ"}</div>}
                    {typeof hoverNode.so_thanh_vien === "number" && <div className="text-muted-foreground">Thành viên: {hoverNode.so_thanh_vien}</div>}
                    {!hoverNode.la_cum && !hoverNode.la_thanh_phan && (
                      <div className="pt-1 text-[11px] text-muted-foreground">Nhấn đúp để bung/thu thành phần</div>
                    )}
                  </div>
                ) : hoverLink ? (() => {
                  const s = typeof hoverLink.source === "string"
                    ? fgData.nodes.find((n) => n.id === hoverLink.source)
                    : hoverLink.source as FGNode;
                  const t = typeof hoverLink.target === "string"
                    ? fgData.nodes.find((n) => n.id === hoverLink.target)
                    : hoverLink.target as FGNode;
                  const dirIcon = hoverLink.huong === "hai_chieu"
                    ? <ArrowLeftRight className="h-3 w-3" />
                    : <ArrowRight className="h-3 w-3" />;
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-0.5 w-4 shrink-0" style={{ backgroundColor: hoverLink.mau }} />
                        <span className="font-semibold text-foreground">{hoverLink.loai_ten ?? "Liên kết"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-foreground">
                        <span className="truncate font-medium">{s?.ten ?? "?"}</span>
                        {dirIcon}
                        <span className="truncate font-medium">{t?.ten ?? "?"}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {hoverLink.lop === "logic" ? "Lớp logic (nét đứt)" : "Lớp vật lý (nét liền)"}
                        {hoverLink.trang_thai === "ngung" ? " · đã ngừng" : ""}
                      </div>
                      {typeof hoverLink.trong_so === "number" && (
                        <div className="text-muted-foreground">Trọng số: <span className="font-medium text-foreground tabular-nums">{hoverLink.trong_so}</span>{hoverLink.la_cum ? " (gộp cụm)" : ""}</div>
                      )}
                      {hoverLink.giao_thuc && <div className="text-muted-foreground">Giao thức: {hoverLink.giao_thuc}</div>}
                      {hoverLink.giao_dien && <div className="text-muted-foreground">Giao diện: {hoverLink.giao_dien}</div>}
                    </div>
                  );
                })() : null}
              </div>
            )}


            {/* Con trỏ laser thuyết trình + vệt mờ (canvas) */}
            {laser && (
              <>
                <canvas
                  ref={laserCanvasRef}
                  className="pointer-events-none absolute inset-0 z-30 h-full w-full"
                />
                <div
                  ref={laserRef}
                  className="pointer-events-none absolute left-0 top-0 z-30 h-4 w-4 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(239,68,68,0.95) 0%, rgba(239,68,68,0.5) 40%, transparent 70%)",
                    boxShadow: "0 0 12px 4px rgba(239,68,68,0.6)",
                  }}
                />
              </>
            )}


            {/* Panel điều khiển Obsidian (Filters / Display / Forces) */}
            {panelOpen && (
              <div className="absolute right-2 top-2 w-64 overflow-hidden rounded-lg border bg-background/95 shadow-lg backdrop-blur">
                <ControlSection title="Bộ lọc" icon={<FilterIcon className="h-3.5 w-3.5" />} defaultOpen>
                  <PanelSelect label="Tổ chức" value={fOrg} onChange={setFOrg}
                    options={[{ v: "", l: "Mọi tổ chức" }, ...toChucList.map((o) => ({ v: o.id, l: o.ten }))]} />
                  <PanelSelect label="Phạm vi" value={fPhamVi} onChange={setFPhamVi}
                    options={[{ v: "", l: "Mọi phạm vi" }, { v: "noi_bo", l: "Nội bộ" }, { v: "ben_ngoai", l: "Bên ngoài" }]} />
                  <PanelSelect label="Loại liên kết" value={fLoai} onChange={setFLoai}
                    options={[{ v: "", l: "Mọi loại" }, ...loaiList.map((l) => ({ v: l.ma, l: l.ten }))]} />
                  <PanelSelect label="Lớp" value={fLop} onChange={setFLop}
                    options={[{ v: "", l: "Mọi lớp" }, { v: "vat_ly", l: LOP_LABEL.vat_ly }, { v: "logic", l: LOP_LABEL.logic }]} />
                  <PanelToggle label="Ẩn liên kết ngừng" checked={hideNgung} onChange={setHideNgung} />
                  <PanelToggle
                    label="Local (ego)" checked={localMode}
                    onChange={(v) => { setLocalMode(v); if (v && !selectedId) toast.info("Chọn 1 hệ thống để xem đồ thị cục bộ."); }}
                  />
                  {localMode && (
                    <PanelSelect label="Bán kính ego" value={String(egoRadius)} onChange={(v) => setEgoRadius(Number(v))}
                      options={[1, 2, 3].map((r) => ({ v: String(r), l: `Bậc ${r}` }))} />
                  )}
                </ControlSection>

                <Separator />
                <ControlSection title="Hiển thị" icon={<Eye className="h-3.5 w-3.5" />} defaultOpen>
                  <PanelToggle label="Mũi tên hướng" checked={showArrows} onChange={setShowArrows} />
                  <PanelSlider label="Ngưỡng mờ chữ" value={textFade} min={0.4} max={4} step={0.1} onChange={setTextFade} />
                  <PanelSlider label="Cỡ điểm" value={nodeSize} min={0.5} max={2.5} step={0.1} onChange={setNodeSize} />
                  <PanelSlider label="Độ dày liên kết" value={linkThickness} min={0.3} max={3} step={0.1} onChange={setLinkThickness} />
                </ControlSection>

                <Separator />
                <ControlSection title="Lực" icon={<Waves className="h-3.5 w-3.5" />} defaultOpen
                  action={
                    <button onClick={resetForces} className="rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label="Đặt lại lực">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  }
                >
                  <PanelSlider label="Lực trung tâm" value={centerForce} min={0} max={0.4} step={0.01} onChange={setCenterForce} />
                  <PanelSlider label="Lực đẩy" value={repelForce} min={20} max={600} step={10} onChange={setRepelForce} />
                  <PanelSlider label="Lực liên kết" value={linkForce} min={0} max={1} step={0.05} onChange={setLinkForce} />
                  <PanelSlider label="Độ dài liên kết" value={linkDistance} min={15} max={200} step={5} onChange={setLinkDistance} />
                </ControlSection>
              </div>
            )}

            {/* Legend — chú giải màu sắc / lớp / trọng số cạnh (thu gọn được) */}
            <div className="absolute bottom-2 left-2 max-w-[260px] rounded-md border bg-background/95 text-[10px] shadow-sm backdrop-blur">
              <button
                type="button"
                onClick={() => setLegendOpen((v) => !v)}
                className="flex w-full items-center gap-1.5 px-2 py-1 font-medium hover:bg-muted/60"
                aria-expanded={legendOpen}
              >
                <Info className="h-3 w-3" />
                <span>Chú giải</span>
                <ChevronDown className={`ml-auto h-3 w-3 transition-transform ${legendOpen ? "" : "-rotate-90"}`} />
              </button>
              {legendOpen && (
                <div className="space-y-2 border-t px-2 py-1.5">
                  {/* Loại liên kết (màu) */}
                  <div>
                    <div className="mb-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">Loại liên kết</div>
                    {LEGEND.map((l) => (
                      <div key={l.ma} className="flex items-center gap-1.5">
                        <span className="inline-block h-0.5 w-5" style={{ backgroundColor: LOAI_LIEN_KET_MAU[l.ma] }} />
                        <span>{l.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Điểm: cụm / nội bộ / bên ngoài */}
                  <div>
                    <div className="mb-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">Điểm</div>
                    <div className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-primary/80" /> Hệ thống nội bộ</div>
                    <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full border border-dashed border-slate-400" /> Hệ thống bên ngoài</div>
                    <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-muted-foreground/60" /> Cụm tổ chức (nhấn đúp để bung)</div>
                  </div>

                  {/* Lớp vật lý / logic */}
                  <div>
                    <div className="mb-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">Lớp</div>
                    <div className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 bg-foreground/80" /> Vật lý (nét liền)</div>
                    <div className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 border-t border-dashed border-foreground/80" /> Logic (nét đứt)</div>
                  </div>

                  {/* Trọng số & hover */}
                  <div>
                    <div className="mb-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">Trọng số cạnh</div>
                    <div className="flex items-center gap-1.5"><span className="inline-block h-[1px] w-5 bg-foreground/70" /> Trọng số thấp</div>
                    <div className="flex items-center gap-1.5"><span className="inline-block h-[3px] w-5 bg-foreground/80" /> Trọng số cao (dày hơn)</div>
                    <div className="mt-0.5 text-muted-foreground">Hover 1 điểm: hàng xóm tô đậm, phần còn lại mờ đi. Hover 1 cạnh: cạnh nổi bật &amp; hiển thị chi tiết trọng số/giao thức.</div>
                  </div>
                </div>
              )}
            </div>


            <Badge variant="outline" className="absolute bottom-2 right-2 bg-background/90">Tầng {tier}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- Cột phải: chi tiết từ DB (thu gọn được) ---------------- */}
      {sideOpen && (
        <div className="flex flex-col gap-2">
          {selectedId && !selectedId.startsWith("org:") && (() => {
            const n = fgData.nodes.find((x) => x.id === selectedId);
            if (!n) return null;
            const key = `${n.la_thanh_phan ? "thanh_phan" : "he_thong"}:${n.id}`;
            const has = notedSet.has(key);
            return (
              <Button
                size="sm"
                variant={has ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setNoteTarget({ type: n.la_thanh_phan ? "thanh_phan" : "he_thong", id: n.id, ten: n.ten });
                  setNoteOpen(true);
                }}
              >
                <StickyNote className="mr-2 h-4 w-4" />
                {has ? "Xem / sửa ghi chú" : "Ghi chú Markdown"} <span className="ml-auto text-[10px] text-muted-foreground">N</span>
              </Button>
            );
          })()}
          <SidePanel
            selectedId={selectedId}
            isCluster={!!selectedId?.startsWith("org:")}
            clusterMemberCount={fgData.nodes.find((n) => n.id === selectedId)?.so_thanh_vien}
            canManage={canManage}
            onClose={() => setSideOpen(false)}
            onImpact={() => selectedId && !selectedId.startsWith("org:") && setImpactFor(selectedId)}
            impactActive={!!impactFor}
            impactCount={impact.length}
            onClearImpact={() => setImpactFor(null)}
            onExpandOrg={(id) => { setExpandedOrg(id); setSelectedId(null); }}
            onEditEdge={(row) => setEditEdgeRow(row)}
          />
        </div>
      )}

      {/* Bảng phím tắt trình chiếu */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Keyboard className="h-4 w-4" /> Phím tắt</DialogTitle>
            <DialogDescription>Áp dụng khi con trỏ không nằm trong ô nhập liệu.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <Kbd k="+ / =" v="Phóng to" />
            <Kbd k="− / _" v="Thu nhỏ" />
            <Kbd k="0" v="Vừa khung (fit)" />
            <Kbd k="F" v="Focus điểm đang chọn" />
            <Kbd k="L" v="Bật/tắt chú giải" />
            <Kbd k="R" v="Reset khung nhìn + xoá bookmark" />
            <Kbd k="S" v="Lưu khung nhìn" />
            <Kbd k="B" v="Khôi phục khung nhìn" />
            <Kbd k="P" v="Bật/tắt laser pointer" />
            <Kbd k="N" v="Ghi chú Markdown cho node đang chọn" />
            <Kbd k="Esc" v="Bỏ chọn điểm" />
            <Kbd k="?" v="Mở/đóng bảng phím tắt" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Sửa liên kết (click cạnh) */}
      <Dialog open={!!editEdgeRow} onOpenChange={(o) => !o && setEditEdgeRow(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết liên kết</DialogTitle>
            <DialogDescription>
              {editEdgeRow?.nguon_ten} → {editEdgeRow?.dich_ten}. Sửa lưu thẳng vào cơ sở dữ liệu.
            </DialogDescription>
          </DialogHeader>
          {editEdgeRow && canManage ? (
            <LienKetForm
              heThongOptions={heThongList.map((h) => ({ value: h.id, label: `${h.ten} (${h.ma})` }))}
              loaiList={loaiList}
              existingEdges={edgeRows.filter((r) => r.id !== editEdgeRow.id)}
              defaultValues={{
                nguonId: editEdgeRow.nguon_id,
                dichId: editEdgeRow.dich_id,
                loaiId: editEdgeRow.loai_lien_ket_id,
                lop: editEdgeRow.lop,
                huong: editEdgeRow.huong,
                gdNguon: editEdgeRow.giao_dien_nguon ?? "",
                gdDich: editEdgeRow.giao_dien_dich ?? "",
                giaoThuc: editEdgeRow.giao_thuc ?? "",
                vaiTro: editEdgeRow.vai_tro_du_phong ?? "",
              }}
              submitting={updMut.isPending}
              onCancel={() => setEditEdgeRow(null)}
              onSubmit={(patch) => updMut.mutate(
                { id: editEdgeRow.id, patch },
                {
                  onSuccess: () => { toast.success("Đã cập nhật liên kết"); setEditEdgeRow(null); },
                  onError: (e: unknown) => {
                    const m = e instanceof Error ? e.message : String(e);
                    toast.error(m.includes("row-level security") || m.includes("permission") ? "Bạn không có quyền sửa liên kết." : m);
                  },
                },
              )}
            />
          ) : editEdgeRow ? (
            <ReadonlyEdge row={editEdgeRow} />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Nối liên kết khe giữa 2 thành phần (chế độ Nối) */}
      <Dialog open={!!connectDialog} onOpenChange={(o) => { if (!o) { setConnectDialog(null); setConnectSourceId(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xem trước & tạo liên kết khe</DialogTitle>
            <DialogDescription>
              Kiểm tra thông tin trước khi ghi vào <code>lien_ket_khe</code>. Nguồn (viền xanh) và đích (viền hồng) đang nhấp nháy trên sơ đồ.
            </DialogDescription>
          </DialogHeader>

          {/* Thẻ xem trước — hiển thị mọi thông tin sắp lưu để người dùng đối chiếu */}
          {connectDialog && (() => {
            const srcLay = compLayout.get(connectDialog.srcId);
            const dstLay = compLayout.get(connectDialog.dstId);
            const heThongTen = heThongList.find((h) => h.id === connectDialog.heThongNguon)?.ten
              ?? fgData.nodes.find((n) => n.id === connectDialog.heThongNguon)?.ten
              ?? connectDialog.heThongNguon;
            const loaiTen = loaiList.find((l) => l.id === connectLoaiId)?.ten ?? "—";
            return (
              <div className="rounded-md border bg-muted/40 p-2.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: srcLay?.color ?? "#22c55e" }} />
                    <span className="font-medium truncate max-w-[9rem]" title={connectDialog.srcTen}>{connectDialog.srcTen}</span>
                    {srcLay?.family && <Badge variant="outline" className="h-4 px-1 text-[9px]">{srcLay.family}</Badge>}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dstLay?.color ?? "#f43f5e" }} />
                    <span className="font-medium truncate max-w-[9rem]" title={connectDialog.dstTen}>{connectDialog.dstTen}</span>
                    {dstLay?.family && <Badge variant="outline" className="h-4 px-1 text-[9px]">{dstLay.family}</Badge>}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <div>Hệ thống nguồn: <span className="text-foreground">{heThongTen}</span></div>
                  <div>Loại: <span className="text-foreground">{loaiTen}</span></div>
                  {connectGdN && <div>GD nguồn: <span className="text-foreground">{connectGdN}</span></div>}
                  {connectGdD && <div>GD đích: <span className="text-foreground">{connectGdD}</span></div>}
                </div>
              </div>
            );
          })()}

          <div className="grid gap-2">
            <Label className="text-xs">Loại liên kết</Label>
            <select
              className="h-8 rounded-md border bg-background px-2 text-xs"
              value={connectLoaiId} onChange={(e) => setConnectLoaiId(e.target.value)}
            >
              {loaiList.map((l) => <option key={l.id} value={l.id}>{l.ten}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Giao diện nguồn</Label>
                <Input value={connectGdN} onChange={(e) => setConnectGdN(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Giao diện đích</Label>
                <Input value={connectGdD} onChange={(e) => setConnectGdD(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <Label className="text-xs">Ghi chú</Label>
            <Input value={connectGhiChu} onChange={(e) => setConnectGhiChu(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => { setConnectDialog(null); setConnectSourceId(null); }}>Huỷ</Button>
            <Button
              size="sm"
              disabled={!connectLoaiId || themKheMut.isPending}
              onClick={() => {
                if (!connectDialog) return;
                const payload = {
                  he_thong_id: connectDialog.heThongNguon,
                  khe_nguon_id: connectDialog.srcId,
                  khe_dich_id: connectDialog.dstId,
                  loai_lien_ket_id: connectLoaiId,
                  don_vi_id_snapshot: null,
                  giao_dien_nguon: connectGdN || null,
                  giao_dien_dich: connectGdD || null,
                  ghi_chu: connectGhiChu || null,
                };
                themKheMut.mutate(payload, {
                  onSuccess: (data: { id: string } | undefined) => {
                    const newId = data?.id;
                    if (newId) {
                      setUndoStack((s) => [...s, { id: newId, he_thong_id: payload.he_thong_id, payload }]);
                      setRedoStack([]); // Bất kỳ hành động mới nào cũng xoá stack redo.
                    }
                    toast.success(`Đã tạo liên kết khe: ${connectDialog.srcTen} → ${connectDialog.dstTen}`);
                    setConnectDialog(null); setConnectSourceId(null);
                  },
                  onError: (e: unknown) => {
                    const m = e instanceof Error ? e.message : String(e);
                    toast.error(m);
                  },
                });
              }}
            >{themKheMut.isPending ? "Đang lưu…" : "Xác nhận tạo"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sổ ghi chú Markdown (Obsidian-style) cho hệ thống / thành phần */}
      <NodeNoteDrawer
        open={noteOpen}
        onOpenChange={setNoteOpen}
        nodeType={noteTarget?.type ?? null}
        nodeId={noteTarget?.id ?? null}
        nodeTen={noteTarget?.ten ?? null}
        onJumpNode={(n) => {
          setNoteTarget(n);
          setSelectedId(n.id);
        }}

      />

    </div>
  );
}

// ---------------------------------------------------------------------------
// Bảng điều khiển kiểu Obsidian: section gập/mở + slider/select/toggle gọn.
// ---------------------------------------------------------------------------
function ControlSection({ title, icon, action, defaultOpen, children }: {
  title: string; icon: React.ReactNode; action?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div>
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <button onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center gap-1.5 text-xs font-semibold">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {icon}
          {title}
        </button>
        {action}
      </div>
      {open && <div className="space-y-2.5 px-2.5 pb-3">{children}</div>}
    </div>
  );
}

function PanelSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{Number.isInteger(step) ? value : value.toFixed(2)}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

function PanelToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function PanelSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: Array<{ v: string; l: string }>;
}) {
  const SENTINEL = "__all";
  return (
    <div className="space-y-1">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <Select value={value || SENTINEL} onValueChange={(v) => onChange(v === SENTINEL ? "" : v)}>
        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.v || SENTINEL} value={o.v || SENTINEL} className="text-xs">{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
function ReadonlyEdge({ row }: { row: DoThiRow }) {
  return (
    <div className="space-y-1 text-sm">
      <Field k="Loại" v={row.loai_ten ?? row.loai_ma} />
      <Field k="Lớp" v={row.lop === "vat_ly" ? "Vật lý" : "Logic"} />
      <Field k="Hướng" v={row.huong === "hai_chieu" ? "Hai chiều" : "Một chiều"} />
      <Field k="Giao diện nguồn" v={row.giao_dien_nguon} />
      <Field k="Giao diện đích" v={row.giao_dien_dich} />
      <Field k="Giao thức" v={row.giao_thuc} />
      <Field k="Vai trò" v={row.vai_tro_du_phong === "du_phong" ? "Dự phòng" : row.vai_tro_du_phong === "chinh" ? "Chính" : "—"} />
      <p className="pt-2 text-xs text-muted-foreground">Bạn không có quyền chỉnh sửa liên kết này.</p>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-2 border-b py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v || "—"}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
function SidePanel(props: {
  selectedId: string | null;
  isCluster: boolean;
  clusterMemberCount?: number;
  canManage: boolean;
  onClose: () => void;
  onImpact: () => void;
  impactActive: boolean;
  impactCount: number;
  onClearImpact: () => void;
  onExpandOrg: (id: string) => void;
  onEditEdge: (row: DoThiRow) => void;
}) {
  const { selectedId, isCluster } = props;

  const CloseBtn = (
    <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={props.onClose} aria-label="Thu gọn">
      <PanelRightClose className="h-4 w-4" />
    </Button>
  );

  if (!selectedId) {
    return (
      <Card><CardContent className="p-4 text-sm text-muted-foreground">
        <div className="mb-2 flex items-center justify-between">
          <Network className="h-5 w-5" />
          {CloseBtn}
        </div>
        Di chuột lên một điểm để đọc nhanh; nhấp để chọn và xem thông tin từ cơ sở dữ liệu. Nhấp đúp tổ chức để bung, nhấp đúp hệ thống để mở sơ đồ nội bộ.
      </CardContent></Card>
    );
  }

  if (isCluster) {
    const orgId = selectedId.replace(/^org:/, "");
    return (
      <Card><CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2"><Boxes className="h-4 w-4 text-primary" /><h3 className="font-semibold">Cụm tổ chức</h3></div>
          {CloseBtn}
        </div>
        <p className="text-sm text-muted-foreground">{props.clusterMemberCount ?? 0} hệ thống bên trong.</p>
        <Button size="sm" className="w-full" onClick={() => props.onExpandOrg(orgId)}>
          <Network className="mr-1 h-4 w-4" /> Bung thành các hệ thống
        </Button>
      </CardContent></Card>
    );
  }

  return <SystemPanel {...props} heThongId={selectedId} />;
}

function SystemPanel(props: {
  heThongId: string;
  canManage: boolean;
  onClose?: () => void;
  onImpact: () => void;
  impactActive: boolean;
  impactCount: number;
  onClearImpact: () => void;
  onEditEdge: (row: DoThiRow) => void;
}) {
  const { heThongId } = props;
  const { chiTiet } = useHeThongChiTiet(heThongId);
  const { rows } = useLienKetCuaHeThong(heThongId);

  const diRa = rows.filter((r) => r.nguon_id === heThongId);
  const diVao = rows.filter((r) => r.dich_id === heThongId);

  return (
    <Card><CardContent className="p-0">
      <ScrollArea className="h-[700px]">
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <h3 className="font-semibold leading-tight">{chiTiet?.ten ?? "…"}</h3>
            </div>
            {props.onClose && (
              <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={props.onClose} aria-label="Thu gọn">
                <PanelRightClose className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-0.5 text-xs">
            <Field k="Mã" v={chiTiet?.ma} />
            <Field k="Đơn vị" v={chiTiet?.don_vi_ten} />
            <Field k="Nhóm" v={chiTiet?.nhom_ten} />
            <Field k="Tổ chức" v={chiTiet?.to_chuc_ten} />
            <Field k="Phạm vi" v={chiTiet?.pham_vi_quan_ly === "ben_ngoai" ? "Bên ngoài" : "Nội bộ"} />
          </div>

          {chiTiet?.pham_vi_quan_ly !== "ben_ngoai" && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Tài sản theo khe ({chiTiet?.khe.length ?? 0})</div>
              <div className="space-y-1">
                {(chiTiet?.khe ?? []).map((k) => (
                  <div key={k.thanh_phan_id} className="rounded border px-2 py-1 text-xs">
                    <div className="font-medium">{k.thanh_phan_ten}</div>
                    <div className="text-muted-foreground">{k.thiet_bi_ten ? `${k.thiet_bi_ten}${k.thiet_bi_ma ? ` · ${k.thiet_bi_ma}` : ""}` : "— trống —"}</div>
                  </div>
                ))}
                {(chiTiet?.khe.length ?? 0) === 0 && <p className="text-xs text-muted-foreground">Chưa khai thành phần.</p>}
              </div>
            </div>
          )}

          <Separator />
          <LinkList title="Liên kết đi ra" icon={<ArrowRight className="h-3.5 w-3.5" />} rows={diRa} self={heThongId} onEdit={props.onEditEdge} canManage={props.canManage} />
          <LinkList title="Liên kết đi vào" icon={<ArrowLeftRight className="h-3.5 w-3.5" />} rows={diVao} self={heThongId} onEdit={props.onEditEdge} canManage={props.canManage} />

          <Separator />
          {props.impactActive ? (
            <div className="space-y-2">
              <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> {props.impactCount} hệ thống bị ảnh hưởng</Badge>
              <Button size="sm" variant="outline" className="w-full" onClick={props.onClearImpact}>Xóa phân tích</Button>
            </div>
          ) : (
            <Button size="sm" variant="destructive" className="w-full" onClick={props.onImpact}>
              <AlertTriangle className="mr-1 h-4 w-4" /> Phân tích tác động
            </Button>
          )}
        </div>
      </ScrollArea>
    </CardContent></Card>
  );
}

function LinkList({ title, icon, rows, self, onEdit, canManage }: {
  title: string; icon: React.ReactNode; rows: DoThiRow[]; self: string;
  onEdit: (r: DoThiRow) => void; canManage: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">{icon}{title} ({rows.length})</div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Không có.</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => {
            const other = r.nguon_id === self ? r.dich_ten : r.nguon_ten;
            return (
              <button
                key={r.id}
                onClick={() => onEdit(r)}
                className="flex w-full items-center justify-between gap-2 rounded border px-2 py-1 text-left text-xs hover:bg-muted"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{other}</div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: r.mau_sac ?? LOAI_LIEN_KET_MAU[r.loai_ma as LoaiLienKetMa] }} />
                    {r.loai_ten ?? r.loai_ma}
                    {r.giao_dien_nguon || r.giao_dien_dich ? ` · ${[r.giao_dien_nguon, r.giao_dien_dich].filter(Boolean).join("→")}` : ""}
                    {r.vai_tro_du_phong === "du_phong" ? " · dự phòng" : ""}
                  </div>
                </div>
                {canManage && <Pencil className="h-3 w-3 shrink-0 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Kbd({ k, v }: { k: string; v: string }) {
  return (
    <>
      <kbd className="justify-self-start rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{k}</kbd>
      <span className="text-muted-foreground">{v}</span>
    </>
  );
}
