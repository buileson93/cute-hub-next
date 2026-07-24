// ============================================================================
// MultiSignatureFlow.tsx — Quy trình ký nhiều người có thứ tự.
// Cấu hình: field.columns = [{key,label}] mô tả từng người ký (role_hint = label).
// Giá trị lưu: Array<SignatureSlot>. Người dùng hiện tại chỉ ký được ô "chờ ký"
// ĐẦU TIÊN còn trống (theo thứ tự). Đã ký thì khoá lại, cho phép xoá để ký lại
// (nếu là chính chủ hoặc chưa ai ký sau đó).
// ============================================================================
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Trash2, PenLine } from "lucide-react";
import { SignaturePad } from "./SignaturePad";
import { useSession } from "@/hooks/use-session";

export type SignatureSlot = {
  key: string;
  label: string;
  signer_id?: string | null;
  signer_name?: string | null;
  signed_at?: string | null;
  data_url?: string | null; // dataURL PNG hoặc path storage sau khi upload
};

export type SignerConfig = { key: string; label: string };

export function MultiSignatureFlow({
  value, onChange, signers, disabled,
}: {
  value: SignatureSlot[];
  onChange: (v: SignatureSlot[]) => void;
  signers: SignerConfig[];
  disabled?: boolean;
}) {
  const { session, profile } = useSession();
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  // Đồng bộ danh sách slot theo cấu hình signers (giữ dữ liệu đã ký nếu có).
  const slots: SignatureSlot[] = signers.map((s) => {
    const existing = value.find((x) => x.key === s.key);
    return existing ?? { key: s.key, label: s.label };
  });

  const firstPendingIdx = slots.findIndex((s) => !s.signed_at);

  const commitSign = (slotKey: string, dataUrl: string | null) => {
    if (!dataUrl) return;
    const idx = slots.findIndex((s) => s.key === slotKey);
    if (idx < 0) return;
    slots[idx] = {
      ...slots[idx],
      signer_id: session?.user.id ?? null,
      signer_name: profile?.ho_ten ?? session?.user.email ?? null,
      signed_at: new Date().toISOString(),
      data_url: dataUrl,
    };
    onChange([...slots]);
    setOpenSlot(null);
    setPending(null);
  };

  const clearSlot = (slotKey: string) => {
    const idx = slots.findIndex((s) => s.key === slotKey);
    if (idx < 0) return;
    slots[idx] = { key: slots[idx].key, label: slots[idx].label };
    onChange([...slots]);
  };

  return (
    <div className="space-y-2 rounded-md border p-2">
      {slots.map((s, i) => {
        const signed = !!s.signed_at;
        const isNext = !signed && i === firstPendingIdx;
        const canSignHere = !disabled && isNext;
        const canClear = !disabled && signed && s.signer_id === session?.user.id
          && !slots.slice(i + 1).some((x) => x.signed_at);
        return (
          <div key={s.key} className="rounded border bg-background p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">#{i + 1}</Badge>
                <span className="text-sm font-medium">{s.label}</span>
                {signed ? (
                  <Badge className="bg-emerald-600 text-white"><Check className="mr-1 h-3 w-3" />Đã ký</Badge>
                ) : isNext ? (
                  <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Chờ ký</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Chưa tới lượt</Badge>
                )}
              </div>
              <div className="flex gap-1">
                {canSignHere && (
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => setOpenSlot(openSlot === s.key ? null : s.key)}>
                    <PenLine className="mr-1 h-3.5 w-3.5" />Ký
                  </Button>
                )}
                {canClear && (
                  <Button type="button" size="sm" variant="ghost"
                    onClick={() => clearSlot(s.key)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" />Xoá ký
                  </Button>
                )}
              </div>
            </div>

            {signed && s.data_url?.startsWith("data:") && (
              <img src={s.data_url} alt="chữ ký" className="mt-2 h-16 rounded border bg-white object-contain" />
            )}
            {signed && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {s.signer_name || s.signer_id || "?"} · {s.signed_at ? new Date(s.signed_at).toLocaleString("vi-VN") : ""}
              </p>
            )}

            {openSlot === s.key && canSignHere && (
              <div className="mt-2">
                <SignaturePad value={pending} onChange={setPending} height={140} />
                <div className="mt-2 flex justify-end gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setOpenSlot(null); setPending(null); }}>
                    Huỷ
                  </Button>
                  <Button type="button" size="sm" onClick={() => commitSign(s.key, pending)} disabled={!pending}>
                    <Check className="mr-1 h-3.5 w-3.5" />Xác nhận ký
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {signers.length === 0 && (
        <p className="text-xs text-muted-foreground">Chưa cấu hình người ký. Vào Thiết kế mẫu, thêm cột (key/label) cho trường chữ ký để bật quy trình ký nhiều người.</p>
      )}
    </div>
  );
}
