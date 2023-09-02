module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: "eslint:recommended",
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    indent: ["warn", 2],
    semi: ["error", "always"],
    quotes: ["error", "double"],
    "no-unused-vars": ["warn"],
    "linebreak-style": ["warn", "unix"],
  },
};
