import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Trình xem ảnh 360° (equirectangular) dùng photo-sphere-viewer.
 * Thư viện chỉ nạp phía client (trong useEffect) để tránh lỗi SSR.
 */
export function PanoViewer({ url, className }: { url: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let viewer: { destroy: () => void } | null = null;
    let cancelled = false;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const [{ Viewer }] = await Promise.all([
          import("@photo-sphere-viewer/core"),
          import("@photo-sphere-viewer/core/index.css"),
        ]);
        if (cancelled || !containerRef.current) return;
        const v = new Viewer({
          container: containerRef.current,
          panorama: url,
          navbar: ["zoom", "move", "fullscreen"],
          defaultZoomLvl: 30,
          loadingTxt: "Đang tải ảnh 360°…",
        });
        viewer = v;
        v.addEventListener("ready", () => !cancelled && setLoading(false), { once: true });
        // Dự phòng nếu sự kiện ready không kích hoạt.
        setTimeout(() => !cancelled && setLoading(false), 1500);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Không hiển thị được ảnh 360°");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        viewer?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [url]);

  return (
    <div className={className ?? "relative h-full w-full"}>
      <div ref={containerRef} className="h-full w-full rounded-lg bg-black" />
      {loading && !err && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm text-white/80">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải ảnh 360°…
        </div>
      )}
      {err && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-destructive">
          {err}
        </div>
      )}
    </div>
  );
}
