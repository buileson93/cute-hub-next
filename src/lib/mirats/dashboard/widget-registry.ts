export type WidgetType =
  | "reliability-kpi"
  | "mttr-kpi"
  | "mtbf-kpi"
  | "pm-kpi"
  | "su-co-trend"
  | "asset-status-pie"
  | "health-donut"
  | "completeness-gauge"
  | "live-timeline"
  | "emergency-kpi"
  | "pm-due-kpi"
  | "pm-overdue-kpi"
  | "asset-type-bar"
  | "su-co-heatmap"
  | "top-he-thong-su-co"
  | "top-thiet-bi-hong-lap"
  | "project-health-bar"
  | "task-status-distribution"
  | "task-completion-trend"
  | "task-due-summary"
  | "dossier-compliance-heatmap"
  | "expiry-timeline";


export interface DashboardWidgetConfig {
  id: string;
  type: WidgetType;
  w: number; // width in grid columns (1-12)
  h?: number; // optional height hint
  title: string;
}

export const AVAILABLE_WIDGETS: Record<
  WidgetType,
  { title: string; defaultWidth: number; icon: string }
> = {
  "reliability-kpi": { title: "Độ sẵn sàng vận hành", defaultWidth: 6, icon: "entity.security" },
  "mttr-kpi": { title: "Thời gian khắc phục (MTTR)", defaultWidth: 6, icon: "status.power" },
  "mtbf-kpi": { title: "Khoảng cách sự cố (MTBF)", defaultWidth: 6, icon: "entity.securityAlert" },
  "pm-kpi": { title: "Hoàn thành bảo trì (PM)", defaultWidth: 6, icon: "status.success" },
  "su-co-trend": { title: "Xu hướng sự cố", defaultWidth: 8, icon: "entity.chart" },
  "asset-status-pie": { title: "Trạng thái tài sản", defaultWidth: 4, icon: "entity.activity" },
  "health-donut": { title: "Phân bố sức khỏe", defaultWidth: 6, icon: "entity.activity" },
  "completeness-gauge": { title: "Chất lượng hồ sơ", defaultWidth: 6, icon: "status.sparkle" },
  "live-timeline": { title: "Nhật ký vận hành", defaultWidth: 6, icon: "entity.history" },
  "emergency-kpi": { title: "Sự cố khẩn", defaultWidth: 4, icon: "status.emergency" },
  "pm-due-kpi": { title: "Đến hạn PM", defaultWidth: 4, icon: "status.maintenance" },
  "pm-overdue-kpi": { title: "PM Quá hạn", defaultWidth: 4, icon: "status.danger" },
  "asset-type-bar": { title: "Phân loại hệ thống", defaultWidth: 6, icon: "entity.system" },
  "su-co-heatmap": { title: "Bản đồ nhiệt sự cố", defaultWidth: 12, icon: "entity.chart" },
  "top-he-thong-su-co": {
    title: "Top hệ thống nhiều sự cố",
    defaultWidth: 6,
    icon: "entity.system",
  },
  "top-thiet-bi-hong-lap": {
    title: "Top thiết bị hỏng lặp",
    defaultWidth: 6,
    icon: "entity.asset",
  },
  "expiry-timeline": { title: "Lộ trình hết hạn", defaultWidth: 12, icon: "entity.history" },
  "project-health-bar": {
    title: "Sức khỏe dự án (Work Health)",
    defaultWidth: 6,
    icon: "entity.chart",
  },
  "task-status-distribution": {
    title: "Phân bổ công việc theo trạng thái",
    defaultWidth: 6,
    icon: "entity.chart",
  },
  "task-completion-trend": {
    title: "Xu hướng hoàn thành công việc",
    defaultWidth: 6,
    icon: "entity.history",
  },
  "task-due-summary": {
    title: "Công việc đến hạn / quá hạn",
    defaultWidth: 4,
    icon: "status.maintenance",
  },
  "dossier-compliance-heatmap": {
    title: "Tuân thủ Hồ sơ (Dossier Compliance)",
    defaultWidth: 6,
    icon: "entity.security",
  },
};

/**
 * Layout mặc định xếp theo luồng đọc chữ Z:
 * KPI quét nhanh → biểu đồ phân tích chính → chi tiết → widget ít/chưa có dữ liệu ở cuối.
 */
export const DEFAULT_HOME_LAYOUT: DashboardWidgetConfig[] = [
  { id: "w1", type: "reliability-kpi", w: 6, title: "Độ sẵn sàng" },
  { id: "w2", type: "mttr-kpi", w: 6, title: "MTTR" },
  { id: "w3", type: "mtbf-kpi", w: 6, title: "MTBF" },
  { id: "w4", type: "pm-kpi", w: 6, title: "PM Completion" },
  { id: "w5", type: "emergency-kpi", w: 4, title: "Khẩn cấp" },
  { id: "w6", type: "pm-due-kpi", w: 4, title: "Đến hạn PM" },
  { id: "w7", type: "pm-overdue-kpi", w: 4, title: "PM Quá hạn" },
  { id: "w8", type: "su-co-trend", w: 12, title: "Xu hướng sự cố" },
  { id: "w9", type: "health-donut", w: 6, title: "Sức khỏe" },
  { id: "w10", type: "asset-type-bar", w: 6, title: "Phân loại" },
  { id: "w11", type: "completeness-gauge", w: 4, title: "Hồ sơ" },
  { id: "w12", type: "live-timeline", w: 8, title: "Nhật ký" },
  { id: "w13", type: "task-status-distribution", w: 6, title: "Trạng thái công việc" },
  { id: "w14", type: "task-completion-trend", w: 6, title: "Hoàn thành công việc" },
];

export const DEFAULT_OVERVIEW_LAYOUT: DashboardWidgetConfig[] = [
  { id: "ov1", type: "reliability-kpi", w: 6, title: "Độ sẵn sàng" },
  { id: "ov2", type: "mttr-kpi", w: 6, title: "MTTR" },
  { id: "ov3", type: "mtbf-kpi", w: 6, title: "MTBF" },
  { id: "ov4", type: "pm-kpi", w: 6, title: "PM Completion" },
  { id: "ov5", type: "su-co-trend", w: 8, title: "Xu hướng" },
  { id: "ov6", type: "asset-status-pie", w: 4, title: "Trạng thái" },
  { id: "ov7", type: "health-donut", w: 6, title: "Sức khỏe" },
  { id: "ov8", type: "completeness-gauge", w: 6, title: "Hồ sơ" },
  { id: "ov9", type: "task-due-summary", w: 4, title: "Đến hạn công việc" },
  { id: "ov10", type: "task-status-distribution", w: 4, title: "Trạng thái công việc" },
  { id: "ov11", type: "task-completion-trend", w: 4, title: "Hoàn thành công việc" },
  { id: "ov12", type: "project-health-bar", w: 6, title: "Sức khỏe dự án" },
  { id: "ov13", type: "dossier-compliance-heatmap", w: 6, title: "Tuân thủ hồ sơ" },
  { id: "ov14", type: "live-timeline", w: 12, title: "Nhật ký" },

];

/** Nhóm chủ đề dùng cho tab dashboard. */
export type WidgetGroup = "tong-quan" | "cong-viec" | "van-hanh";

export const WIDGET_GROUP: Record<WidgetType, WidgetGroup> = {
  "reliability-kpi": "tong-quan",
  "mttr-kpi": "tong-quan",
  "mtbf-kpi": "tong-quan",
  "pm-kpi": "tong-quan",
  "emergency-kpi": "tong-quan",
  "pm-due-kpi": "tong-quan",
  "pm-overdue-kpi": "tong-quan",
  "completeness-gauge": "tong-quan",
  "health-donut": "tong-quan",
  "asset-status-pie": "van-hanh",
  "asset-type-bar": "van-hanh",
  "su-co-trend": "van-hanh",
  "su-co-heatmap": "van-hanh",
  "top-he-thong-su-co": "van-hanh",
  "top-thiet-bi-hong-lap": "van-hanh",
  "expiry-timeline": "van-hanh",
  "live-timeline": "van-hanh",
  "task-status-distribution": "cong-viec",
  "task-completion-trend": "cong-viec",
  "task-due-summary": "cong-viec",
  "project-health-bar": "cong-viec",
  "dossier-compliance-heatmap": "cong-viec",
};

export const WIDGET_GROUP_LABEL: Record<WidgetGroup, string> = {
  "tong-quan": "Tổng quan",
  "cong-viec": "Công việc",
  "van-hanh": "Vận hành",
};

/** Thứ tự hiển thị tab trên dashboard (tab đầu tiên là mặc định). */
export const WIDGET_GROUPS: readonly WidgetGroup[] = [
  "tong-quan",
  "cong-viec",
  "van-hanh",
] as const;

/** Chuẩn hóa giá trị tab đã lưu (localStorage có thể chứa giá trị cũ/không hợp lệ). */
export function normalizeWidgetGroup(value: unknown): WidgetGroup {
  return WIDGET_GROUPS.includes(value as WidgetGroup) ? (value as WidgetGroup) : WIDGET_GROUPS[0]!;
}
