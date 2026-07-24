import { describe, it, expect } from "vitest";
import {
  VAN_DE_STATES,
  isVanDeOpen,
  isVanDeClosed,
  isActionOpen,
  blockingActions,
  canManageVanDe,
  canApproveCongViec,
  canCloseVanDe,
  type RcaAction,
} from "@/lib/mirats/van-de-state";
import type { AppRole } from "@/hooks/use-session";

const admin: AppRole[] = ["admin"];
const phongKt: AppRole[] = ["phong_kt"];
const ktv: AppRole[] = ["ktv"];
const dv: AppRole[] = ["phu_trach_dv"];

function act(bat_buoc: boolean, trang_thai: string): RcaAction {
  return { bat_buoc, trang_thai };
}

describe("van-de-state — phân loại trạng thái vấn đề", () => {
  it("dong là đóng, còn lại đang mở", () => {
    expect(isVanDeClosed("dong")).toBe(true);
    expect(isVanDeOpen("dong")).toBe(false);
    for (const s of VAN_DE_STATES.filter((x) => x !== "dong")) {
      expect(isVanDeOpen(s)).toBe(true);
    }
  });
  it("rỗng/null không mở cũng không đóng-hợp-lệ", () => {
    expect(isVanDeOpen("")).toBe(false);
    expect(isVanDeOpen(null)).toBe(false);
    expect(isVanDeClosed(null)).toBe(false);
  });
});

describe("van-de-state — hành động khắc phục còn mở", () => {
  it("HOAN_THANH & HUY là đã xong; còn lại đang mở", () => {
    expect(isActionOpen("MO")).toBe(true);
    expect(isActionOpen("DANG_LAM")).toBe(true);
    expect(isActionOpen("HOAN_THANH")).toBe(false);
    expect(isActionOpen("HUY")).toBe(false);
  });
  it("chỉ tính hành động BẮT BUỘC còn mở là mục chặn", () => {
    const actions = [
      act(true, "MO"), // chặn
      act(true, "HOAN_THANH"), // xong → không chặn
      act(false, "MO"), // không bắt buộc → không chặn
      act(true, "DANG_LAM"), // chặn
    ];
    expect(blockingActions(actions).length).toBe(2);
  });
});

describe("van-de-state — quyền (đồng bộ can_manage_equipment)", () => {
  it("chỉ admin / phong_kt quản lý & phê duyệt", () => {
    expect(canManageVanDe(admin)).toBe(true);
    expect(canManageVanDe(phongKt)).toBe(true);
    expect(canManageVanDe(ktv)).toBe(false);
    expect(canManageVanDe(dv)).toBe(false);
    expect(canManageVanDe([])).toBe(false);
    expect(canManageVanDe(null)).toBe(false);
    expect(canApproveCongViec(admin)).toBe(true);
    expect(canApproveCongViec(ktv)).toBe(false);
  });
});

describe("van-de-state — quy tắc đóng vấn đề (mirror RPC dong_van_de)", () => {
  it("KHÔNG đóng được khi còn hành động bắt buộc mở", () => {
    const r = canCloseVanDe(admin, [act(true, "MO"), act(false, "MO")]);
    expect(r.ok).toBe(false);
    expect(r.blocking).toBe(1);
    expect(r.reason).toMatch(/bắt buộc/);
  });
  it("đóng được khi mọi hành động bắt buộc đã HOÀN_THÀNH/HỦY", () => {
    const r = canCloseVanDe(admin, [
      act(true, "HOAN_THANH"),
      act(true, "HUY"),
      act(false, "MO"), // không bắt buộc, còn mở nhưng không chặn
    ]);
    expect(r.ok).toBe(true);
    expect(r.blocking).toBe(0);
  });
  it("đóng được khi không có hành động nào", () => {
    expect(canCloseVanDe(phongKt, []).ok).toBe(true);
  });
  it("sai vai trò thì không đóng dù không còn hành động chặn", () => {
    const r = canCloseVanDe(ktv, []);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/quyền/);
  });
});
