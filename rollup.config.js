import babel from "@rollup/plugin-babel";
import eslint from "@rollup/plugin-eslint";
import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";
import autoprefixer from "autoprefixer";

const devMode = process.env.NODE_ENV === "development";
const sourcemap = devMode ? "inline" : false;

console.log(`running in ${devMode ? "development" : "production"} mode`);

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
    !devMode &&
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      }),
    postcss({
      plugins: [autoprefixer()],
      inject: false,
      extract: true,
    }),
  ],
};
