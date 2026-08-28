import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8080,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@framework": path.resolve(import.meta.dirname, "./platform/src"),
    },
  },
}));
