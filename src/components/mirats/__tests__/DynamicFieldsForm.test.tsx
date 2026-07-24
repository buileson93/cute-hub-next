// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { DynamicFieldsForm } from "../DynamicFieldsForm";
import type { FieldSpec } from "@/lib/mirats/registry";

function spec(p: Partial<FieldSpec> & { field_key: string }): FieldSpec {
  return {
    field_key: p.field_key,
    nhan: p.nhan ?? p.field_key,
    kieu: p.kieu ?? "text",
    tuy_chon: p.tuy_chon ?? [],
    thu_tu: p.thu_tu ?? 0,
    bat_buoc: p.bat_buoc ?? false,
    rang_buoc: p.rang_buoc ?? {},
    mac_dinh: p.mac_dinh ?? null,
    help_text: p.help_text ?? null,
    nhom_field: p.nhom_field ?? null,
  };
}

afterEach(() => cleanup());

describe("DynamicFieldsForm — render theo spec", () => {
  it("hiển thị nhãn, dấu bắt buộc và help_text", () => {
    const specs = [
      spec({ field_key: "cs", nhan: "Công suất", bat_buoc: true, help_text: "Đơn vị W" }),
    ];
    render(<DynamicFieldsForm specs={specs} value={{}} onChange={() => {}} />);
    expect(screen.getByText("Công suất")).toBeTruthy();
    expect(screen.getByText("Đơn vị W")).toBeTruthy();
    // dấu bắt buộc *
    expect(screen.getByText("*")).toBeTruthy();
  });

  it("prefill mac_dinh khi chưa có giá trị", () => {
    const onChange = vi.fn();
    const specs = [spec({ field_key: "x", nhan: "X", mac_dinh: "def" })];
    render(<DynamicFieldsForm specs={specs} value={{}} onChange={onChange} />);
    const input = screen.getByLabelText("X") as HTMLInputElement;
    expect(input.value).toBe("def");
  });

  it("hiển thị lỗi validate khi giá trị vi phạm", () => {
    const specs = [spec({ field_key: "x", nhan: "X", kieu: "number", rang_buoc: { min: 100 } })];
    render(<DynamicFieldsForm specs={specs} value={{ x: "5" }} onChange={() => {}} showErrors />);
    // có thông báo lỗi min
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("gọi onChange khi người dùng nhập", () => {
    const onChange = vi.fn();
    const specs = [spec({ field_key: "x", nhan: "X" })];
    render(<DynamicFieldsForm specs={specs} value={{ x: "" }} onChange={onChange} />);
    const input = screen.getByLabelText("X") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "abc" } });
    expect(onChange).toHaveBeenCalled();
  });
});
