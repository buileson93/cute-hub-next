// ============================================================================
// Tầng-1 parser: bóc tách GPKT (Cục HKVN) từ text đã trích xuất bằng regex.
// GPKT có cấu trúc rất ổn định (10 mục trong Điều 1 + Điều 3 chốt hiệu lực),
// nên parser này xử lý được >90% trường hợp mà không cần gọi AI.
// ============================================================================
import type { GpktParsedFields } from "./gpkt-import.functions";

export type FieldSource = "regex" | "ai" | "manual" | "empty";
export interface FieldMeta { source: FieldSource; needsCheck: boolean; reason?: string }
export type FieldMetaMap = Record<keyof GpktParsedFields, FieldMeta>;

const EMPTY: GpktParsedFields = {
  gp_so: "", gp_ngay: "", gp_han: "", gp_cu: "",
  ten_he_thong_theo_gp: "", nam_sx_gp: "", kieu_thiet_bi: "",
  so_san_xuat: "", noi_san_xuat: "", muc_dich: "", pham_vi: "",
  ma_dia_chi: "", dia_diem: "", thoi_gian: "", thanh_phan_theo_gp: "",
  don_vi: "", tram: "",
};

function normalize(s: string): string {
  return s
    .replace(/\r/g, "")
    // gộp khoảng trắng
    .replace(/[ \t]+/g, " ")
    // hợp nhất các dòng bị ngắt vụn (tiếng Việt ít khi có dòng < 3 ký tự)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n");
}

function pad2(n: string): string { return n.length === 1 ? "0" + n : n; }
function toIso(d: string, m: string, y: string): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

const MONTHS_VN = /ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i;
const DATE_SLASH = /(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/;

function stripLeadingNum(s: string): string {
  return s.replace(/^\s*\d+\.\s*/, "").trim();
}

// tìm value cho một item số (1..10) trong Điều 1
function itemValue(text: string, n: number): string {
  // match từ "N. " tới "N+1. " (hoặc "Điều 2")
  const re = new RegExp(
    `(?:^|\\n)\\s*${n}\\.\\s*([\\s\\S]*?)(?=\\n\\s*${n + 1}\\.\\s|\\n\\s*Điều\\s*2\\.)`,
    "m",
  );
  const m = text.match(re);
  if (!m) return "";
  return m[1]
    .split("\n").map((l) => l.trim()).filter(Boolean).join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// Cắt tiền tố kiểu "Tên thiết bị:" ra khỏi giá trị
function afterColon(s: string, ...prefixes: string[]): string {
  for (const p of prefixes) {
    const re = new RegExp(`^\\s*${p}\\s*[:：]\\s*`, "i");
    if (re.test(s)) return s.replace(re, "").trim();
  }
  // fallback: nếu có dấu ':' thì lấy phần sau
  const i = s.indexOf(":");
  if (i > 0 && i < 40) return s.slice(i + 1).trim();
  return s.trim();
}

const UNIT_TOKEN = /^(?:km|m|cm|mm|dm|Hz|kHz|MHz|GHz|dB|dBm|W|kW|mW|V|kV|mV|A|mA|µV|uV|h|s|ms|Đ|B|N|E|W)\.?$/i;

// Loại bỏ "rác" watermark ở cuối câu (chỉ tokens ASCII ngắn, giữ nguyên
// từ tiếng Việt có dấu và các đơn vị hợp lệ như km, Đ, B).
function cleanTail(s: string): string {
  if (!s) return s;
  let v = s.trim().replace(/[–\-]\s*$/, "").trim();
  for (let i = 0; i < 6; i++) {
    const m = v.match(/^(.*?[A-Za-zÀ-ỹ0-9\)])[\s.,;:\-]+([A-Za-z]\.?[A-Za-z]?|[A-Za-z]{1,2}\.?)\s*$/);
    if (!m) break;
    if (UNIT_TOKEN.test(m[2])) break; // đơn vị vật lý — giữ nguyên
    v = m[1].trim();
  }
  return v.replace(/[\s,;:]+$/, "").trim();
}

// Bản đồ trạm/địa danh → mã đơn vị quản lý (khớp app_role/enum don_vi_code).
const PLACE_TO_DONVI: Array<[RegExp, string]> = [
  [/\bCLA\b|Chu\s*Lai/i, "CLA"],
  [/\bCRA\b|Cam\s*Ranh/i, "CRA"],
  [/\bTHO\b|Thọ\s*Xuân|Tho\s*Xuan/i, "THO"],
  [/\bPCA\b|Phù\s*Cát|Phu\s*Cat/i, "PCA"],
  [/\bPBA\b|Pleiku/i, "PBA"],
  [/\bPLK\b|Plây\s*Ku/i, "PLK"],
];

function detectDonVi(...blobs: string[]): string {
  const hay = blobs.filter(Boolean).join(" ");
  for (const [re, code] of PLACE_TO_DONVI) if (re.test(hay)) return code;
  return "";
}

export interface RegexParseResult {
  fields: GpktParsedFields;
  filledCount: number;
  totalCount: number;
  perField: FieldMetaMap;
}

const REQUIRED: Array<keyof GpktParsedFields> = [
  "gp_so", "gp_ngay", "gp_han", "ten_he_thong_theo_gp",
  "muc_dich", "pham_vi", "kieu_thiet_bi", "dia_diem", "don_vi",
];

/**
 * Xác thực từng trường sau khi bóc tách: đánh dấu `needsCheck` để UI
 * highlight và kèm lý do gợi ý người dùng sửa. Dùng chung cho cả kết
 * quả regex lẫn AI.
 */
export function validateFields(f: GpktParsedFields, defaultSource: FieldSource = "regex"): FieldMetaMap {
  const meta = {} as FieldMetaMap;
  const empty = (k: keyof GpktParsedFields) => {
    meta[k] = {
      source: "empty",
      needsCheck: REQUIRED.includes(k),
      reason: REQUIRED.includes(k) ? "Trường bắt buộc" : undefined,
    };
  };
  const ok = (k: keyof GpktParsedFields) => { meta[k] = { source: defaultSource, needsCheck: false }; };
  const warn = (k: keyof GpktParsedFields, reason: string) => {
    meta[k] = { source: defaultSource, needsCheck: true, reason };
  };

  // gp_so — dạng NNN/GP-CHK
  if (!f.gp_so) empty("gp_so");
  else if (!/^\d{1,6}\s*\/\s*GP-?CHK$/i.test(f.gp_so)) warn("gp_so", "Không đúng mẫu NNN/GP-CHK");
  else ok("gp_so");

  // gp_ngay — ISO
  if (!f.gp_ngay) empty("gp_ngay");
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(f.gp_ngay)) warn("gp_ngay", "Ngày cấp không đúng dạng ISO");
  else ok("gp_ngay");

  // gp_han — ISO và sau ngày cấp
  if (!f.gp_han) empty("gp_han");
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(f.gp_han)) warn("gp_han", "Ngày hết hạn không đúng dạng ISO");
  else if (f.gp_ngay && /^\d{4}-\d{2}-\d{2}$/.test(f.gp_ngay) && f.gp_han <= f.gp_ngay) {
    warn("gp_han", "Ngày hết hạn phải sau ngày cấp");
  } else ok("gp_han");

  // gp_cu — tùy chọn
  if (!f.gp_cu) empty("gp_cu");
  else if (!/GP-?CHK/i.test(f.gp_cu)) warn("gp_cu", "Không đúng mẫu số GP cũ");
  else ok("gp_cu");

  // don_vi — enum
  if (!f.don_vi) empty("don_vi");
  else if (!/^(CLA|CRA|THO|PCA|PBA|PLK)$/.test(f.don_vi)) warn("don_vi", "Mã đơn vị không thuộc danh mục chuẩn");
  else ok("don_vi");

  // nam_sx_gp — phải có năm 4 chữ số
  if (!f.nam_sx_gp) empty("nam_sx_gp");
  else if (!/\b(19|20)\d{2}\b/.test(f.nam_sx_gp)) warn("nam_sx_gp", "Không nhận diện được năm 4 chữ số");
  else ok("nam_sx_gp");

  // các trường mô tả — cảnh báo nếu quá ngắn
  const desc: Array<keyof GpktParsedFields> = [
    "ten_he_thong_theo_gp", "muc_dich", "pham_vi", "kieu_thiet_bi", "dia_diem",
  ];
  desc.forEach((k) => {
    const v = f[k];
    if (!v) empty(k);
    else if (v.length < 4) warn(k, "Giá trị quá ngắn — có thể bóc tách chưa đủ");
    else ok(k);
  });

  // còn lại — không kiểm tra, chỉ đánh dấu empty/regex
  const rest: Array<keyof GpktParsedFields> = [
    "so_san_xuat", "noi_san_xuat", "ma_dia_chi", "thoi_gian", "thanh_phan_theo_gp", "tram",
  ];
  rest.forEach((k) => { if (!f[k]) empty(k); else ok(k); });

  return meta;
}

export function parseGpktText(raw: string): RegexParseResult {
  const out: GpktParsedFields = { ...EMPTY };
  const text = normalize(raw);
  if (!text) return { fields: out, filledCount: 0, totalCount: 17 };

  // --- gp_so ---
  const soM = text.match(/Số\s*:?\s*(\d{1,6})\s*\/\s*GP-?CHK/i);
  if (soM) out.gp_so = `${soM[1]}/GP-CHK`;

  // --- gp_ngay (ngày cấp = ngày ban hành ở header "Hà Nội, ngày ...") ---
  // Tìm ngày ban hành sau chuỗi "Hà Nội,"
  const banHanhM = text.match(/(?:Hà\s*Nội|TP\.?\s*Hà\s*Nội)[^\n]*?ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i);
  if (banHanhM) out.gp_ngay = toIso(banHanhM[1], banHanhM[2], banHanhM[3]);

  // --- gp_han: ưu tiên "Có giá trị đến ngày ..." ---
  const hanM =
    text.match(/Có giá trị đến\s*ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i) ||
    text.match(/hiệu\s*lực[^\n]*?đến\s*ngày\s*(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/i);
  if (hanM) out.gp_han = toIso(hanM[1], hanM[2], hanM[3]);

  // --- Điều 3: ngày hiệu lực + gp_cu ---
  const dieu3 = text.match(/Điều\s*3\.[\s\S]*?(?=Nơi nhận|KT\.|CỤC TRƯỞNG|$)/i)?.[0] ?? "";
  if (dieu3) {
    // "từ ngày DD/MM/YYYY đến ngày DD/MM/YYYY"
    const eff = dieu3.match(/từ\s*ngày\s*(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})[\s\S]*?đến\s*ngày\s*(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/i);
    if (eff) {
      if (!out.gp_ngay) out.gp_ngay = toIso(eff[1], eff[2], eff[3]);
      if (!out.gp_han) out.gp_han = toIso(eff[4], eff[5], eff[6]);
    }
    const cu = dieu3.match(/bãi\s*bỏ[\s\S]*?Giấy\s*phép\s*số\s*(\d{1,6}\s*\/\s*GP-?CHK)/i);
    if (cu) out.gp_cu = cu[1].replace(/\s+/g, "");
  }

  // --- Điều 1 items ---
  const t1 = itemValue(text, 1);
  if (t1) {
    out.ten_he_thong_theo_gp = cleanTail(afterColon(t1, "Tên thiết bị", "Tên hệ thống", "Tên hệ thống, thiết bị"));
  }
  const t2 = itemValue(text, 2);
  if (t2) out.muc_dich = cleanTail(afterColon(t2, "Mục đích sử dụng", "Mục đích"));
  const t3 = itemValue(text, 3);
  if (t3) out.pham_vi = cleanTail(afterColon(t3, "Phạm vi hoạt động", "Phạm vi"));
  const t4 = itemValue(text, 4);
  if (t4) out.kieu_thiet_bi = cleanTail(afterColon(t4, "Kiểu thiết bị", "Kiểu"));
  const t5 = itemValue(text, 5);
  if (t5) out.so_san_xuat = cleanTail(afterColon(t5, "Số sản xuất", "Số hiệu"));
  const t6 = itemValue(text, 6);
  if (t6) {
    // "Nơi sản xuất: ... . Năm sản xuất: ..."
    const noi = t6.match(/Nơi\s*sản\s*xuất\s*[:：]\s*([^.]*?)(?:\.\s*Năm|$)/i);
    if (noi) out.noi_san_xuat = cleanTail(noi[1]);
    const nam = t6.match(/Năm\s*sản\s*xuất\s*[:：]\s*([0-9,\s\-–]+)/i);
    if (nam) out.nam_sx_gp = nam[1].trim().replace(/[.,;]+$/, "");
    if (!out.noi_san_xuat && !out.nam_sx_gp) out.noi_san_xuat = cleanTail(afterColon(t6, "Nơi sản xuất"));
  }
  const t8 = itemValue(text, 8);
  if (t8) {
    const v = afterColon(t8, "Mã số, địa chỉ kỹ thuật", "Mã số", "Địa chỉ kỹ thuật", "Mã địa chỉ");
    out.ma_dia_chi = /^không$/i.test(v) ? "Không" : v;
  }
  const t9 = itemValue(text, 9);
  if (t9) out.dia_diem = cleanTail(afterColon(t9, "Địa điểm đặt thiết bị", "Địa điểm"));
  const t10 = itemValue(text, 10);
  if (t10) out.thoi_gian = cleanTail(afterColon(t10, "Thời gian hoạt động", "Thời gian"));

  // --- don_vi: mã đơn vị suy từ dia_diem / muc_dich / tên hệ thống ---
  out.don_vi = detectDonVi(out.dia_diem, out.muc_dich, out.ten_he_thong_theo_gp);

  // --- tram: cụm "Đài KSKL X - Cảng HK X" hoặc "Trạm X" ---
  if (out.dia_diem) {
    const tr = out.dia_diem.match(/Đài\s+[A-Za-zÀ-ỹ ]+?\s+([A-Za-zÀ-ỹ .]+?)(?:\s*-|;|\.|$)/i);
    if (tr) out.tram = tr[1].trim();
  }

  // Đếm số trường đã lấp
  const filledCount = (Object.keys(EMPTY) as Array<keyof GpktParsedFields>)
    .reduce((n, k) => n + (out[k] ? 1 : 0), 0);

  return { fields: out, filledCount, totalCount: 17, perField: validateFields(out, "regex") };
}
