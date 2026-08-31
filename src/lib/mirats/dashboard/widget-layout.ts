import {
  AVAILABLE_WIDGETS,
  DashboardWidgetConfig,
  WidgetType,
  WIDGET_GROUP,
  type WidgetGroup,
} from "@/lib/mirats/dashboard/widget-registry";

/**
 * Di chuyển widget `fromId` tới vị trí của `overId` (giữ nguyên mảng gốc).
 * Trả về mảng cũ nếu id không hợp lệ hoặc không có thay đổi.
 */
export function moveWidget(
  layout: DashboardWidgetConfig[],
  fromId: string,
  overId: string,
): DashboardWidgetConfig[] {
  if (fromId === overId) return layout;
  const from = layout.findIndex((w) => w.id === fromId);
  const to = layout.findIndex((w) => w.id === overId);
  if (from < 0 || to < 0) return layout;
  const next = layout.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Kiểm tra và làm sạch layout đã lưu (user pref có thể hỏng hoặc chứa widget đã bị gỡ).
 * Fallback về layout mặc định nếu dữ liệu không dùng được.
 */
export function sanitizeLayout(
  raw: unknown,
  fallback: DashboardWidgetConfig[],
): DashboardWidgetConfig[] {
  if (!Array.isArray(raw)) return fallback;
  const seen = new Set<string>();
  const cleaned = raw.flatMap((item): DashboardWidgetConfig[] => {
    if (!item || typeof item !== "object") return [];
    const w = item as Partial<DashboardWidgetConfig>;
    if (typeof w.id !== "string" || typeof w.type !== "string") return [];
    if (!(w.type in AVAILABLE_WIDGETS)) return [];
    if (seen.has(w.id)) return [];
    seen.add(w.id);
    const type = w.type as WidgetType;
    const width = typeof w.w === "number" && w.w >= 1 && w.w <= 12 ? Math.round(w.w) : undefined;
    return [
      {
        id: w.id,
        type,
        w: width ?? AVAILABLE_WIDGETS[type].defaultWidth,
        title: typeof w.title === "string" && w.title ? w.title : AVAILABLE_WIDGETS[type].title,
      },
    ];
  });
  return cleaned.length ? cleaned : fallback;
}

/**
 * Lọc layout theo nhóm chủ đề (tab). Trả về mảng rỗng khi nhóm chưa có widget nào,
 * để UI hiển thị empty-state có ngữ cảnh thay vì khung trống.
 */
export function filterLayoutByGroup(
  layout: DashboardWidgetConfig[],
  group: WidgetGroup,
): DashboardWidgetConfig[] {
  return layout.filter((w) => WIDGET_GROUP[w.type] === group);
}
