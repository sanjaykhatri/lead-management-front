import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Relax some rules to be compatible with vendored code and migrated TS
  {
    rules: {
      // Allow using `any` in places where backend responses are loosely typed
      "@typescript-eslint/no-explicit-any": "off",
      // Our hooks intentionally skip some deps (auth / initial load patterns)
      "react-hooks/exhaustive-deps": "off",
      // Treat unused vars as warnings, and allow prefixing with `_` to ignore
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Allow apostrophes in JSX text (common copy)
      "react/no-unescaped-entities": "off",
      // Disable new React 19 ref+effect strictness for third‑party patterns
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      // Vendor components often skip displayName
      "react/display-name": "off",
      // Allow empty extension interfaces in simple wrapper components
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow using @ts-ignore in vendor‑style code
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore vendored Vuexy starter-kit and generated icon bundles
    "vendor/**",
    "assets/iconify-icons/**",
  ]),
]);

export default eslintConfig;
