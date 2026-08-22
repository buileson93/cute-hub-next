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
        // Hàng rào u4: Chặn các vi phạm giao diện trực tiếp
        {
          selector: "Literal[value=/text-\\[\\d+px\\]/]",
          message:
            "Cấm dùng text-[Npx] trực tiếp. Hãy dùng thang chữ chuẩn TYPO (DISPLAY, H1, H2, H3, BODY, LABEL, MONO).",
        },
        {
          selector:
            "Literal[value=/\\b(bg|text|border)-(blue|red|green|yellow|slate|gray|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-\\d+\\b/]",
          message:
            "Cấm dùng màu Tailwind palette cứng. Hãy dùng các token màu thương hiệu (primary, secondary, accent, v.v.) hoặc các biến CSS --color-*.",
        },
        {
          selector: "Literal[value=/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b/]",
          message:
            "Cấm dùng mã màu HEX trực tiếp trong TSX/TS. Hãy dùng các biến CSS theme hoặc token màu chuẩn của MIRATS.",
        },
        // Hàng rào U10: Chặn raw <button> trong code ứng dụng
        {
          selector: "JSXOpeningElement[name.name='button']",
          message:
            "Cấm dùng thẻ <button> trực tiếp. Hãy dùng component <Button /> từ @/components/ui/button để đảm bảo tính nhất quán và khả năng truy cập.",
        },
        // Hàng rào U10: Chặn raw <table> ngoài components/ui/table
        {
          selector: "JSXOpeningElement[name.name='table']",
          message:
            "Cấm dùng thẻ <table> trực tiếp. Hãy dùng <DataTableCore /> hoặc các table primitives từ @/components/ui/table.",
        },
        // Hàng rào U10: Cảnh báo class mâu thuẫn responsive
        {
          selector:
            "JSXAttribute[name.name='className'] > Literal[value=/\\bhidden\\b.*\\bflex\\b/]",
          message:
            "Phát hiện class 'hidden' và 'flex' mâu thuẫn trên cùng một phần tử mà không có tiền tố responsive. Hãy dùng 'hidden md:flex' hoặc tương đương.",
        },
      ],
    },
  },
  eslintPluginPrettier,
);
