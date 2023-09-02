import babel from "@rollup/plugin-babel";

export default {
  input: "./src/scripts/app.js",

  output: {
    file: "./app/dist/app.js",
    format: "es",
    sourcemap: "inline",
  },

  plugins: [
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
