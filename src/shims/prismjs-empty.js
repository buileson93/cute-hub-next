// Empty shim for prismjs — @react-email/components' barrel re-exports
// @react-email/code-block which pulls prismjs. We don't use CodeBlock,
// and prismjs 1.30 crashes under Node SSR ("Element is not defined").
module.exports = {};
module.exports.default = {};
module.exports.languages = {};
module.exports.highlight = () => "";
module.exports.tokenize = () => [];
module.exports.hooks = { add: () => {}, run: () => {} };
