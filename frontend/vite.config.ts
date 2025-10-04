import { defineConfig } from "vite";
import * as path from "path";

export default defineConfig({
  esbuild: {
    jsx: "transform",
    jsxFactory: "h",
    jsxFragment: "Fragment",
  },
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
