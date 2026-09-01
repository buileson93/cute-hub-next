import type { ComponentType, ReactNode } from "react";
import { Boxes, Cpu, FolderTree, Layers, Network } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Bộ khung form dùng chung cho các nghiệp vụ khai báo / chỉnh sửa / liên kết
 * dữ liệu (Danh sách, Cây phân cấp, Sơ đồ tổng thể).
 *
 * ponytail: chỉ gồm các primitive trình bày. Logic form (RHF/zod, mutation)
 * do màn hình sử dụng tự quản lý để giữ diff nhỏ.
 */

export type EntityKind = "pl" | "lv" | "nh" | "ht" | "tp" | "tb";

interface KindMeta {
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Lớp màu dùng cho badge — dựa trên token của design system. */
  badge: string;
}

export const ENTITY_META: Record<EntityKind, KindMeta> = {
  pl: { label: "Phân loại", icon: Layers, badge: "border-border bg-muted text-muted-foreground" },
  lv: { label: "Lĩnh vực", icon: Layers, badge: "border-border bg-muted text-muted-foreground" },
  nh: { label: "Nhóm hệ thống", icon: FolderTree, badge: "border-border bg-muted text-foreground" },
  ht: { label: "Hệ thống", icon: Network, badge: "border-primary/30 bg-primary/10 text-primary" },
  tp: { label: "Thành phần hệ thống", icon: Boxes, badge: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  tb: { label: "Tài sản", icon: Cpu, badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

export function EntityKindBadge({ kind, className }: { kind: EntityKind; className?: string }) {
  const meta = ENTITY_META[kind];
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-meta font-medium", meta.badge, className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </Badge>
  );
}

/** Header ngữ cảnh: loại đối tượng, mã, chế độ Tạo mới / Chỉnh sửa, trạng thái. */
export function EntityFormHeader({
  kind,
  title,
  code,
  mode,
  status,
  description,
  className,
}: {
  kind: EntityKind;
  title: ReactNode;
  code?: string | null;
  mode: "create" | "edit" | "view";
  status?: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <EntityKindBadge kind={kind} />
        {code ? (
          <Badge variant="outline" className="font-mono text-meta font-semibold">
            {code}
          </Badge>
        ) : null}
        <Badge variant="secondary" className="text-meta">
          {mode === "create" ? "Tạo mới" : mode === "edit" ? "Chỉnh sửa" : "Chỉ xem"}
        </Badge>
        {status}
      </div>
      <h2 className="truncate text-base font-semibold leading-tight">{title}</h2>
      {description ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

/** Một nhóm nghiệp vụ trong form. */
export function FormSection({
  title,
  icon: Icon,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3 rounded-lg border bg-card/40 p-3", className)}>
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            {Icon ? <Icon className="h-4 w-4 text-muted-foreground" aria-hidden /> : null}
            <span className="truncate">{title}</span>
          </div>
          {description ? (
            <p className="text-meta leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

/** Empty state chuẩn cho panel liên kết nhanh. */
export function FormEmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-md border border-dashed px-3 py-5 text-center">
      {Icon ? <Icon className="h-5 w-5 text-muted-foreground" aria-hidden /> : null}
      <p className="text-sm font-medium">{title}</p>
      {hint ? <p className="text-meta text-muted-foreground">{hint}</p> : null}
      {action}
    </div>
  );
}

/** Thanh hành động cố định ở đáy form. Hành động phá huỷ tách riêng khỏi Lưu. */
export function FormActionBar({
  primary,
  secondary,
  destructive,
  dirty,
  className,
}: {
  primary?: ReactNode;
  secondary?: ReactNode;
  destructive?: ReactNode;
  dirty?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 space-y-2 border-t bg-background/95 pt-3 backdrop-blur",
        className,
      )}
    >
      {dirty ? (
        <p className="text-meta font-medium text-amber-600 dark:text-amber-400">
          Có thay đổi chưa lưu.
        </p>
      ) : null}
      {primary || secondary ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {primary ? <div className="flex-1">{primary}</div> : null}
          {secondary ? <div className="flex-1">{secondary}</div> : null}
        </div>
      ) : null}
      {destructive ? <div className="border-t pt-2">{destructive}</div> : null}
    </div>
  );
}
