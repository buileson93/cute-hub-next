// @vitest-environment jsdom
// ============================================================================
// Kiểm thử luồng XEM TRƯỚC → GHI của ImportPreviewDialog (dùng chung cho các
// nút "Nhập CSV" rải rác). Bảo đảm: hiển thị số dòng + bảng, chỉ ghi khi bấm
// "Ghi vào CSDL", gọi onCommit rồi onClose; huỷ thì không ghi.
// ============================================================================

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { ImportPreviewDialog } from "../ImportPreviewDialog";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

afterEach(cleanup);

const baseProps = {
  title: "Nhập lại nhà cung cấp",
  headers: ["ma", "ten"],
  rows: [
    { ma: "NCC1", ten: "Công ty A" },
    { ma: "NCC2", ten: "Công ty B" },
  ],
};

describe("ImportPreviewDialog", () => {
  it("hiển thị số dòng và nội dung bảng xem trước", () => {
    render(<ImportPreviewDialog {...baseProps} onCommit={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("2 dòng")).toBeTruthy();
    expect(screen.getByText("Công ty A")).toBeTruthy();
    expect(screen.getByText("NCC2")).toBeTruthy();
  });

  it('bấm "Ghi vào CSDL" → gọi onCommit rồi onClose', async () => {
    const onCommit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<ImportPreviewDialog {...baseProps} onCommit={onCommit} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Ghi vào CSDL/i }));
    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("bấm Huỷ → onClose, KHÔNG ghi", () => {
    const onCommit = vi.fn();
    const onClose = vi.fn();
    render(<ImportPreviewDialog {...baseProps} onCommit={onCommit} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Huỷ/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commit lỗi → KHÔNG đóng hộp thoại (giữ để thử lại)", async () => {
    const onCommit = vi.fn().mockRejectedValue(new Error("mạng lỗi"));
    const onClose = vi.fn();
    render(<ImportPreviewDialog {...baseProps} onCommit={onCommit} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Ghi vào CSDL/i }));
    await waitFor(() => expect(onCommit).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("không có dòng hợp lệ → thông báo & khoá nút ghi", () => {
    render(<ImportPreviewDialog {...baseProps} rows={[]} onCommit={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/Không có dòng hợp lệ/i)).toBeTruthy();
    const btn = screen.getByRole("button", { name: /Ghi vào CSDL/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  // ==== E2E: stepper + lỗi theo dòng/cột + tải báo cáo lỗi ====================
  it("hiển thị stepper các bước xử lý", () => {
    render(
      <ImportPreviewDialog
        {...baseProps}
        steps={[
          { label: "Đọc file", status: "done" },
          { label: "Kiểm tra cột", status: "done" },
          { label: "Xem trước", status: "active" },
          { label: "Ghi", status: "pending" },
        ]}
        onCommit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const list = screen.getByRole("list", { name: /Tiến trình xử lý nhập liệu/i });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[2].getAttribute("aria-current")).toBe("step");
    expect(items[2].getAttribute("aria-label")).toMatch(/Đang xử lý/);
    expect(items[0].getAttribute("aria-label")).toMatch(/Hoàn tất/);
    expect(screen.getByText("Đọc file")).toBeTruthy();
    expect(screen.getByText("Xem trước")).toBeTruthy();
  });

  it("cảnh báo mức file hiển thị banner", () => {
    render(
      <ImportPreviewDialog
        {...baseProps}
        fileWarnings={["Mẫu phiên bản 0 không khớp phiên bản hiện tại (1)."]}
        onCommit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/Cảnh báo định dạng mẫu/i)).toBeTruthy();
    expect(screen.getByText(/Mẫu phiên bản 0/i)).toBeTruthy();
  });

  it("tô đỏ ô lỗi theo từng cột và ghi rõ giá trị vi phạm", () => {
    render(
      <ImportPreviewDialog
        {...baseProps}
        rows={[
          { ma: "", ten: "" },
          { ma: "NCC2", ten: "Công ty B" },
        ]}
        statuses={[
          {
            action: "error",
            messages: ['Cột "ten" bỏ trống.'],
            issues: [
              { field: "ten", value: "", message: 'Cột "ten" bỏ trống.', level: "error" },
              { field: "ma", value: "", message: 'Mã tự sinh vì "ma" rỗng.', level: "warning" },
            ],
          },
          { action: "create" },
        ]}
        onCommit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    // Nút ghi phải bị khoá khi có lỗi.
    const btn = screen.getByRole("button", { name: /Ghi vào CSDL/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    // Dialog portal → query trên document.body.
    const invalidCell = document.body.querySelector('td[data-field="ten"][data-invalid="error"]');
    expect(invalidCell).toBeTruthy();
    const warnCell = document.body.querySelector('td[data-field="ma"][data-invalid="warning"]');
    expect(warnCell).toBeTruthy();
    // Chi tiết vi phạm hiển thị tên cột.
    const details = screen.getByTestId("row-issues-0");
    expect(details.textContent).toMatch(/cột.*ten/i);
    expect(details.textContent).toMatch(/bỏ trống/i);
  });

  it('bấm "Tải báo cáo lỗi" → gọi onDownloadErrors', () => {
    const onDownloadErrors = vi.fn();
    render(
      <ImportPreviewDialog
        {...baseProps}
        statuses={[
          {
            action: "error",
            issues: [{ field: "ten", value: "", message: "trống", level: "error" }],
          },
          { action: "create" },
        ]}
        onDownloadErrors={onDownloadErrors}
        onCommit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Tải báo cáo lỗi/i }));
    expect(onDownloadErrors).toHaveBeenCalledTimes(1);
  });

  it("chế độ diff trước/sau: hiện toggle và tô ô đã đổi", async () => {
    render(
      <ImportPreviewDialog
        {...baseProps}
        rows={[{ ma: "NCC1", ten: "Công ty A đổi tên" }]}
        statuses={[{ action: "update", before: { ma: "NCC1", ten: "Công ty A" } }]}
        onCommit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const toggle = screen.getByRole("button", { name: /so sánh trước\/sau/i });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle.getAttribute("aria-pressed")).toBe("true"));
    const changed = document.body.querySelector('td[data-field="ten"][data-changed="true"]');
    expect(changed).toBeTruthy();
    expect(changed?.textContent).toMatch(/Công ty A/);
    expect(changed?.textContent).toMatch(/Công ty A đổi tên/);
  });
});
