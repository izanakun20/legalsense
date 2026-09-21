import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "max-lines": ["warn", 300],
      "no-console": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-unused-vars": "warn"
    }
  },
  {
    files: ["src/components/**/*.tsx", "src/app/**/*.tsx"],
    ignores: ["src/lib/**", "src/app/api/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@google/genai", "@/lib/gemini-client"],
          message: "Client components cannot import server AI modules."
        }]
      }]
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "design/**",
    "stitch_legalsense_document_reader/**"
  ]),
]);

export default eslintConfig;
