// Stub for @react-email/code-block — not used by this project, and the real
// module pulls prismjs which references `Element` at module top-level and
// crashes under Node SSR. Aliased in vite.config.ts so it works across
// package reinstalls.
export const CodeBlock = () => null;
export const CodeInline = () => null;
export const dracula = {};
export const prism = {};
export default { CodeBlock, CodeInline, dracula, prism };
