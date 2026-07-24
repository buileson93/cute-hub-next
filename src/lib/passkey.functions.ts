import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestHost, setCookie, getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RP_NAME = "MIRATS 2.0";
const REG_COOKIE = "wa_reg_challenge";
const AUTH_COOKIE = "wa_auth_challenge";

/** Derive Relying Party ID + expected origin from the incoming request. */
function getRp(): { rpID: string; origin: string; secure: boolean } {
  const originHeader = getRequestHeader("origin");
  if (originHeader) {
    try {
      const u = new URL(originHeader);
      return {
        rpID: u.hostname,
        origin: originHeader,
        secure: u.protocol === "https:",
      };
    } catch {
      /* fall through */
    }
  }
  const host = getRequestHost() || "localhost";
  const hostname = host.split(":")[0];
  const secure = hostname !== "localhost" && !hostname.startsWith("127.");
  return {
    rpID: hostname,
    origin: `${secure ? "https" : "http"}://${host}`,
    secure,
  };
}

function setChallengeCookie(name: string, value: string, secure: boolean) {
  setCookie(name, value, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });
}

// ─────────────────────────────────────────────────────────────
// 1. REGISTRATION — link a device biometric to the signed-in account
// ─────────────────────────────────────────────────────────────
export const getRegistrationOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { rpID, secure } = getRp();
    const userId = context.userId as string;
    const email =
      ((context.claims as Record<string, unknown> | undefined)?.email as string) ||
      "user";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("webauthn_credentials")
      .select("credential_id, transports")
      .eq("user_id", userId);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userID: isoUint8Array.fromUTF8String(userId),
      userName: email,
      userDisplayName: email,
      attestationType: "none",
      excludeCredentials: (existing ?? []).map((c) => ({
        id: c.credential_id,
        transports: (c.transports ?? undefined) as
          | AuthenticatorTransportFuture[]
          | undefined,
      })),
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "preferred",
      },
    });

    setChallengeCookie(REG_COOKIE, options.challenge, secure);
    return options;
  });

export const verifyRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { response: RegistrationResponseJSON; deviceName?: string }) => d,
  )
  .handler(async ({ data, context }) => {
    const { rpID, origin } = getRp();
    const expectedChallenge = getCookie(REG_COOKIE);
    if (!expectedChallenge) {
      return { success: false, error: "Phiên đăng ký đã hết hạn, thử lại." };
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: data.response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
      });
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }

    if (!verification.verified || !verification.registrationInfo) {
      return { success: false, error: "Không xác minh được tài sản." };
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;
    const userId = context.userId as string;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("webauthn_credentials").insert({
      user_id: userId,
      credential_id: credential.id,
      public_key: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? null,
      device_type: credentialDeviceType,
      backed_up: credentialBackedUp,
      device_name:
        data.deviceName?.slice(0, 80) || "Tài sản " + new Date().toLocaleDateString("vi-VN"),
    });

    if (error) {
      if (error.code === "23505")
        return { success: false, error: "Tài sản này đã được đăng ký." };
      return { success: false, error: error.message };
    }

    return { success: true };
  });

// ─────────────────────────────────────────────────────────────
// 2. AUTHENTICATION — passwordless login with biometric passkey
// ─────────────────────────────────────────────────────────────
export const getAuthenticationOptions = createServerFn({ method: "POST" }).handler(
  async () => {
    const { rpID, secure } = getRp();
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      // empty allowCredentials → discoverable (resident) keys, usernameless
    });
    setChallengeCookie(AUTH_COOKIE, options.challenge, secure);
    return options;
  },
);

export const verifyAuthentication = createServerFn({ method: "POST" })
  .inputValidator((d: { response: AuthenticationResponseJSON }) => d)
  .handler(async ({ data }) => {
    const { rpID, origin } = getRp();
    const expectedChallenge = getCookie(AUTH_COOKIE);
    if (!expectedChallenge) {
      return { success: false as const, error: "Phiên đăng nhập đã hết hạn." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cred } = await supabaseAdmin
      .from("webauthn_credentials")
      .select("*")
      .eq("credential_id", data.response.id)
      .maybeSingle();

    if (!cred) {
      return { success: false as const, error: "Passkey chưa được đăng ký." };
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: data.response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
        credential: {
          id: cred.credential_id,
          publicKey: isoBase64URL.toBuffer(cred.public_key),
          counter: Number(cred.counter),
          transports: (cred.transports ?? undefined) as
            | AuthenticatorTransportFuture[]
            | undefined,
        },
      });
    } catch (e) {
      return { success: false as const, error: (e as Error).message };
    }

    if (!verification.verified) {
      return { success: false as const, error: "Xác thực sinh trắc học thất bại." };
    }

    // update counter + last used
    await supabaseAdmin
      .from("webauthn_credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", cred.id);

    // Mint a Supabase session for this user via a one-time magic-link token.
    const { data: userRes, error: userErr } =
      await supabaseAdmin.auth.admin.getUserById(cred.user_id);
    const email = userRes?.user?.email;
    if (userErr || !email) {
      return { success: false as const, error: "Không tìm thấy tài khoản." };
    }

    const { data: linkData, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
    if (linkErr || !linkData?.properties?.hashed_token) {
      return { success: false as const, error: "Không tạo được phiên đăng nhập." };
    }

    return {
      success: true as const,
      email,
      tokenHash: linkData.properties.hashed_token,
    };
  });

// ─────────────────────────────────────────────────────────────
// 3. MANAGEMENT — list / delete passkeys for the signed-in user
// ─────────────────────────────────────────────────────────────
export const listPasskeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase
      .from("webauthn_credentials")
      .select("id, device_name, device_type, backed_up, created_at, last_used_at")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const deletePasskey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("webauthn_credentials")
      .delete()
      .eq("id", data.id);
    return { success: !error, error: error?.message };
  });

// Local type alias (avoids importing dom-lib-only type names in some setups)
type AuthenticatorTransportFuture =
  | "ble"
  | "cable"
  | "hybrid"
  | "internal"
  | "nfc"
  | "smart-card"
  | "usb";
