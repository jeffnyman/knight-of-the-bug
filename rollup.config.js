import babel from "@rollup/plugin-babel";
import eslint from "@rollup/plugin-eslint";

const mode = process.env.NODE_ENV === "development";
const sourcemap = mode ? "inline" : false;

console.log(`running in ${mode ? "development" : "production"} mode`);

export default {
  input: "./src/scripts/app.js",

  output: {
    file: "./app/dist/app.js",
    format: "es",
    sourcemap,
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
