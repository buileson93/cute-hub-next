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

      const fail = () =>
        next({
          context: {
            supabase: null as any,
            userId: null as any,
            claims: null as any,
            unauthenticated: true,
          },
        });

      if (!request?.headers) return fail();

      const authHeader = request.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) return fail();

      const token = authHeader.slice("Bearer ".length);
      if (!token || token.split(".").length !== 3) return fail();

      const supabase = createClient<Database>(cfg.url, cfg.publishableKey, {
        global: {
          fetch: backendFetch(cfg.publishableKey),
          headers: { Authorization: `Bearer ${token}` },
        },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      });

      // Verification of token
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return fail();

      return next({
        context: {
          supabase,
          userId: data.user.id,
          claims: (data.user as any).app_metadata || {},
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
