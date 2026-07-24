// ============================================================================
// Liên kết hệ thống — LOGIC THUẦN (pure) để dựng đồ thị & phân tích tác động.
//
// Nguồn dữ liệu: view `v_do_thi_he_thong` (mỗi hàng là 1 cạnh, đã denormalize
// thông tin hai đầu). Module này KHÔNG chạm CSDL / DOM — chỉ nhận rows và trả
// nodes/edges (cho React Flow) cùng kết quả phân tích tác động phía client.
// Test bằng Vitest (system-graph.test.ts).
// ============================================================================

export type LoaiLienKetMa =
  | "DAU_NOI_VAT_LY"
  | "LUONG_TIN_HIEU"
  | "PHU_THUOC_DICH_VU"
  | "DU_PHONG";

export type Lop = "vat_ly" | "logic";
export type Huong = "mot_chieu" | "hai_chieu";
export type TrangThaiLienKet = "hoat_dong" | "tam_ngung" | "ngung";
export type KieuNet = "solid" | "dashed" | "dotted";

/** Một hàng từ view v_do_thi_he_thong (một cạnh đã denormalize hai đầu). */
export interface DoThiRow {
  id: string;
  nguon_id: string;
  nguon_ten: string | null;
  nguon_nhom: string | null;
  nguon_don_vi: string | null;
  dich_id: string;
  dich_ten: string | null;
  dich_nhom: string | null;
  dich_don_vi: string | null;
  loai_lien_ket_id: string;
  loai_ma: LoaiLienKetMa | string;
  loai_ten: string | null;
  mau_sac: string | null;
  kieu_net: KieuNet | string | null;
  lop: Lop;
  huong: Huong;
  vai_tro_du_phong: "chinh" | "du_phong" | null;
  giao_dien_nguon: string | null;
  giao_dien_dich: string | null;
  giao_thuc: string | null;
  trang_thai: TrangThaiLienKet;
  don_vi_id_snapshot: string | null;
  /** true = cạnh có hướng (nguồn->đích); false = hai chiều. Từ danh mục loại. */
  co_huong?: boolean;
  /** Hệ thống nguồn/đích thuộc quản lý bên ngoài (pham_vi_quan_ly='ben_ngoai'). */
  nguon_ben_ngoai?: boolean | null;
  nguon_to_chuc?: string | null;
  dich_ben_ngoai?: boolean | null;
  dich_to_chuc?: string | null;
}

export interface GraphNode {
  id: string;
  ten: string;
  nhom: string | null;
  don_vi: string | null;
  ben_ngoai?: boolean;
  to_chuc?: string | null;
}

export interface GraphEdge {
  id: string;
  nguon: string;
  dich: string;
  loai: string;
  loai_ten: string | null;
  mau_sac: string;
  kieu_net: KieuNet;
  lop: Lop;
  huong: Huong;
  hai_chieu: boolean;
  /** true = cạnh có hướng (mũi tên 1 chiều). false/undefined = vẽ 2 đầu. Từ danh mục. */
  co_huong?: boolean;
  trang_thai: TrangThaiLienKet;
}

export interface SystemGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Adapter sang lõi đồ thị dùng chung (graph-core). Type-only import để
// system-graph không kéo theo bất kỳ phụ thuộc renderer/layout nào.
import type { CoreGraph } from "./graph-core";

/** Chuyển SystemGraph -> CoreGraph (renderer-agnostic) cho GraphCanvas/Prompt 6. */
export function toCoreGraph(g: SystemGraph): CoreGraph {
  return {
    nodes: g.nodes.map((n) => ({
      id: n.id,
      ten: n.ten,
      nhom: n.nhom,
      don_vi: n.don_vi,
      ben_ngoai: n.ben_ngoai ?? false,
      to_chuc: n.to_chuc ?? null,
    })),
    edges: g.edges.map((e) => ({
      id: e.id,
      nguon: e.nguon,
      dich: e.dich,
      loai: e.loai,
      loai_ten: e.loai_ten,
      lop: e.lop,
      huong: e.huong,
      trang_thai: e.trang_thai,
      mau_sac: e.mau_sac,
      kieu_net: e.kieu_net,
      co_huong: e.co_huong,
      hai_chieu: e.hai_chieu,
    })),
  };
}

/** Màu mặc định theo loại liên kết (khớp seed danh mục). */
export const LOAI_LIEN_KET_MAU: Record<LoaiLienKetMa, string> = {
  DAU_NOI_VAT_LY: "#6b7280",
  LUONG_TIN_HIEU: "#2563eb",
  PHU_THUOC_DICH_VU: "#d97706",
  DU_PHONG: "#16a34a",
};

/** Kiểu nét mặc định theo loại liên kết. */
export const LOAI_LIEN_KET_NET: Record<LoaiLienKetMa, KieuNet> = {
  DAU_NOI_VAT_LY: "solid",
  LUONG_TIN_HIEU: "solid",
  PHU_THUOC_DICH_VU: "dashed",
  DU_PHONG: "dotted",
};

export const LOAI_LIEN_KET_LABEL: Record<LoaiLienKetMa, string> = {
  DAU_NOI_VAT_LY: "Đấu nối vật lý",
  LUONG_TIN_HIEU: "Luồng tín hiệu",
  PHU_THUOC_DICH_VU: "Phụ thuộc dịch vụ",
  DU_PHONG: "Dự phòng",
};

function mauCuaCanh(row: DoThiRow): string {
  if (row.mau_sac) return row.mau_sac;
  return LOAI_LIEN_KET_MAU[row.loai_ma as LoaiLienKetMa] ?? "#6b7280";
}

function netCuaCanh(row: DoThiRow): KieuNet {
  if (row.kieu_net === "solid" || row.kieu_net === "dashed" || row.kieu_net === "dotted") {
    return row.kieu_net;
  }
  return LOAI_LIEN_KET_NET[row.loai_ma as LoaiLienKetMa] ?? "solid";
}

/**
 * Dựng đồ thị (nodes + edges) từ các hàng của view.
 * Node là hợp các hệ thống xuất hiện ở hai đầu bất kỳ cạnh nào.
 */
export function buildSystemGraph(rows: DoThiRow[]): SystemGraph {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const themNode = (
    id: string,
    ten: string | null,
    nhom: string | null,
    don_vi: string | null,
    ben_ngoai?: boolean | null,
    to_chuc?: string | null,
  ) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, {
        id,
        ten: ten ?? id,
        nhom,
        don_vi,
        ben_ngoai: ben_ngoai ?? false,
        to_chuc: to_chuc ?? null,
      });
    }
  };

  for (const r of rows) {
    themNode(r.nguon_id, r.nguon_ten, r.nguon_nhom, r.nguon_don_vi, r.nguon_ben_ngoai, r.nguon_to_chuc);
    themNode(r.dich_id, r.dich_ten, r.dich_nhom, r.dich_don_vi, r.dich_ben_ngoai, r.dich_to_chuc);
    edges.push({
      id: r.id,
      nguon: r.nguon_id,
      dich: r.dich_id,
      loai: r.loai_ma,
      loai_ten: r.loai_ten,
      mau_sac: mauCuaCanh(r),
      kieu_net: netCuaCanh(r),
      lop: r.lop,
      huong: r.huong,
      hai_chieu: r.huong === "hai_chieu",
      co_huong: r.co_huong,
      trang_thai: r.trang_thai,
    });
  }

  return {
    nodes: Array.from(nodeMap.values()).sort((a, b) => a.ten.localeCompare(b.ten, "vi")),
    edges,
  };
}

export interface ImpactResult {
  he_thong_id: string;
  do_sau: number;
  duong_dan: string[];
}

/**
 * Phân tích tác động phía client (khớp logic RPC phan_tich_tac_dong):
 * nếu `startId` ngừng hoạt động, những hệ thống nào bị ảnh hưởng?
 * Lan truyền chỉ theo cạnh ĐANG HIỆU LỰC:
 *   - LUONG_TIN_HIEU: nguồn -> đích (và ngược lại nếu hai chiều)
 *   - PHU_THUOC_DICH_VU: đích -> nguồn (nguồn phụ thuộc dịch vụ của đích)
 */
export function phanTichTacDong(rows: DoThiRow[], startId: string): ImpactResult[] {
  // Dựng danh sách kề lan truyền: tu -> den
  const ke = new Map<string, string[]>();
  const themKe = (tu: string, den: string) => {
    const arr = ke.get(tu);
    if (arr) arr.push(den);
    else ke.set(tu, [den]);
  };

  for (const r of rows) {
    if (r.trang_thai !== "hoat_dong") continue;
    if (r.loai_ma === "LUONG_TIN_HIEU") {
      themKe(r.nguon_id, r.dich_id);
      if (r.huong === "hai_chieu") themKe(r.dich_id, r.nguon_id);
    } else if (r.loai_ma === "PHU_THUOC_DICH_VU") {
      themKe(r.dich_id, r.nguon_id);
    }
  }

  const ketQua = new Map<string, ImpactResult>();
  // BFS theo độ sâu để do_sau là khoảng cách ngắn nhất
  let frontier: Array<{ id: string; duong_dan: string[] }> = [
    { id: startId, duong_dan: [startId] },
  ];
  let doSau = 0;
  const daTham = new Set<string>([startId]);

  while (frontier.length > 0) {
    doSau += 1;
    const next: Array<{ id: string; duong_dan: string[] }> = [];
    for (const cur of frontier) {
      for (const den of ke.get(cur.id) ?? []) {
        if (daTham.has(den)) continue;
        daTham.add(den);
        const duong_dan = [...cur.duong_dan, den];
        ketQua.set(den, { he_thong_id: den, do_sau: doSau, duong_dan });
        next.push({ id: den, duong_dan });
      }
    }
    frontier = next;
  }

  return Array.from(ketQua.values()).sort((a, b) => a.do_sau - b.do_sau);
}

// ============================================================================
// MÔ HÌNH CẠNH ĐỊNH HƯỚNG (mirror của view `v_canh_dieu_huong` + RPC
// `phan_tich_tac_dong` mới). Hướng/lan truyền KHAI Ở DANH MỤC, không hardcode.
//   - co_huong=true  -> 1 cạnh có hướng: tu=nguồn (cung cấp) -> den=đích (phụ thuộc)
//   - co_huong=false -> 2 cạnh (nguồn->đích và đích->nguồn)
//   - chỉ cạnh lan_truyen_tac_dong=true mới lan truyền hư hỏng
//   - traversal chặn chu trình bằng mảng đường đi (den <> ALL(path))
// ============================================================================

/** Một liên kết gốc (đang hiệu lực) kèm cờ danh mục để sinh cạnh định hướng. */
export interface LienKetCanh {
  lien_ket_id: string;
  nguon_id: string;
  dich_id: string;
  loai_ma: LoaiLienKetMa | string;
  co_huong: boolean;
  lan_truyen_tac_dong: boolean;
}

/** Một cạnh đã định hướng (khớp 1 dòng của v_canh_dieu_huong). */
export interface CanhDieuHuong {
  lien_ket_id: string;
  tu: string;
  den: string;
  loai_ma: LoaiLienKetMa | string;
  co_huong: boolean;
  lan_truyen_tac_dong: boolean;
}

/**
 * Sinh cạnh định hướng từ danh sách liên kết đang hiệu lực (mirror view).
 * Cạnh có hướng -> 1 dòng; cạnh hai chiều -> 2 dòng.
 */
export function sinhCanhDieuHuong(lienKets: LienKetCanh[]): CanhDieuHuong[] {
  const out: CanhDieuHuong[] = [];
  for (const lk of lienKets) {
    const base = {
      lien_ket_id: lk.lien_ket_id,
      loai_ma: lk.loai_ma,
      co_huong: lk.co_huong,
      lan_truyen_tac_dong: lk.lan_truyen_tac_dong,
    };
    out.push({ ...base, tu: lk.nguon_id, den: lk.dich_id });
    if (!lk.co_huong) {
      out.push({ ...base, tu: lk.dich_id, den: lk.nguon_id });
    }
  }
  return out;
}

/**
 * Phân tích tác động trên cạnh định hướng (mirror RPC mới): chỉ đi theo cạnh
 * lan_truyen_tac_dong=true, chặn chu trình bằng đường đi, trả do_sau nhỏ nhất.
 */
export function phanTichTacDongTheoCanh(
  canh: CanhDieuHuong[],
  startId: string,
): ImpactResult[] {
  const ke = new Map<string, string[]>();
  for (const c of canh) {
    if (!c.lan_truyen_tac_dong) continue;
    const arr = ke.get(c.tu);
    if (arr) arr.push(c.den);
    else ke.set(c.tu, [c.den]);
  }

  const ketQua = new Map<string, ImpactResult>();
  const daTham = new Set<string>([startId]);
  let frontier: Array<{ id: string; duong_dan: string[] }> = [
    { id: startId, duong_dan: [startId] },
  ];
  let doSau = 0;

  while (frontier.length > 0) {
    doSau += 1;
    const next: Array<{ id: string; duong_dan: string[] }> = [];
    for (const cur of frontier) {
      for (const den of ke.get(cur.id) ?? []) {
        // Chặn chu trình: không quay lại node đã có trên đường đi.
        if (cur.duong_dan.includes(den)) continue;
        if (daTham.has(den)) continue;
        daTham.add(den);
        const duong_dan = [...cur.duong_dan, den];
        ketQua.set(den, { he_thong_id: den, do_sau: doSau, duong_dan });
        next.push({ id: den, duong_dan });
      }
    }
    frontier = next;
  }

  return Array.from(ketQua.values()).sort((a, b) => a.do_sau - b.do_sau);
}
