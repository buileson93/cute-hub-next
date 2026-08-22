// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

import { renderHook, act } from "@testing-library/react";
import { useColumnPrefs } from "../use-column-prefs";
import { supabase } from "@/integrations/backend/client";

vi.mock("@/integrations/backend/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: { user: { id: "test-user" } } } }),
      ),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null })),
          })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe("useColumnPrefs", () => {
  const allKeys = ["col1", "col2", "actions"];
  const defaultHidden = ["col2"];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should initialize with default values", async () => {
    const { result } = renderHook(() => useColumnPrefs("test-table", allKeys, defaultHidden));

    expect(result.current.order).toEqual(["col1", "col2", "actions"]);
    expect(result.current.hidden.has("col2")).toBe(true);
    expect(result.current.hidden.has("col1")).toBe(false);
  });

  it("should toggle column visibility", async () => {
    const { result } = renderHook(() => useColumnPrefs("test-table", allKeys, defaultHidden));

    act(() => {
      result.current.toggle("col1");
    });

    expect(result.current.hidden.has("col1")).toBe(true);

    act(() => {
      result.current.toggle("col1");
    });

    expect(result.current.hidden.has("col1")).toBe(false);
  });

  it("should persist to localStorage when order changes", async () => {
    const { result } = renderHook(() => useColumnPrefs("test-table", allKeys, defaultHidden));
    const newOrder = ["col2", "col1", "actions"];

    act(() => {
      result.current.setOrder(newOrder);
    });

    expect(result.current.order).toEqual(newOrder);
    expect(localStorage.getItem("mirats:colprefs:v2:test-table")).toContain("col2");
  });
});
