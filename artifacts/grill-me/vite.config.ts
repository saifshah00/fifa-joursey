import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 4173;

if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  define: {
    'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
      process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY ?? ''
    ),
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "spa-fallback",
      apply: "build",
      closeBundle() {
        const outDir = path.resolve(import.meta.dirname, "dist/public");
        const indexPath = path.join(outDir, "index.html");
        const fallbackPath = path.join(outDir, "404.html");

        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, fallbackPath);
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
