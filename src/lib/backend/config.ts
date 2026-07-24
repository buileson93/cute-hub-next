/**
 * Backend configuration layer — single source of truth for backend env vars.
 *
 * Dùng lớp này thay vì đọc `process.env.SUPABASE_*` / `import.meta.env.VITE_SUPABASE_*`
 * rải rác. Khi đổi sang backend Supabase tự chủ, chỉ cần cập nhật env vars —
 * không phải sửa nhiều file gọi.
 *
 * Quy tắc:
 * - `serverBackendConfig()`: gọi trong `createServerFn` handler / server route handler.
 * - `browserBackendConfig()`: gọi trong component/hook trình duyệt.
 * - KHÔNG đọc `process.env` ở module scope (breaks SSR + client bundle).
 */

export interface ServerBackendConfig {
  url: string;
  publishableKey: string;
  serviceRoleKey?: string; // chỉ có khi caller thực sự cần admin
  projectId: string;
}

export interface BrowserBackendConfig {
  url: string;
  publishableKey: string;
  projectId: string;
}

function req(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`[backend/config] Missing env var: ${name}`);
  }
  return value;
}

/**
 * Đọc cấu hình server. Gọi bên trong `.handler()` — không phải module scope.
 */
export function serverBackendConfig(opts?: { withServiceRole?: boolean }): ServerBackendConfig {
  const cfg: ServerBackendConfig = {
    url: req("SUPABASE_URL", process.env.SUPABASE_URL),
    publishableKey: req("SUPABASE_PUBLISHABLE_KEY", process.env.SUPABASE_PUBLISHABLE_KEY),
    projectId: req("SUPABASE_PROJECT_ID", process.env.SUPABASE_PROJECT_ID),
  };
  if (opts?.withServiceRole) {
    cfg.serviceRoleKey = req("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return cfg;
}

/**
 * Đọc cấu hình cho code chạy trong browser.
 */
export function browserBackendConfig(): BrowserBackendConfig {
  return {
    url: req("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL),
    publishableKey: req(
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    ),
    projectId: req("VITE_SUPABASE_PROJECT_ID", import.meta.env.VITE_SUPABASE_PROJECT_ID),
  };
}

/**
 * Public URL của app (dùng cho cron endpoints, email templates).
 * Ưu tiên đọc từ bảng `app_cai_dat.public_app_url` khi cần động.
 * Fallback về env `PUBLIC_APP_URL` (server) hoặc `window.location.origin` (browser).
 */
export function publicAppUrlFromEnv(): string | undefined {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.PUBLIC_APP_URL;
}
