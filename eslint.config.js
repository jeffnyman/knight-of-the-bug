import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/",
      "node_modules/",
      "__sleeping-beauty-master/",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: {
      indent: ["warn", 2, { SwitchCase: 1 }],
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-unused-vars": ["warn"],
      "linebreak-style": ["warn", "unix"],
    },
  },
  {
    files: ["*.config.js", "tests/**/*.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
