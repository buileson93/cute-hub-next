// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { z } from "zod";
import { SchemaDialog, type SchemaField } from "../SchemaDialog";

afterEach(() => cleanup());

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("SchemaDialog — primitive khai thêm / sửa nhanh", () => {
  it("render đủ input theo schema (text + number + switch)", () => {
    const fields: SchemaField[] = [
      { key: "ten", type: "text", label: "Tên", required: true },
      { key: "soLuong", type: "number", label: "Số lượng" },
      { key: "batBuoc", type: "switch", label: "Bắt buộc" },
    ];
    const schema = z.object({
      ten: z.string(),
      soLuong: z.number().optional(),
      batBuoc: z.boolean(),
    });
    wrap(
      <SchemaDialog
        open
        onOpenChange={() => {}}
        title="Test"
        fields={fields}
        schema={schema}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByLabelText(/Tên/)).toBeTruthy();
    expect(screen.getByLabelText(/Số lượng/)).toBeTruthy();
    expect(screen.getByText("Bắt buộc")).toBeTruthy();
  });

  it("submit thiếu field required → hiện lỗi inline, không gọi onSubmit", async () => {
    const onSubmit = vi.fn();
    const fields: SchemaField[] = [{ key: "ten", type: "text", label: "Tên", required: true }];
    const schema = z.object({ ten: z.string().min(1, "Bắt buộc nhập tên") });
    wrap(
      <SchemaDialog
        open
        onOpenChange={() => {}}
        title="Test"
        fields={fields}
        schema={schema}
        onSubmit={onSubmit}
        disableSubmitWhenInvalid={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox").getAttribute("aria-invalid")).toBe("true"),
    );
    // Message hiển thị đúng theo field và có role=alert
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Bắt buộc nhập tên");
    // aria-describedby trỏ đến id của message
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disableSubmitWhenInvalid (mặc định): nút submit bị disable khi schema fail", () => {
    const fields: SchemaField[] = [{ key: "ten", type: "text", label: "Tên", required: true }];
    const schema = z.object({ ten: z.string().min(3, "Tối thiểu 3 ký tự") });
    wrap(
      <SchemaDialog
        open
        onOpenChange={() => {}}
        title="Test"
        fields={fields}
        schema={schema}
        onSubmit={() => {}}
      />,
    );
    const btn = screen.getByRole("button", { name: "Lưu" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "abc" } });
    expect((screen.getByRole("button", { name: "Lưu" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("submit hợp lệ → gọi onSubmit với values đã parse (number → number)", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const fields: SchemaField[] = [
      { key: "ten", type: "text", label: "Tên", required: true },
      { key: "soLuong", type: "number", label: "Số lượng", required: true },
    ];
    const schema = z.object({ ten: z.string().min(1), soLuong: z.number().min(1) });
    wrap(
      <SchemaDialog
        open
        onOpenChange={() => {}}
        title="Test"
        fields={fields}
        schema={schema}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Tên/), { target: { value: "Alpha" } });
    fireEvent.change(screen.getByLabelText(/Số lượng/), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ ten: "Alpha", soLuong: 3 });
  });

  it("select async loadOptions lỗi → hiện message inline, submit vẫn disable", async () => {
    const fields: SchemaField[] = [
      {
        key: "dv",
        type: "select",
        label: "Đơn vị",
        required: true,
        loadOptions: {
          queryKey: ["sd-test-dv-err"],
          queryFn: async () => {
            throw new Error("Không tải được đơn vị");
          },
        },
      },
    ];
    const schema = z.object({ dv: z.string().min(1) });
    wrap(
      <SchemaDialog
        open
        onOpenChange={() => {}}
        title="Test"
        fields={fields}
        schema={schema}
        onSubmit={() => {}}
      />,
    );
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Không tải được đơn vị");
    expect((screen.getByRole("button", { name: "Lưu" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("aria-required + aria-invalid được gắn cho field bắt buộc khi có lỗi", async () => {
    const fields: SchemaField[] = [{ key: "ten", type: "text", label: "Tên", required: true }];
    const schema = z.object({ ten: z.string().min(1, "Bắt buộc") });
    wrap(
      <SchemaDialog
        open
        onOpenChange={() => {}}
        title="Test"
        fields={fields}
        schema={schema}
        onSubmit={() => {}}
        disableSubmitWhenInvalid={false}
      />,
    );
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("aria-required")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(input.getAttribute("aria-invalid")).toBe("true"));
  });

  it("chỉ hiện lỗi ở đúng field (message per-field)", async () => {
    const fields: SchemaField[] = [
      { key: "a", type: "text", label: "A", required: true },
      { key: "b", type: "text", label: "B", required: true },
    ];
    const schema = z.object({
      a: z.string().min(1, "A bắt buộc"),
      b: z.string().min(1, "B bắt buộc"),
    });
    wrap(
      <SchemaDialog
        open
        onOpenChange={() => {}}
        title="Test"
        fields={fields}
        schema={schema}
        onSubmit={() => {}}
        disableSubmitWhenInvalid={false}
      />,
    );
    // Điền A, chừa B trống → chỉ B lỗi
    fireEvent.change(screen.getByLabelText(/^A/), { target: { value: "xxx" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    const alerts = await screen.findAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].textContent).toContain("B bắt buộc");
    const bWrap = screen.getByLabelText(/^B/).closest("div")!;
    expect(within(bWrap).getByRole("alert")).toBeTruthy();
  });
});
