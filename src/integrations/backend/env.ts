/**
 * Lớp phân giải cấu hình backend (Supabase).
 *
 * Cho phép dự án chạy trên **Supabase riêng của bạn** thay vì Lovable Cloud,
 * mà không phải sửa code nghiệp vụ.
 *
 * Thứ tự ưu tiên:
 *   1. Biến `APP_SUPABASE_*` / `VITE_APP_SUPABASE_*`  → Supabase tự chủ của bạn
 *   2. Biến `SUPABASE_*` / `VITE_SUPABASE_*`          → Lovable Cloud (mặc định)
 *
 * Lưu ý: `import.meta.env.X` phải viết tường minh để Vite thay thế lúc build.
 */

export type BackendProvider = "self-hosted" | "lovable-cloud";

export interface ResolvedBrowserBackend {
  url: string;
  publishableKey: string;
  projectId?: string;
  provider: BackendProvider;
}

export interface ResolvedServerBackend {
  url: string;
  publishableKey: string;
  serviceRoleKey?: string;
  projectId?: string;
  provider: BackendProvider;
}

function pick(...values: Array<string | undefined>): string | undefined {
  for (const v of values) {
    const t = typeof v === "string" ? v.trim() : "";
    if (t) return t;
  }
  return undefined;
}

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[backend] Thiếu biến môi trường: ${name}. ` +
        `Cấu hình Supabase riêng qua APP_SUPABASE_* / VITE_APP_SUPABASE_*, ` +
        `hoặc để trống để dùng Lovable Cloud.`,
    );
  }
  return value;
}

/** Cấu hình cho code chạy trong trình duyệt. */
export function resolveBrowserBackend(): ResolvedBrowserBackend {
  // Ưu tiên cao nhất: nguồn dữ liệu do quản trị viên chọn ngay trong app.
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("mirats.backend.override");
      const v = raw ? (JSON.parse(raw) as { url?: string; publishableKey?: string }) : null;
      if (v?.url && v?.publishableKey) {
        return { url: v.url, publishableKey: v.publishableKey, provider: "self-hosted" };
      }
    } catch {
      /* cấu hình hỏng → bỏ qua, dùng biến môi trường */
    }
  }

  const overrideUrl = pick(import.meta.env.VITE_APP_SUPABASE_URL as string | undefined);
  const overrideKey = pick(
    import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY as string | undefined,
    import.meta.env.VITE_APP_SUPABASE_ANON_KEY as string | undefined,
  );
  const isSelfHosted = Boolean(overrideUrl && overrideKey);

  return {
    url: required(
      "VITE_APP_SUPABASE_URL / VITE_SUPABASE_URL",
      pick(overrideUrl, import.meta.env.VITE_SUPABASE_URL as string | undefined),
    ),
    publishableKey: required(
      "VITE_APP_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_PUBLISHABLE_KEY",
      pick(overrideKey, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined),
    ),
    projectId: pick(
      import.meta.env.VITE_APP_SUPABASE_PROJECT_ID as string | undefined,
      import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined,
    ),
    provider: isSelfHosted ? "self-hosted" : "lovable-cloud",
  };
}


/**
 * Cấu hình cho code chạy trên server.
 * CHỈ gọi bên trong `.handler()` của server function hoặc trong server route handler.
 */
export function resolveServerBackend(opts?: { withServiceRole?: boolean }): ResolvedServerBackend {
  const env = (globalThis as any).process?.env || {};
  const overrideUrl = pick(env.APP_SUPABASE_URL);
  const overrideKey = pick(env.APP_SUPABASE_PUBLISHABLE_KEY, env.APP_SUPABASE_ANON_KEY);
  const isSelfHosted = Boolean(overrideUrl && overrideKey);

  const cfg: ResolvedServerBackend = {
    url: pick(overrideUrl, env.SUPABASE_URL) || "",
    publishableKey: pick(overrideKey, env.SUPABASE_PUBLISHABLE_KEY) || "",
    projectId: pick(env.APP_SUPABASE_PROJECT_ID, env.SUPABASE_PROJECT_ID),
    provider: isSelfHosted ? "self-hosted" : "lovable-cloud",
  };

  if (opts?.withServiceRole) {
    cfg.serviceRoleKey = isSelfHosted
      ? pick(env.APP_SUPABASE_SERVICE_ROLE_KEY)
      : pick(env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return cfg;
}

/** Key kiểu mới (`sb_publishable_` / `sb_secret_`) là chuỗi mờ, không phải JWT. */
export function isOpaqueApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

/** fetch bọc header `apikey` đúng chuẩn cho cả key JWT cũ lẫn key `sb_` mới. */
export function backendFetch(apiKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isOpaqueApiKey(apiKey) && headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", apiKey);
    return fetch(input, { ...init, headers });
  };
}
