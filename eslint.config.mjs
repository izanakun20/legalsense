import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";


const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "max-lines": ["warn", 600],
      "no-console": "error",
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
    "stitch_legalsense_document_reader/**",
    "coverage/**"
  ]),
]);

export default eslintConfig;
