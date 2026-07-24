// @vitest-environment jsdom
// ============================================================================
// Kiểm thử component ResolutionReview: hiển thị file/hiện tại/đề xuất và phát
// đúng hành động create/update/merge/skip/save_alias. "Gộp" chỉ bật khi có
// ứng viên; không tự merge.
// ============================================================================

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ResolutionReview, type ReviewRow } from "../ResolutionReview";
import type { MatchResult } from "@/lib/mirats/entity-resolve";

afterEach(cleanup);

const nearResult: MatchResult = {
  decision: "needs_review",
  kind: "near_name",
  confidence: 0.9,
  candidate: { id: "id-B", ma: "TB-002", ten: "Switch mạng lõi" },
  candidates: [{ id: "id-B", ma: "TB-002", ten: "Switch mạng lõi" }],
  reason: "Tên gần giống (90%)",
};

const noneResult: MatchResult = {
  decision: "create",
  kind: "none",
  confidence: 0,
  candidate: null,
  candidates: [],
  reason: "Không tìm thấy — tạo mới",
};

const rows: ReviewRow[] = [
  { rowIndex: 1, fileValues: { ten: "Switch mang loi" }, result: nearResult },
  { rowIndex: 2, fileValues: { ten: "Tài sản mới" }, result: noneResult },
];

describe("ResolutionReview", () => {
  it("hiển thị giá trị file, ứng viên hiện tại và nhãn loại khớp", () => {
    render(<ResolutionReview rows={rows} onAction={vi.fn()} />);
    expect(screen.getByText("Switch mang loi")).toBeTruthy();
    expect(screen.getByText(/Switch mạng lõi/)).toBeTruthy();
    expect(screen.getByText("Tên gần giống")).toBeTruthy();
  });

  it('bấm "Gộp" phát action merge kèm ứng viên; không tự merge trước đó', () => {
    const onAction = vi.fn();
    render(<ResolutionReview rows={[rows[0]]} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /^Gộp$/ }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0][1]).toBe("merge");
    expect(onAction.mock.calls[0][2]?.id).toBe("id-B");
  });

  it('"Gộp"/"Cập nhật"/"Lưu alias" bị vô hiệu khi không có ứng viên', () => {
    render(<ResolutionReview rows={[rows[1]]} onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: /^Gộp$/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Cập nhật/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Lưu alias/ }).hasAttribute("disabled")).toBe(true);
  });

  it('"Tạo mới" và "Bỏ qua" luôn dùng được', () => {
    const onAction = vi.fn();
    render(<ResolutionReview rows={[rows[1]]} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /Tạo mới/ }));
    fireEvent.click(screen.getByRole("button", { name: /Bỏ qua/ }));
    expect(onAction.mock.calls.map((c) => c[1])).toEqual(["create", "skip"]);
  });
});
