import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/admin/kiem-tra-layout")({
  head: () => ({ meta: [{ title: "Kiểm tra layout — MIRATS" }] }),
  component: KiemTraLayoutPage,
});

type Preset = { label: string; w: number; h: number; device: string };
const PRESETS: Preset[] = [
  { label: "Mobile 375", w: 375, h: 667, device: "iPhone SE" },
  { label: "Mobile 414", w: 414, h: 896, device: "iPhone XR" },
  { label: "Tablet 768", w: 768, h: 1024, device: "iPad" },
  { label: "Máy tính 1024", w: 1024, h: 768, device: "Laptop nhỏ" },
  { label: "Desktop 1280", w: 1280, h: 800, device: "Máy tính chuẩn" },
  { label: "Desktop 1536", w: 1536, h: 864, device: "Màn hình lớn" },
];

const ROUTES_TO_CHECK = [
  "/",
  "/thiet-bi",
  "/he-thong/cay",
  "/he-thong/cay?view=table",
  "/bao-tri",
  "/sap-het-han",
  "/admin/kiem-tra-so-lieu",
];

type CheckResult = {
  overflowY: boolean;
  overflowX: boolean;
  scrollH: number;
  scrollW: number;
  innerH: number;
  innerW: number;
};

function KiemTraLayoutPage() {
  const [path, setPath] = useState("/he-thong/cay?view=table");
  const [results, setResults] = useState<Record<string, CheckResult | null>>({});
  const [reloadTick, setReloadTick] = useState(0);

  const check = (iframe: HTMLIFrameElement | null, key: string) => {
    if (!iframe) return;
    try {
      const w = iframe.contentWindow;
      const d = w?.document;
      if (!w || !d) return;
      const r: CheckResult = {
        scrollH: d.documentElement.scrollHeight,
        scrollW: d.documentElement.scrollWidth,
        innerH: w.innerHeight,
        innerW: w.innerWidth,
        overflowY: d.documentElement.scrollHeight > w.innerHeight + 2,
        overflowX: d.documentElement.scrollWidth > w.innerWidth + 2,
      };
      setResults((s) => ({ ...s, [key]: r }));
    } catch {
      setResults((s) => ({ ...s, [key]: null }));
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Kiểm tra layout theo viewport</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tự động render trang trong các iframe kích thước phổ biến. Trang nào có nội dung vượt
              chiều cao viewport sẽ được đánh dấu <b>tràn dọc</b>. Vượt chiều rộng đánh dấu{" "}
              <b>tràn ngang</b>.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setResults({});
              setReloadTick((t) => t + 1);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Chạy lại
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Đường dẫn tuỳ chọn:</span>
            <Input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="max-w-md"
              placeholder="/he-thong/cay"
            />
            <span className="text-sm text-muted-foreground">Hoặc chọn nhanh:</span>
            {ROUTES_TO_CHECK.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={path === r ? "default" : "outline"}
                onClick={() => setPath(r)}
              >
                {r}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {PRESETS.map((p) => {
              const key = `${p.w}-${path}-${reloadTick}`;
              const res = results[key];
              const ok = res && !res.overflowY && !res.overflowX;
              return (
                <div key={p.label} className="rounded-lg border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {p.label} <span className="text-xs text-muted-foreground">({p.device})</span>
                    </div>
                    {res == null ? (
                      <Badge variant="outline">Đang kiểm tra…</Badge>
                    ) : ok ? (
                      <Badge className="gap-1 border-success/30 bg-success/10 text-success hover:bg-success/20">
                        <CheckCircle2 className="h-3 w-3" /> OK
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {res.overflowY && res.overflowX
                          ? "Tràn 2 chiều"
                          : res.overflowY
                            ? "Tràn dọc"
                            : "Tràn ngang"}
                      </Badge>
                    )}
                  </div>
                  <div
                    className="relative overflow-hidden rounded border bg-muted/30"
                    style={{ height: 260 }}
                  >
                    <iframe
                      key={key}
                      src={path}
                      title={p.label}
                      className="origin-top-left border-0"
                      style={{
                        width: p.w,
                        height: p.h,
                        transform: `scale(${Math.min(1, 380 / p.w)})`,
                        transformOrigin: "top left",
                      }}
                      onLoad={(e) => {
                        // đo sau khi trang bên trong render xong
                        setTimeout(() => check(e.currentTarget, key), 400);
                      }}
                    />
                  </div>
                  {res && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Nội dung: {res.scrollW}×{res.scrollH}px · Viewport: {res.innerW}×{res.innerH}
                      px
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
