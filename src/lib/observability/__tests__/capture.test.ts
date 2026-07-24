// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  captureError,
  setUserContext,
  addBreadcrumb,
  setTag,
  installGlobalErrorHandlers,
} from "../capture";

declare global {
  interface Window {
    __miratsObsInstalled?: boolean;
  }
}

describe("observability/capture", () => {
  beforeEach(() => {
    window.__lovableEvents = { captureException: vi.fn() };
    window.__miratsObsInstalled = false;
    setUserContext(null);
  });

  it("forwards errors to Lovable reporter with user + tag + breadcrumb context", () => {
    setUserContext({ id: "u1", email: "a@b.c" });
    setTag("env", "test");
    addBreadcrumb({ category: "ui", message: "click submit" });

    const err = new Error("boom");
    captureError(err, { form: "su-co" });

    const spy = window.__lovableEvents!.captureException as ReturnType<typeof vi.fn>;
    expect(spy).toHaveBeenCalledTimes(1);
    const [errArg, ctx] = spy.mock.calls[0];
    expect(errArg).toBe(err);
    expect((ctx as { user: { id: string } }).user.id).toBe("u1");
    expect((ctx as { tags: { env: string } }).tags.env).toBe("test");
    expect((ctx as { form: string }).form).toBe("su-co");
    expect((ctx as { breadcrumbs: unknown[] }).breadcrumbs.length).toBe(1);
  });

  it("swallows reporter failures without throwing", () => {
    window.__lovableEvents = {
      captureException: () => {
        throw new Error("reporter down");
      },
    };
    expect(() => captureError(new Error("x"))).not.toThrow();
  });

  it("installGlobalErrorHandlers is idempotent", () => {
    const add = vi.spyOn(window, "addEventListener");
    installGlobalErrorHandlers();
    installGlobalErrorHandlers();
    const errorCalls = add.mock.calls.filter((c) => c[0] === "error");
    expect(errorCalls.length).toBe(1);
    add.mockRestore();
  });
});
