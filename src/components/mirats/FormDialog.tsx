import { useState } from "react";
import type { ZodSchema } from "zod";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NHAN } from "@/lib/mirats/tu-vung";
import { toast } from "sonner";

// Task 26 — Dialog nhập liệu chuẩn: validate bằng zod + bước "Xem trước tác động"
// bắt buộc trước khi ghi. Đồng bộ với luồng preview của Task 19/21.
export interface FormDialogProps<TValues, TPreview> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  values: TValues;
  schema: ZodSchema<TValues>;
  /** JSX form. Nhận errors theo tên trường để render lỗi cạnh input. */
  renderForm: (ctx: { errors: Record<string, string>; disabled: boolean }) => React.ReactNode;
  /** Tính toán tóm tắt tác động (số bản ghi tạo/cập nhật, cảnh báo…). */
  previewTacDong: (values: TValues) => TPreview | Promise<TPreview>;
  /** Render tóm tắt tác động cho người dùng đối soát. */
  renderPreview: (preview: TPreview) => React.ReactNode;
  /** Handler ghi chính thức. */
  onConfirm: (values: TValues, preview: TPreview) => void | Promise<void>;
  submitLabel?: string;
  successMessage?: string;
}

type Step = "form" | "preview";

export function FormDialog<TValues, TPreview>({
  open, onOpenChange, title, description,
  values, schema, renderForm, previewTacDong, renderPreview,
  onConfirm, submitLabel = NHAN.luu, successMessage,
}: FormDialogProps<TValues, TPreview>) {
  const [step, setStep] = useState<Step>("form");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<TPreview | null>(null);
  const [busy, setBusy] = useState(false);

  function close(o: boolean) {
    if (busy) return;
    if (!o) {
      setStep("form");
      setErrors({});
      setPreview(null);
    }
    onOpenChange(o);
  }

  async function goPreview() {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const iss of parsed.error.issues) {
        const key = iss.path.join(".");
        if (key && !map[key]) map[key] = iss.message;
      }
      setErrors(map);
      toast.error("Vui lòng sửa các lỗi trong biểu mẫu");
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const p = await previewTacDong(parsed.data);
      setPreview(p);
      setStep("preview");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tính được tác động");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview) return;
    setBusy(true);
    try {
      const parsed = schema.parse(values);
      await onConfirm(parsed, preview);
      if (successMessage) toast.success(successMessage);
      close(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không lưu được");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-3">{renderForm({ errors, disabled: busy })}</div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {NHAN.xemTruoc}
            </div>
            {preview && renderPreview(preview)}
          </div>
        )}

        <DialogFooter>
          {step === "form" ? (
            <>
              <Button variant="ghost" onClick={() => close(false)} disabled={busy}>
                {NHAN.huy}
              </Button>
              <Button onClick={goPreview} disabled={busy}>
                {busy ? "Đang tính…" : NHAN.xemTruoc}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep("form")} disabled={busy}>
                {NHAN.quayLai}
              </Button>
              <Button onClick={commit} disabled={busy}>
                {busy ? "Đang lưu…" : submitLabel}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
