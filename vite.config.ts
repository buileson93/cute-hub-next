// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [mcpPlugin()],
    resolve: {
      alias: [
        // Neither package is used by this project. The real @react-email/code-block
        // pulls prismjs which references `Element` at module top-level and crashes
        // under Node SSR. Stub both so barrel imports from @react-email/components
        // stay safe. Regex catches subpath imports like `prismjs/prism.js` too.
        {
          find: /^@react-email\/code-block(\/.*)?$/,
          replacement: new URL("./src/shims/react-email-code-block-empty.js", import.meta.url).pathname,
        },
        {
          find: /^prismjs(\/.*)?$/,
          replacement: new URL("./src/shims/prismjs-empty.js", import.meta.url).pathname,
        },
      ],
    },
    ssr: {
      noExternal: ["@react-email/components"],
    },



    build: {
      rollupOptions: {
        output: {
          // Force browser-only 3D/web-component libraries into a dedicated,
          // dynamic-import-only chunk. Otherwise rollup co-locates
          // @google/model-viewer + lit + three with a shared `performance`
          // polyfill that framer-motion/xyflow import statically — which drags
          // the model-viewer custom-element code (top-level `extends HTMLElement`
          // and `document` access) into the SSR graph and 500s every route on
          // the Cloudflare Worker runtime.
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return;
            if (
              id.includes("@google/model-viewer") ||
              id.includes("/lit/") ||
              id.includes("/lit-html/") ||
              id.includes("/lit-element/") ||
              id.includes("/@lit/") ||
              id.includes("/@lit-labs/") ||
              id.includes("/three/") ||
              id.includes("three/build")
            ) {
              return "browser-3d";
            }
          },
        },
      },
    },
  },
});
