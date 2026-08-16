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
    try {
      const cfg = resolveServerBackend();
      const request = getRequest();

      if (!request?.headers) {
        console.warn("requireSupabaseAuth: No request headers available");
        return next({
          context: {
            supabase: null as any,
            userId: null as any,
            claims: null as any,
            unauthenticated: true,
          },
        });
      }

      const authHeader = request.headers.get("authorization");
      if (!authHeader) {
        return next({
          context: {
            supabase: null as any,
            userId: null as any,
            claims: null as any,
            unauthenticated: true,
          },
        });
      }

      if (!authHeader.startsWith("Bearer ")) {
        console.warn("requireSupabaseAuth: Only Bearer tokens are supported");
        return next({
          context: {
            supabase: null as any,
            userId: null as any,
            claims: null as any,
            unauthenticated: true,
          },
        });
      }

      const token = authHeader.slice("Bearer ".length);
      if (!token || token.split(".").length !== 3) {
        console.warn("requireSupabaseAuth: Invalid token format");
        return next({
          context: {
            supabase: null as any,
            userId: null as any,
            claims: null as any,
            unauthenticated: true,
          },
        });
      }

      const supabase = createClient<Database>(cfg.url, cfg.publishableKey, {
        global: {
          fetch: backendFetch(cfg.publishableKey),
          headers: { Authorization: `Bearer ${token}` },
        },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await supabase.auth.getClaims(token);
      if (error || !data?.claims || !data.claims.sub) {
        console.warn("requireSupabaseAuth: Failed to get claims or no user ID", error);
        return next({
          context: {
            supabase: null as any,
            userId: null as any,
            claims: null as any,
            unauthenticated: true,
          },
        });
      }

      return next({
        context: {
          supabase,
          userId: data.claims.sub,
          claims: data.claims,
          unauthenticated: false,
        },
      });
    } catch (err) {
      console.error("requireSupabaseAuth unexpected error:", err);
      return next({
        context: {
          supabase: null as any,
          userId: null as any,
          claims: null as any,
          unauthenticated: true,
        },
      });
    }
  },
);

