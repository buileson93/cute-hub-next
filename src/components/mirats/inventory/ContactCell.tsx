// ============================================================================
// ContactCell & MetaPopover — hiển thị đầu mối liên hệ và metadata bổ sung
// cho bảng "Thành phần & Tài sản".
//
// Nguyên tắc:
//  - Ô liên hệ: đầu mối chính + badge "+N" (không liệt kê hết trong ô).
//  - Popover mở được bằng chuột lẫn bàn phím (trigger là <button>), Escape đóng
//    theo hành vi mặc định của Radix Popover.
//  - Không render dòng rỗng, không lặp lại giá trị đang hiển thị ở ô.
// ============================================================================

import { Building2, Factory, Truck, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContactEntry, ContactRole, MetaItem } from "@/lib/mirats/inventory/contact-format";

const ROLE_ICON: Record<ContactRole, typeof Building2> = {
  "Đơn vị quản lý": Building2,
  "Nhà cung cấp": Truck,
  "Hãng sản xuất": Factory,
};

function RoleIcon({ role }: { role: ContactRole }) {
  const Icon = ROLE_ICON[role];
  return (
    <>
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{role}: </span>
    </>
  );
}

/** Danh sách label/value gọn dùng chung cho popover. */
export function MetaList({ items }: { items: MetaItem[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-meta">
      {items.map((it) => (
        <div key={`${it.label}-${it.value}`} className="contents">
          <dt className="whitespace-nowrap text-muted-foreground">{it.label}</dt>
          <dd className="min-w-0 break-words font-medium text-foreground">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Affordance "xem thêm" cho MODEL/SERIAL. Không render gì khi không có
 * metadata bổ sung (tránh popover rỗng).
 */
export function MetaPopover({
  title,
  items,
  label,
  className,
}: {
  title: string;
  items: MetaItem[];
  label: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <Info className="h-3 w-3" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 text-mini font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        <MetaList items={items} />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Ô "Liên hệ": đầu mối chính + badge +N mở popover liệt kê đầy đủ.
 */
export function ContactCell({ contacts }: { contacts: ContactEntry[] }) {
  if (contacts.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const [main, ...rest] = contacts;
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="flex min-w-0 items-center gap-1">
        <RoleIcon role={main.role} />
        <span title={`${main.role}: ${main.name}`} className="truncate text-xs font-medium">
          {main.name}
        </span>
      </span>
      {rest.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Xem thêm ${rest.length} đầu mối liên hệ`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Badge variant="outline" className="h-4 shrink-0 px-1 text-mini tabular-nums">
                +{rest.length}
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 text-mini font-semibold uppercase tracking-wider text-muted-foreground">
              Đầu mối liên hệ
            </div>
            <MetaList items={contacts.map((c) => ({ label: c.role, value: c.name }))} />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
