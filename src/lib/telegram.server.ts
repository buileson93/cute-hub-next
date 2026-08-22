/**
 * Telegram gateway helper (server-only).
 * Route API calls through Lovable connector gateway.
 */
const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

export async function tgCall<T = unknown>(
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const LOVABLE_API_KEY = envOrThrow("LOVABLE_API_KEY");
  const TELEGRAM_API_KEY = envOrThrow("TELEGRAM_API_KEY");

  const res = await fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telegram ${method} failed [${res.status}]: ${text}`);
  }
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${method}: ${json.description ?? "unknown error"}`);
  return json.result as T;
}

export async function sendMessage(
  chat_id: string,
  text: string,
  opts: { parse_mode?: "HTML" | "Markdown"; disable_web_page_preview?: boolean } = {},
) {
  return tgCall("sendMessage", {
    chat_id,
    text,
    parse_mode: opts.parse_mode ?? "HTML",
    disable_web_page_preview: opts.disable_web_page_preview ?? true,
  });
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
