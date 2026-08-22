import { describe, it, expect } from "vitest";
import { Route } from "./_app.du-an.$id";

describe("/_app/du-an/$id search validation", () => {
  const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => any;

  it("allows supported views", () => {
    const kanban = validateSearch({ view: "kanban" });
    expect(kanban.view).toBe("kanban");

    const list = validateSearch({ view: "list" });
    expect(list.view).toBe("list");
    
    const hoso = validateSearch({ view: "hoso" });
    expect(hoso.view).toBe("hoso");
  });

  it("normalizes unsupported/legacy views to kanban", () => {
    // Hidden views
    const discovery = validateSearch({ view: "discovery" });
    expect(discovery.view).toBe("kanban");

    const delivery = validateSearch({ view: "delivery" });
    expect(delivery.view).toBe("kanban");

    const operations = validateSearch({ view: "operations" });
    expect(operations.view).toBe("kanban");

    // Random garbage
    const garbage = validateSearch({ view: "something-else" });
    expect(garbage.view).toBe("kanban");
  });

  it("defaults to kanban when no view is provided", () => {
    const empty = validateSearch({});
    expect(empty.view).toBe("kanban");
  });
});

