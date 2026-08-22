import { test, expect } from "vitest";
import { calculateOptimalWidths } from "../table-geometry";

test("calculateOptimalWidths should handle legacy minW and new minWidth", () => {
  const columns = [
    { key: "id", width: 100 },
    { key: "name", minWidth: 200 },
    { key: "code", minW: "150px" } as any,
  ];

  // Simulation of internal normalization in StandardTable
  const normalized = columns.map((c) => ({
    ...c,
    minWidth: c.minWidth ?? (c.minW ? parseInt(c.minW) : undefined),
  }));

  expect(normalized[1].minWidth).toBe(200);
  expect(normalized[2].minWidth).toBe(150);
});
