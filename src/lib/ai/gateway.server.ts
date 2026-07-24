/**
 * Provider AI cho MIRATS – server-only.
 * - `lovable`: dùng Lovable AI Gateway (mặc định, không cần key riêng).
 * - `custom`: endpoint OpenAI-compatible do admin nhập (base_url + tên secret).
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type AiProvider = "lovable" | "custom";

export type AiRuntimeConfig = {
  enabled: boolean;
  provider: AiProvider;
  model: string;
  base_url: string | null;
  api_key_secret_name: string | null;
  system_prompt: string;
  max_tokens: number;
};

export function buildAiModel(cfg: AiRuntimeConfig) {
  if (cfg.provider === "lovable") {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Thiếu LOVABLE_API_KEY trên máy chủ");
    const provider = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      supportsStructuredOutputs: false,
      headers: {
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });
    return provider(cfg.model);
  }

  // custom OpenAI-compatible
  if (!cfg.base_url) throw new Error("Cấu hình AI: thiếu base_url");
  const secretName = cfg.api_key_secret_name?.trim();
  const apiKey = secretName ? process.env[secretName] : undefined;
  if (secretName && !apiKey) {
    throw new Error(`Chưa cấu hình secret "${secretName}" trên máy chủ`);
  }
  const provider = createOpenAICompatible({
    name: "custom",
    baseURL: cfg.base_url,
    supportsStructuredOutputs: false,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  });
  return provider(cfg.model);
}
