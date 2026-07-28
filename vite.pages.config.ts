import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: "/eigenforge/",
  plugins: [react()],
  build: {
    outDir: "docs",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        game: fileURLToPath(new URL("index.html", import.meta.url)),
        exercises: fileURLToPath(
          new URL("exercises/index.html", import.meta.url),
        ),
      },
    },
  },
});
