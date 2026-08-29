import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, ".."),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0", // Allow external connections (important for Docker)
    port: 3000,
    strictPort: true, // Fail if port is not available
    watch: {
      usePolling: true, // Enable for hot reload in Docker containers
      interval: 1000, // Polling interval
    },
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
  optimizeDeps: {
    force: true, // Force dependency optimization
  },
  esbuild: {
    target: "es2020", // Ensure compatibility
  },
});
