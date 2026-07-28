// Parser deterministic cho báo cáo tuần sự cố kỹ thuật (mẫu TTBDKT / Đài KSKL).
// Đầu vào: DOCX (ArrayBuffer) hoặc plain text đã paste.
// Đầu ra: header đơn vị/khoảng tuần + N sự cố (Bảng 1) + M hỏng-tồn (Bảng 2).
//
// Không gọi AI. Dùng lại `parseIncidentByRules` cho phần suy luận mức độ khi cần.

import mammoth from "mammoth";

export interface WeeklyReportHeader {
  don_vi: string;      // "TRUNG TÂM BẢO ĐẢM KỸ THUẬT" / "ĐÀI KSKL PHÚ BÀI"
  so_van_ban: string;  // "30/BC-BĐKT"
  ngay_ky: string;     // "22/7/2026"
  tuan_tu_ngay: string; // "16/07/2026"
  tuan_den_ngay: string; // "22/07/2026"
  tieu_de: string;     // "BÁO CÁO TUẦN 30"
}

export interface WeeklyIncidentRow {
  stt: string;
  thiet_bi: string;       // "VHF 120.45MHz DAN"
  vi_tri: string;         // "Đội Thông tin"
  sl_hong: string;        // "01"
  thoi_diem_raw: string;  // "Từ 02:45 đến 09:00 Ngày 16/07/2026"
  tinh_trang: string;     // Máy thu VHF … báo mất nguồn AC…
  vat_tu: string;         // Thay máy dự phòng…
  ghi_chu: string;        // BBKT số 172…
  he_thong_hint: string;  // "Hệ thống VHF" (từ header nhóm)
  nhom: string;           // "I" | "II" | "III"
  // Suy luận sau parse
  thoi_gian_bat_dau: string; // ISO YYYY-MM-DDTHH:mm hoặc ""
  thoi_gian_ket_thuc: string;
  phan_loai: string; // A..E
  anh_huong_dhb: string;
  confidence: number; // 0..1 — thấp → nên rà lại
}

export interface WeeklyHongHocRow {
  stt: string;
  thiet_bi: string;       // "Máy thu VHF R&S EU4200 (S/N: 105806)"
  don_vi_ql: string;      // "Đội Thông tin"
  tinh_trang: string;     // "Hỏng nguồn AC"
  ngay_hong_raw: string;  // "02:45 ngày 16/07/2026"
  don_vi_sc: string;
  ngay_chuyen_sc: string;
  ghi_chu: string;
  ngay_hong_iso: string;  // "" nếu không suy được
}

export interface WeeklyReportParsed {
  header: WeeklyReportHeader;
  incidents: WeeklyIncidentRow[];
  hong_hoc: WeeklyHongHocRow[];
  raw_tables: string[][][]; // debug — mọi bảng đọc được
}

/** Mở file DOCX -> HTML (giữ nguyên bảng) rồi trả DOM. */
async function docxToTables(buf: ArrayBuffer): Promise<string[][][]> {
  const res = await mammoth.convertToHtml({ arrayBuffer: buf });
  const doc = new DOMParser().parseFromString(`<div>${res.value}</div>`, "text/html");
  const tables: string[][][] = [];
  for (const tbl of Array.from(doc.querySelectorAll("table"))) {
    const rows: string[][] = [];
    for (const tr of Array.from(tbl.querySelectorAll("tr"))) {
      const cells = Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent ?? "").replace(/\s+/g, " ").trim());
      rows.push(cells);
    }
    if (rows.length) tables.push(rows);
  }
  return tables;
}

/** Đọc header văn bản (đơn vị, số, tuần). */
function parseHeader(fullText: string): WeeklyReportHeader {
  const t = fullText.replace(/\r\n?/g, "\n");
  const dv = t.match(/(TRUNG T[ÂA]M[^\n]{0,80}|Đ[ÀA]I\s+K[SI][ĐD]?K[LI][^\n]{0,80}|ĐỘI[^\n]{0,60})/i);
  const so = t.match(/S[ốo]:\s*([^\n]+)/i);
  const ngayKy = t.match(/ng[àa]y\s+(\d{1,2})\s+th[áa]ng\s+(\d{1,2})\s+n[ăa]m\s+(\d{4})/i);
  const tuan = t.match(/T[ừu]\s+ng[àa]y\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})[^\d]{1,10}(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
  const td = t.match(/B[ÁA]O\s+C[ÁA]O\s+TU[ẦA]N[^\n]{0,40}/i);
  return {
    don_vi: (dv?.[1] || "").trim(),
    so_van_ban: (so?.[1] || "").trim().replace(/\s+/g, " "),
    ngay_ky: ngayKy ? `${ngayKy[1]}/${ngayKy[2]}/${ngayKy[3]}` : "",
    tuan_tu_ngay: tuan?.[1] || "",
    tuan_den_ngay: tuan?.[2] || "",
    tieu_de: (td?.[0] || "BÁO CÁO TUẦN").trim(),
  };
}

/** Trả về ISO local `YYYY-MM-DDTHH:mm` (mốc bắt đầu) hoặc "". */
export function extractStartTime(raw: string): string {
  if (!raw) return "";
  const s = raw.replace(/\s+/g, " ").trim();
  const d = s.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (!d) return "";
  const dd = d[1].padStart(2, "0");
  const mm = d[2].padStart(2, "0");
  const yyyy = d[3];
  const t = s.match(/(\d{1,2})\s*[h:]\s*(\d{2})/);
  const HH = t ? t[1].padStart(2, "0") : "00";
  const MI = t ? t[2] : "00";
  return `${yyyy}-${mm}-${dd}T${HH}:${MI}`;
}

/** Trả về ISO của giờ kết thúc nếu có "đến HH:mm" trong cùng chuỗi. */
export function extractEndTime(raw: string): string {
  if (!raw) return "";
  const s = raw.replace(/\s+/g, " ").trim();
  // "02:45 đến 09:00 Ngày 16/07/2026" — lấy giờ thứ 2
  const m = s.match(/đ[ếe]n\s+(\d{1,2})\s*[h:]\s*(\d{2})/i);
  if (!m) return "";
  const startIso = extractStartTime(raw);
  if (!startIso) return "";
  const HH = m[1].padStart(2, "0");
  const MI = m[2];
  return `${startIso.slice(0, 10)}T${HH}:${MI}`;
}

function classifyImpact(txt: string): string {
  const s = txt.toLowerCase();
  if (/gi[áa]n\s*đo[ạa]n|d[ừu]ng\s*đi[ềe]u\s*h[àa]nh|ng[ưu]ng\s*[đd]hb/.test(s)) return "Có gián đoạn ĐHB";
  if (/kh[ôo]ng\s*[ảa]nh\s*h[ưu][ơở]ng|v[ẫâ]n\s*ho[ạa]t\s*đ[ộo]ng\s*b[ìi]nh\s*th[ưu][ơờ]ng/.test(s)) return "Không ảnh hưởng";
  if (/[ảa]nh\s*h[ưu][ởo]ng/.test(s)) return "Ảnh hưởng một phần";
  return "Không ảnh hưởng";
}

function classifyLevel(txt: string, impact: string): string {
  const s = txt.toLowerCase();
  if (/m[ấâ]t\s*an\s*to[àa]n|tai\s*n[ạa]n|nghi[êe]m\s*tr[ọo]ng/.test(s)) return "A";
  if (impact === "Có gián đoạn ĐHB") return "B";
  if (impact === "Ảnh hưởng một phần") return "C";
  if (/d[ựu]\s*ph[òo]ng|standby|reset/.test(s)) return "D";
  return "E";
}

// Header nhóm trong Bảng 1 (không phải row data)
const GROUP_RE = /^(H[ệe]?)\s*th[ốo]ng\s+/i;
const NHOM_RE = /^(I{1,3})\.?\s*Thi[ếe]t\s*b[ịi]\s*nh[óo]m/i;

/** Đoán Bảng 1 (sự cố tuần) từ dòng header có "Vị trí khai thác" + "Vật tư". */
function isTable1Header(row: string[]): boolean {
  const s = row.join("|").toLowerCase();
  return /v[ịi]\s*tr[íi]\s*khai\s*th[áa]c/.test(s) && /v[ậa]t\s*t[ưu]/.test(s);
}

/** Đoán Bảng 2 (hỏng tồn) từ header có "Đơn vị sửa chữa". */
function isTable2Header(row: string[]): boolean {
  const s = row.join("|").toLowerCase();
  return /đ[ơo]n\s*v[ịi]\s*s[ửu]a\s*ch[ữu]a/.test(s) || /ng[àa]y\s*chuy[ểe]n\s*đ[ơo]n\s*v[ịi]/.test(s);
}

function isEmptyRow(row: string[]): boolean {
  const nonEmpty = row.filter((c) => c && c.trim().length > 0);
  if (nonEmpty.length === 0) return true;
  // Chỉ có mỗi STT (số nhỏ hoặc "1"/"2"…)
  if (nonEmpty.length === 1 && /^\d{1,2}$/.test(nonEmpty[0].trim())) return true;
  return false;
}

function extractTable1(rows: string[][]): WeeklyIncidentRow[] {
  const out: WeeklyIncidentRow[] = [];
  let heThongHint = "";
  let nhom = "";
  // Bỏ 2 dòng header đầu (row header + row sub-header với \n)
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    const joined = r.join(" ").trim();
    if (!joined) continue;
    // Nhóm La Mã "I. Thiết bị nhóm 1:"
    const nm = joined.match(NHOM_RE);
    if (nm) { nhom = nm[1]; continue; }
    // Header hệ thống — dòng chỉ có tên nhóm hệ thống, các ô sau rỗng
    const first = (r[0] ?? "").trim();
    if (GROUP_RE.test(first) && r.slice(1).every((c) => !c || !c.trim())) {
      heThongHint = first;
      continue;
    }
    // Rỗng thực sự
    if (isEmptyRow(r)) continue;
    // Dòng dữ liệu: cần có Thiết bị (col 1) + Thời điểm (col 4) hoặc Tình trạng (col 5)
    // Cột: 0=STT, 1=Thiết bị, 2=Vị trí, 3=SL, 4=Thời điểm, 5=Tình trạng, 6=Vật tư, 7=Ghi chú
    const c = (idx: number) => (r[idx] ?? "").trim();
    const thiet_bi = c(1);
    const thoi_diem = c(4);
    const tinh_trang = c(5);
    if (!thiet_bi && !thoi_diem && !tinh_trang) continue;
    const impact = classifyImpact(`${tinh_trang} ${c(7)}`);
    const level = classifyLevel(`${tinh_trang} ${c(6)}`, impact);
    const isoStart = extractStartTime(thoi_diem);
    const isoEnd = extractEndTime(thoi_diem);
    let conf = 0.55;
    if (thiet_bi) conf += 0.15;
    if (isoStart) conf += 0.15;
    if (tinh_trang) conf += 0.1;
    if (heThongHint) conf += 0.05;
    out.push({
      stt: c(0), thiet_bi, vi_tri: c(2), sl_hong: c(3),
      thoi_diem_raw: thoi_diem, tinh_trang, vat_tu: c(6), ghi_chu: c(7),
      he_thong_hint: heThongHint, nhom,
      thoi_gian_bat_dau: isoStart, thoi_gian_ket_thuc: isoEnd,
      phan_loai: level, anh_huong_dhb: impact,
      confidence: Math.min(1, conf),
    });
  }
  return out;
}

function extractTable2(rows: string[][]): WeeklyHongHocRow[] {
  const out: WeeklyHongHocRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || isEmptyRow(r)) continue;
    const c = (idx: number) => (r[idx] ?? "").trim();
    const thiet_bi = c(1);
    if (!thiet_bi || thiet_bi === "//") continue;
    const ngayHongRaw = c(4);
    out.push({
      stt: c(0), thiet_bi, don_vi_ql: c(2), tinh_trang: c(3),
      ngay_hong_raw: ngayHongRaw, don_vi_sc: c(5),
      ngay_chuyen_sc: c(6), ghi_chu: c(7),
      ngay_hong_iso: extractStartTime(ngayHongRaw),
    });
  }
  return out;
}

/** Trích tất cả text để parse header (fallback nếu docx không có <p>). */
function tablesToText(tables: string[][][]): string {
  return tables.map((tbl) => tbl.map((r) => r.join(" ")).join("\n")).join("\n");
}

export async function parseWeeklyReportDocx(buf: ArrayBuffer): Promise<WeeklyReportParsed> {
  const tables = await docxToTables(buf);
  // Cũng lấy text raw cho header (mammoth extractRawText nhanh gọn).
  const raw = await mammoth.extractRawText({ arrayBuffer: buf });
  const fullText = raw.value || tablesToText(tables);
  return finalize(fullText, tables);
}

/** Fallback: user paste plain text (TSV / bảng đã copy từ Word). */
export function parseWeeklyReportText(text: string): WeeklyReportParsed {
  // Chuyển text thành 1 bảng ảo — mỗi dòng chia theo TAB (khi paste từ Word).
  const tables: string[][][] = [];
  let cur: string[][] = [];
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    if (!line.trim()) { if (cur.length) { tables.push(cur); cur = []; } continue; }
    cur.push(line.split("\t"));
  }
  if (cur.length) tables.push(cur);
  return finalize(text, tables);
}

function finalize(fullText: string, tables: string[][][]): WeeklyReportParsed {
  const header = parseHeader(fullText);
  let t1: string[][] | null = null;
  let t2: string[][] | null = null;
  for (const tbl of tables) {
    if (!t1 && tbl.some(isTable1Header)) {
      // Tìm index header rồi cắt phần sau
      const idx = tbl.findIndex(isTable1Header);
      t1 = tbl.slice(idx);
    } else if (!t2 && tbl.some(isTable2Header)) {
      const idx = tbl.findIndex(isTable2Header);
      t2 = tbl.slice(idx);
    }
  }
  return {
    header,
    incidents: t1 ? extractTable1(t1) : [],
    hong_hoc: t2 ? extractTable2(t2) : [],
    raw_tables: tables,
  };
}

// -----------------------------------------------------------------------------
// Fuzzy match hệ thống — trả top-K gợi ý với score 0..1
// -----------------------------------------------------------------------------

function normVN(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(normVN(s).split(" ").filter((x) => x.length >= 2));
}

/** Jaccard trên tokens + bonus cho substring khớp. */
export function fuzzyScore(a: string, b: string): number {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const jac = inter / (A.size + B.size - inter);
  const na = normVN(a);
  const nb = normVN(b);
  const sub = na && nb && (na.includes(nb) || nb.includes(na)) ? 0.15 : 0;
  return Math.min(1, jac + sub);
}

export interface HeThongCandidate { id: string; ten: string; score: number }

export function fuzzyMatchHeThong(
  hint: string,
  thietBiTen: string,
  systems: readonly { id: string; ten: string }[],
  topK = 3,
): HeThongCandidate[] {
  const query = `${hint} ${thietBiTen}`.trim();
  const scored = systems.map((s) => ({ id: s.id, ten: s.ten, score: fuzzyScore(query, s.ten) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter((s) => s.score > 0);
}
