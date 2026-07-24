// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { KiemKeDialog } from "../KiemKeDialog";

afterEach(() => cleanup());

const thietBi = { maThietBi: "TB-001", ten: "Máy UHF" };

describe("KiemKeDialog — chụp ảnh, GPS, tình trạng", () => {
  it("người có quyền: hiện nút 'Kiểm kê'", () => {
    render(<KiemKeDialog thietBi={thietBi} canManage onSubmit={() => {}} />);
    expect(screen.getByRole("button", { name: "Kiểm kê" })).toBeTruthy();
  });

  it("người không có quyền: không hiện nút", () => {
    render(<KiemKeDialog thietBi={thietBi} canManage={false} onSubmit={() => {}} />);
    expect(screen.queryByRole("button", { name: "Kiểm kê" })).toBeNull();
  });

  it("mở dialog hiện tình trạng, chọn ảnh và lấy vị trí", () => {
    render(<KiemKeDialog thietBi={thietBi} canManage onSubmit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Kiểm kê" }));
    expect(screen.getByText(/Tình trạng/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Lấy vị trí/ })).toBeTruthy();
    expect(screen.getByText("Máy UHF")).toBeTruthy();
  });

  it("bấm 'Lấy vị trí' lấy GPS và hiển thị toạ độ", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({
        coords: { latitude: 21.0278, longitude: 105.8342 },
      } as GeolocationPosition),
    );
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });

    render(<KiemKeDialog thietBi={thietBi} canManage onSubmit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Kiểm kê" }));
    fireEvent.click(screen.getByRole("button", { name: /Lấy vị trí/ }));

    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
      expect(screen.getByText(/21\.0278/)).toBeTruthy();
    });
    vi.unstubAllGlobals();
  });

  it("xác nhận gọi onSubmit với tình trạng mặc định và toạ độ", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({ coords: { latitude: 10.5, longitude: 20.5 } } as GeolocationPosition),
    );
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    const onSubmit = vi.fn();

    render(<KiemKeDialog thietBi={thietBi} canManage onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Kiểm kê" }));
    fireEvent.click(screen.getByRole("button", { name: /Lấy vị trí/ }));
    await waitFor(() => screen.getByText(/10\.5/));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận kiểm kê" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.tinhTrang).toBeTruthy();
    expect(arg.viTriGps).toBe("10.5, 20.5");
    vi.unstubAllGlobals();
  });
});
