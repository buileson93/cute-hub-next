import { describe, it, expect } from "vitest";
import { isValidStatusTransition, isTerminalState } from "../status";

describe("OCR Status Logic", () => {
  it("should validate allowed status transitions", () => {
    expect(isValidStatusTransition("queued", "extracting")).toBe(true);
    expect(isValidStatusTransition("queued", "completed")).toBe(false);
    expect(isValidStatusTransition("completed", "queued")).toBe(true);
  });

  it("should correctly identify terminal states", () => {
    expect(isTerminalState("completed")).toBe(true);
    expect(isTerminalState("failed")).toBe(true);
    expect(isTerminalState("ocr_running")).toBe(false);
  });
});
