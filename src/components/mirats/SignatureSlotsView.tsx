// ============================================================================
// SignatureSlotsView.tsx — Hiển thị read-only các ô chữ ký đã lưu.
// Ảnh chữ ký có thể ở 3 dạng: (1) dataURL PNG inline, (2) FormAttachment với
// storage `path` (cần sign URL), (3) URL trực tiếp.
// ============================================================================
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Loader2 } from "lucide-react";
import type { SignatureSlot } from "./MultiSignatureFlow";
import { signedUrl, type FormAttachment } from "@/lib/mirats/form-attachments";

type SigLike = string | FormAttachment | null | undefined;

function isAttachment(v: SigLike): v is FormAttachment {
  return !!v && typeof v === "object" && typeof (v as FormAttachment).path === "string";
}

function SignatureImg({ src, alt }: { src: SigLike; alt: string }) {
  const [resolved, setResolved] = useState<string | null>(() =>
    typeof src === "string" ? src : null,
  );
  const [loading, setLoading] = useState<boolean>(isAttachment(src));

  useEffect(() => {
    let cancelled = false;
    if (typeof src === "string") {
      setResolved(src);
      setLoading(false);
      return;
    }
    if (isAttachment(src)) {
      setLoading(true);
      signedUrl(src.path)
        .then((u) => { if (!cancelled) setResolved(u); })
        .finally(() => { if (!cancelled) setLoading(false); });
    } else {
      setResolved(null);
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [src]);

  if (loading) {
    return (
      <div className="mt-2 flex h-14 items-center justify-center rounded border bg-muted/30">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!resolved) {
    return <div className="mt-2 flex h-14 items-center justify-center rounded border bg-muted/20 text-[11px] text-muted-foreground">Không tải được ảnh</div>;
  }
  return <img src={resolved} alt={alt} className="mt-2 h-14 w-full rounded border bg-white object-contain" />;
}

export function SignatureSlotsView({ slots, compact }: { slots: SignatureSlot[]; compact?: boolean }) {
  if (!slots || slots.length === 0) {
    return <span className="text-xs text-muted-foreground">Chưa có chữ ký.</span>;
  }
  return (
    <div className={compact ? "flex flex-wrap gap-2" : "space-y-2"}>
      {slots.map((s, i) => {
        const signed = !!s.signed_at;
        return (
          <div key={s.key ?? i} className={`rounded border bg-background p-2 ${compact ? "w-44" : ""}`}>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">#{i + 1}</Badge>
              <span className="truncate text-sm font-medium">{s.label}</span>
              {signed ? (
                <Badge className="bg-primary text-primary-foreground"><Check className="mr-1 h-3 w-3" />Đã ký</Badge>
              ) : (
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border shadow-none"><Clock className="mr-1 h-3 w-3" />Chờ ký</Badge>
              )}
            </div>
            {signed && <SignatureImg src={s.data_url as SigLike} alt={`chữ ký ${s.label}`} />}
            {signed && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {s.signer_name || s.signer_id || "?"}
                {s.signed_at ? ` · ${new Date(s.signed_at).toLocaleString("vi-VN")}` : ""}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Ô chữ ký đơn (không cấu hình nhiều người). */
export function SingleSignatureView({ value, signedAt }: { value: unknown; signedAt?: string | null }) {
  if (!value) return <span className="text-xs text-muted-foreground">Chưa ký.</span>;
  const src = (typeof value === "string" || isAttachment(value as SigLike)) ? (value as SigLike) : null;
  if (!src) return <span className="text-xs text-muted-foreground">Chưa ký.</span>;
  return (
    <div className="inline-block rounded border bg-white p-1">
      <SignatureImg src={src} alt="chữ ký" />
      {signedAt && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {new Date(signedAt).toLocaleString("vi-VN")}
        </p>
      )}
    </div>
  );
}
