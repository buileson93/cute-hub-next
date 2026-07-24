import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildAiModel, type AiRuntimeConfig } from "@/lib/ai/gateway.server";

// GĐ3-05 — Vision Image Hint
// Nhận đường dẫn ảnh trong bucket `su-co-images` (private), tạo signed URL,
// yêu cầu model vision gợi ý mô tả sự cố ngắn. Không ghi CSDL.

const inputSchema = z.object({
  paths: z.array(z.string().min(1)).min(1).max(5),
});

export interface IncidentImageHint {
  short_description: string;
  suggested_category: "A" | "B" | "C" | "D" | "E" | "";
  keywords: string[];
}

const EMPTY: IncidentImageHint = { short_description: "", suggested_category: "", keywords: [] };

function extractJson(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>; } catch { return null; }
}

const SYSTEM = `Bạn là trợ lý phân tích ảnh hiện trường sự cố kỹ thuật hàng không cho MIRATS.
Xem các ảnh được cung cấp và trả về DUY NHẤT một object JSON theo khoá:
{
  "short_description": "mô tả 1-2 câu về hiện trạng nhìn thấy trong ảnh (thiết bị, dấu hiệu hỏng, đèn báo, cháy, đứt cáp…)",
  "suggested_category": "A|B|C|D|E — mức nghi ngờ (A nghiêm trọng nhất); không rõ để \"\"",
  "keywords": ["các từ khoá ngắn liên quan (VD: rack, cầu chì cháy, đèn đỏ, cáp đứt)"]
}
TUYỆT ĐỐI không bịa đặt. Nếu không đủ dữ liệu để suy đoán, để chuỗi/mảng rỗng.`;

export const analyzeIncidentImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }): Promise<IncidentImageHint> => {
    const { data: cfgRow, error: cfgErr } = await context.supabase
      .from("ai_config").select("*").eq("id", 1).maybeSingle();
    if (cfgErr) throw new Error(cfgErr.message);
    const cfg = cfgRow as unknown as AiRuntimeConfig | null;
    if (!cfg || !cfg.enabled) throw new Error("Tính năng AI đang tắt");

    // Ký URL tạm cho từng ảnh (5 phút)
    const urls: string[] = [];
    for (const p of data.paths) {
      const { data: sig, error } = await context.supabase.storage
        .from("su-co-images").createSignedUrl(p, 300);
      if (error || !sig?.signedUrl) throw new Error(error?.message ?? "Không tạo được URL ảnh");
      urls.push(sig.signedUrl);
    }

    const model = buildAiModel(cfg);
    const { text } = await generateText({
      model,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Phân tích các ảnh hiện trường sau và trả JSON theo yêu cầu." },
            ...urls.map((url) => ({ type: "image" as const, image: url })),
          ],
        },
      ],
      maxOutputTokens: Math.min(cfg.max_tokens || 1024, 1024),
    });

    const obj = extractJson(text);
    if (!obj) return EMPTY;
    const cat = String(obj.suggested_category ?? "").toUpperCase();
    const kws = Array.isArray(obj.keywords)
      ? (obj.keywords as unknown[]).map((v) => String(v ?? "").trim()).filter(Boolean).slice(0, 20)
      : [];
    return {
      short_description: typeof obj.short_description === "string" ? obj.short_description.trim() : "",
      suggested_category: (["A","B","C","D","E"].includes(cat) ? cat : "") as IncidentImageHint["suggested_category"],
      keywords: kws,
    };
  });
