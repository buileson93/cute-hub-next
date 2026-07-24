// ============================================================================
// Hook client: trả về ImportEngine "server" đã bind runBulkImport (useServerFn).
// Các nút "Nhập" rải rác dùng hook này để đi qua CÙNG một logic với Import
// Studio — chỉ khi cờ `importEngineUnified` bật. File này client-only.
// ============================================================================

import { useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { runBulkImport } from "@/lib/mirats/import-export.functions";
import {
  createServerImportEngine,
  type ImportEngine,
  type RunBulkImport,
} from "@/lib/mirats/import-engine";

/** Engine chung (preview/commit qua runBulkImport). Dùng trong React component. */
export function useServerImportEngine(): ImportEngine {
  const run = useServerFn(runBulkImport);
  return useMemo(() => createServerImportEngine(run as unknown as RunBulkImport), [run]);
}
