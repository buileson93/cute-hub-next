import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildAiModel, type AiRuntimeConfig } from "@/lib/ai/gateway.server";
import { parseIncidentByRules } from "@/lib/ai/incident-parse-rules";

const inputSchema = z.object({
  text: z.string().min(10, "Nội dung quá ngắn để phân tích"),
});

/** Kết quả AI bóc tách từ văn bản sự cố tự do. */
export interface ParsedIncident {
  hien_tuong: string;
  he_thong_goi_y: string;
  thiet_bi_goi_y: string[];
  tom_tat: string;
  thoi_gian_bat_dau: string; // "YYYY-MM-DDTHH:mm" hoặc ""
  dia_diem: string;
  anh_huong_dhb: string; // "Không ảnh hưởng" | "Ảnh hưởng một phần" | "Có gián đoạn ĐHB"
  nguyen_nhan: string;
  bien_phap_xu_ly: string;
  tinh_hinh_hien_tai: string;
  ket_qua_khac_phuc: string;
  phan_loai: string; // A/B/C/D/E
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

/** Rút JSON đầu tiên từ chuỗi trả về (chịu được rào ```json và text thừa). */
function extractJson(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

const SYSTEM = `Bạn là trợ lý bóc tách BÁO CÁO SỰ CỐ KỸ THUẬT hàng không cho hệ thống MIRATS.
Người dùng dán một đoạn văn bản mô tả sự cố (cấu trúc KHÔNG chặt chẽ, có thể thiếu trường, viết tắt, ký hiệu giờ Zulu "Z").
Nhiệm vụ: hiểu ngữ nghĩa và điền vào các trường JSON dưới đây. TUYỆT ĐỐI không bịa thông tin không có trong văn bản — trường nào không suy được thì để chuỗi rỗng "".

Trả về DUY NHẤT một object JSON (không giải thích, không markdown) theo đúng khóa:
{
  "hien_tuong": "tiêu đề/hiện tượng lỗi ngắn gọn (1 dòng)",
  "he_thong_goi_y": "tên hệ thống/dịch vụ bị sự cố (ví dụ: VHF, VCCS, Radar...)",
  "thiet_bi_goi_y": ["các từ khóa/tên tài sản bị ảnh hưởng, ví dụ: VHF Park Air T6T 127.9MHz"],
  "tom_tat": "diễn biến sự việc đầy đủ, giữ nguyên mốc giờ Z và ngày như văn bản gốc",
  "thoi_gian_bat_dau": "thời điểm bắt đầu sự cố dạng YYYY-MM-DDTHH:mm nếu suy được, không thì \\"\\" (giờ Z giữ nguyên số giờ)",
  "dia_diem": "địa điểm/đơn vị nếu có (ví dụ APP)",
  "anh_huong_dhb": "chọn đúng 1 trong: Không ảnh hưởng | Ảnh hưởng một phần | Có gián đoạn ĐHB",
  "nguyen_nhan": "nguyên nhân/nghi ngờ nếu có",
  "bien_phap_xu_ly": "phương án giải trợ/xử lý tạm thời nếu có",
  "tinh_hinh_hien_tai": "tình hình hiện tại đến thời điểm báo cáo",
  "ket_qua_khac_phuc": "kết quả hoặc phương án khắc phục",
  "phan_loai": "mức phân loại A/B/C/D/E (A nghiêm trọng nhất). Không rõ thì \\"E\\""
}`;

/**
 * Bóc tách văn bản sự cố tự do thành các trường có cấu trúc để điền form.
 * KHÔNG ghi vào CSDL — chỉ trả kết quả để người dùng kiểm tra & xác nhận.
 */
export const parseIncidentText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }): Promise<ParsedIncident> => {
    // Tầng 1 — deterministic parser. Đa số báo cáo TTBDKT theo 7 mục cố định,
    // khỏi cần AI (nhanh, ổn định, 0 credit).
    const ruleRes = parseIncidentByRules(data.text);
    if (ruleRes.confidence >= 0.7) {
      return ruleRes.parsed;
    }

    // Tầng 2 — AI fallback khi parser không đủ tự tin.
    const { data: cfgRow, error: cfgErr } = await context.supabase
      .from("ai_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (cfgErr) throw new Error(cfgErr.message);
    const cfg = cfgRow as unknown as AiRuntimeConfig | null;
    if (!cfg || !cfg.enabled) {
      // AI tắt: trả kết quả parser (dù thấp) — user vẫn có gì đó để chỉnh.
      return ruleRes.parsed;
    }

    const model = buildAiModel(cfg);

    const { text } = await generateText({
      model,
      system: SYSTEM,
      prompt: `Văn bản sự cố cần bóc tách:\n\n"""\n${data.text}\n"""\n\nGợi ý từ parser (có thể sai, hãy sửa lại theo văn bản gốc):\n${JSON.stringify(ruleRes.parsed)}`,
      maxOutputTokens: Math.min(cfg.max_tokens || 4096, 4096),
    });

    const obj = extractJson(text);
    if (!obj) {
      // AI hỏng: vẫn trả kết quả parser để user không mất công gõ lại.
      return ruleRes.parsed;
    }

    const dhb = asStr(obj.anh_huong_dhb);
    const validDhb = ["Không ảnh hưởng", "Ảnh hưởng một phần", "Có gián đoạn ĐHB"];
    const pl = asStr(obj.phan_loai).toUpperCase();

    const tb = Array.isArray(obj.thiet_bi_goi_y)
      ? (obj.thiet_bi_goi_y as unknown[]).map(asStr).filter(Boolean)
      : [];

    return {
      ...EMPTY,
      hien_tuong: asStr(obj.hien_tuong),
      he_thong_goi_y: asStr(obj.he_thong_goi_y),
      thiet_bi_goi_y: tb,
      tom_tat: asStr(obj.tom_tat),
      thoi_gian_bat_dau: asStr(obj.thoi_gian_bat_dau),
      dia_diem: asStr(obj.dia_diem),
      anh_huong_dhb: validDhb.includes(dhb) ? dhb : "Không ảnh hưởng",
      nguyen_nhan: asStr(obj.nguyen_nhan),
      bien_phap_xu_ly: asStr(obj.bien_phap_xu_ly),
      tinh_hinh_hien_tai: asStr(obj.tinh_hinh_hien_tai),
      ket_qua_khac_phuc: asStr(obj.ket_qua_khac_phuc),
      phan_loai: ["A", "B", "C", "D", "E"].includes(pl) ? pl : "E",
    };
  });
