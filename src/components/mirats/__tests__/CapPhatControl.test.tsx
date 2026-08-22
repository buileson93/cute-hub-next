// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { CapPhatControl } from "../CapPhatControl";

afterEach(() => cleanup());

const donVi = [
  { id: "dv1", ten: "CRA" },
  { id: "dv2", ten: "CLA" },
];

describe("CapPhatControl — nút cấp phát / thu hồi", () => {
  it("tài sản sẵn sàng: hiện nút 'Cấp phát' cho người có quyền", () => {
    render(
      <CapPhatControl
        trangThai="san_sang"
        canManage
        donViOptions={donVi}
        onCapPhat={() => {}}
        onThuHoi={() => {}}
      />,
    );
    expect(screen.getByText("Sẵn sàng")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Cấp phát/ })).toBeTruthy();
  });

  it("tài sản đã cấp phát: hiện người giữ và nút 'Thu hồi'", () => {
    render(
      <CapPhatControl
        trangThai="da_cap_phat"
        nguoiGiu="Nguyễn Văn An"
        donViGiuTen="CRA"
        canManage
        donViOptions={donVi}
        onCapPhat={() => {}}
        onThuHoi={() => {}}
      />,
    );
    expect(screen.getByText("Đã cấp phát")).toBeTruthy();
    expect(screen.getByText("Nguyễn Văn An")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Thu hồi/ })).toBeTruthy();
  });

  it("người không có quyền: không hiện nút thao tác", () => {
    render(
      <CapPhatControl
        trangThai="san_sang"
        canManage={false}
        donViOptions={donVi}
        onCapPhat={() => {}}
        onThuHoi={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /Cấp phát/ })).toBeNull();
  });

  it("mở dialog cấp phát, nhập người giữ và xác nhận gọi onCapPhat", () => {
    const onCapPhat = vi.fn();
    render(
      <CapPhatControl
        trangThai="san_sang"
        canManage
        donViOptions={donVi}
        onCapPhat={onCapPhat}
        onThuHoi={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Cấp phát/ }));
    const input = screen.getByLabelText("Người giữ") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Trần Thị Bình" } });
    fireEvent.click(screen.getByRole("button", { name: /Xác nhận cấp phát/ }));
    expect(onCapPhat).toHaveBeenCalledTimes(1);
    expect(onCapPhat.mock.calls[0][0].nguoiGiu).toBe("Trần Thị Bình");
  });

  it("xác nhận thu hồi gọi onThuHoi", () => {
    const onThuHoi = vi.fn();
    render(
      <CapPhatControl
        trangThai="da_cap_phat"
        nguoiGiu="Nguyễn Văn An"
        canManage
        donViOptions={donVi}
        onCapPhat={() => {}}
        onThuHoi={onThuHoi}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Thu hồi/ }));
    fireEvent.click(screen.getByRole("button", { name: /Xác nhận thu hồi/ }));
    expect(onThuHoi).toHaveBeenCalledTimes(1);
  });
});
