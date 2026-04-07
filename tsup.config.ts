import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    styles: "src/styles/calendar.css",
  },
  format: ["esm", "cjs"],
  dts: {
    entry: "src/index.ts",
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: ["react", "react-dom", "framer-motion"],
});
