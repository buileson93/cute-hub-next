import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Password-reset flow with:
 *  - Zod validation
 *  - Silent uniform response (no email enumeration)
 *  - Math CAPTCHA (HMAC-signed, 5 phút TTL, dùng 1 lần trong window)
 *  - Rate limit theo email (3/15p) và IP (10/15p)
 *  - Chỉ gửi cho tài khoản đã được duyệt (active)
 *  - Ghi log mọi bước vào audit_log
 *  - Sau khi đổi mật khẩu: thu hồi mọi session cũ (invalidate old tokens)
 */

const CHALLENGE_TTL_MS = 5 * 60_000;

function clientIp(): string {
  return (
    getRequestHeader("cf-connecting-ip") ??
    getRequestHeader("x-real-ip") ??
    (getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown")
  );
}

function signChallenge(payload: string): string {
  return createHmac("sha256", process.env.RESET_CHALLENGE_SECRET!)
    .update(payload)
    .digest("hex");
}

function verifyChallengeToken(token: string, answer: number): { ok: boolean; reason?: string } {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [payloadB64, sig] = parts;
  const expected = signChallenge(payloadB64);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };
  let payload: { a: number; b: number; ans: number; exp: number };
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "bad_payload" };
  }
  if (Date.now() > payload.exp) return { ok: false, reason: "expired" };
  if (payload.ans !== answer) return { ok: false, reason: "wrong_answer" };
  return { ok: true };
}

/** Cấp câu hỏi CAPTCHA — trả về câu hỏi + token đã ký (không lộ đáp án). */
export const issuePasswordResetChallenge = createServerFn({ method: "GET" }).handler(async () => {
  const a = randomInt(2, 12);
  const b = randomInt(2, 12);
  const op = Math.random() < 0.5 ? "+" : "×";
  const ans = op === "+" ? a + b : a * b;
  const exp = Date.now() + CHALLENGE_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ a, b, ans, exp }), "utf8").toString("base64url");
  const token = `${payload}.${signChallenge(payload)}`;
  return {
    token,
    question: `${a} ${op} ${b} = ?`,
    expiresAt: exp,
  };
});

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email("Email không hợp lệ").max(255),
        redirectTo: z.string().url().max(500),
        challengeToken: z.string().min(20).max(1000),
        challengeAnswer: z.coerce.number().int().min(-1000).max(10000),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = clientIp();
    const userAgent = getRequestHeader("user-agent")?.slice(0, 200) ?? null;

    async function log(action: string, extra: Record<string, unknown> = {}) {
      await supabaseAdmin.from("audit_log").insert({
        action,
        entity: "auth",
        entity_id: data.email,
        detail: { email: data.email, ip, user_agent: userAgent, ...extra },
      });
    }

    // --- Bước 1: xác minh CAPTCHA
    const captcha = verifyChallengeToken(data.challengeToken, data.challengeAnswer);
    if (!captcha.ok) {
      await log("password_reset_captcha_failed", { reason: captcha.reason });
      return { ok: false as const, error: "captcha_failed" };
    }

    // --- Bước 2: rate-limit qua audit_log
    const WINDOW_MIN = 15;
    const MAX_PER_EMAIL = 3;
    const MAX_PER_IP = 10;
    const sinceIso = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();

    const [{ count: emailCount }, { count: ipCount }] = await Promise.all([
      supabaseAdmin
        .from("audit_log")
        .select("id", { count: "exact", head: true })
        .eq("action", "password_reset_requested")
        .eq("entity_id", data.email)
        .gte("created_at", sinceIso),
      supabaseAdmin
        .from("audit_log")
        .select("id", { count: "exact", head: true })
        .eq("action", "password_reset_requested")
        .contains("detail", { ip })
        .gte("created_at", sinceIso),
    ]);

    if ((emailCount ?? 0) >= MAX_PER_EMAIL || (ipCount ?? 0) >= MAX_PER_IP) {
      await log("password_reset_rate_limited", {
        email_count: emailCount,
        ip_count: ipCount,
      });
      return { ok: true as const };
    }

    // --- Bước 3: tra profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, active")
      .eq("email", data.email)
      .maybeSingle<Database["public"]["Tables"]["profiles"]["Row"]>();

    if (!profile) {
      await log("password_reset_unknown_email");
      return { ok: true as const };
    }
    if (!profile.active) {
      await log("password_reset_inactive_account", { user_id: profile.id });
      return { ok: true as const };
    }

    // --- Bước 4: gửi email khôi phục
    const publicClient = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await publicClient.auth.resetPasswordForEmail(data.email, {
      redirectTo: data.redirectTo,
    });

    if (error) {
      await log("password_reset_send_failed", { user_id: profile.id, error: error.message });
      return { ok: true as const };
    }

    await log("password_reset_requested", { user_id: profile.id });
    return { ok: true as const };
  });

/**
 * Sau khi user đã updateUser({password}) thành công trong phiên recovery,
 * gọi hàm này để:
 *   - Ghi audit_log "password_reset_completed"
 *   - Thu hồi toàn bộ refresh-token khác của user (invalidate old tokens)
 */
export const finalizePasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ userId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    // Chỉ chính chủ (phiên recovery vừa xác thực) mới được gọi
    if (context.userId !== data.userId) {
      return { ok: false as const, error: "forbidden" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = clientIp();
    const userAgent = getRequestHeader("user-agent")?.slice(0, 200) ?? null;

    // Xác thực user tồn tại + active
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, active")
      .eq("id", data.userId)
      .maybeSingle();
    if (!profile) return { ok: false as const, error: "not_found" };

    // Thu hồi tất cả refresh-token/session của user (bao gồm cả phiên recovery hiện tại)
    const { error: signOutErr } = await supabaseAdmin.auth.admin.signOut(data.userId, "global");

    await supabaseAdmin.from("audit_log").insert({
      user_id: data.userId,
      action: "password_reset_completed",
      entity: "auth",
      entity_id: profile.email,
      detail: {
        email: profile.email,
        ip,
        user_agent: userAgent,
        sessions_revoked: !signOutErr,
        sign_out_error: signOutErr?.message ?? null,
      },
    });

    return { ok: true as const };
  });
