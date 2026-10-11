import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the built game works from any sub-path (e.g. GitHub Pages).
  base: "./",
  build: {
    // "hidden" emits the map but leaves no sourceMappingURL in the
    // bundle, so devtools will not auto-load the original source and
    // hand the class every hasBug() call site.
    sourcemap: "hidden",
  },
  test: {
    include: ["tests/**/*.test.js"],
  },
});
