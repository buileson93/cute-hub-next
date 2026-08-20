import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { SavingIndicator } from "@/components/mirats/SavingIndicator";
import { OfflineBanner } from "@/components/mirats/OfflineBanner";


function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const isDev = import.meta.env.DEV;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Đã xảy ra lỗi khi tải trang
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đã có lỗi không mong muốn xảy ra. Bạn có thể thử tải lại trang hoặc quay về trang chủ.
        </p>
        
        {isDev && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg text-left overflow-auto max-h-[300px] border border-red-200 dark:border-red-900">
            <p className="text-xs font-mono text-red-600 dark:text-red-400 font-bold mb-1">
              [DEBUG ERROR]: {error.message}
            </p>
            <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">
              {error.stack}
            </pre>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Thử lại
          </button>
          <button
            onClick={() => {
              try {
                localStorage.clear();
                window.location.href = "/";
              } catch (e) {
                window.location.href = "/";
              }
            }}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Xoá cache & Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MIRATS — VATM Middle Region CMMS" },
      {
        name: "description",
        content:
          "Hệ thống quản lý tài sản kỹ thuật của Công ty Quản lý bay miền Trung. Vận hành 1.486 tài sản trên 6 đài kiểm soát không lưu.",
      },
      { name: "author", content: "VATM Middle Region" },
      { property: "og:title", content: "MIRATS — VATM Middle Region CMMS" },
      {
        property: "og:description",
        content:
          "Hệ thống quản lý tài sản kỹ thuật của Công ty Quản lý bay miền Trung. Vận hành 1.486 tài sản trên 6 đài kiểm soát không lưu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MIRATS — VATM Middle Region CMMS" },
      { name: "twitter:description", content: "Hệ thống quản lý tài sản kỹ thuật của Công ty Quản lý bay miền Trung. Vận hành 1.486 tài sản trên 6 đài kiểm soát không lưu." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8cfa19cc-e31a-45f0-aae3-9f880fc5b3b3/id-preview-d301bd18--56d952f4-c039-4fe2-859c-da5794db3823.lovable.app-1783491132295.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8cfa19cc-e31a-45f0-aae3-9f880fc5b3b3/id-preview-d301bd18--56d952f4-c039-4fe2-859c-da5794db3823.lovable.app-1783491132295.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=localStorage.getItem('mirats.density');if(d==='compact')document.documentElement.dataset.density='compact';}catch(e){}",
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { useBanQuyenAlertScanner } from "@/lib/mirats/ban-quyen-alerts";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  
  useBanQuyenAlertScanner();

  useEffect(() => {
    // Đồng bộ nguồn dữ liệu (Lovable Cloud hay Supabase ngoài do quản trị chọn).
    void (async () => {
      try {
        const [{ getActiveBackend }, rt] = await Promise.all([
          import("@/lib/supabase-ngoai.functions"),
          import("@/lib/backend/runtime-source"),
        ]);
        const active = await getActiveBackend();
        if (rt.writeBackendOverride(active)) rt.applyBackendOverrideAndReload(active);
      } catch {
        /* không đồng bộ được → giữ nguyên nguồn hiện tại */
      }
    })();
  }, []);

  useEffect(() => {

    // Task 35 — bắt lỗi hết phiên global để đăng xuất mềm, không vòng redirect.
    let cleanup: (() => void) | undefined;
    void import("@/lib/mirats/auth/soft-signout").then((m) => {
      cleanup = m.cauHinhBatLoiHetPhien();
    });
    // Task 38 — cài đặt bộ thu lỗi runtime tập trung.
    void import("@/lib/observability/capture").then((m) => {
      m.installGlobalErrorHandlers();
      m.setTag("app", "mirats");
      if (import.meta.env.MODE) m.setTag("env", String(import.meta.env.MODE));
    });
    return () => cleanup?.();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AstryxProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AstryxProvider>
      <Toaster />
      <SavingIndicator />
      <OfflineBanner />
    </QueryClientProvider>
  );
}
