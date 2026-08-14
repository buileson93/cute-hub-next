// ============================================================================
// Nguồn dữ liệu THẬT cho cây "Hệ Thống" và trang "Hệ thống tài sản".
// Đọc trực tiếp từ CSDL (thiet_bi + các bảng danh mục) thay cho dữ liệu mẫu tĩnh.
//
// Phân lớp thật trong CSDL (quan hệ khóa ngoại rõ ràng):
//   Đơn vị (dm_don_vi)
//     → Phân loại (dm_phan_loai: Nhóm 1 / Nhóm 2 / Nhóm 3 / Tài sản đo lường …)
//       → Nhóm hệ thống (dm_nhom_he_thong: VHF / VCCS / AMHS / Radar …)
//         → Hệ thống (dm_he_thong)
//           → Tài sản (thiet_bi)
//
// Nhóm hệ thống nay là BẢNG THẬT (dm_nhom_he_thong) và được gán qua khóa ngoại
// dm_he_thong.nhom_he_thong_id — KHÔNG còn suy ra từ tên hệ thống. Hàm
// deriveNhom chỉ còn dùng làm phương án dự phòng khi hệ thống chưa gán nhóm.
// Lĩnh vực (dm_linh_vuc) được giữ lại cho dữ liệu cũ nhưng ẩn khỏi cây mới.
// ============================================================================

import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { fetchAllRows } from "@/lib/mirats/paginate";
import type { ThietBi } from "@/lib/mirats/types";

/** Tài sản lấy từ CSDL, kèm mã phân lớp taxonomy để dựng cây. */
export interface DbDevice extends ThietBi {
  id: string;
  _pl: string; // mã phân loại (id nhóm hệ thống)
  _plTen: string;
  _lv: string; // mã lĩnh vực (id)
  _lvTen: string;
  _htId: string; // id hệ thống
  _htTen: string;
  _nhKey: string; // mã nhóm hệ thống suy ra
  _nhTen: string;
  // Trường mở rộng (vòng đời / khai thác) hiển thị ở trang Hệ thống tài sản.
  _namSanXuat: number | null;
  _namKhaiThac: number | null;
  _tyLeTuoiTho: number | null;
  _noiQuanLy: string;
  _phanLoai: string;
  _thanhPhan: string;
  _thanhPhanId: string | null;
  _thanhPhanMa: string | null;
  _thanhPhanTen: string | null;
  _donViTen: string;
  _viTriId: string;
  /** Tên vị trí ĐÃ liên kết danh mục dm_vi_tri (rỗng nếu chưa liên kết / danh mục đã xoá).
   *  Khác với `vi_tri` (có thể là chữ tự do cũ). Dùng để gom theo vị trí thật trong DB. */
  _viTriTen: string;
  _maBravo: string; // mã tài sản Bravo (cột vật lý cố định)
  // Model (dm_model) đã liên kết — nguồn kế thừa loại TB / NSX / thông số.
  _modelId: string;
  _modelMa: string;
  _modelTen: string;
  _modelAnh: string; // đường dẫn ảnh trong bucket model-anh (rỗng nếu chưa có)
  _modelMoTa: string;
  _modelPn: string;
  _modelNsxTen: string;
  // Chủng loại (dm_loai_thiet_bi): dùng để gom & hiển thị nhãn phân loại
  // theo loại (Cảm biến, Truyền dẫn…). Kế thừa từ model.
  _loaiTbId: string;
  _loaiTbTen: string;
  _loaiTbOrder: number;
  // Cấp phát / thu hồi (T2.1)
  _capPhatTrangThai: string; // 'san_sang' | 'da_cap_phat'
  _nguoiGiu: string;
  _donViGiuId: string;
  _donViGiuTen: string;
  _ngayCapPhat: string;
}

export interface DbTaxonomy {
  devices: DbDevice[];
  /** Danh sách phân loại theo đúng thứ tự CSDL (id → tên/tone/thứ tự). */
  plList: Array<{ id: string; ten: string; tone: string; thu_tu: number }>;
  plNameMap: Map<string, string>;
  lvNameMap: Map<string, string>;
  htNameMap: Map<string, string>; // id hệ thống → tên
  htMaMap: Map<string, string>;   // mã hệ thống (ma) → tên
  nhomNameMap: Map<string, string>;
  nhomMaMap: Map<string, string>; // mã nhóm (ma) → tên
  donViList: Array<{ id: string; ma: string; ten: string; mo_ta: string }>;
  /** Danh sách lĩnh vực theo thứ tự CSDL. */
  lvList: Array<{ id: string; ma: string; ten: string; thu_tu: number }>;
  /** Danh sách nhóm hệ thống thật (dm_nhom_he_thong: VHF/VCCS…). */
  nhomList: Array<{ id: string; ma: string; ten: string; phanLoaiId: string; thu_tu: number }>;
  nhomNameMap: Map<string, string>;
  /** Danh sách hệ thống thật (dm_he_thong) kèm khoá phân lớp. */
  htList: Array<{
    id: string;
    ma: string;
    ten: string;
    phanLoaiId: string;
    nhomId: string;
    lvId: string;
    donViId: string;
    gpSo: string;
    gpHan: string;
    maBravo: string;
  }>;
  /** Danh mục vị trí thật (dm_vi_tri). */
  viTriList: Array<{ id: string; ma: string; ten: string; mo_ta: string }>;
  trangThaiList: string[];
}

/* --------- Suy ra "Nhóm hệ thống" (VHF/VCCS…) từ tên hệ thống --------- */

// Bỏ dấu tiếng Việt để so khớp từ khoá.
function noAccent(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase();
}

// Thứ tự ưu tiên khớp (cụ thể trước, chung sau). [từ khoá, mã, tên hiển thị]
const NHOM_KEYWORDS: Array<[RegExp, string, string]> = [
  [/\bVCCS\b|CHUYEN MACH THOAI/, "VCCS", "VCCS — Chuyển mạch thoại"],
  [/\bAMHS\b|DIEN VAN/, "AMHS", "AMHS — Xử lý điện văn"],
  [/D-?ATIS|\bATIS\b/, "ATIS", "ATIS / D-ATIS"],
  [/\bVHF\b/, "VHF", "VHF — Thu phát thoại"],
  [/\bHF\b/, "HF", "HF — Sóng ngắn"],
  [/ADS-?B/, "ADSB", "ADS-B"],
  [/\bMLAT\b|\bWAM\b/, "MLAT", "MLAT / WAM"],
  [/\bVOR\b/, "VOR", "VOR"],
  [/\bDME\b/, "DME", "DME"],
  [/\bNDB\b/, "NDB", "NDB"],
  [/RADAR|RA ?DA|DOPPLER/, "RADAR", "Radar"],
  [
    /AWOS|QUAN TRAC (THOI TIET|KHI TUONG)|OPTIMET|AVIMET|\bIMS\b/,
    "AWOS",
    "AWOS — Quan trắc thời tiết",
  ],
  [/LLWAS|GIO DUT/, "LLWAS", "LLWAS — Cảnh báo gió đứt"],
  [/\bRDP\b|\bFDP\b|\bATCC\b|QUAN LY KHONG LUU|\bATM\b/, "ATM", "ATM / RDP"],
  [/VSAT/, "VSAT", "VSAT"],
  [/VIBA/, "VIBA", "VIBA"],
  [/TONG DAI|\bPBX\b|UNIFY/, "PBX", "Tổng đài điện thoại"],
  [/GHI AM|RECORD/, "REC", "Ghi âm / Ghi hình"],
  [/CAMERA|\bCAM\b|\bCCTV\b/, "CAM", "Camera giám sát"],
  [/DIEU HOA|\bAC\b|CHILLER/, "AC", "Điều hòa"],
  [/\bUPS\b|AC-?DC|MAY PHAT|ACQUY|AC QUY|NGUON DIEN|DIEN NGUON/, "PWR", "Nguồn điện / UPS"],
  [/PCCC|CHUA CHAY|BAO CHAY/, "PCCC", "PCCC"],
  [/CHONG SET|CAT LOC SET/, "SET", "Chống sét"],
  [/DONG HO|CLOCK|NTP/, "CLK", "Đồng hồ chuẩn"],
  [/SIMULATOR|GIA DINH|HUAN LUYEN/, "SIM", "Giả định huấn luyện"],
  [/\bSW\b|SWITCH|CONVETER|CONVERTER|ROUTER|MANG|NETWORK/, "NET", "Mạng / Chuyển mạch"],
  [/DO |DONG HO DO|MEGAOHM|WATMET|EARTH GROUND|DIEN TRO/, "DO", "Tài sản đo lường"],
];

export function deriveNhom(tenHeThong: string): { key: string; ten: string } {
  const s = noAccent(tenHeThong ?? "");
  for (const [re, key, ten] of NHOM_KEYWORDS) {
    if (re.test(s)) return { key, ten };
  }
  return { key: "KHAC", ten: "Nhóm khác" };
}

/* ------------------------------ Màu phân loại ------------------------------ */

function plTone(ten: string): string {
  const s = noAccent(ten);
  if (s.includes("DUNG KHAI THAC")) return "border-slate-500/40 bg-slate-500/10 text-slate-500";
  if (s.includes("NHOM 1")) return "border-rose-500/40 bg-rose-500/10 text-rose-600";
  if (s.includes("NHOM 2")) return "border-amber-500/40 bg-amber-500/10 text-amber-600";
  if (s.includes("NHOM 3")) return "border-sky-500/40 bg-sky-500/10 text-sky-600";
  if (s.includes("DO LUONG")) return "border-violet-500/40 bg-violet-500/10 text-violet-600";
  return "border-border bg-muted text-muted-foreground";
}

/** Nhãn giấy phép theo phân loại: Nhóm 1 = giấy phép, Nhóm 2 = quyết định. */
export function giayPhepLabelByTen(plTen: string | undefined): string {
  const s = noAccent(plTen ?? "");
  if (s.includes("NHOM 1")) return "Giấy phép khai thác";
  if (s.includes("NHOM 2")) return "Quyết định khai thác";
  return "";
}

/* ------------------------------ Tải dữ liệu ------------------------------ */

type CatRow = { id: string; ma: string; ten: string; thu_tu: number | null };

const TB_COLS =
  "id, ma_thiet_bi, ma_tai_san_bravo, ten_thiet_bi, ma_serial, p_n, model, model_id, nha_san_xuat, nha_cung_cap, vi_tri, vi_tri_id, ngay_mua, han_bao_hanh, ghi_chu, he_thong_id, phan_loai_id, nhom_he_thong_id, don_vi_id, trang_thai_id, loai_thiet_bi_id, phan_loai, nam_san_xuat, nam_dua_vao_khai_thac, ty_le_tuoi_tho, noi_quan_ly, thanh_phan, nguoi_giu, don_vi_giu_id, ngay_cap_phat, trang_thai_cap_phat, gan_chuc_nang(id, he_thong_thanh_phan:thanh_phan_id(id, ma_thanh_phan, ten))";

async function fetchAllThietBi(): Promise<Record<string, unknown>[]> {
  const page = 1000;
  let from = 0;
  const out: Record<string, unknown>[] = [];
  for (;;) {
    const { data, error } = await supabase
      .from("thiet_bi")
      .select(TB_COLS)
      .order("ma_thiet_bi", { ascending: true })
      .range(from, from + page - 1);
    if (error) throw error;
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    out.push(...rows);
    if (rows.length < page) break;
    from += page;
  }
  return out;
}

async function loadTaxonomy(): Promise<DbTaxonomy> {
  const [plRes, nhomRes, htRes, dvRes, ttRes, vtRes, ltRes, mdRes, nsxRes, editRes, tbRows] =
    await Promise.all([
      supabase.from("dm_phan_loai").select("id, ma, ten, thu_tu").order("thu_tu"),
      supabase.from("dm_nhom_he_thong").select("id, ma, ten, phan_loai_id, thu_tu").order("thu_tu"),
      supabase
        .from("dm_he_thong")
        .select(
          "id, ma, ten, ma_tai_san_bravo, thu_tu, phan_loai_id, nhom_he_thong_id, don_vi_id, gp_so, gp_han",
        )
        .order("ten"),
      supabase.from("dm_don_vi").select("id, ma, ten, mo_ta, thu_tu").order("thu_tu"),
      supabase.from("dm_trang_thai_thiet_bi").select("id, ma, ten, thu_tu").order("thu_tu"),
      supabase.from("dm_vi_tri").select("id, ma, ten, mo_ta, thu_tu").order("thu_tu"),
      supabase.from("dm_loai_thiet_bi").select("id, ma, ten, thu_tu").order("thu_tu"),
      supabase.from("dm_model").select("id, ma, ten, hinh_anh, mo_ta, p_n, nha_san_xuat_id"),
      supabase.from("dm_nha_san_xuat").select("id, ten"),
      supabase.from("cay_node_edit").select("ma, du_lieu").eq("kind", "ht"),
      fetchAllThietBi(),
    ]);
  for (const r of [plRes, nhomRes, htRes, dvRes, ttRes, vtRes, ltRes, mdRes, nsxRes, editRes]) {
    if (r.error) throw r.error;
  }

  const pl = (plRes.data ?? []) as CatRow[];
  const nhom = (nhomRes.data ?? []) as Array<CatRow & { phan_loai_id: string | null }>;
  const lv: CatRow[] = [];
  const ht = (htRes.data ?? []) as Array<
    CatRow & {
      phan_loai_id: string | null;
      nhom_he_thong_id: string | null;
      don_vi_id: string | null;
      gp_so: string | null;
      gp_han: string | null;
      ma_tai_san_bravo: string | null;
    }
  >;
  const dv = (dvRes.data ?? []) as Array<CatRow & { mo_ta: string | null }>;
  const tt = (ttRes.data ?? []) as CatRow[];
  const vt = (vtRes.data ?? []) as Array<CatRow & { mo_ta: string | null }>;
  const lt = (ltRes.data ?? []) as CatRow[];
  const md = (mdRes.data ?? []) as Array<{
    id: string; ma: string | null; ten: string | null; hinh_anh: string | null;
    mo_ta: string | null; p_n: string | null; nha_san_xuat_id: string | null;
  }>;
  const nsx = (nsxRes.data ?? []) as Array<{ id: string; ten: string | null }>;
  const edits = (editRes.data ?? []) as Array<{
    ma: string;
    du_lieu: Record<string, unknown> | null;
  }>;

  const plNameMap = new Map(pl.map((r) => [r.id, r.ten]));
  const lvNameMap = new Map(lv.map((r) => [r.id, r.ten]));
  const htNameMap = new Map(ht.map((r) => [r.id, r.ten]));
  const dvMaMap = new Map(dv.map((r) => [r.id, r.ma]));
  const dvTenMap = new Map(dv.map((r) => [r.id, r.ten]));
  const ttNameMap = new Map(tt.map((r) => [r.id, r.ten]));
  const vtNameMap = new Map(vt.map((r) => [r.id, r.ten]));
  const ltNameMap = new Map(lt.map((r) => [r.id, r.ten]));
  const ltOrderMap = new Map(lt.map((r, i) => [r.id, r.thu_tu ?? i]));
  const nsxNameMap = new Map(nsx.map((r) => [r.id, r.ten ?? ""]));
  const modelMap = new Map(md.map((r) => [r.id, r]));

  // Nhóm hệ thống thật (id → mã/tên) + bản đồ hệ thống → nhóm/phân loại.
  const nhomById = new Map(nhom.map((r) => [r.id, { ma: r.ma, ten: r.ten }]));
  const nhomNameMap = new Map(nhom.map((r) => [r.id, r.ten]));
  const nhomMaMap = new Map(nhom.map((r) => [r.ma, r.ten]));
  const htNameMap = new Map(ht.map((r) => [r.id, r.ten]));
  const htMaMap = new Map(ht.map((r) => [r.ma, r.ten]));
  const htNhomMap = new Map(ht.map((r) => [r.id, r.nhom_he_thong_id ?? ""]));
  const htPhanLoaiMap = new Map(ht.map((r) => [r.id, r.phan_loai_id ?? ""]));
  // Phân loại của NHÓM hệ thống (nhomId → phan_loai_id) — dùng làm bậc dự phòng
  // theo phân cấp: tài sản → hệ thống → NHÓM. Nhờ vậy hệ thống/tài sản chưa
  // khai phân loại trực tiếp vẫn nằm đúng nhánh phân loại của nhóm cha (không
  // rơi vào mục "chưa phân loại").
  const nhomPhanLoaiMap = new Map(nhom.map((r) => [r.id, r.phan_loai_id ?? ""]));

  const nhOverrideMap = new Map<string, { key: string; ten: string }>();
  for (const e of edits) {
    const key = e.du_lieu?.manual_nh_key;
    if (typeof key !== "string" || !key.trim()) continue;
    const ten = e.du_lieu?.manual_nh_ten;
    nhOverrideMap.set(e.ma, {
      key: key.trim(),
      ten: typeof ten === "string" && ten.trim() ? ten.trim() : key.trim(),
    });
  }

  const plList = pl.map((r) => ({
    id: r.id,
    ten: r.ten,
    tone: plTone(r.ten),
    thu_tu: r.thu_tu ?? 0,
  }));

  const devices: DbDevice[] = tbRows.map((r) => {
    const htId = (r.he_thong_id as string) ?? "";
    const htTen = htNameMap.get(htId) ?? "(Chưa gán hệ thống)";
    // Nhóm hệ thống THẬT: theo khóa ngoại (ưu tiên tài sản → hệ thống).
    const nhomId = (r.nhom_he_thong_id as string) || htNhomMap.get(htId) || "";
    const nhomRow = nhomId ? nhomById.get(nhomId) : undefined;
    // Phân loại theo phân cấp: tài sản → hệ thống → NHÓM hệ thống. Nhờ bậc dự
    // phòng theo nhóm, hệ thống mới nhập (chưa khai phân loại trực tiếp) vẫn nằm
    // đúng nhánh phân loại của nhóm cha thay vì rơi vào "chưa phân loại".
    const plId =
      (r.phan_loai_id as string) ||
      htPhanLoaiMap.get(htId) ||
      (nhomId ? nhomPhanLoaiMap.get(nhomId) : "") ||
      "";
    const lvId = "";
    const nhOverride = nhOverrideMap.get(htId);
    // NGUỒN CHÂN LÝ DUY NHẤT = khóa ngoại nhom_he_thong_id (nhomRow).
    // Đã backfill toàn bộ; không còn fallback theo tên hệ thống.
    const derived = nhomRow
      ? { key: nhomRow.ma, ten: nhomRow.ten }
      : (nhOverride ?? { key: "", ten: "" });
    const { key: nhKey, ten: nhTen } = derived;

    const trangThai = ttNameMap.get((r.trang_thai_id as string) ?? "") ?? "";
    const donViMa = dvMaMap.get((r.don_vi_id as string) ?? "") ?? "";
    const donViTen = dvTenMap.get((r.don_vi_id as string) ?? "") ?? "";
    const num = (v: unknown): number | null => {
      const n = typeof v === "number" ? v : v == null || v === "" ? NaN : Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const tp = (r.gan_chuc_nang as any)?.[0]?.he_thong_thanh_phan;
    return {
      // các trường ThietBi tĩnh (điền từ CSDL, thiếu thì để rỗng)
      ma_thiet_bi: (r.ma_thiet_bi as string) ?? (r.id as string),
      ten: (r.ten_thiet_bi as string) ?? "(Không tên)",
      serial: (r.ma_serial as string) ?? "",
      p_n: (r.p_n as string) ?? "",
      model: (r.model as string) ?? "",

      don_vi: donViMa,
      he_thong: htId,
      nhom_he_thong: plId,
      loai: "",
      nha_san_xuat: (r.nha_san_xuat as string) ?? "",
      nha_cung_cap: (r.nha_cung_cap as string) ?? "",
      vi_tri: vtNameMap.get((r.vi_tri_id as string) ?? "") ?? (r.vi_tri as string) ?? "",
      ngay_mua: (r.ngay_mua as string) ?? "",
      ngay_dua_vao_su_dung: (r.nam_dua_vao_khai_thac as string) ?? "",
      han_bao_hanh: (r.han_bao_hanh as string) ?? "",
      gia_tri_mua: 0,
      nguon_von: "",
      tuoi_tho_thiet_ke_nam: 0,
      trang_thai: trangThai,
      muc_do_quan_trong: "",
      tinh_trang_ky_thuat: "",
      thiet_bi_cha: null,
      ghi_chu: (r.ghi_chu as string) ?? null,
      // mở rộng taxonomy
      id: r.id as string,
      _pl: plId,
      _plTen: plNameMap.get(plId) ?? "(Chưa phân loại)",
      _lv: lvId,
      _lvTen: lvNameMap.get(lvId) ?? "(Chưa xác định lĩnh vực)",
      _htId: htId,
      _htTen: htTen,
      _nhKey: nhKey,
      _nhTen: nhTen,
      _namSanXuat: num(r.nam_san_xuat),
      _namKhaiThac: num(r.nam_dua_vao_khai_thac),
      _tyLeTuoiTho: num(r.ty_le_tuoi_tho),
      _noiQuanLy: (r.noi_quan_ly as string) ?? "",
      _phanLoai: (r.phan_loai as string) ?? "",
      _thanhPhan: (r.thanh_phan as string) ?? "",
      _thanhPhanId: tp?.id || null,
      _thanhPhanMa: tp?.ma_thanh_phan || null,
      _thanhPhanTen: tp?.ten || null,
      _donViTen: donViTen,
      _viTriId: (r.vi_tri_id as string) ?? "",
      _viTriTen: vtNameMap.get((r.vi_tri_id as string) ?? "") ?? "",
      _maBravo: (r.ma_tai_san_bravo as string) ?? "",
      ...(() => {
        const m = modelMap.get((r.model_id as string) ?? "");
        return {
          _modelId: (r.model_id as string) ?? "",
          _modelMa: m?.ma ?? "",
          _modelTen: m?.ten ?? ((r.model as string) ?? ""),
          _modelAnh: m?.hinh_anh ?? "",
          _modelMoTa: m?.mo_ta ?? "",
          _modelPn: m?.p_n ?? "",
          _modelNsxTen: m?.nha_san_xuat_id ? (nsxNameMap.get(m.nha_san_xuat_id) ?? "") : "",
        };
      })(),
      _loaiTbId: (r.loai_thiet_bi_id as string) ?? "",
      _loaiTbTen: ltNameMap.get((r.loai_thiet_bi_id as string) ?? "") ?? "",
      _loaiTbOrder: ltOrderMap.get((r.loai_thiet_bi_id as string) ?? "") ?? 9999,
      _capPhatTrangThai: (r.trang_thai_cap_phat as string) ?? "san_sang",
      _nguoiGiu: (r.nguoi_giu as string) ?? "",
      _donViGiuId: (r.don_vi_giu_id as string) ?? "",
      _donViGiuTen: dvTenMap.get((r.don_vi_giu_id as string) ?? "") ?? "",
      _ngayCapPhat: (r.ngay_cap_phat as string) ?? "",
    };
  });

  return {
    devices,
    plList,
    plNameMap,
    lvNameMap,
    htNameMap,
    nhomList: nhom.map((r) => ({
      id: r.id,
      ma: r.ma,
      ten: r.ten,
      phanLoaiId: r.phan_loai_id ?? "",
      thu_tu: r.thu_tu ?? 0,
    })),
    nhomNameMap,
    donViList: dv.map((r) => ({ id: r.id, ma: r.ma, ten: r.ten, mo_ta: r.mo_ta ?? "" })),
    lvList: lv.map((r) => ({ id: r.id, ma: r.ma, ten: r.ten, thu_tu: r.thu_tu ?? 0 })),
    htList: ht.map((r) => ({
      id: r.id,
      ma: r.ma,
      ten: r.ten,
      phanLoaiId: r.phan_loai_id ?? "",
      nhomId: r.nhom_he_thong_id ?? "",
      lvId: "",
      donViId: r.don_vi_id ?? "",
      gpSo: r.gp_so ?? "",
      gpHan: r.gp_han ?? "",
      maBravo: r.ma_tai_san_bravo ?? "",
    })),
    viTriList: vt.map((r) => ({ id: r.id, ma: r.ma, ten: r.ten, mo_ta: r.mo_ta ?? "" })),
    trangThaiList: tt.map((r) => r.ten),
  };
}

export function useDbTaxonomy() {
  return useQuery({
    queryKey: ["db_taxonomy"],
    queryFn: loadTaxonomy,
    staleTime: 10_000,
  });
}

/**
 * Vô hiệu hoá TOÀN BỘ cache phụ thuộc danh mục/taxonomy để mọi giao diện
 * (cây Hệ Thống, danh sách Hệ thống tài sản, Sổ lý lịch…) đồng bộ TỨC THÌ
 * sau khi sửa danh mục (chủng loại, nhà sản xuất, vị trí…), đổi tên node
 * hay chỉnh tài sản. Dùng chung ở mọi nơi có thay đổi ảnh hưởng cây tài sản.
 */
export function invalidateTaxonomy(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
  qc.invalidateQueries({ queryKey: ["ht_name_overrides"] });
  qc.invalidateQueries({ queryKey: ["tb_name_overrides"] });
  qc.invalidateQueries({ queryKey: ["ref_id_options"] });
  qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
}

// ---------------------------------------------------------------------------
// Đồng bộ tên hệ thống đã đổi ở cây "Hệ Thống" (bảng cay_node_edit, kind="ht")
// sang các trang khác (Sổ lý lịch…). Mã lưu dạng "<nhóm>::<id hệ thống>", nên
// tách phần id hệ thống để map theo id.
// ---------------------------------------------------------------------------
const HT_SEP = "::";

/**
 * Pure helper: dựng Map<idHệThống, tênOverride> CHỈ cho node NHÁP.
 * Sau P1/P2, tên hệ thống thật lấy từ `dm_he_thong` (SSoT). Override ở
 * `cay_node_edit` chỉ được giữ cho id KHÔNG tồn tại trong `realSystemIds`.
 */
export function buildSystemNameOverrideMap(
  rows: Array<{ ma: string; ten: string | null; du_lieu: Record<string, unknown> | null }>,
  realSystemIds: Set<string>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of rows) {
    const i = r.ma.indexOf(HT_SEP);
    const sysId = i < 0 ? r.ma : r.ma.slice(i + HT_SEP.length);
    if (!sysId || sysId === "__none__") continue;
    if (realSystemIds.has(sysId)) continue; // node thật → dùng bảng gốc, bỏ qua override
    const name = r.ten?.trim() || (typeof r.du_lieu?.ten_mindmap === "string" ? String(r.du_lieu.ten_mindmap).trim() : "");
    if (name) map.set(sysId, name);
  }
  return map;
}

/**
 * Pure helper: dựng Map<maThietBi, tênOverride> CHỈ cho node NHÁP.
 * Với ma_thiet_bi đã tồn tại ở `thiet_bi`, tên đọc thẳng từ bảng gốc.
 */
export function buildDeviceNameOverrideMap(
  rows: Array<{ ma: string; ten: string | null; du_lieu: Record<string, unknown> | null }>,
  realDeviceMa: Set<string>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of rows) {
    if (!r.ma) continue;
    if (realDeviceMa.has(r.ma)) continue;
    const name = r.ten?.trim() || (typeof r.du_lieu?.ten_mindmap === "string" ? String(r.du_lieu.ten_mindmap).trim() : "");
    if (name) map.set(r.ma, name);
  }
  return map;
}

/** Trả về Map<idHệThống, tênNháp> — chỉ chứa node CHƯA có bản ghi ở `dm_he_thong`. */
export function useSystemNameOverrides() {
  return useQuery({
    queryKey: ["ht_name_overrides"],
    queryFn: async (): Promise<Map<string, string>> => {
      const [editRes, htRes] = await Promise.all([
        supabase.from("cay_node_edit").select("ma,ten,du_lieu").eq("kind", "ht"),
        supabase.from("dm_he_thong").select("id"),
      ]);
      if (editRes.error) throw editRes.error;
      if (htRes.error) throw htRes.error;
      const realIds = new Set<string>((htRes.data ?? []).map((r) => r.id as string));
      return buildSystemNameOverrideMap(
        (editRes.data ?? []) as Array<{ ma: string; ten: string | null; du_lieu: Record<string, unknown> | null }>,
        realIds,
      );
    },
    staleTime: 30_000,
  });
}

/** Trả về Map<maThietBi, tênNháp> — chỉ chứa mã CHƯA có bản ghi ở `thiet_bi`. */
export function useDeviceNameOverrides() {
  return useQuery({
    queryKey: ["tb_name_overrides"],
    queryFn: async (): Promise<Map<string, string>> => {
      const [editRes, tbRows] = await Promise.all([
        supabase.from("cay_node_edit").select("ma,ten,du_lieu").eq("kind", "tb"),
        fetchAllRows<{ ma_thiet_bi: string }>((from, to) =>
          supabase.from("thiet_bi").select("ma_thiet_bi").range(from, to),
        ),
      ]);
      if (editRes.error) throw editRes.error;
      const realMa = new Set<string>(tbRows.map((r) => r.ma_thiet_bi));
      return buildDeviceNameOverrideMap(
        (editRes.data ?? []) as Array<{ ma: string; ten: string | null; du_lieu: Record<string, unknown> | null }>,
        realMa,
      );
    },
    staleTime: 30_000,
  });
}

