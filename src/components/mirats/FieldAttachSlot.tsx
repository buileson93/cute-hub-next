// ============================================================================
// FieldAttachSlot.tsx — Nút "Đính kèm" gọn nhẹ hiển thị dưới mọi trường form.
// Lưu FormAttachment[] vào `data.__attachments[fieldKey]` (sidecar).
// ============================================================================
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, ChevronDown, ChevronUp } from "lucide-react";
import { PhotoUpload } from "./PhotoUpload";
import type { FormAttachment } from "@/lib/mirats/form-attachments";

export function FieldAttachSlot({
  attachments, onChange, templateCode, draftId, fieldKey, disabled,
}: {
  attachments: FormAttachment[];
  onChange: (a: FormAttachment[]) => void;
  templateCode: string;
  draftId: string;
  fieldKey: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(attachments.length > 0);
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-meta text-muted-foreground hover:text-foreground"
      >
        <Paperclip className="h-3 w-3" />
        Đính kèm {attachments.length > 0 && `(${attachments.length})`}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-1 rounded border border-dashed bg-muted/20 p-2">
          <PhotoUpload
            value={attachments}
            onChange={onChange}
            templateCode={templateCode}
            draftId={draftId}
            fieldKey={`__att_${fieldKey}`}
            disabled={disabled}
            maxFiles={5}
          />
        </div>
      )}
    </div>
  );
}
