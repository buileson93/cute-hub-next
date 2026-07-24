import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Hàng rào Task 8: buộc khai báo đủ dependency cho hook để tránh
      // stale-closure/rerender sai khi nâng cấp nguồn dữ liệu.
      "react-hooks/exhaustive-deps": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // GĐ 7: cảnh báo select("*") — thường là tải toàn bộ cột, dễ nặng.
      // Cho phép các trường hợp cần thiết bằng eslint-disable-next-line.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.property.name='select'][arguments.0.value='*']",
          message:
            "Tránh select('*') cho bảng lớn — hãy liệt kê cột cụ thể để giảm payload và cho phép index-only scan.",
        },
      ],
    },
  },
  eslintPluginPrettier,
);
