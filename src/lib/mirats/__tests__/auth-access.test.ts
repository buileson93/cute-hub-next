import { describe, it, expect } from "vitest";
import {
  decideAccess,
  laLoiHetPhien,
  laRouteCongKhai,
  type TrangThaiPhien,
} from "@/lib/mirats/auth/access";

const dangTai: TrangThaiPhien = { kieu: "dang_tai" };
const chuaDangNhap: TrangThaiPhien = { kieu: "chua_dang_nhap" };
const daActive: TrangThaiPhien = { kieu: "da_dang_nhap", is_active_user: true };
const daChuaDuyet: TrangThaiPhien = { kieu: "da_dang_nhap", is_active_user: false };

describe("laRouteCongKhai", () => {
  it("liệt kê các route công khai chuẩn", () => {
    expect(laRouteCongKhai("/auth")).toBe(true);
    expect(laRouteCongKhai("/forgot-password")).toBe(true);
    expect(laRouteCongKhai("/reset-password")).toBe(true);
    expect(laRouteCongKhai("/pending")).toBe(true);
    expect(laRouteCongKhai("/q/TB_ABC12345")).toBe(true);
    expect(laRouteCongKhai("/api/public/webhook")).toBe(true);
  });
  it("từ chối route nội bộ", () => {
    expect(laRouteCongKhai("/")).toBe(false);
    expect(laRouteCongKhai("/thiet-bi")).toBe(false);
    expect(laRouteCongKhai("/admin/users")).toBe(false);
  });
});

describe("decideAccess", () => {
  it("đang tải + route bảo vệ → chờ", () => {
    expect(decideAccess(dangTai, "/thiet-bi")).toEqual({
      hanh_dong: "cho",
      ly_do: "dang_tai",
    });
  });
  it("đang tải + route công khai → cho phép ngay", () => {
    expect(decideAccess(dangTai, "/auth").hanh_dong).toBe("cho_phep");
  });
  it("chưa đăng nhập + route bảo vệ → /auth", () => {
    const r = decideAccess(chuaDangNhap, "/thiet-bi");
    expect(r).toMatchObject({ hanh_dong: "chuyen_huong", toi: "/auth" });
  });
  it("chưa đăng nhập + route công khai → cho phép", () => {
    expect(decideAccess(chuaDangNhap, "/auth").hanh_dong).toBe("cho_phep");
    expect(decideAccess(chuaDangNhap, "/reset-password").hanh_dong).toBe("cho_phep");
  });
  it("đã đăng nhập nhưng chưa duyệt → /pending", () => {
    const r = decideAccess(daChuaDuyet, "/thiet-bi");
    expect(r).toMatchObject({ hanh_dong: "chuyen_huong", toi: "/pending" });
  });
  it("chưa duyệt + đang ở /pending → cho phép hiển thị màn chặn", () => {
    expect(decideAccess(daChuaDuyet, "/pending").hanh_dong).toBe("cho_phep");
  });
  it("chưa duyệt + /auth → cho phép (để đăng xuất)", () => {
    expect(decideAccess(daChuaDuyet, "/auth").hanh_dong).toBe("cho_phep");
  });
  it("đã đăng nhập active + route bảo vệ → cho phép", () => {
    expect(decideAccess(daActive, "/thiet-bi").hanh_dong).toBe("cho_phep");
  });
  it("đã active mà quay lại /auth → chuyển đi (không kẹt ở login)", () => {
    const r = decideAccess(daActive, "/auth");
    expect(r.hanh_dong).toBe("chuyen_huong");
  });
});

describe("laLoiHetPhien", () => {
  it("nhận diện mã PostgREST JWT", () => {
    expect(laLoiHetPhien({ code: "PGRST301" })).toBe(true);
    expect(laLoiHetPhien({ code: "PGRST302" })).toBe(true);
  });
  it("nhận diện lỗi refresh token / JWT", () => {
    expect(laLoiHetPhien({ message: "Invalid Refresh Token: Refresh Token Not Found" })).toBe(true);
    expect(laLoiHetPhien({ message: "JWT expired" })).toBe(true);
    expect(laLoiHetPhien({ message: "invalid JWT" })).toBe(true);
    expect(laLoiHetPhien({ name: "AuthSessionMissingError" })).toBe(true);
  });
  it("KHÔNG kick khi chỉ có HTTP 401 trần (RLS/GRANT)", () => {
    // Bug-fix: 401 do RLS/GRANT không phải phiên hết hạn, không được soft-signout.
    expect(laLoiHetPhien({ status: 401 })).toBe(false);
    expect(laLoiHetPhien({ status: 401, message: "permission denied" })).toBe(false);
    expect(laLoiHetPhien({ status: 403, code: "42501" })).toBe(false);
  });
  it("không nhận nhầm lỗi thường", () => {
    expect(laLoiHetPhien({ status: 500, message: "server error" })).toBe(false);
    expect(laLoiHetPhien(null)).toBe(false);
    expect(laLoiHetPhien("string")).toBe(false);
  });
});
