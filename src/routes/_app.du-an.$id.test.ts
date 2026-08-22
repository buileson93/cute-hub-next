import { describe, it, expect } from "vitest";
import { Route } from "./_app.du-an.$id";

describe("/_app/du-an/$id search validation", () => {
  it("allows supported views", () => {
    const kanban = Route.options.validateSearch({ view: "kanban" });
    expect(kanban.view).toBe("kanban");

    const list = Route.options.validateSearch({ view: "list" });
    expect(list.view).toBe("list");
    
    const hoso = Route.options.validateSearch({ view: "hoso" });
    expect(hoso.view).toBe("hoso");
  });

  it("normalizes unsupported/legacy views to kanban", () => {
    // Hidden views
    const discovery = Route.options.validateSearch({ view: "discovery" });
    expect(discovery.view).toBe("kanban");

    const delivery = Route.options.validateSearch({ view: "delivery" });
    expect(delivery.view).toBe("kanban");

    const operations = Route.options.validateSearch({ view: "operations" });
    expect(operations.view).toBe("kanban");

    // Random garbage
    const garbage = Route.options.validateSearch({ view: "something-else" });
    expect(garbage.view).toBe("kanban");
  });

  it("defaults to kanban when no view is provided", () => {
    const empty = Route.options.validateSearch({});
    expect(empty.view).toBe("kanban");
  });
});
