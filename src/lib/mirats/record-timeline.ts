// ============================================================================
// Bộ HỢP NHẤT dòng thời gian (timeline) cho SỔ LÝ LỊCH.
//
// Gộp các nguồn lịch sử hiện có về một danh sách theo thứ tự thời gian:
//   Bảo dưỡng · Sự cố · Hỏng hóc/thay thế · Bàn giao · Chỉnh sửa dữ liệu.
//
// Hàm THUẦN (pure) — không React, không Supabase — để dùng lại ở cả sổ lý
// lịch tài sản và sổ lý lịch hệ thống, và để kiểm thử dễ dàng.
// Giữ NGUYÊN hình dạng dữ liệu route đang dùng (parity), chỉ tách ra tái dùng.
// ============================================================================

import type { SuCo, BaoTri, HongHocThayThe, BanGiao } from "@/lib/mirats/types";
import {
  resolveDeviceIdentity,
  type LiveDeviceInfo,
  type IdentitySource,
} from "@/lib/mirats/record-snapshot";

export type TimelineKind = "bt" | "sc" | "hh" | "bg" | "cd";

export interface TimelineItem {
  kind: TimelineKind;
  date: string;
  title: string;
  label: string;
  desc: string;
  tag?: string;
  /** Nhãn tài sản (dùng khi gộp nhiều tài sản, ví dụ sổ lý lịch hệ thống). */
  device?: string;
  /** Nguồn nhận dạng tài sản đã dùng (live/snapshot/text). */
  deviceSource?: IdentitySource;
}

/** Sự kiện chỉnh sửa dữ liệu tối thiểu cần cho timeline. */
export interface ChangeTimelineEvent {
  at: string;
  action: "insert" | "update" | "delete";
  userName: string;
  changesText?: string;
  changesCount?: number;
}

export interface TimelineSources {
  baoTri?: BaoTri[];
  suCo?: SuCo[];
  hongHoc?: HongHocThayThe[];
  banGiao?: BanGiao[];
  changeEvents?: ChangeTimelineEvent[];
  /** Tra tài sản sống theo id để hiển thị nhãn (ưu tiên) + fallback snapshot. */
  getLive?: (id: string) => LiveDeviceInfo | undefined;
  /** Bật gắn nhãn tài sản vào mỗi mục (dùng cho sổ lý lịch hệ thống). */
  withDeviceLabel?: boolean;
}

function toKey(d: string): number {
  const t = Date.parse(d);
  return Number.isNaN(t) ? -Infinity : t;
}

function deviceLabelFor(
  rec: {
    deviceId?: string | null;
    deviceText?: string | null;
    snapshot_ma_thiet_bi?: string | null;
    snapshot_ten_thiet_bi?: string | null;
    snapshot_he_thong?: string | null;
    snapshot_don_vi?: string | null;
    snapshot_vi_tri?: string | null;
  },
  getLive?: (id: string) => LiveDeviceInfo | undefined,
): { device: string; source: IdentitySource } {
  const r = resolveDeviceIdentity(rec, getLive);
  const device = [r.ma, r.ten].filter(Boolean).join(" — ");
  return { device, source: r.source };
}

/** Gộp & sắp xếp dòng thời gian sổ lý lịch (mới nhất trước). */
export function buildRecordTimeline(sources: TimelineSources): TimelineItem[] {
  const { withDeviceLabel, getLive } = sources;
  const items: TimelineItem[] = [];

  for (const e of sources.baoTri ?? []) {
    const item: TimelineItem = {
      kind: "bt",
      date: e.ngay_bat_dau || "",
      title: e.mo_ta_cong_viec || e.loai_bao_tri || "Bảo dưỡng",
      label: e.loai_bao_tri || "Bảo dưỡng",
      desc: e.ket_qua ?? "",
      tag: e.trang_thai,
    };
    if (withDeviceLabel) {
      const d = deviceLabelFor({ deviceId: e.thiet_bi_id, deviceText: e.thiet_bi, ...e }, getLive);
      item.device = d.device;
      item.deviceSource = d.source;
    }
    items.push(item);
  }

  for (const e of sources.suCo ?? []) {
    const item: TimelineItem = {
      kind: "sc",
      date: e.ngay_phat_hien || "",
      title: e.hien_tuong || "Sự cố",
      label: e.muc_do || "Sự cố",
      desc: e.bien_phap_xu_ly ?? e.nguyen_nhan ?? "",
      tag: e.trang_thai,
    };
    if (withDeviceLabel) {
      const d = deviceLabelFor({ deviceId: e.thiet_bi_id, deviceText: e.thiet_bi, ...e }, getLive);
      item.device = d.device;
      item.deviceSource = d.source;
    }
    items.push(item);
  }

  for (const e of sources.hongHoc ?? []) {
    const item: TimelineItem = {
      kind: "hh",
      date: e.ngay_hong || "",
      title: e.mo_ta_hong_hoc || e.bo_phan_hong || "Hỏng hóc / thay thế",
      label: e.bo_phan_hong || "Hỏng hóc",
      desc: e.phuong_an ?? "",
      tag: e.trang_thai,
    };
    if (withDeviceLabel) {
      const d = deviceLabelFor(
        { deviceId: e.thiet_bi_hong_id, deviceText: e.thiet_bi_hong, ...e },
        getLive,
      );
      item.device = d.device;
      item.deviceSource = d.source;
    }
    items.push(item);
  }

  for (const e of sources.banGiao ?? []) {
    const item: TimelineItem = {
      kind: "bg",
      date: e.ngay_nhan || "",
      title: `${e.nguoi_giao || "—"} → ${e.nguoi_nhan || "—"}`,
      label: e.loai_ban_giao || "Bàn giao",
      desc: e.don_vi_nhan ?? "",
      tag: e.trang_thai,
    };
    if (withDeviceLabel) {
      const d = deviceLabelFor({ deviceId: null, deviceText: e.thiet_bi, ...e }, getLive);
      item.device = d.device;
      item.deviceSource = d.source;
    }
    items.push(item);
  }

  for (const ev of sources.changeEvents ?? []) {
    const title =
      ev.action === "insert"
        ? "Tạo mới bản ghi"
        : ev.action === "delete"
          ? "Xoá bản ghi"
          : `Cập nhật ${ev.changesCount ?? 0} trường`;
    const desc = ev.action === "update" ? (ev.changesText ?? "") : "";
    items.push({ kind: "cd", date: ev.at, title, label: `bởi ${ev.userName}`, desc });
  }

  return items.sort((a, b) => toKey(b.date) - toKey(a.date));
}
