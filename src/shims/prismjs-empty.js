var noop = function () {};
var Prism = {
  languages: {
    extend: function () {
      return {};
    },
    insertBefore: function () {
      return {};
    },
    DFS: noop,
  },
  hooks: { add: noop, run: noop },
  highlight: function () {
    return "";
  },
  tokenize: function () {
    return [];
  },
  plugins: {},
  util: {
    encode: function (x) {
      return x;
    },
    type: function () {
      return "";
    },
    objId: function () {
      return 0;
    },
    clone: function (x) {
      return x;
    },
  },
};
module.exports = Prism;
module.exports.default = Prism;
