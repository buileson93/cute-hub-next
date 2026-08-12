/**
 * Middleware xác thực cho server function — hoạt động với Supabase riêng hoặc Lovable Cloud.
 * Thay thế `requireSupabaseAuth` sinh tự động, nhưng đọc cấu hình qua lớp `backend/env`.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { backendFetch, resolveServerBackend } from "./env";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const cfg = resolveServerBackend();
    const request = getRequest();

    if (!request?.headers) throw new Error("Unauthorized: No request headers available");

    const authHeader = request.headers.get("authorization");
    if (!authHeader) throw new Error("Unauthorized: No authorization header provided");
    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized: Only Bearer tokens are supported");
    }

    const token = authHeader.slice("Bearer ".length);
    if (!token) throw new Error("Unauthorized: No token provided");
    if (token.split(".").length !== 3) throw new Error("Unauthorized: Invalid token");

    const supabase = createClient<Database>(cfg.url, cfg.publishableKey, {
      global: {
        fetch: backendFetch(cfg.publishableKey),
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims) throw new Error("Unauthorized: Invalid token");
    if (!data.claims.sub) throw new Error("Unauthorized: No user ID found in token");

    return next({
      context: { supabase, userId: data.claims.sub, claims: data.claims },
    });
  },
);
