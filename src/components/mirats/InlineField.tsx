// ============================================================================
// Task 31 — InlineField: sửa nhanh 1 trường tại chỗ.
//
// - Chỉ mở edit khi `canWrite(domain, roles)` (Task 26).
// - Enter lưu, Esc huỷ, click ngoài huỷ.
// - Validate qua `validateField` (Task 31 pure).
// - Ghi qua `supabase.rpc(...)` bằng payload từ `buildUpdatePayload` — nguồn
//   sự thật ở DB, audit_log tự động (trigger sẵn có).
// - Optimistic: cập nhật queryCache trước; rollback khi RPC lỗi + toast.
// ============================================================================
import * as React from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

import {
  validateField, buildUpdatePayload, type Loai,
} from "@/lib/mirats/ui/inline-edit";
import { canWrite, type Domain } from "@/lib/mirats/quyen";
import type { AppRole } from "@/hooks/use-session";

const LOAI_TO_DOMAIN: Record<Loai, Domain> = {
  thiet_bi: "thiet_bi",
  su_co: "su_co",
  van_de: "van_de",
  cong_viec: "cong_viec",
  hong_hoc: "hong_hoc",
  ban_giao: "ban_giao",
  giay_phep: "giay_phep",
  vat_tu: "vat_tu",
  kho: "kho",
};

export interface InlineFieldProps {
  loai: Loai;
  id: string;
  field: string;
  giaTri: string | number | null | undefined;
  roles?: readonly AppRole[] | null;
  /** Trạng thái hiện tại (dùng cho state-machine field). */
  truoc?: string | null;
  /** Key TanStack Query cần invalidate sau khi ghi. */
  invalidateKey?: readonly unknown[];
  /** Placeholder khi rỗng. */
  placeholder?: string;
  className?: string;
}

export function InlineField({
  loai, id, field, giaTri, roles, truoc, invalidateKey, placeholder = "—", className,
}: InlineFieldProps) {
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState<string>(giaTri == null ? "" : String(giaTri));
  const [loi, setLoi] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setValue(giaTri == null ? "" : String(giaTri));
  }, [giaTri]);

  const domain = LOAI_TO_DOMAIN[loai];
  const coQuyen = canWrite(domain, roles ?? []);

  const mutation = useMutation({
    mutationFn: async (raw: string) => {
      const kq = validateField(loai, field, raw, truoc ?? undefined);
      if (!kq.hopLe) throw new Error(kq.loi.join("; "));
      const payload = buildUpdatePayload(loai, id, field, kq.giaTriChuan);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc(payload.rpc, payload.args);
      if (error) throw new Error(error.message);
      return kq.giaTriChuan;
    },
    onSuccess: () => {
      toast.success("Đã lưu");
      if (invalidateKey) qc.invalidateQueries({ queryKey: [...invalidateKey] });
      setEditing(false);
      setLoi(null);
    },
    onError: (e: Error) => {
      setLoi(e.message);
      toast.error("Không lưu được: " + e.message);
      // Rollback = hiện lại giá trị gốc
      setValue(giaTri == null ? "" : String(giaTri));
    },
  });

  const huy = () => {
    setValue(giaTri == null ? "" : String(giaTri));
    setLoi(null);
    setEditing(false);
  };

  const luu = () => mutation.mutate(value);

  if (!coQuyen) {
    return (
      <span className={cn("text-sm", className)}>
        {giaTri == null || giaTri === "" ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          String(giaTri)
        )}
      </span>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "group inline-flex max-w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-sm hover:bg-accent",
          className,
        )}
        aria-label={`Sửa ${field}`}
      >
        <span className="truncate">
          {giaTri == null || giaTri === "" ? (
            <span className="text-muted-foreground italic">{placeholder}</span>
          ) : (
            String(giaTri)
          )}
        </span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60" aria-hidden />
      </button>
    );
  }

  return (
    <div className={cn("flex items-start gap-1", className)}>
      <div className="flex-1">
        <Input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); luu(); }
            if (e.key === "Escape") { e.preventDefault(); huy(); }
          }}
          disabled={mutation.isPending}
          className="h-8 text-sm"
          aria-invalid={loi != null}
          aria-describedby={loi ? `${id}-${field}-err` : undefined}
        />
        {loi && (
          <p
            id={`${id}-${field}-err`}
            className="mt-1 text-xs text-destructive"
            role="alert"
          >
            {loi}
          </p>
        )}
      </div>
      <Button
        type="button" size="icon" variant="ghost"
        className="h-8 w-8" onClick={luu}
        disabled={mutation.isPending}
        aria-label="Lưu"
      >
        {mutation.isPending
          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          : <Check className="h-4 w-4" aria-hidden />}
      </Button>
      <Button
        type="button" size="icon" variant="ghost"
        className="h-8 w-8" onClick={huy}
        disabled={mutation.isPending}
        aria-label="Huỷ"
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
