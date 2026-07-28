/**
 * Deterministic parser cho báo cáo sự cố kỹ thuật (7 mục).
 * Ưu tiên chạy trước AI: đa số báo cáo TTBDKT tuân theo cấu trúc:
 *   1. Đơn vị báo cáo   2. Hệ thống/thiết bị/đường truyền
 *   3. Mô tả sự cố      4. Nguyên nhân
 *   5. Thiết bị thay thế 6. Xử lý
 *   7. Đánh giá ảnh hưởng (+ 8. Đề xuất)
 *
 * Trả về `ParsedIncident` (tương thích schema AI hiện tại) kèm confidence.
 * Confidence < 0.7 → caller nên gọi AI để bổ sung.
 */

export interface ParsedIncident {
  hien_tuong: string;
  he_thong_goi_y: string;
  thiet_bi_goi_y: string[];
  tom_tat: string;
  thoi_gian_bat_dau: string; // YYYY-MM-DDTHH:mm hoặc ""
  dia_diem: string;
  anh_huong_dhb: string;
  nguyen_nhan: string;
  bien_phap_xu_ly: string;
  tinh_hinh_hien_tai: string;
  ket_qua_khac_phuc: string;
  phan_loai: string;
}

export interface RuleParseResult {
  parsed: ParsedIncident;
  confidence: number; // 0..1
  matched_sections: number; // 0..7
  notes: string[];
}

const EMPTY: ParsedIncident = {
  hien_tuong: "",
  he_thong_goi_y: "",
  thiet_bi_goi_y: [],
  tom_tat: "",
  thoi_gian_bat_dau: "",
  dia_diem: "",
  anh_huong_dhb: "Không ảnh hưởng",
  nguyen_nhan: "",
  bien_phap_xu_ly: "",
  tinh_hinh_hien_tai: "",
  ket_qua_khac_phuc: "",
  phan_loai: "E",
};

/** Vai trò của một mục (routing theo header keyword). */
type SectionRole =
  | "don_vi" | "he_thong" | "mo_ta" | "nguyen_nhan"
  | "thay_the" | "xu_ly" | "danh_gia" | "de_xuat" | "unknown";

interface Section { raw: string; body: string; role: SectionRole; header: string; num: number }

/** Bỏ prefix header đầu content: "Mô tả sự cố: ...". */
function stripHeader(s: string): { header: string; body: string } {
  const m = s.match(/^\s*([^:\n]{2,80}?)\s*:\s*/);
  if (!m) return { header: "", body: s.trim() };
  return { header: m[1].trim(), body: s.slice(m[0].length).trim() };
}

/** Suy vai trò từ header text (không lệ thuộc số thứ tự). */
function classifyRole(header: string, body: string): SectionRole {
  const s = (header + " " + body).toLowerCase();
  if (/nguy[êe]n\s*nh[âa]n/.test(header.toLowerCase())) return "nguyen_nhan";
  if (/x[ửu]\s*l[ýy]/.test(header.toLowerCase())) return "xu_ly";
  if (/thay\s*th[ếe]|d[ựu]\s*ph[òo]ng|đ[ườu]ng\s*truy[ềe]n\s*thay/.test(header.toLowerCase())) return "thay_the";
  if (/đánh\s*giá|danh gia|ảnh\s*hưởng|anh huong/.test(header.toLowerCase())) return "danh_gia";
  if (/đề\s*xuất|de xuat|kiến\s*nghị/.test(header.toLowerCase())) return "de_xuat";
  if (/mô\s*t[ảa]|mo ta|di[ễe]n\s*bi[ếe]n|s[ựu]\s*c[ốo]/.test(header.toLowerCase())) return "mo_ta";
  if (/h[ệe]\s*th[ốo]ng|thi[ếe]t\s*b[ịi]|đ[ườu]ng\s*truy[ềe]n/.test(header.toLowerCase())) return "he_thong";
  if (/b[áa]o\s*c[áa]o|ttbdkt|trung\s*t[âa]m/.test(header.toLowerCase())) return "don_vi";
  // fallback theo body
  if (/\b(reset|thay|khắc phục|kiểm tra|sửa chữa)\b/i.test(s) && /\b(ca trực|đã|tiến hành)\b/i.test(s)) return "xu_ly";
  return "unknown";
}

/** Tách các mục "1. ...", "2. ..." rồi phân vai trò theo header. */
function splitSections(text: string): Section[] {
  const normalized = text.replace(/\r\n?/g, "\n");
  const out: Section[] = [];
  const re = /^\s*(\d{1,2})[\.\)]\s*([\s\S]*?)(?=^\s*\d{1,2}[\.\)]\s|\Z)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized)) !== null) {
    const num = Number.parseInt(m[1], 10);
    const raw = m[2].trim();
    const { header, body } = stripHeader(raw);
    const role = classifyRole(header, body);
    out.push({ raw, body, role, header, num });
  }
  return out;
}

function pick(sections: Section[], role: SectionRole): string {
  return sections.find((s) => s.role === role)?.body ?? "";
}

/**
 * Trích cặp thời gian "02h45 đến 09h00 ngày 16/07/2026" hoặc "04h00-04:05 UTC ngày 21/07/2026".
 * Trả ISO local (không kèm timezone offset — form hiện tại lưu naive).
 */
function extractStartTime(desc: string): string {
  if (!desc) return "";
  // Ngày dd/mm/yyyy hoặc dd-mm-yyyy
  const dm = desc.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (!dm) return "";
  const dd = dm[1].padStart(2, "0");
  const mm = dm[2].padStart(2, "0");
  const yyyy = dm[3];
  // Giờ bắt đầu: "02h45", "04h00", "04:05"
  const tm = desc.match(/(\d{1,2})\s*[h:]\s*(\d{2})/);
  const HH = tm ? tm[1].padStart(2, "0") : "00";
  const MI = tm ? tm[2] : "00";
  return `${yyyy}-${mm}-${dd}T${HH}:${MI}`;
}

/** Trạng thái điều hành bay → enum form. */
function classifyImpact(anhHuong: string): string {
  const s = anhHuong.toLowerCase();
  if (/(không|khong)\s+ảnh\s+hưởng|khong anh huong/.test(s)) return "Không ảnh hưởng";
  if (/gián\s+đoạn|gian doan|dừng\s+điều\s+hành|ngưng ĐHB/i.test(s)) return "Có gián đoạn ĐHB";
  if (/ảnh\s+hưởng|anh huong/.test(s)) return "Ảnh hưởng một phần";
  return "Không ảnh hưởng";
}

/** Suy phân loại A..E từ mức độ ảnh hưởng + từ khoá. */
function classifyLevel(desc: string, impact: string): string {
  const s = (desc + " " + impact).toLowerCase();
  if (/mất\s+an\s+toàn|nghi[êe]m\s+trọng|tai n[ạa]n/.test(s)) return "A";
  if (impact === "Có gián đoạn ĐHB") return "B";
  if (impact === "Ảnh hưởng một phần") return "C";
  if (/dự phòng|du phong|standby/i.test(s)) return "D";
  return "E";
}

/** Tách "hiện tượng" ngắn 1 dòng từ mục 3 (bỏ mốc thời gian). */
function shortSymptom(desc: string, systemHint: string): string {
  if (!desc) return systemHint ? `Sự cố ${systemHint}` : "";
  // Bỏ đoạn thời gian dài kiểu "Từ 02h45 đến 09h00 ngày dd/mm/yyyy"
  let s = desc.replace(/(Từ|Lúc|từ|lúc)\s+\d{1,2}[h:]\d{0,2}[^\n\.]{0,80}?ngày\s+\d{1,2}[\/-]\d{1,2}[\/-]\d{4}[\.:]?\s*/g, "");
  // Lấy câu đầu — chỉ ngắt tại "chấm + khoảng trắng" (tránh cắt "120.45MHz").
  s = s.split(/(?:\.\s|\n)/)[0].trim();
  s = s.replace(/\.$/, "").trim();
  if (s.length > 140) s = s.slice(0, 140) + "…";
  return s || (systemHint ? `Sự cố ${systemHint}` : "");
}

/**
 * Parser chính. An toàn với input mọi định dạng — không throw.
 */
export function parseIncidentByRules(input: string): RuleParseResult {
  const notes: string[] = [];
  const parsed: ParsedIncident = { ...EMPTY };
  const text = (input ?? "").trim();
  if (!text) return { parsed, confidence: 0, matched_sections: 0, notes: ["Rỗng"] };

  const sections = splitSections(text);
  const matched = sections.length;

  const systemHint = pick(sections, "he_thong").split("\n")[0].trim();
  const desc3 = pick(sections, "mo_ta");
  const cause4 = pick(sections, "nguyen_nhan");
  const backup5 = pick(sections, "thay_the");
  const handle6 = pick(sections, "xu_ly");
  const impact7 = pick(sections, "danh_gia");
  const propose8 = pick(sections, "de_xuat");

  parsed.he_thong_goi_y = systemHint;
  parsed.thiet_bi_goi_y = systemHint ? [systemHint] : [];
  parsed.tom_tat = desc3;
  parsed.thoi_gian_bat_dau = extractStartTime(desc3);
  parsed.nguyen_nhan = cause4 || extractCauseInline(desc3);
  parsed.bien_phap_xu_ly = handle6;
  parsed.tinh_hinh_hien_tai = backup5;
  parsed.ket_qua_khac_phuc = [impact7, propose8].filter(Boolean).join("\n\n").trim();
  parsed.anh_huong_dhb = classifyImpact(impact7);
  parsed.phan_loai = classifyLevel(desc3, parsed.anh_huong_dhb);
  parsed.hien_tuong = shortSymptom(desc3, systemHint);
  parsed.dia_diem = extractLocation(systemHint + " " + desc3);

  // Confidence: đếm số role trọng yếu match (không tính số mục thô).
  const critical: SectionRole[] = ["he_thong", "mo_ta", "xu_ly", "danh_gia"];
  const criticalHit = critical.filter((r) => sections.some((s) => s.role === r)).length;
  let conf = 0.4 + 0.15 * criticalHit; // 4/4 = 1.0
  if (!desc3) conf -= 0.3;
  if (!parsed.thoi_gian_bat_dau) { conf -= 0.15; notes.push("Không suy được thời gian bắt đầu"); }
  if (!systemHint) { conf -= 0.2; notes.push("Không xác định được hệ thống"); }
  if (!handle6 && !propose8) notes.push("Chưa có biện pháp xử lý");
  conf = Math.max(0, Math.min(1, conf));

  return { parsed, confidence: conf, matched_sections: matched, notes };
}

/** Nếu nguyên nhân viết chèn trong mục 3 kiểu "Nguyên nhân: ...". */
function extractCauseInline(desc: string): string {
  const m = desc.match(/Nguy[êe]n\s+nh[âa]n\s*:?\s*([^\n]+)/i);
  return m ? m[1].trim() : "";
}

/** Trích địa điểm nhanh (APP/TWR/ACC/trạm XX). */
function extractLocation(s: string): string {
  const hits: string[] = [];
  const re = /\b(APP|TWR|ACC|CNS|trạm\s+\d+|station\s+\d+)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) hits.push(m[1]);
  return Array.from(new Set(hits)).join(", ");
}