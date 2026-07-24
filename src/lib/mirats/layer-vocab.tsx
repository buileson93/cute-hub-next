// ============================================================================
// NGUỒN CHÂN LÝ DUY NHẤT cho "3 lớp" của mô hình tài sản — dùng chung cho
// cây, bảng và ngăn (drawer) để BỐ CỤC CHI TIẾT gom nhóm & hiển thị NHẤT QUÁN.
//
//   1. Hệ thống          (ht) — hệ thống khai thác (đứng yên)
//   2. Thành phần hệ thống (tp) — vai trò / vị trí chức năng (đứng yên tại chỗ)
//   3. Tài sản vật lý    (tb) — máy cụ thể (di động, lắp/tháo vào vai trò)
//
// Mọi màu, icon, nhãn của từng lớp CHỈ khai báo ở đây; các nơi khác import về.
// ============================================================================
import type { ComponentType } from "react";
import { Network, Component, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

export type LayerKey = "ht" | "tp" | "tb";

export type LayerMeta = {
  key: LayerKey;
  /** Nhãn đầy đủ hiển thị ở tiêu đề nhóm. */
  label: string;
  /** Mô tả ngắn (một câu) — vai trò của lớp trong mô hình. */
  hint: string;
  Icon: ComponentType<{ className?: string }>;
  /** Màu chữ + icon của tiêu đề nhóm. */
  text: string;
  /** Class cho "pill/badge" nhỏ (viền + nền nhạt + chữ). */
  badge: string;
  /** Màu chấm/đường kẻ trang trí bên trái nhóm. */
  accent: string;
};

export const LAYER: Record<LayerKey, LayerMeta> = {
  ht: {
    key: "ht",
    label: "Hệ thống",
    hint: "Hệ thống khai thác — ngữ cảnh cấp cao (đơn vị, phân loại).",
    Icon: Network,
    text: "text-blue-600",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-600",
    accent: "bg-blue-500",
  },
  tp: {
    key: "tp",
    label: "Thành phần hệ thống",
    hint: "Vai trò / vị trí chức năng — đứng yên, tài sản lắp vào sẽ đảm nhận.",
    Icon: Component,
    text: "text-emerald-600",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    accent: "bg-emerald-500",
  },
  tb: {
    key: "tb",
    label: "Tài sản vật lý",
    hint: "Máy cụ thể — di động, tháo/lắp không làm đổi vai trò.",
    Icon: HardDrive,
    text: "text-primary",
    badge: "border-primary/30 bg-primary/10 text-primary",
    accent: "bg-primary",
  },
};

/**
 * Thứ tự hiển thị trong ngăn/thẻ chi tiết THIẾT BỊ (lấy máy làm trung tâm):
 * máy vật lý trước → vai trò đang đảm nhận → hệ thống bao ngoài.
 */
export const DEVICE_DETAIL_LAYERS: LayerKey[] = ["tb", "tp", "ht"];

/**
 * Thứ tự khi lấy THÀNH PHẦN làm trung tâm (từ cây / dialog thành phần):
 * vai trò trước → máy đang lắp → hệ thống.
 */
export const COMPONENT_DETAIL_LAYERS: LayerKey[] = ["tp", "tb", "ht"];

/** Nhãn pill nhỏ chỉ rõ "đây là lớp nào" — dùng cạnh tiêu đề/tên. */
export function LayerBadge({ layer, className }: { layer: LayerKey; className?: string }) {
  const m = LAYER[layer];
  const Icon = m.Icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0 text-[10px] font-semibold leading-5",
        m.badge,
        className,
      )}
      title={m.hint}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" />
      {m.label}
    </span>
  );
}

/**
 * Tiêu đề một NHÓM theo lớp — dùng thống nhất cho drawer / dialog / hover.
 * Có chấm màu + icon + nhãn lớp; `right` để đặt nút/hành động bên phải.
 */
export function LayerSectionHeader({
  layer,
  subtitle,
  right,
  className,
}: {
  layer: LayerKey;
  /** Chú thích phụ hiển thị mờ bên cạnh nhãn lớp (tuỳ chọn). */
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  const m = LAYER[layer];
  const Icon = m.Icon;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("h-3.5 w-1 shrink-0 rounded-full", m.accent)} />
      <Icon className={cn("h-4 w-4 shrink-0", m.text)} />
      <span className={cn("text-xs font-semibold uppercase tracking-wide", m.text)}>{m.label}</span>
      {subtitle && <span className="truncate text-[11px] font-normal text-muted-foreground">· {subtitle}</span>}
      {right && <span className="ml-auto">{right}</span>}
    </div>
  );
}
