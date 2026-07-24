// ============================================================================
// P6 — useCellEditor: hook dùng chung cho inline-edit ở 3 view của cây hệ thống.
//
// - Enter lưu, Esc huỷ (helper `keyHandler`).
// - Optimistic + invalidate + toast (đã có sẵn trong 3 mutation gốc — hook chỉ
//   dispatch, không tự invalidate lần hai để tránh flicker).
// - Dispatch qua `resolveEditIntent` → cùng 1 (kind, ma, field, value) sửa từ
//   view nào cũng ghi vào một đích: renameEntity / saveCell / saveNode.
// ============================================================================
import * as React from "react";
import {
  resolveEditIntent,
  type CayKind,
  type CayView,
  type CellEditIntent,
  type ResolveEditInput,
} from "@/lib/mirats/ui/inline-edit";

export interface CellEditorMutations {
  renameEntity: (args: { kind: CayKind; id: string; ten: string }) => Promise<unknown> | unknown;
  saveCell: (args: { ma: string; col: string; value: string | number | null }) => Promise<unknown> | unknown;
  saveNode: (args: { kind: CayKind; ma: string; ten?: string; du_lieu?: Record<string, unknown>; phys?: Record<string, string | number | null> }) => Promise<unknown> | unknown;
}

export interface UseCellEditorOptions {
  physCols?: readonly string[];
  /** true nếu node là bản ghi thật. Route đã có helper `realNameTarget`. */
  isRealFor: (kind: CayKind, ma: string) => { keyVal: string } | null;
  mutations: CellEditorMutations;
}

export interface CommitInput {
  view: CayView;
  kind: CayKind;
  ma: string;
  field: string;
  value: unknown;
  /** Giá trị cũ để bỏ qua no-op. */
  previous?: unknown;
}

export interface UseCellEditorApi {
  /** Xây intent thuần (không side-effect) — hữu ích cho test/telemetry. */
  planIntent: (input: CommitInput) => CellEditIntent | null;
  /** Thực thi commit — dispatch tới đúng mutation theo intent. */
  commit: (input: CommitInput) => Promise<CellEditIntent | null>;
  /** Trả về onKeyDown gắn vào input: Enter → commit; Esc → cancel. */
  keyHandler: (
    input: CommitInput,
    onCancel?: () => void,
  ) => (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function useCellEditor(opts: UseCellEditorOptions): UseCellEditorApi {
  const { physCols, isRealFor, mutations } = opts;

  const planIntent = React.useCallback(
    (input: CommitInput): CellEditIntent | null => {
      if (input.previous !== undefined && input.previous === input.value) return null;
      const real = isRealFor(input.kind, input.ma);
      const resolveInput: ResolveEditInput = {
        kind: input.kind,
        ma: input.ma,
        field: input.field,
        value: input.value,
        isReal: !!real,
        realId: real?.keyVal,
        physCols,
      };
      return resolveEditIntent(resolveInput);
    },
    [isRealFor, physCols],
  );

  const commit = React.useCallback(
    async (input: CommitInput) => {
      const intent = planIntent(input);
      if (!intent) return null;
      switch (intent.target) {
        case "renameEntity":
          await mutations.renameEntity({ kind: intent.kind, id: intent.id, ten: intent.ten });
          break;
        case "saveCell":
          await mutations.saveCell({ ma: intent.ma, col: intent.col, value: intent.value });
          break;
        case "saveNode": {
          // Field "ten" → mutation nhận `ten`; ngược lại đi qua `du_lieu`.
          if (intent.field === "ten") {
            await mutations.saveNode({ kind: intent.kind, ma: intent.ma, ten: String(intent.value ?? "") });
          } else {
            await mutations.saveNode({
              kind: intent.kind,
              ma: intent.ma,
              du_lieu: { [intent.field]: intent.value },
            });
          }
          break;
        }
      }
      return intent;
    },
    [planIntent, mutations],
  );

  const keyHandler = React.useCallback(
    (input: CommitInput, onCancel?: () => void) =>
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void commit(input);
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel?.();
        }
      },
    [commit],
  );

  return { planIntent, commit, keyHandler };
}
