import { ReactNode } from "react";

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
  | "expiry-timeline";

export interface DashboardWidgetConfig {
  id: string;
  type: WidgetType;
  w: number; // width in grid columns (1-12)
  h?: number; // optional height hint
  title: string;
}

export const AVAILABLE_WIDGETS: Record<WidgetType, { title: string; defaultWidth: number; icon: string }> = {
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
  "top-he-thong-su-co": { title: "Top hệ thống nhiều sự cố", defaultWidth: 6, icon: "entity.system" },
  "top-thiet-bi-hong-lap": { title: "Top thiết bị hỏng lặp", defaultWidth: 6, icon: "entity.asset" },
  "expiry-timeline": { title: "Lộ trình hết hạn", defaultWidth: 12, icon: "entity.history" },
};


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
  { id: "ov9", type: "live-timeline", w: 12, title: "Nhật ký" },
];
