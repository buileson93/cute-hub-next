// ============================================================================
// Phân loại hệ thống tài sản bảo đảm hoạt động bay (CNS/ATM/MET/ME…)
//
// Cấu trúc phân lớp (layer) của "Hệ thống tài sản":
//   Toàn hệ thống
//     → Phân loại hệ thống  (Nhóm 1 / Nhóm 2 / Nhóm 3)
//       → Lĩnh vực          (Thông tin, Dẫn đường, Giám sát, ATM,
//                              Tin tức hàng không, Khí tượng, ME, Hỗ trợ…)
//         → Nhóm hệ thống    (VHF A/G, VCCS, AMHS, AWOS, ADS-B, ATM…)
//           → Hệ thống        (hệ thống cụ thể — trường "he_thong" của tài sản)
//             → Tài sản      (tài sản thực trong CSDL)
//               → Thành phần tài sản (tài sản con — theo thiet_bi_cha)
//
// Giấy phép theo phân loại: Nhóm 1 = Giấy phép khai thác;
//   Nhóm 2 = Quyết định khai thác; Nhóm 3 = không yêu cầu.
// ============================================================================

export type PhanLoaiId = "N1" | "N2" | "N3";

export interface PhanLoai {
  id: PhanLoaiId;
  ten: string;
  mo_ta: string;
  /** class màu semantic cho badge/khối */
  tone: string;
}

export const PHAN_LOAI: PhanLoai[] = [
  {
    id: "N1",
    ten: "Nhóm 1 — Chiến lược trọng yếu",
    mo_ta: "Hệ thống, tài sản trực tiếp bảo đảm điều hành bay, mức ưu tiên cao nhất.",
    tone: "border-rose-500/40 bg-rose-500/10 text-rose-600",
  },
  {
    id: "N2",
    ten: "Nhóm 2 — Hạ tầng thiết yếu",
    mo_ta: "Hạ tầng thông tin, nguồn điện, cơ điện phục vụ hệ thống Nhóm 1 và Nhóm 2.",
    tone: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  },
  {
    id: "N3",
    ten: "Nhóm 3 — Hỗ trợ",
    mo_ta: "Hệ thống, tài sản hỗ trợ, đảm bảo môi trường và an ninh cơ sở.",
    tone: "border-sky-500/40 bg-sky-500/10 text-sky-600",
  },
];

export type LinhVucId =
  | "thong-tin"
  | "dan-duong"
  | "giam-sat"
  | "atm"
  | "tin-tuc"
  | "khi-tuong"
  | "me"
  | "khac"
  | "ho-tro";

export interface LinhVuc {
  id: LinhVucId;
  ten: string;
}

// Thứ tự hiển thị các Nhóm Hệ thống (lĩnh vực).
export const LINH_VUC: LinhVuc[] = [
  { id: "thong-tin", ten: "Lĩnh vực Thông tin" },
  { id: "dan-duong", ten: "Lĩnh vực Dẫn đường" },
  { id: "giam-sat", ten: "Lĩnh vực Giám sát" },
  { id: "atm", ten: "Lĩnh vực ATM" },
  { id: "tin-tuc", ten: "Lĩnh vực Tin tức hàng không" },
  { id: "khi-tuong", ten: "Lĩnh vực Khí tượng" },
  { id: "me", ten: "Lĩnh vực ME (Cơ điện)" },
  { id: "khac", ten: "Các hệ thống, tài sản khác" },
  { id: "ho-tro", ten: "Nhóm hỗ trợ" },
];

export interface HeThongCatalog {
  /** mã hệ thống (khớp với nhom_he_thong của tài sản khi có dữ liệu) */
  ma: string;
  ten: string;
  pl: PhanLoaiId;
  lv: LinhVucId;
}

// Danh mục đầy đủ hệ thống theo phân loại (nguồn: quy định phân nhóm HTTB BĐHĐB).
export const HE_THONG_CATALOG: HeThongCatalog[] = [
  // ---------------------- Nhóm 1 — Chiến lược trọng yếu ----------------------
  { ma: "VHF", ten: "Tài sản thu phát sóng cực ngắn không-địa (VHF A/G)", pl: "N1", lv: "thong-tin" },
  { ma: "HF", ten: "Tài sản thu phát sóng ngắn không-địa (HF A/G)", pl: "N1", lv: "thong-tin" },
  { ma: "VCCS", ten: "Hệ thống chuyển mạch thoại (VCCS)", pl: "N1", lv: "thong-tin" },
  { ma: "AMHS", ten: "Hệ thống xử lý điện văn dịch vụ không lưu (AMHS)", pl: "N1", lv: "thong-tin" },
  { ma: "DATIS", ten: "Hệ thống thông báo tự động khu vực sân bay (ATIS/D-ATIS)", pl: "N1", lv: "thong-tin" },

  { ma: "VOR", ten: "Hệ thống dẫn đường đa hướng sóng cực ngắn (VOR)", pl: "N1", lv: "dan-duong" },
  { ma: "DME", ten: "Hệ thống đo cự ly bằng vô tuyến (DME)", pl: "N1", lv: "dan-duong" },

  { ma: "PSR", ten: "Hệ thống ra đa giám sát sơ cấp (PSR, SMR)", pl: "N1", lv: "giam-sat" },
  { ma: "SSR", ten: "Hệ thống ra đa giám sát thứ cấp (SSR)", pl: "N1", lv: "giam-sat" },
  { ma: "ADSB", ten: "Hệ thống giám sát tự động phụ thuộc dạng quảng bá (ADS-B)", pl: "N1", lv: "giam-sat" },
  { ma: "MLAT", ten: "Hệ thống giám sát đa điểm (MLAT/WAM)", pl: "N1", lv: "giam-sat" },
  { ma: "ATS", ten: "Giám sát ATS (ra đa/đa điểm)", pl: "N1", lv: "giam-sat" },

  { ma: "ATM", ten: "Hệ thống quản lý không lưu tự động (ATM)", pl: "N1", lv: "atm" },
  { ma: "ATFM", ten: "Hệ thống quản lý luồng không lưu (ATFM)", pl: "N1", lv: "atm" },
  { ma: "SDP", ten: "Hệ thống xử lý dữ liệu giám sát/bay (SDP, RDP/FDP)", pl: "N1", lv: "atm" },
  { ma: "ADSBP", ten: "Hệ thống xử lý dữ liệu ADS-B", pl: "N1", lv: "atm" },
  { ma: "ASMGCS", ten: "Hệ thống giám sát mặt đất cải tiến (A-SMGCS)", pl: "N1", lv: "atm" },

  { ma: "AIM", ten: "Hệ thống quản lý tin tức hàng không (AIM)", pl: "N1", lv: "tin-tuc" },

  { ma: "AWOS", ten: "Hệ thống quan trắc thời tiết tự động (AWOS)", pl: "N1", lv: "khi-tuong" },
  { ma: "WSHEAR", ten: "Hệ thống đo đạc, cảnh báo hiện tượng gió đứt", pl: "N1", lv: "khi-tuong" },
  { ma: "WXRADAR", ten: "Hệ thống radar thời tiết", pl: "N1", lv: "khi-tuong" },
  { ma: "WAFS", ten: "Hệ thống thu sản phẩm dự báo thời tiết toàn cầu (WAFS)", pl: "N1", lv: "khi-tuong" },
  { ma: "CSDLKT", ten: "Hệ thống cơ sở dữ liệu khí tượng hàng không (CSDL KTHK)", pl: "N1", lv: "khi-tuong" },
  { ma: "OPMET", ten: "Hệ thống thu thập, xử lý và trao đổi dữ liệu OPMET", pl: "N1", lv: "khi-tuong" },
  { ma: "MET", ten: "Các tài sản đo đạc quan trắc thông dụng", pl: "N1", lv: "khi-tuong" },

  // ---------------------- Nhóm 2 — Hạ tầng thiết yếu ----------------------
  { ma: "ATN", ten: "Mạng viễn thông hàng không (ATN)", pl: "N2", lv: "thong-tin" },
  { ma: "VIBA", ten: "Hệ thống thông tin vô tuyến chuyển tiếp (VIBA) / VSAT", pl: "N2", lv: "thong-tin" },
  { ma: "VSAT", ten: "Hệ thống thông tin vệ tinh mặt đất cỡ nhỏ (VSAT)", pl: "N2", lv: "thong-tin" },
  { ma: "MUX", ten: "Hệ thống thông tin quang / ghép kênh", pl: "N2", lv: "thong-tin" },
  { ma: "ATSDS", ten: "Tài sản trực thoại không lưu (ATS D/S)", pl: "N2", lv: "thong-tin" },
  { ma: "PBX", ten: "Hệ thống tổng đài điện thoại & bảo đảm mặt đất", pl: "N2", lv: "thong-tin" },
  { ma: "VHFFM", ten: "Thu phát VHF FM liên lạc mặt đất hiệp đồng bay (VHF FM G/G)", pl: "N2", lv: "thong-tin" },

  { ma: "NDB", ten: "Hệ thống dẫn đường vô hướng (NDB)", pl: "N2", lv: "dan-duong" },

  { ma: "AIS", ten: "Hệ thống tự động hóa dịch vụ thông báo tin tức hàng không (AIS)", pl: "N2", lv: "tin-tuc" },
  { ma: "NOTAM", ten: "Hệ thống NOTAM bán tự động", pl: "N2", lv: "tin-tuc" },
  { ma: "ETOD", ten: "Hệ thống CSDL địa hình và vật chướng ngại điện tử (eTOD)", pl: "N2", lv: "tin-tuc" },
  { ma: "IFPD", ten: "Hệ thống thiết kế phương thức bay (IFPD)", pl: "N2", lv: "tin-tuc" },

  { ma: "GTS", ten: "Hệ thống thu thập, xử lý số liệu khí tượng cơ bản (GTS)", pl: "N2", lv: "khi-tuong" },
  { ma: "SATCLOUD", ten: "Hệ thống thu ảnh mây vệ tinh khí tượng", pl: "N2", lv: "khi-tuong" },
  { ma: "XLSLKT", ten: "Hệ thống thu, xử lý số liệu khí tượng (XLSL KT)", pl: "N2", lv: "khi-tuong" },

  { ma: "PWR", ten: "Cấp nguồn UPS / AC-DC / Máy phát / Điều hòa TT / PMS / BMS", pl: "N2", lv: "me" },

  { ma: "SIM", ten: "Hệ thống huấn luyện giả định cho KSVKL (SIM)", pl: "N2", lv: "khac" },
  { ma: "CLK", ten: "Hệ thống đồng hồ thời gian chuẩn", pl: "N2", lv: "khac" },
  { ma: "REC", ten: "Tài sản ghi âm, dữ liệu", pl: "N2", lv: "khac" },
  { ma: "CYBER", ten: "Hệ thống giám sát an ninh mạng tập trung", pl: "N2", lv: "khac" },
  { ma: "PCDHB", ten: "Hệ thống Quản lý số liệu Điều hành bay (QLSL ĐHB)", pl: "N2", lv: "khac" },

  // ---------------------- Nhóm 3 — Hỗ trợ ----------------------
  { ma: "LIFT", ten: "Hệ thống thang máy", pl: "N3", lv: "ho-tro" },
  { ma: "PCCC", ten: "Tài sản phòng cháy và chữa cháy (PCCC)", pl: "N3", lv: "ho-tro" },
  { ma: "LIGHTNING", ten: "Tài sản chống sét đánh thẳng; cắt lọc sét đường nguồn", pl: "N3", lv: "ho-tro" },
  { ma: "CAM", ten: "Tài sản camera giám sát", pl: "N3", lv: "ho-tro" },
  { ma: "ACCESS", ten: "Tài sản cổng, cửa từ, soi chiếu", pl: "N3", lv: "ho-tro" },
  { ma: "IDS", ten: "Hệ thống phòng chống xâm nhập", pl: "N3", lv: "ho-tro" },
  { ma: "LOCALAC", ten: "Điều hòa cục bộ đảm bảo môi trường tài sản BĐHĐB", pl: "N3", lv: "ho-tro" },
  { ma: "UPS3", ten: "Cấp nguồn không gián đoạn (UPS) cho hệ thống Nhóm 3", pl: "N3", lv: "ho-tro" },
  { ma: "OFF", ten: "Tài sản văn phòng", pl: "N3", lv: "ho-tro" },
];

// Ánh xạ mã nhóm hệ thống hiện có trong CSDL → mã hệ thống trong danh mục.
// Đa số trùng mã; chỉ vài mã cần chuẩn hóa.
const NHOM_ALIAS: Record<string, string> = {
  BDMT: "PBX",
};

export const CATALOG_BY_MA = new Map(HE_THONG_CATALOG.map((h) => [h.ma, h]));
export const PHAN_LOAI_BY_ID = new Map(PHAN_LOAI.map((p) => [p.id, p]));
export const LINH_VUC_BY_ID = new Map(LINH_VUC.map((l) => [l.id, l]));

// Mã hệ thống dành cho tài sản chưa xác định phân loại.
export const HT_KHAC = "__khac__";

/** Chuẩn hóa mã nhóm hệ thống của tài sản về mã hệ thống trong danh mục. */
export function normalizeHtMa(nhomCode: string | null | undefined): string {
  const c = (nhomCode ?? "").trim();
  if (!c) return HT_KHAC;
  const alias = NHOM_ALIAS[c] ?? c;
  return CATALOG_BY_MA.has(alias) ? alias : HT_KHAC;
}

/** Trả về phân loại + lĩnh vực + hệ thống cho 1 mã nhóm hệ thống. */
export function classify(nhomCode: string | null | undefined): {
  ht: string;
  pl: PhanLoaiId;
  lv: LinhVucId;
} {
  const ht = normalizeHtMa(nhomCode);
  const cat = CATALOG_BY_MA.get(ht);
  if (!cat) return { ht: HT_KHAC, pl: "N3", lv: "ho-tro" };
  return { ht, pl: cat.pl, lv: cat.lv };
}

/* ------------------------- Tầng "Nhóm hệ thống" ------------------------- */
// Nhóm hệ thống gom các hệ thống theo cặp (Lĩnh vực + Phân loại).
// Mỗi cặp (phân loại, lĩnh vực) tương ứng đúng một nhóm hệ thống.

export const PHAN_LOAI_SHORT: Record<PhanLoaiId, string> = {
  N1: "Nhóm 1",
  N2: "Nhóm 2",
  N3: "Nhóm 3",
};

/** Tên lĩnh vực rút gọn (bỏ tiền tố "Lĩnh vực "). */
export function lvShort(lvId: LinhVucId): string {
  return (LINH_VUC_BY_ID.get(lvId)?.ten ?? lvId).replace(/^Lĩnh vực\s*/i, "");
}

/** Mã định danh của một Nhóm hệ thống (dùng làm khoá override & focus). */
export function nhMa(plId: PhanLoaiId, lvId: LinhVucId): string {
  return `${plId}__${lvId}`;
}

/** Tách mã nhóm hệ thống về (phân loại, lĩnh vực). */
export function parseNhMa(ma: string): { plId: PhanLoaiId; lvId: LinhVucId } | null {
  const [pl, lv] = ma.split("__");
  if (!pl || !lv) return null;
  if (!PHAN_LOAI_BY_ID.has(pl as PhanLoaiId)) return null;
  if (!LINH_VUC_BY_ID.has(lv as LinhVucId)) return null;
  return { plId: pl as PhanLoaiId, lvId: lv as LinhVucId };
}

/** Tên mặc định của một Nhóm hệ thống: "Lĩnh vực · Phân loại". */
export function nhTenMacDinh(plId: PhanLoaiId, lvId: LinhVucId): string {
  return `${lvShort(lvId)} · ${PHAN_LOAI_SHORT[plId]}`;
}

/* --------------------------- Tầng "Hệ thống" --------------------------- */
// Hệ thống cụ thể = trường "he_thong" của tài sản, nằm trong một Nhóm hệ thống.
// Mã định danh: "<mã danh mục>::<tên hệ thống>" để làm khoá override & focus.

const HT_SEP = "::";

/** Tạo mã hệ thống cụ thể từ mã danh mục (nhóm hệ thống) + tên hệ thống. */
export function htSysMa(catMa: string, sysName: string): string {
  return `${catMa}${HT_SEP}${sysName}`;
}

/** Tách mã hệ thống cụ thể về (mã danh mục, tên hệ thống). */
export function parseHtSysMa(ma: string): { catMa: string; sysName: string } {
  const i = ma.indexOf(HT_SEP);
  if (i < 0) return { catMa: "", sysName: ma };
  return { catMa: ma.slice(0, i), sysName: ma.slice(i + HT_SEP.length) };
}

/** Nhãn loại giấy phép khai thác theo phân loại hệ thống. */
export function giayPhepLabel(plId: PhanLoaiId | undefined): string {
  if (plId === "N2") return "Quyết định khai thác";
  if (plId === "N3") return "";
  return "Giấy phép khai thác";
}
