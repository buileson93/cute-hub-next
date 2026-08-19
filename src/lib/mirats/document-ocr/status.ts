import { OcrStatus } from "./types";

/**
 * Valid state transitions for OCR status
 */
export const VALID_STATUS_TRANSITIONS: Record<OcrStatus, OcrStatus[]> = {
  queued: ["extracting", "ocr_running", "failed", "cancelled"],
  extracting: ["ocr_running", "completed", "partial", "failed", "cancelled"],
  ocr_running: ["completed", "partial", "failed", "cancelled"],
  completed: ["queued"], // Re-run
  partial: ["queued", "ocr_running"],
  failed: ["queued"],
  cancelled: ["queued"],
};

/**
 * Checks if a status transition is valid
 */
export function isValidStatusTransition(current: OcrStatus, next: OcrStatus): boolean {
  return VALID_STATUS_TRANSITIONS[current].includes(next);
}

/**
 * Helper to determine if OCR is in a terminal state
 */
export function isTerminalState(status: OcrStatus): boolean {
  return ["completed", "failed", "cancelled"].includes(status);
}

/**
 * Helper to determine if OCR is currently in progress
 */
export function isInProgress(status: OcrStatus): boolean {
  return ["queued", "extracting", "ocr_running"].includes(status);
}
