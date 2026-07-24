import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Trình xem mô hình 3D / kết quả quét LiDAR (glb, gltf, và usdz cho AR trên iOS).
 * Định dạng phù hợp khi xuất từ Polycam: GLB (xem web) + USDZ (AR trên iPhone/iPad).
 * model-viewer là web component, chỉ đăng ký phía client để tránh lỗi SSR.
 */
export function Model3DViewer({
  url,
  iosUrl,
  className,
}: {
  url: string;
  iosUrl?: string;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await import("@google/model-viewer");
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Không tải được trình xem 3D");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !hostRef.current) return;
    const host = hostRef.current;
    host.innerHTML = "";
    const el = document.createElement("model-viewer");
    el.setAttribute("src", url);
    if (iosUrl) el.setAttribute("ios-src", iosUrl);
    el.setAttribute("camera-controls", "");
    el.setAttribute("touch-action", "pan-y");
    el.setAttribute("ar", "");
    el.setAttribute("ar-modes", "webxr scene-viewer quick-look");
    el.setAttribute("shadow-intensity", "1");
    el.setAttribute("exposure", "1");
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.backgroundColor = "#0b0b0f";
    el.style.borderRadius = "0.5rem";
    host.appendChild(el);
    return () => {
      host.innerHTML = "";
    };
  }, [ready, url, iosUrl]);

  return (
    <div className={className ?? "relative h-full w-full"}>
      <div ref={hostRef} className="h-full w-full rounded-lg bg-black" />
      {!ready && !err && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm text-white/80">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải mô hình 3D…
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
