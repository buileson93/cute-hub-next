import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// GĐ3-04 — QR Scanner in-app
// Ưu tiên `BarcodeDetector` (native), fallback `@zxing/browser`.
// Cleanup camera track khi unmount.

type Props = {
  onDetect: (code: string) => void;
  className?: string;
};

// Trích mã thiết bị từ URL /q/<ma> hoặc trả về nguyên chuỗi.
export function extractMaThietBi(raw: string): string {
  const s = raw.trim();
  const m = s.match(/\/q\/([^/?#\s]+)/i);
  return decodeURIComponent(m ? m[1] : s);
}

export function QRScanner({ onDetect, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "denied" | "error">("idle");
  const [manual, setManual] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    zxingControlsRef.current?.stop();
    zxingControlsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function start() {
    setErrMsg(null);
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play().catch(() => {});
      setStatus("scanning");

      // 1) BarcodeDetector native
      const AnyWin = window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (src: CanvasImageSource) => Promise<Array<{ rawValue: string }>> } };
      if (AnyWin.BarcodeDetector) {
        const detector = new AnyWin.BarcodeDetector({ formats: ["qr_code"] });
        const tick = async () => {
          if (!videoRef.current || status === "idle") return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length > 0) {
              const val = codes[0].rawValue;
              handleDetected(val);
              return;
            }
          } catch { /* ignore per-frame errors */ }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // 2) ZXing fallback
      const mod = await import("@zxing/browser");
      const reader = new mod.BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoElement(video, (result) => {
        if (result) handleDetected(result.getText());
      });
      zxingControlsRef.current = controls;
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setStatus("denied");
      } else {
        setStatus("error");
        setErrMsg(err?.message ?? "Không mở được camera");
      }
      cleanup();
    }
  }

  function handleDetected(raw: string) {
    cleanup();
    setStatus("idle");
    onDetect(extractMaThietBi(raw));
  }

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const v = manual.trim();
    if (v) onDetect(extractMaThietBi(v));
  };

  return (
    <div className={className}>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-black/90">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {status !== "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white/90">
            {status === "starting" ? (
              <><Loader2 className="h-8 w-8 animate-spin" /><span>Đang mở camera…</span></>
            ) : status === "denied" ? (
              <><CameraOff className="h-8 w-8" /><span className="px-6 text-center text-sm">Chưa cấp quyền camera. Nhập mã bên dưới.</span></>
            ) : status === "error" ? (
              <><CameraOff className="h-8 w-8" /><span className="px-6 text-center text-sm">{errMsg}</span></>
            ) : (
              <>
                <QrCode className="h-10 w-10 opacity-70" />
                <Button onClick={start} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  <Camera className="h-4 w-4" /> Bật camera quét
                </Button>
              </>
            )}
          </div>
        )}
        {status === "scanning" && (
          <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        )}
      </div>

      <form onSubmit={submitManual} className="mt-3 flex items-center gap-2">
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Nhập mã thiết bị hoặc dán link…"
          aria-label="Nhập mã thiết bị"
        />
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Mở</Button>
      </form>
      {status === "scanning" && (
        <div className="mt-2 flex justify-end">
          <Button type="button" size="sm" variant="ghost" className="h-8 text-primary hover:text-primary/90 hover:bg-primary/5" onClick={() => { cleanup(); setStatus("idle"); }}>
            Tắt camera
          </Button>
        </div>
      )}
    </div>
  );
}
