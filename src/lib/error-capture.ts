// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
} else {
  const g = globalThis as any;
  if (g.process && typeof g.process.on === "function") {
    g.process.on("uncaughtException", (error: any) => {
      console.error("[Capture] Uncaught Exception:", error);
      record(error);
    });
    g.process.on("unhandledRejection", (reason: any) => {
      console.error("[Capture] Unhandled Rejection:", reason);
      record(reason);
    });
  }
}

export function consumeLastCapturedError(): unknown {
  const captured = lastCapturedError;
  if (!captured) return undefined;
  if (Date.now() - captured.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  lastCapturedError = undefined;
  return captured.error;
}
