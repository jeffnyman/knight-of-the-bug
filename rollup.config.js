import babel from "@rollup/plugin-babel";
import eslint from "@rollup/plugin-eslint";

export default {
  input: "./src/scripts/app.js",

  output: {
    file: "./app/dist/app.js",
    format: "es",
    sourcemap: "inline",
  },

  plugins: [
    eslint({
      fix: true,
      exclude: ["./node_modules/**", "./src/styles/**"],
    }),
    babel({
      exclude: "node_modules/**",
      babelHelpers: "bundled",
      presets: [
        [
          "@babel/preset-env",
          {
            modules: false,
            useBuiltIns: false,
            targets: {
              browsers: "defaults",
            },
          },
        ],
      ],
    }),
  ],
};
