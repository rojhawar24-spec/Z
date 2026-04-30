import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GitHub Pages deployt naar een subfolder: /languagetaal/
// base = "/" voor root domain of "/repo-name/" voor project pages
const REPO_NAME = "languagetaal";
const BASE = process.env.NODE_ENV === "production" ? `/${REPO_NAME}/` : "/";

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
