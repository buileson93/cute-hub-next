/**
 * Middleware xác thực cho server function — hoạt động với Supabase riêng hoặc Lovable Cloud.
 * Thay thế `requireSupabaseAuth` sinh tự động, nhưng đọc cấu hình qua lớp `backend/env`.
 */
import { createMiddleware } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    try {
      const { resolveServerBackend, backendFetch } = await import("./env");
      const { createClient } = await import("@supabase/supabase-js");
      const { getRequest } = await import("@tanstack/react-start/server");

      const cfg = resolveServerBackend();
      const request = getRequest();

      if (!request?.headers) {
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
      if (!authHeader?.startsWith("Bearer ")) {
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
      if (error || !data?.claims?.sub) {
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
