import mammoth from "mammoth";

export type DetectVerdict = "accept" | "suspect" | "reject";

export interface DetectResult {
  verdict: DetectVerdict;
  score: number; // 0..1
  reason: string;
  hints: string[];
}

const REJECT_EXT = new Set([
  "pdf", "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "heic",
  "xlsx", "xls", "csv", "zip", "rar", "7z", "mp3", "mp4", "mov",
  "pptx", "ppt", "txt", "rtf",
]);

// Từ khoá bắt buộc/nhấn mạnh cho báo cáo tuần sự cố.
const STRONG_KEYWORDS = [
  /b[aá]o\s*c[aá]o\s*tu[aầ]n/i,
  /tu[aầ]n\s*\d{1,2}\s*(?:\/|năm|nam)/i,
  /t[iì]nh\s*tr[aạ]ng\s*(k[yỹ]?\s*thu[aậ]t|thi[eế]t\s*b[iị])/i,
  /bi[eệ]n\s*ph[aá]p\s*kh[aắ]c\s*ph[uụ]c/i,
];
const MED_KEYWORDS = [
  /s[uự]\s*c[oố]/i,
  /h[oỏ]ng\s*(h[oó]c|t[oồ]n)/i,
  /th[oờ]i\s*gian\s*(b[aắ]t\s*đ[aầ]u|k[eế]t\s*th[uú]c)/i,
  /[aả]nh\s*h[uư][oở]ng/i,
  /(ĐHB|CNS|RADAR|VOR|DVOR|ILS|AWOS)/i,
];
// Từ khoá của các loại tài liệu khác (dùng để loại trừ).
const NEGATIVE_KEYWORDS: Array<[RegExp, string]> = [
  [/gi[aấ]y\s*ph[eé]p\s*khai\s*th[aá]c/i, "Giấy phép khai thác"],
  [/phi[eế]u\s*b[aả]o\s*d[uư][oỡ]ng/i, "Phiếu bảo dưỡng"],
  [/bi[eê]n\s*b[aả]n\s*nghi[eệ]m\s*thu/i, "Biên bản nghiệm thu"],
  [/h[oợ]p\s*đ[oồ]ng/i, "Hợp đồng"],
];

function extFromName(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

export function classifyTextForWeeklyReport(text: string): DetectResult {
  const hints: string[] = [];
  const t = (text || "").slice(0, 20000); // đủ để nhận diện, tránh scan quá dài
  if (!t.trim()) {
    return { verdict: "reject", score: 0, reason: "Nội dung rỗng", hints };
  }

  let score = 0;
  for (const rx of STRONG_KEYWORDS) if (rx.test(t)) { score += 0.28; hints.push(`match: ${rx.source.slice(0, 30)}`); }
  for (const rx of MED_KEYWORDS) if (rx.test(t)) { score += 0.1; }

  // Bảng thường có cột TT/STT + Tên thiết bị + Thời gian
  if (/\bTT\b|\bSTT\b/.test(t) && /(t[eê]n\s*(thi[eế]t\s*b[iị]|h[eệ]\s*th[oố]ng))/i.test(t)) {
    score += 0.15; hints.push("cột bảng: TT + Tên thiết bị");
  }

  // Nhiều mốc thời gian dd/mm hoặc hh:mm → dấu hiệu báo cáo tuần
  const timeMarks = (t.match(/\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/g) || []).length
    + (t.match(/\b\d{1,2}h\d{0,2}\b/gi) || []).length;
  if (timeMarks >= 3) { score += 0.1; hints.push(`${timeMarks} mốc thời gian`); }

  // Loại trừ nếu có dấu hiệu tài liệu khác rõ ràng
  for (const [rx, label] of NEGATIVE_KEYWORDS) {
    if (rx.test(t)) {
      return { verdict: "reject", score, reason: `Có vẻ là tài liệu "${label}", không phải báo cáo tuần`, hints };
    }
  }

  score = Math.min(1, score);
  if (score >= 0.55) return { verdict: "accept", score, reason: "Đủ dấu hiệu báo cáo tuần sự cố", hints };
  if (score >= 0.3) return { verdict: "suspect", score, reason: "Không chắc chắn — thiếu tiêu đề/cột bảng đặc trưng", hints };
  return { verdict: "reject", score, reason: "Không phát hiện dấu hiệu báo cáo tuần sự cố", hints };
}

export async function classifyWeeklyReportFile(file: File): Promise<DetectResult> {
  const ext = extFromName(file.name);

  if (REJECT_EXT.has(ext)) {
    const map: Record<string, string> = {
      pdf: "PDF (giấy phép/tài liệu quét)",
      png: "ảnh PNG", jpg: "ảnh JPG", jpeg: "ảnh JPEG", gif: "ảnh GIF",
      webp: "ảnh WEBP", bmp: "ảnh BMP", svg: "SVG", heic: "ảnh HEIC",
      xlsx: "bảng tính Excel", xls: "bảng tính Excel", csv: "CSV",
      zip: "gói nén", rar: "gói nén", "7z": "gói nén",
      pptx: "slide PowerPoint", ppt: "slide PowerPoint",
      txt: "text thô (hãy dùng tab \"Dán nội dung\")",
      rtf: "văn bản RTF",
      mp3: "âm thanh", mp4: "video", mov: "video",
    };
    return {
      verdict: "reject", score: 0,
      reason: `File là ${map[ext] ?? ext.toUpperCase()} — không phải báo cáo tuần .docx`,
      hints: [`ext=${ext}`],
    };
  }

  if (ext === "doc") {
    return {
      verdict: "reject", score: 0,
      reason: "File .doc cũ không hỗ trợ — hãy Save As sang .docx",
      hints: ["ext=doc"],
    };
  }

  if (ext !== "docx") {
    return {
      verdict: "reject", score: 0,
      reason: `Định dạng .${ext || "?"} không được hỗ trợ`,
      hints: [`ext=${ext}`],
    };
  }

  // Đọc raw text để chấm điểm nội dung
  try {
    const buf = await file.arrayBuffer();
    const raw = await mammoth.extractRawText({ arrayBuffer: buf });
    return classifyTextForWeeklyReport(raw.value ?? "");
  } catch (e) {
    return {
      verdict: "reject", score: 0,
      reason: `Không đọc được nội dung DOCX: ${e instanceof Error ? e.message : String(e)}`,
      hints: ["mammoth.error"],
    };
  }
}