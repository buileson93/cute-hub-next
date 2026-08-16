// Install inert DOM globals BEFORE anything else. Some browser-only libraries
// (e.g. @google/model-viewer, lit-html) touch `HTMLElement`, `customElements`,
// `document`, `window`, and `navigator` at module top-level. On the Worker SSR
// runtime those globals don't exist, so evaluating the module throws
// (`ReferenceError: document is not defined`, etc.). That module is co-located
// in a shared vendor chunk imported by always-loaded libs (framer-motion,
// xyflow, mcp-js, photo-sphere-viewer) via a shared `performance` polyfill, so
// the throw crashed SSR for every route with a 500.
//
// The shim uses a single recursive, inert Proxy so ANY property access or call
// returns another inert value and never throws. It also degrades browser
// feature-detection to server-safe results: string coercion yields "" (so UA
// sniffing regexes match nothing) and it is never actually `== null`, so the
// libraries settle on their no-op/server behavior. Real DOM behavior still only
// runs in the browser where the genuine globals exist.
{
  const g = globalThis as unknown as Record<string, unknown>;

  const makeInert = (): unknown => {
    const fn = function () {
      return proxy;
    };
    const proxy: unknown = new Proxy(fn, {
      get(_t, prop) {
        if (prop === Symbol.toPrimitive) return () => "";
        if (prop === Symbol.iterator)
          return function* () {
            /* empty iterable */
          };
        if (prop === "nodeType") return 1;
        if (prop === "length") return 0;
        return proxy;
      },
      set() {
        return true;
      },
      apply() {
        return proxy;
      },
      construct() {
        return proxy as object;
      },
      has() {
        return true;
      },
    });
    return proxy;
  };

  // Cloudflare Workers expose `self` (globalThis) but not the DOM globals below.
  if (typeof g.self === "undefined") g.self = g;
  if (typeof g.HTMLElement === "undefined") g.HTMLElement = class {} as unknown;
  if (typeof g.customElements === "undefined") {
    g.customElements = {
      define() {},
      get() {
        return undefined;
      },
      whenDefined() {
        return Promise.resolve();
      },
      upgrade() {},
    } as unknown;
  }
  if (typeof g.document === "undefined") g.document = makeInert();
  if (typeof g.window === "undefined") g.window = makeInert();
  if (typeof g.navigator === "undefined") g.navigator = makeInert();

  // Defining `window` above makes isomorphic libs (e.g. the Supabase browser
  // client) take their browser path, which reads bare `localStorage`. Provide a
  // real, in-memory Storage polyfill so `getItem` returns `null` (not a proxy)
  // for missing keys — the Supabase client then correctly sees "no session"
  // during SSR instead of throwing.
  const makeStorage = (): unknown => {
    const map = new Map<string, string>();
    return {
      get length() {
        return map.size;
      },
      getItem(key: string) {
        return map.has(key) ? map.get(key)! : null;
      },
      setItem(key: string, value: string) {
        map.set(String(key), String(value));
      },
      removeItem(key: string) {
        map.delete(key);
      },
      clear() {
        map.clear();
      },
      key(i: number) {
        return Array.from(map.keys())[i] ?? null;
      },
    };
  };
  if (typeof g.localStorage === "undefined") g.localStorage = makeStorage();
  if (typeof g.sessionStorage === "undefined") g.sessionStorage = makeStorage();
}

import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  
  // If it's already HTML, it might be our error page or a Vite error, let it pass.
  if (contentType.includes("text/html")) return response;

  const body = await response.clone().text();
  const capturedError = consumeLastCapturedError();
  
  if (isH3SwallowedErrorBody(body) || !contentType.includes("application/json")) {
    console.error(capturedError ?? new Error(`SSR error detected (Status ${response.status}): ${body.slice(0, 500)}`));
    return new Response(renderErrorPage(capturedError || body), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return response;
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
