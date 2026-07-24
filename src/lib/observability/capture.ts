// ============================================================================
// Observability — Thu thập lỗi runtime tập trung.
//
// Kênh gửi lỗi: cầu qua Lovable error reporter đã có sẵn
// (`window.__lovableEvents.captureException`, xem `src/lib/lovable-error-reporting.ts`).
// Module này mở rộng: kèm user context, breadcrumbs, tag môi trường, và cung
// cấp API đồng nhất cho toàn bộ ứng dụng.
// ============================================================================

type Severity = "fatal" | "error" | "warning" | "info" | "debug";

type UserContext = {
  id?: string | null;
  email?: string | null;
  ho_ten?: string | null;
  role?: string | null;
};

type Breadcrumb = {
  ts: number;
  category: string;
  message: string;
  data?: Record<string, unknown>;
};

const MAX_BREADCRUMBS = 30;
const state = {
  user: {} as UserContext,
  breadcrumbs: [] as Breadcrumb[],
  tags: {} as Record<string, string>,
};

/** Gắn user hiện tại vào mọi báo cáo lỗi tiếp theo. */
export function setUserContext(user: UserContext | null | undefined): void {
  state.user = user ?? {};
}

/** Gắn tag toàn cục (ví dụ: environment, release). */
export function setTag(key: string, value: string): void {
  state.tags[key] = value;
}

/** Ghi lại một hành động của người dùng để đính kèm khi có lỗi tiếp theo. */
export function addBreadcrumb(bc: Omit<Breadcrumb, "ts">): void {
  state.breadcrumbs.push({ ts: Date.now(), ...bc });
  if (state.breadcrumbs.length > MAX_BREADCRUMBS) {
    state.breadcrumbs.splice(0, state.breadcrumbs.length - MAX_BREADCRUMBS);
  }
}

/**
 * Gửi lỗi ra kênh giám sát trung tâm.
 * Không throw lại — chỉ log + forward. Client-side only.
 */
export function captureError(
  error: unknown,
  extra: Record<string, unknown> = {},
  severity: Severity = "error",
): void {
  if (typeof window === "undefined") {
    // SSR — chỉ log console; kênh trung tâm được xử lý ở edge/log.
    // eslint-disable-next-line no-console
    console.error("[observability]", error, extra);
    return;
  }

  const context = {
    ...extra,
    route: window.location.pathname + window.location.search,
    user: state.user,
    tags: state.tags,
    breadcrumbs: state.breadcrumbs.slice(),
    ua: navigator.userAgent,
  };

  try {
    window.__lovableEvents?.captureException?.(error, context, {
      mechanism: "manual",
      handled: severity !== "fatal",
      severity: severity === "fatal" ? "error" : (severity as "error" | "warning" | "info"),
    });
  } catch {
    /* ignore reporter failures */
  }

  // eslint-disable-next-line no-console
  console.error("[observability]", severity, error, context);
}

/** Đăng ký handler bắt lỗi toàn cục (gọi 1 lần trong bootstrap). */
export function installGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __miratsObsInstalled?: boolean }).__miratsObsInstalled) return;
  (window as unknown as { __miratsObsInstalled?: boolean }).__miratsObsInstalled = true;

  window.addEventListener("error", (e) => {
    captureError(e.error ?? new Error(e.message), { source: "window.error" });
  });
  window.addEventListener("unhandledrejection", (e) => {
    captureError(e.reason ?? new Error("Unhandled rejection"), {
      source: "unhandledrejection",
    });
  });
}
