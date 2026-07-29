/**
 * GĐ2-03 — AI fallback cho Command Palette v2.
 * Khi rule-based `matchIntent` trả confidence thấp, gọi AI để bóc tách intent.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import { buildAiModel, type AiRuntimeConfig } from "@/lib/ai/gateway.server";
import type { Intent } from "@/lib/mirats/command-intent";

const inputSchema = z.object({ input: z.string().min(2).max(200) });

const SYSTEM = `Bạn là trợ lý bóc tách INTENT cho ứng dụng MIRATS.
Người dùng gõ 1 câu tiếng Việt/Anh ngắn trong Command Palette. Trả về DUY NHẤT 1 JSON:
{"kind":"mount-asset"|"unmount-asset"|"close-incident"|"create-pm"|"jump-to","asset"?:string,"component"?:string,"id"?:string,"target"?:string,"query"?:string,"confidence":0..1}
- Không giải thích, không markdown. Không suy đoán mã nếu văn bản không có.
- Nếu không chắc: {"kind":"jump-to","query":"<nguyên văn>","confidence":0.3}`;

function extractJson(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{"); const end = s.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try { return JSON.parse(s.slice(start, end + 1)); } catch { return null; }
}

export const parseIntentWithAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }): Promise<Intent> => {
    const { data: cfgRow } = await context.supabase.from("ai_config").select("*").eq("id", 1).maybeSingle();
    const cfg = cfgRow as unknown as AiRuntimeConfig | null;
    if (!cfg || !cfg.enabled) {
      return { kind: "jump-to", query: data.input, confidence: 0.3 };
    }
    const model = buildAiModel(cfg);
    const { text } = await generateText({
      model, system: SYSTEM,
      prompt: `Câu: """${data.input}"""`,
      maxOutputTokens: 200,
    });
    const obj = extractJson(text);
    if (!obj || typeof obj.kind !== "string") {
      return { kind: "jump-to", query: data.input, confidence: 0.3 };
    }
    const conf = typeof obj.confidence === "number" ? Math.max(0, Math.min(1, obj.confidence)) : 0.6;
    const asStr = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    switch (obj.kind) {
      case "mount-asset":
        return { kind: "mount-asset", asset: asStr(obj.asset).toUpperCase(), component: asStr(obj.component).toUpperCase(), confidence: conf };
      case "unmount-asset":
        return { kind: "unmount-asset", asset: asStr(obj.asset).toUpperCase(), component: asStr(obj.component).toUpperCase() || undefined, confidence: conf };
      case "close-incident":
        return { kind: "close-incident", id: asStr(obj.id).toUpperCase(), confidence: conf };
      case "create-pm":
        return { kind: "create-pm", target: asStr(obj.target), confidence: conf };
      default:
        return { kind: "jump-to", query: asStr(obj.query) || data.input, confidence: conf };
    }
  });
