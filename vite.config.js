import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the built game works from any sub-path (e.g. GitHub Pages).
  base: "./",
  build: {
    sourcemap: true,
  },
  test: {
    include: ["tests/**/*.test.js"],
  },
});
